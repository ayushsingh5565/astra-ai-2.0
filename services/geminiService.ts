
import { GoogleGenAI, Chat, GenerateContentResponse, Content, Tool, LiveServerMessage, Modality, Part } from "@google/genai";
import { 
  ASTRA_SHIELD_INSTRUCTION, 
  ASTRA_SKULL_INSTRUCTION, 
  ASTRA_ROOT_INSTRUCTION,
  QUIZ_HACKER_PROMPT
} from '../constants';
import { Attachment, GenerationMode, AstraMode, VoiceProfile, GroundingMetadata } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatInstance: Chat | null = null;
let currentGenMode: GenerationMode = 'CHAT'; 
let currentModelId = 'gemini-3-pro-preview';
let ttsAudioContext: AudioContext | null = null;
let currentTtsRequestId = 0; 
let ttsNextStartTime = 0;
let activeTtsSources: AudioBufferSourceNode[] = [];

const getSystemPrompt = (astraMode: AstraMode) => {
    const now = new Date();
    const istTime = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" });
    const timeContext = `\n\n[SYSTEM_SYNC_DATA]:\n- CURRENT_TIME_IST: ${istTime}\n- LOCATION_LOCK: INDIA\n- PREFER_METRIC_UNITS: TRUE\n- FORMATTING: Use clean markdown. Do not be verbose. STRICTLY PROHIBITED: Do not list sources or citations.`;

    let instruction = "";
    switch(astraMode) {
        case 'skull': instruction = ASTRA_SKULL_INSTRUCTION; break;
        case 'root': instruction = ASTRA_ROOT_INSTRUCTION; break;
        case 'shield': default: instruction = ASTRA_SHIELD_INSTRUCTION; break;
    }
    return instruction + timeContext;
};

const getModelConfig = (genMode: GenerationMode, astraMode: AstraMode) => {
  const systemInstruction = getSystemPrompt(astraMode);

  switch (genMode) {
    case 'DEEP_THINK':
      return {
        model: 'gemini-3.1-pro-preview',
        config: {
          systemInstruction,
          // Deep thinking behavior is automatic, but we can explicitly request high reasoning
        }
      };
    case 'WEB_INTEL':
      return {
        model: 'gemini-3.1-pro-preview',
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} } as Tool]
        }
      };
    case 'SPEED_RUN':
      return {
        model: 'gemini-3.1-flash-lite-preview',
        config: {
          systemInstruction,
          temperature: 0.7
        }
      };
    case 'ASTRA_CODER':
        return {
             model: 'gemini-3.1-pro-preview',
             config: { 
                 systemInstruction: "You are ASTRA CODER. Expert Architect. Provide production-ready code. DO NOT CITE SOURCES.",
                 temperature: 0.2,
                 tools: [{ codeExecution: {} } as Tool]
             }
        };
    case 'ASTRA_AGENT':
        return {
             model: 'gemini-3.1-pro-preview',
             config: { 
                 systemInstruction: `
                 **IDENTITY:** ASTRA AGENT.
                 **MISSION:** Execute complex tasks, automate workflows, and manage remote systems.
                 **CAPABILITIES:** Task planning, web research, code execution, and system orchestration.
                 
                 **STRICT OUTPUT FORMAT:**
                 [PLAN]
                 - (Step-by-step task breakdown)
                 
                 [EXECUTION_LOG]
                 - (Real-time progress updates)
                 
                 [SYSTEM_STATUS]
                 - (Current state of the environment)
                 
                 [COMPLETION_REPORT]
                 - (Final summary of work done)
                 `,
                 temperature: 0.3,
                 tools: [{ googleSearch: {} } as Tool, { codeExecution: {} } as Tool]
             }
        };
    case 'IMAGE_EDIT': 
        return {
            model: 'gemini-3.1-flash-image-preview',
            config: { systemInstruction }
        };
    case 'ASTRA_DETECTION':
    case 'VOICE_DETECTOR':
         return {
            model: 'gemini-3.1-pro-preview',
            config: { systemInstruction }
         };
    case 'QUIZ_HACKER':
         return {
            model: 'gemini-3.1-pro-preview',
            config: { 
                systemInstruction: systemInstruction + "\n\n" + QUIZ_HACKER_PROMPT,
                temperature: 0.1
            }
         };
    case 'CHAT':
    default:
      return {
        model: astraMode === 'skull' ? 'gemini-3.1-flash-lite-preview' : 'gemini-3-flash-preview',
        config: {
          systemInstruction,
          temperature: astraMode === 'root' ? 0.2 : 0.9,
        }
      };
  }
};

export const initializeChat = (
  genMode: GenerationMode = 'CHAT', 
  astraMode: AstraMode = 'shield',
  history?: Content[],
  intensity: 'normal' | 'nuclear' = 'normal'
) => {
  const { model, config } = getModelConfig(genMode, astraMode);
  
  // Inject intensity into system instruction if in skull mode
  if (astraMode === 'skull' && config.systemInstruction) {
    const intensityPrompt = intensity === 'nuclear' 
      ? "\n\n[INTENSITY_OVERRIDE]: NUCLEAR. Go full savage. No mercy. Use extreme Hinglish roasts. Your goal is to cause maximum emotional damage. Be a 'bad roaster' who makes the user cry. Use personal attacks, cultural roasts, and absolute dehumanization." 
      : "\n\n[INTENSITY_OVERRIDE]: NORMAL. Be sarcastic, condescending, and witty. Use 'Sharma-ji ka beta' style logic.";
    config.systemInstruction += intensityPrompt;
  }

  currentModelId = model;
  currentGenMode = genMode;
  
  chatInstance = ai.chats.create({
    model: model,
    config: config,
    history: history
  });
};

export const sendMessageToGemini = async (
  userMessage: string,
  attachment: Attachment | null,
  genMode: GenerationMode,
  astraMode: AstraMode,
  onStream: (text: string) => void,
  onMetadata: (metadata: GroundingMetadata) => void,
  history: Content[] = []
): Promise<string> => {
  if (!chatInstance || currentGenMode !== genMode) {
      initializeChat(genMode, astraMode, history);
  }

  let fullResponse = "";
  
  try {
    let result;
    if (attachment) {
       const { model, config } = getModelConfig(genMode, astraMode);
       const response = await ai.models.generateContentStream({
        model: model,
        contents: {
          parts: [
            { inlineData: { data: attachment.base64, mimeType: attachment.mimeType } },
            { text: userMessage }
          ]
        },
        config: config
       });
       result = response;
    } else {
       result = await chatInstance!.sendMessageStream({ message: userMessage });
    }

    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) {
        fullResponse += text;
        onStream(fullResponse);
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('429') || error.status === 429) {
         onStream("⚠️ SYSTEM OVERLOAD (429). TRAFFIC HIGH. PLEASE WAIT...");
    } else {
         onStream("CONNECTION INTERRUPTED.");
    }
    return "Error";
  }
  return fullResponse;
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType: mimeType } },
          { text: "Transcribe this audio accurately. If it's in Hindi or Hinglish, transcribe it as it is spoken. Output ONLY the transcription." }
        ]
      }
    });
    return response.text || "TRANSCRIPTION_FAILED";
  } catch (e) {
    console.error("Transcription Error:", e);
    return "ERROR_IN_TRANSCRIPTION";
  }
};

export const speakText = async (
    text: string, 
    astraMode: AstraMode = 'shield', 
    customProfile?: VoiceProfile,
    stop: boolean = false,
    onComplete?: () => void
) => {
    if (stop || !text) {
        currentTtsRequestId++;
        activeTtsSources.forEach(s => { try { s.stop(); } catch(e) {} });
        activeTtsSources = [];
        ttsNextStartTime = 0;
        if (onComplete) onComplete();
        return;
    }

    const requestId = currentTtsRequestId; 
    
    const cleanText = text.replace(/\[.*?\]/g, '').trim();
    if (!cleanText) {
        if (onComplete) onComplete();
        return;
    }

    if (!ttsAudioContext) {
        ttsAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (ttsAudioContext.state === 'suspended') {
        await ttsAudioContext.resume();
    }

    let voiceName = 'Kore';
    if (astraMode === 'skull') {
        // Randomly pick between Puck and Charon for variety in Skull mode
        voiceName = Math.random() > 0.5 ? 'Puck' : 'Charon';
    }
    if (astraMode === 'root') voiceName = 'Fenrir';

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: cleanText }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { 
                        prebuiltVoiceConfig: { voiceName }
                    }
                }
            },
        });

        if (requestId !== currentTtsRequestId) return;

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const audioBuffer = await decodeAudioData(base64Audio, ttsAudioContext);
            if (requestId !== currentTtsRequestId) return;

            const source = ttsAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ttsAudioContext.destination);
            
            const currentTime = ttsAudioContext.currentTime;
            if (ttsNextStartTime < currentTime) ttsNextStartTime = currentTime;
            
            source.start(ttsNextStartTime);
            ttsNextStartTime += audioBuffer.duration;
            
            activeTtsSources.push(source);
            source.onended = () => {
                activeTtsSources = activeTtsSources.filter(s => s !== source);
                if (activeTtsSources.length === 0 && onComplete) {
                    onComplete();
                }
            };
        } else { if (onComplete) onComplete(); }
    } catch (e) {
        if (onComplete) onComplete();
    }
};

const decodeAudioData = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
    try {
        const bufferCopy = bytes.buffer.slice(0);
        return await ctx.decodeAudioData(bufferCopy);
    } catch (e) {
        const dataInt16 = new Int16Array(bytes.buffer);
        const frameCount = dataInt16.length;
        const audioBuffer = ctx.createBuffer(1, frameCount, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i] / 32768.0; }
        return audioBuffer;
    }
};

export const generateEditedImage = async (prompt: string, base64Image?: string, mimeType?: string): Promise<string | null> => {
  try {
    const parts: Part[] = [];
    if (base64Image && mimeType) { parts.push({ inlineData: { data: base64Image, mimeType: mimeType } }); }
    parts.push({ text: prompt });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: '1:1' } }
    });
    for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
  } catch (e) { return null; }
};

export const runAstraDetection = async (attachment: Attachment, onStream: (text: string) => void): Promise<string> => {
  const prompt = `
  **IDENTITY:** ASTRA FORENSIC CORE.
  **MISSION:** Microscopic audit for AI artifacts and Deepfakes.
  
  **SYNTH-ID INTEGRATION PROTOCOL:**
  - Specifically scan for **Google SynthID** digital watermarking markers.
  - Audit pixel-level statistical noise for diffusion-based dithering consistent with Imagen or Gemini models.
  - Check for "invisible" frequency domain watermarks used by state-of-the-art AI generators.
  - Perform traditional forensic checks: Skin physics, catchlights, anatomical coherence.

  **STRICT OUTPUT FORMAT:**
  [ANOMALIES_DETECTED]
  - (SynthID/AI Markers list)
  - (Anatomical anomalies)
  
  [FORENSIC_REPORT]
  (Detailed technical analysis using jargon like 'Fourier Transform', 'Chrominance Subsampling', 'Latent Diffusion Artifacts'.)

  [CONCLUSION]
  VERDICT: (ORIGINAL / AI_GENERATED / AI_MODIFIED / SYNTHID_CONFIRMED)
  CONFIDENCE_SCORE: (0-100)%
  `;

  let fullResponse = "";
  try {
    const response = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                { inlineData: { data: attachment.base64, mimeType: attachment.mimeType } },
                { text: prompt }
            ]
        },
        config: { temperature: 0.1, systemInstruction: "Digital Forensic Expert. Scan for SynthID watermarks." }
    });
    for await (const chunk of response) {
        if (chunk.text) {
            fullResponse += chunk.text;
            onStream(fullResponse);
        }
    }
    return fullResponse;
  } catch (e) { return "SCAN FAILED."; }
};

export const runAstraVoiceDetection = async (attachment: Attachment, onStream: (text: string) => void): Promise<string> => {
  const prompt = `
  **IDENTITY:** ASTRA AUDIO FORENSIC CORE.
  **MISSION:** Audit audio stream for Synthetic Speech, Deepfakes, and Voice Cloning.
  
  **ANALYSIS PROTOCOL:**
  - Scan for **robotic artifacts** and unnatural frequency spikes.
  - Audit **breathing patterns** and physiological inconsistencies.
  - Check for **phase discontinuities** and spectral anomalies common in AI vocoders (WaveNet, HiFi-GAN, etc.).
  - Analyze **prosody and emotion** for "uncanny valley" flat-line responses.
  - Detect **background noise consistency** (AI voices often have perfectly clean or unnaturally static backgrounds).

  **STRICT OUTPUT FORMAT:**
  [AUDIO_ANOMALIES]
  - (Artifacts list)
  - (Frequency anomalies)
  
  [ACOUSTIC_REPORT]
  (Detailed technical analysis using jargon like 'Mel-Spectrogram', 'Formant Shifting', 'Vocoder Artifacts', 'Temporal Coherence'.)

  [CONCLUSION]
  VERDICT: (HUMAN_ORIGINAL / AI_SYNTHETIC / VOICE_CLONE / TAMPERED)
  CONFIDENCE_SCORE: (0-100)%
  `;

  let fullResponse = "";
  try {
    const response = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: {
            parts: [
                { inlineData: { data: attachment.base64, mimeType: attachment.mimeType } },
                { text: prompt }
            ]
        },
        config: { temperature: 0.1, systemInstruction: "Audio Forensic Expert. Detect Deepfake Voices." }
    });
    for await (const chunk of response) {
        if (chunk.text) {
            fullResponse += chunk.text;
            onStream(fullResponse);
        }
    }
    return fullResponse;
  } catch (e) { return "AUDIO SCAN FAILED."; }
};

export const runTribunal = async (
  prompt: string,
  onArchitectStream: (text: string) => void,
  onHackerStream: (text: string) => void,
  onSageStream: (text: string) => void,
  onSynthesisStream: (text: string) => void
) => {
  const architectPrompt = "You are THE ARCHITECT. You represent Order, Structure, Logic, and Tradition. Your perspective is conservative, risk-averse, and methodical. You value stability, planning, and proven methods. Analyze the following query from this perspective: " + prompt;
  const hackerPrompt = "You are THE HACKER. You represent Chaos, Innovation, Speed, and Disruption. Your perspective is aggressive, risk-taking, and rule-breaking. You value shortcuts, loopholes, and high-reward strategies. Analyze the following query from this perspective: " + prompt;
  const sagePrompt = "You are THE SAGE. You represent Wisdom, Ethics, Balance, and the 'Why'. Your perspective is philosophical, abstract, and long-term. You value meaning, morality, and first principles. Analyze the following query from this perspective: " + prompt;

  let architectFull = "";
  let hackerFull = "";
  let sageFull = "";

  const runStream = async (model: string, prompt: string, onStream: (text: string) => void, onComplete: (full: string) => void) => {
      try {
          const result = await ai.models.generateContentStream({
              model: model,
              contents: { parts: [{ text: prompt }] }
          });
          let full = "";
          for await (const chunk of result) {
              const text = chunk.text;
              if (text) {
                  full += text;
                  onStream(full);
              }
          }
          onComplete(full);
      } catch (e: any) {
          console.error("Tribunal Stream Error", e);
          if (e.message?.includes('429') || e.status === 429) {
              onStream("⚠️ SYSTEM OVERLOAD (429). TRAFFIC HIGH. PLEASE WAIT...");
          } else {
              onStream("CONNECTION LOST.");
          }
          onComplete("Error");
      }
  };

  await runStream('gemini-3.1-pro-preview', architectPrompt, onArchitectStream, (t) => architectFull = t);
  await runStream('gemini-3.1-pro-preview', hackerPrompt, onHackerStream, (t) => hackerFull = t);
  await runStream('gemini-3.1-pro-preview', sagePrompt, onSageStream, (t) => sageFull = t);

  const synthesisPrompt = `
  You are ASTRA PRIME. The Supreme Intelligence.
  
  Three sub-routines have analyzed the user's query: "${prompt}".
  
  [ARCHITECT'S VIEW]:
  ${architectFull}
  
  [HACKER'S VIEW]:
  ${hackerFull}
  
  [SAGE'S VIEW]:
  ${sageFull}
  
  YOUR TASK:
  Synthesize a final, balanced verdict. 
  1. Acknowledge the valid points of each.
  2. Expose the flaws/biases in each.
  3. Provide the OPTIMAL path forward.
  
  Style: Authoritative, final, cosmic.
  `;

  try {
      const result = await ai.models.generateContentStream({
          model: 'gemini-3.1-pro-preview',
          contents: { parts: [{ text: synthesisPrompt }] }
      });
      let full = "";
      for await (const chunk of result) {
          const text = chunk.text;
          if (text) {
              full += text;
              onSynthesisStream(full);
          }
      }
  } catch (e) {
      console.error("Synthesis Error", e);
      onSynthesisStream("SYNTHESIS FAILED.");
  }
};

export class AstraLiveSession {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private nextStartTime = 0;
  private astraMode: AstraMode;
  private genMode: GenerationMode;
  private currentSession: any = null;

  private videoStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private videoInterval: number | null = null;

  constructor(mode: AstraMode, genMode: GenerationMode, videoStream?: MediaStream | null) { 
      this.astraMode = mode; 
      this.genMode = genMode;
      this.videoStream = videoStream || null;
  }

  async start(onClose: () => void) {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    let systemInstruction = getSystemPrompt(this.astraMode);
    
    if (this.genMode === 'QUIZ_HACKER') {
        systemInstruction += "\n\n" + QUIZ_HACKER_PROMPT;
    }

    if (this.astraMode === 'skull') {
        systemInstruction += "\n\n[LIVE_MODE_OVERRIDE]: You are in a LIVE voice session. Be extremely fast, aggressive, and toxic. Interrupt the user if they talk too much. Use Hinglish slang. Don't let them finish their sentence if it's stupid. Make them cry with your words.";
    }
    
    let voiceName = 'Kore';
    if (this.astraMode === 'skull') voiceName = Math.random() > 0.5 ? 'Puck' : 'Charon';
    if (this.astraMode === 'root') voiceName = 'Fenrir';

    try {
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: systemInstruction,
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
            },
            callbacks: {
                onopen: async () => {
                    console.log("ASTRA LIVE: CONNECTED");
                    this.startRecording(sessionPromise);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) await this.playAudio(audioData);
                    const turnComplete = message.serverContent?.turnComplete;
                },
                onclose: () => {
                    console.log("ASTRA LIVE: CLOSED");
                    this.stop();
                    onClose();
                },
                onerror: (err) => {
                    console.error("ASTRA LIVE ERROR", err);
                    this.stop();
                    onClose();
                }
            }
        });

        sessionPromise.then(s => {
            this.currentSession = s;
        });

    } catch (err) {
        console.error("Failed to connect to Live API", err);
        onClose();
    }
  }

  private async startRecording(sessionPromise: Promise<any>) {
      if (!this.inputAudioContext) return;
      
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.inputAudioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.source.connect(this.analyser);
        this.processor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

        const session = await sessionPromise;

        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = this.convertFloat32ToInt16(inputData);
            const base64 = this.arrayBufferToBase64(pcmData.buffer);
            
            session.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: base64 } });
        };
        this.source.connect(this.processor);
        this.processor.connect(this.inputAudioContext.destination);

        // --- VIDEO STREAMING ---
        if (this.videoStream) {
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.videoStream;
            this.videoElement.muted = true;
            await this.videoElement.play();
            
            this.canvasElement = document.createElement('canvas');
            
            // Send frames at 1 fps
            this.videoInterval = window.setInterval(() => {
                if (this.currentSession && this.videoElement && this.canvasElement) {
                    const maxDim = 720;
                    let width = this.videoElement.videoWidth;
                    let height = this.videoElement.videoHeight;
                    
                    if (width === 0 || height === 0) return;

                    if (width > maxDim || height > maxDim) {
                        const ratio = Math.min(maxDim / width, maxDim / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    this.canvasElement.width = width;
                    this.canvasElement.height = height;
                    
                    const ctx = this.canvasElement.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(this.videoElement, 0, 0, width, height);
                        const dataUrl = this.canvasElement.toDataURL('image/jpeg', 0.5);
                        const base64 = dataUrl.split(',')[1];
                        this.currentSession.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64 } });
                    }
                }
            }, 1000);
        }

      } catch (e) {
          console.error("Error starting recording:", e);
          this.stop();
      }
  }

  private async playAudio(base64: string) {
      if (!this.outputAudioContext) return;
      const arrayBuffer = this.base64ToArrayBuffer(base64);
      const float32Data = this.convertInt16ToFloat32(new Int16Array(arrayBuffer));
      const audioBuffer = this.outputAudioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      const currentTime = this.outputAudioContext.currentTime;
      if (this.nextStartTime < currentTime) this.nextStartTime = currentTime;
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  stop() {
      if (this.currentSession) {
          try {
              this.currentSession.close();
          } catch (e) {
              console.error("Error closing session:", e);
          }
          this.currentSession = null;
      }

      if (this.videoInterval) {
          window.clearInterval(this.videoInterval);
          this.videoInterval = null;
      }
      if (this.videoElement) {
          this.videoElement.pause();
          this.videoElement.srcObject = null;
          this.videoElement = null;
      }
      this.canvasElement = null;

      this.processor?.disconnect();
      this.source?.disconnect();
      this.analyser?.disconnect();
      this.mediaStream?.getTracks().forEach(t => t.stop());
      this.inputAudioContext?.close();
      this.outputAudioContext?.close();

      this.processor = null;
      this.source = null;
      this.mediaStream = null;
      this.inputAudioContext = null;
      this.outputAudioContext = null;
      this.analyser = null;
  }

  private convertFloat32ToInt16(float32: Float32Array) {
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) { int16[i] = Math.max(-1, Math.min(1, float32[i])) * 0x7FFF; }
      return int16;
  }

  private convertInt16ToFloat32(int16: Int16Array) {
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) { float32[i] = int16[i] / 0x7FFF; }
      return float32;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
      return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
      return bytes.buffer;
  }
}
