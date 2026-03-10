
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Mic, Image as ImageIcon, Terminal, X, 
  Activity, ChevronLeft, LayoutGrid, BrainCircuit, 
  Globe, Zap, ScanEye, Wand2, Paperclip, Shield, Skull, Cpu, 
  Volume2, VolumeX, Trash2, Radio, StopCircle, Settings2, ChevronDown,
  AlertTriangle, CheckCircle2, Flame, Search, ScanLine, Code2, Copy, Check, Download, StopCircle as StopIcon, Gavel, MonitorUp, Target
} from 'lucide-react';
import { Message, Role, CodeSnippet, Attachment, GenerationMode, AstraMode, VoiceSettings, GroundingMetadata } from '../types';
import { 
  sendMessageToGemini, 
  initializeChat, 
  generateEditedImage, 
  runAstraDetection,
  runAstraVoiceDetection,
  speakText,
  transcribeAudio,
  AstraLiveSession,
  runTribunal
} from '../services/geminiService';
import { TribunalView } from './TribunalView';
import { 
  INITIAL_GREETING_SHIELD, 
  INITIAL_GREETING_SKULL, 
  INITIAL_GREETING_ROOT 
} from '../constants';
import ReactMarkdown from 'react-markdown';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { Typewriter } from './Typewriter';
import { AstraScanner } from './AstraScanner';
import { VoiceScanner } from './VoiceScanner';
import { MatrixRain } from './MatrixRain';
import { VoiceVisualizer } from './VoiceVisualizer';
import { Tooltip } from './Tooltip';
import { CyberBackground } from './CyberBackground';
import { Content } from '@google/genai';

interface ChatInterfaceProps {
  onBack: () => void;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
    shield: { pitch: 1.0, rate: 1.0, voiceURI: '' },
    skull: { pitch: 0.05, rate: 0.8, voiceURI: '' }, // More aggressive/Deep
    root: { pitch: 0.8, rate: 1.4, voiceURI: '' } // Default Robot
};

// Analysis function to detect if query requires live web data
const detectNewsIntent = (text: string): boolean => {
    const keywords = [
        "news", "latest", "recent", "update", "current", "today", "now",
        "weather", "forecast", "stock", "price", "crypto", "market", "score", "winner",
        "election", "schedule", "when is", "who won", "what happened", "live", "vs", "match", "game"
    ];
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
};

// Helper to convert internal Message type to Gemini Content type for history preservation
const getHistoryForGemini = (msgs: Message[]): Content[] => {
    return msgs
     .filter((m: Message) => m.id !== 'init' && !m.text.startsWith('>> IMAGE_GENERATED')) 
     .map((m: Message) => ({ 
         role: m.role === Role.USER ? 'user' : 'model', 
         parts: [{ text: m.text }] 
     }));
};

// --- SPECIALIZED FORENSIC RESULT COMPONENT ---
const ForensicResultDisplay = ({ text }: { text: string }) => {
  const isAudio = text.includes('[AUDIO_ANOMALIES]');
  
  const anomalyTag = isAudio ? '[AUDIO_ANOMALIES]' : '[ANOMALIES_DETECTED]';
  const reportTag = isAudio ? '[ACOUSTIC_REPORT]' : '[FORENSIC_REPORT]';
  const conclusionTag = '[CONCLUSION]';

  const anomalyMatch = text.match(new RegExp(`${anomalyTag.replace('[', '\\[').replace(']', '\\]')}([\\s\\S]*?)${reportTag.replace('[', '\\[').replace(']', '\\]')}`));
  const reportMatch = text.match(new RegExp(`${reportTag.replace('[', '\\[').replace(']', '\\]')}([\\s\\S]*?)${conclusionTag.replace('[', '\\[').replace(']', '\\]')}`));
  const conclusionMatch = text.match(new RegExp(`${conclusionTag.replace('[', '\\[').replace(']', '\\]')}([\\s\\S]*)`));

  const anomalies = anomalyMatch ? anomalyMatch[1].trim().split('\n').map(l => l.replace(/^-\s*/, '').trim()).filter(Boolean) : [];
  const report = reportMatch ? reportMatch[1].trim() : "";
  const conclusion = conclusionMatch ? conclusionMatch[1].trim() : "";
  
  if (!anomalyMatch && !reportMatch && !conclusionMatch) {
      return (
        <div className="flex flex-col gap-2">
           <div className="text-xs font-mono text-astra-blue animate-pulse">{" >> "} DECRYPTING_FORENSIC_DATA...</div>
           <div className="opacity-50 text-[10px] whitespace-pre-wrap font-mono">{text}</div>
        </div>
      );
  }

  // Determine alert level based on verdict
  const isDanger = conclusion.toLowerCase().includes('ai_generated') || 
                   conclusion.toLowerCase().includes('fake') || 
                   conclusion.toLowerCase().includes('ai_modified') ||
                   conclusion.toLowerCase().includes('ai_synthetic') ||
                   conclusion.toLowerCase().includes('voice_clone');
  const isClean = (conclusion.toLowerCase().includes('original') || conclusion.toLowerCase().includes('human_original')) && !isDanger;

  return (
    <div className="space-y-8 w-full mt-4">
        {/* 1. PRIMARY VERDICT BOX (TOP) - THE "ANSWER" */}
        {conclusion && (
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative overflow-hidden rounded-3xl border-4 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${
                    isDanger 
                    ? 'border-red-500 bg-red-950/60 shadow-red-500/30' 
                    : 'border-green-500 bg-green-950/60 shadow-green-500/30'
                }`}
            >
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1)_0%,transparent_60%)] pointer-events-none" />
                 
                 <div className="relative z-10 flex flex-col items-center text-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${isDanger ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="text-[10px] font-orbitron text-white font-bold tracking-[0.3em] uppercase">
                            Forensic Conclusion
                        </span>
                    </div>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                        className={`text-4xl md:text-5xl font-orbitron font-black tracking-tighter leading-none ${
                            isDanger 
                            ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                            : 'text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                        }`}
                    >
                        {isDanger ? 'DEEPFAKE_DETECTED' : 'HUMAN_VERIFIED'}
                    </motion.div>

                    <div className="w-full max-w-xs h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="font-mono text-base font-bold text-white/90 max-w-xl leading-relaxed">
                        {conclusion.split('\n').filter(l => !l.includes('VERDICT')).map((line, i) => (
                            <div key={i} className="mb-2">{line}</div>
                        ))}
                    </div>
                 </div>

                 {/* ANIMATED SCAN LINES ON VERDICT */}
                 <motion.div 
                    className={`absolute inset-0 pointer-events-none opacity-40 ${isDanger ? 'bg-[linear-gradient(transparent_0%,rgba(239,68,68,0.4)_50%,transparent_100%)]' : 'bg-[linear-gradient(transparent_0%,rgba(34,197,94,0.4)_50%,transparent_100%)]'}`}
                    animate={{ top: ['-100%', '100%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    style={{ backgroundSize: '100% 60px' }}
                 />
                 
                 {/* Corner Accents */}
                 <div className={`absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 ${isDanger ? 'border-red-400' : 'border-green-400'} rounded-tl-3xl opacity-50`} />
                 <div className={`absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 ${isDanger ? 'border-red-400' : 'border-green-400'} rounded-br-3xl opacity-50`} />
            </motion.div>
        )}

        {/* 2. "ALL THE THING" (DETAILS) AT THE BOTTOM */}
        <div className="space-y-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                <div className="text-[10px] font-orbitron text-gray-500 tracking-[0.5em] uppercase">Forensic Details</div>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            {/* DETECTED ANOMALIES */}
            <div className="space-y-3">
                <div className="text-[10px] font-orbitron text-astra-saffron tracking-widest flex items-center gap-2 opacity-60">
                    <AlertTriangle size={12} /> {isAudio ? 'AUDIO_ANOMALIES' : 'DETECTED_ANOMALIES'}
                </div>
                {anomalies.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                        {anomalies.map((anomaly, idx) => (
                            <motion.div 
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx} 
                                className="bg-white/5 border-l-2 border-red-500/40 p-3 text-xs font-mono text-gray-400 flex items-start gap-3 rounded-r backdrop-blur-sm hover:bg-white/10 transition-colors"
                            >
                               <ScanLine size={14} className="shrink-0 text-red-500/70 mt-0.5" />
                               <span>{anomaly}</span>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-gray-600 italic px-2">No significant anomalies flagged.</div>
                )}
            </div>

            {/* DETAILED REPORT */}
            {report && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-black/20 rounded-xl p-5 border border-white/5 backdrop-blur-sm"
                >
                    <div className="text-[10px] font-orbitron text-astra-blue tracking-widest mb-4 flex items-center gap-2 opacity-60">
                        <Search size={12} /> {isAudio ? 'ACOUSTIC_ANALYSIS' : 'FORENSIC_ANALYSIS'}
                    </div>
                    <div className="prose prose-invert prose-sm font-light text-gray-500 leading-relaxed max-w-none">
                        <ReactMarkdown>{report}</ReactMarkdown>
                    </div>
                </motion.div>
            )}
        </div>
    </div>
  );
};


// --- SPECIALIZED AGENT TASK COMPONENT ---
const AgentTaskDisplay = ({ text }: { text: string }) => {
  const planMatch = text.match(/\[PLAN\]([\s\S]*?)\[EXECUTION_LOG\]/);
  const logMatch = text.match(/\[EXECUTION_LOG\]([\s\S]*?)\[SYSTEM_STATUS\]/);
  const statusMatch = text.match(/\[SYSTEM_STATUS\]([\s\S]*?)\[COMPLETION_REPORT\]/);
  const reportMatch = text.match(/\[COMPLETION_REPORT\]([\s\S]*)/);

  const plan = planMatch ? planMatch[1].trim().split('\n').filter(Boolean) : [];
  const logs = logMatch ? logMatch[1].trim().split('\n').filter(Boolean) : [];
  const status = statusMatch ? statusMatch[1].trim() : "";
  const report = reportMatch ? reportMatch[1].trim() : "";

  if (!planMatch && !logMatch && !statusMatch && !reportMatch) {
      return (
        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 font-light text-base">
            <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      );
  }

  return (
    <div className="space-y-6 w-full mt-4">
        {/* 1. TASK PLAN */}
        <div className="space-y-3">
            <div className="text-[10px] font-orbitron text-astra-blue tracking-widest flex items-center gap-2 border-b border-astra-blue/20 pb-1 opacity-70">
                <LayoutGrid size={12} /> MISSION_PLAN
            </div>
            <div className="grid grid-cols-1 gap-2">
                {plan.map((step, idx) => (
                    <motion.div 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="bg-white/5 border-l-2 border-astra-blue p-3 text-xs font-mono text-gray-300 flex items-start gap-3 rounded-r backdrop-blur-sm"
                    >
                       <div className="w-4 h-4 rounded-full bg-astra-blue/20 flex items-center justify-center text-[10px] text-astra-blue font-bold shrink-0">{idx + 1}</div>
                       <span>{step.replace(/^-\s*/, '')}</span>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* 2. EXECUTION LOGS */}
        {logs.length > 0 && (
            <div className="space-y-3">
                <div className="text-[10px] font-orbitron text-astra-saffron tracking-widest flex items-center gap-2 border-b border-astra-saffron/20 pb-1 opacity-70">
                    <Activity size={12} /> EXECUTION_LOG
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-astra-saffron/80 space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="opacity-40">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                            <span>{log.replace(/^-\s*/, '')}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 3. SYSTEM STATUS */}
        {status && (
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                 <div className="text-[10px] font-orbitron text-white/60 tracking-widest mb-3 flex items-center gap-2">
                    <Cpu size={12} /> SYSTEM_STATUS
                 </div>
                 <div className="text-xs font-mono text-astra-blue">
                     {status}
                 </div>
            </div>
        )}

        {/* 4. COMPLETION REPORT */}
        {report && (
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative overflow-hidden rounded-3xl border-2 border-astra-blue bg-astra-blue/10 p-6 shadow-2xl"
            >
                 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                 <div className="relative z-10">
                    <div className="text-[10px] font-orbitron text-astra-blue tracking-[0.3em] mb-4 uppercase font-bold">
                        Mission Report
                    </div>
                    <div className="prose prose-invert prose-sm font-light text-gray-300 leading-relaxed max-w-none">
                        <ReactMarkdown>{report}</ReactMarkdown>
                    </div>
                 </div>
            </motion.div>
        )}
    </div>
  );
};


// --- MESSAGE ITEM COMPONENT (MEMOIZED) ---
const MessageItem = React.memo(({ 
    msg, 
    astraMode, 
    isLast, 
    isLoading, 
    copiedId, 
    speakingMessageId, 
    handleCopy, 
    handleSpeakToggle 
}: { 
    msg: Message; 
    astraMode: AstraMode; 
    isLast: boolean; 
    isLoading: boolean; 
    copiedId: string | null; 
    speakingMessageId: string | null; 
    handleCopy: (text: string, id: string) => void; 
    handleSpeakToggle: (text: string, id: string) => void; 
}) => {
    return (
        <motion.div 
            layout="position"
            initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ 
                duration: 0.5, 
                ease: [0.23, 1, 0.32, 1] 
            }}
            className={`flex flex-col ${msg.role === Role.USER ? 'items-end' : 'items-start'} gap-1`}
        >
            {/* Message Bubble/Content */}
            <motion.div 
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className={`max-w-[85%] md:max-w-[70%] group relative ${
                msg.role === Role.USER 
                 ? 'bg-[#2f2f2f] text-white rounded-[24px] px-5 py-3 rounded-br-none shadow-[0_4px_20px_rgba(0,0,0,0.5)]' 
                 : 'bg-transparent text-white px-0 py-0'
            }`}>
                
                {/* Attachments */}
                {msg.image && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-white/10 max-w-sm relative group/image">
                        <img src={msg.image} alt="Visual Data" className="w-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                             <button 
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = msg.image!;
                                    link.download = `astra-vision-${Date.now()}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="p-2 bg-black/50 hover:bg-astra-saffron hover:text-black text-white rounded-lg border border-white/20 backdrop-blur-md transition-all shadow-lg"
                                title="Download Output"
                             >
                                 <Download size={16} />
                             </button>
                        </div>
                    </div>
                )}

                {msg.text.includes('[AUDIO_ANOMALIES]') && (
                    <div className="mb-3 p-3 bg-astra-blue/5 border border-astra-blue/20 rounded-lg flex items-center gap-3">
                         <div className="p-2 bg-astra-blue/10 rounded-full">
                            <Volume2 size={20} className="text-astra-blue" />
                         </div>
                         <div className="text-xs font-mono text-astra-blue">VOICE_STREAM_ANALYZED</div>
                    </div>
                )}

                {/* Text Content */}
                <div className={`prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 ${astraMode === 'root' ? 'font-terminal text-lg text-green-500' : 'font-light text-base'}`}>
                   {msg.text.includes('[ANOMALIES_DETECTED]') ? (
                       <ForensicResultDisplay text={msg.text} />
                   ) : msg.text.includes('[PLAN]') ? (
                       <AgentTaskDisplay text={msg.text} />
                   ) : (
                       isLast && msg.role === Role.MODEL && isLoading ? (
                           <Typewriter text={msg.text} speed={astraMode === 'root' ? 2 : 8} />
                       ) : (
                           <ReactMarkdown
                            components={{
                                code({className, children, ...props}) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return match ? (
                                        <div className="relative group/code my-4">
                                            <div className="absolute -top-3 left-2 px-2 bg-gray-800 text-[10px] text-gray-400 rounded border border-gray-700 font-mono">
                                                {match[1].toUpperCase()}
                                            </div>
                                            <div className="bg-[#0d0d0d] p-4 rounded-lg border border-white/10 overflow-x-auto">
                                                <code className={`!bg-transparent text-sm font-mono text-gray-300 ${className}`} {...props}>
                                                    {children}
                                                </code>
                                            </div>
                                        </div>
                                    ) : (
                                        <code className="bg-white/10 px-1 py-0.5 rounded text-astra-saffron font-mono text-xs" {...props}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                           >
                               {msg.text}
                           </ReactMarkdown>
                       )
                   )}
                </div>
            </motion.div>

            {/* Footer Actions (Only for Model) */}
            {msg.role === Role.MODEL && (
                <div className="flex items-center gap-4 px-1 mt-1 opacity-60 text-gray-400">
                    <button onClick={() => handleCopy(msg.text, msg.id)} className="hover:text-white transition-colors">
                        {copiedId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                    <button 
                        onClick={() => handleSpeakToggle(msg.text, msg.id)} 
                        className={`transition-colors ${speakingMessageId === msg.id ? 'text-astra-saffron animate-pulse' : 'hover:text-white'}`}
                    >
                        {speakingMessageId === msg.id ? <StopIcon size={14} /> : <Volume2 size={14} />}
                    </button>
                    <span className="text-[10px] font-sans pt-0.5">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )}
            
            {/* Timestamp for User */}
            {msg.role === Role.USER && (
                <div className="text-[10px] text-gray-500 mr-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            )}

        </motion.div>
    );
});

// --- EMPTY STATE DASHBOARD COMPONENT ---
const getSuggestedPrompts = (mode: GenerationMode): { title: string, prompt: string }[] => {
    switch(mode) {
        case 'DEEP_THINK': return [
            { title: "Solve Math", prompt: "Solve a complex math problem step-by-step" },
            { title: "Explain Concept", prompt: "Explain quantum computing to a 5-year-old" },
            { title: "Analyze Logic", prompt: "Analyze the Ship of Theseus paradox" },
            { title: "Write Essay", prompt: "Write a philosophical essay on AI consciousness" }
        ];
        case 'ASTRA_CODER': return [
            { title: "React Component", prompt: "Write a React component for a dashboard" },
            { title: "Debug Code", prompt: "Help me debug a Python script" },
            { title: "Explain Docker", prompt: "Explain how Docker works with examples" },
            { title: "SQL Schema", prompt: "Create a SQL schema for a blog platform" }
        ];
        case 'IMAGE_EDIT': return [
            { title: "Cyberpunk Style", prompt: "Make this image look like a cyberpunk city" },
            { title: "Remove Background", prompt: "Remove the background from this image" },
            { title: "Add Object", prompt: "Add a futuristic car to the background" },
            { title: "Enhance Quality", prompt: "Enhance the quality and lighting of this image" }
        ];
        case 'ASTRA_DETECTION': return [
            { title: "Analyze Image", prompt: "Analyze this image for deepfake artifacts" },
            { title: "Check Metadata", prompt: "Check the metadata of this image" },
            { title: "Verify Source", prompt: "Verify if this image is AI-generated" },
            { title: "Forensic Scan", prompt: "Run a full forensic scan on this photo" }
        ];
        default: return [
            { title: "Capabilities", prompt: "What are your core capabilities?" },
            { title: "Write Email", prompt: "Help me write a professional email" },
            { title: "Learn Something", prompt: "Teach me something new today" },
            { title: "System Status", prompt: "Run a diagnostic on your system status" }
        ];
    }
}

const EmptyStateDashboard = ({ 
    astraMode, 
    genMode, 
    onSelectPrompt 
}: { 
    astraMode: AstraMode, 
    genMode: GenerationMode, 
    onSelectPrompt: (prompt: string) => void 
}) => {
    const prompts = getSuggestedPrompts(genMode);
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto mt-12 sm:mt-24 px-4"
        >
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-astra-blue/20 blur-3xl rounded-full" />
                <Logo className="w-24 h-24 sm:w-32 sm:h-32 relative z-10" isHackerMode={astraMode === 'root'} />
            </div>
            
            <h2 className={`text-2xl sm:text-3xl font-orbitron font-bold tracking-widest mb-2 text-center ${astraMode === 'root' ? 'text-red-500' : 'text-white'}`}>
                SYSTEM ONLINE
            </h2>
            <p className="text-gray-400 font-mono text-sm mb-12 text-center max-w-md">
                Awaiting input for protocol: <span className={`font-bold ${astraMode === 'root' ? 'text-red-500' : 'text-astra-blue'}`}>{genMode.replace('_', ' ')}</span>
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {prompts.map((p, i) => (
                    <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 + (i * 0.1) }}
                        onClick={() => onSelectPrompt(p.prompt)}
                        className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all group ${
                            astraMode === 'root' 
                            ? 'bg-red-950/20 border-red-900/30 hover:bg-red-900/40 hover:border-red-500/50' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-astra-blue/50'
                        }`}
                    >
                        <span className={`font-orbitron text-xs font-bold mb-1 ${astraMode === 'root' ? 'text-red-400' : 'text-astra-blue'}`}>
                            {p.title}
                        </span>
                        <span className="text-sm text-gray-400 group-hover:text-gray-200 line-clamp-2">
                            {p.prompt}
                        </span>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [genMode, setGenMode] = useState<GenerationMode>('CHAT');
  const [astraMode, setAstraMode] = useState<AstraMode>('shield'); 
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [featureMenuOpen, setFeatureMenuOpen] = useState(false);
  const [personalityMenuOpen, setPersonalityMenuOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [scanningImage, setScanningImage] = useState<string | null>(null);
  const [scanningAudioName, setScanningAudioName] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [skullIntensity, setSkullIntensity] = useState<'normal' | 'nuclear'>('normal');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);
  const [showTribunal, setShowTribunal] = useState(false);
  const [tribunalPrompt, setTribunalPrompt] = useState('');
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);
  const liveSessionRef = useRef<AstraLiveSession | null>(null);
  const personalityMenuRef = useRef<HTMLDivElement>(null);
  
  // --- INIT & LOAD HISTORY ---
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const savedHistory = localStorage.getItem('ASTRA_HISTORY');
    const savedAstraMode = localStorage.getItem('ASTRA_MODE') as AstraMode;
    const savedGenMode = localStorage.getItem('ASTRA_GEN_MODE') as GenerationMode;
    const savedIntensity = localStorage.getItem('ASTRA_SKULL_INTENSITY') as 'normal' | 'nuclear';
    const savedVoiceSettings = localStorage.getItem('ASTRA_VOICE_SETTINGS');

    if(savedVoiceSettings) {
        try {
            setVoiceSettings(JSON.parse(savedVoiceSettings));
        } catch(e) { console.error("Error loading voice settings", e); }
    }

    if (savedHistory && savedAstraMode) {
       try {
           const parsedMsgs = JSON.parse(savedHistory);
           setMessages(parsedMsgs);
           setAstraMode(savedAstraMode);
           if(savedGenMode) setGenMode(savedGenMode);
           
           const history = getHistoryForGemini(parsedMsgs);
           initializeChat(savedGenMode || 'CHAT', savedAstraMode, history, savedIntensity || 'normal');
       } catch (e) {
           console.error("Corrupt History", e);
           startFreshSession('shield', 'CHAT');
       }
    } else {
       startFreshSession('shield', 'CHAT');
    }

    // Cleanup audio on unmount
    return () => {
         speakText('', 'shield', undefined, true);
    }

  }, []);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (personalityMenuRef.current && !personalityMenuRef.current.contains(event.target as Node)) {
              setPersonalityMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
     if (isInitialized.current) {
        localStorage.setItem('ASTRA_HISTORY', JSON.stringify(messages));
        localStorage.setItem('ASTRA_MODE', astraMode);
        localStorage.setItem('ASTRA_GEN_MODE', genMode);
        localStorage.setItem('ASTRA_SKULL_INTENSITY', skullIntensity);
        localStorage.setItem('ASTRA_VOICE_SETTINGS', JSON.stringify(voiceSettings));
     }
  }, [messages, astraMode, genMode, skullIntensity, voiceSettings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time audio polling for Live Session
  useEffect(() => {
    let animationFrame: number;
    const update = () => {
      if (isLiveMode && liveSessionRef.current) {
        setAudioData(liveSessionRef.current.getFrequencyData());
        animationFrame = requestAnimationFrame(update);
      }
    };
    if (isLiveMode) {
      update();
    } else {
      setAudioData(new Uint8Array(0));
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isLiveMode]);

  const lastSpokenId = useRef<string | null>(null);
  const spokenLength = useRef<number>(0);

  useEffect(() => {
      if (isVoiceEnabled && messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          
          if (lastMsg.role === Role.MODEL && lastMsg.id !== 'init') {
              // If it's a new message, reset tracking and clear previous queue
              if (lastMsg.id !== lastSpokenId.current) {
                  speakText('', astraMode, undefined, true); // Stop previous
                  lastSpokenId.current = lastMsg.id;
                  spokenLength.current = 0;
              }

              // Only speak if we have new substantial text (e.g. a full sentence or 100+ chars)
              // or if the message is finished loading
              const currentText = lastMsg.text;
              const newText = currentText.substring(spokenLength.current);
              
              const shouldSpeak = !isLoading || 
                                 newText.includes('.') || 
                                 newText.includes('?') || 
                                 newText.includes('!') || 
                                 newText.length > 150;

              if (shouldSpeak && newText.trim().length > 20) {
                  spokenLength.current = currentText.length;
                  setSpeakingMessageId(lastMsg.id);
                  speakText(newText, astraMode, voiceSettings[astraMode], false, () => {
                      if (!isLoading) {
                        setSpeakingMessageId(prev => prev === lastMsg.id ? null : prev);
                      }
                  });
              }
          }
      } else if (!isVoiceEnabled) {
          speakText('', astraMode, undefined, true);
          setSpeakingMessageId(null);
          lastSpokenId.current = null;
          spokenLength.current = 0;
      }
  }, [messages, isVoiceEnabled, isLoading, astraMode, voiceSettings]);

  useEffect(() => {
      if (videoRef.current && screenStream) {
          videoRef.current.srcObject = screenStream;
      }
  }, [screenStream]);

  const toggleScreenShare = async () => {
      if (screenStream) {
          screenStream.getTracks().forEach(t => t.stop());
          setScreenStream(null);
      } else {
          try {
              const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
              stream.getVideoTracks()[0].onended = () => {
                  setScreenStream(null);
              };
              setScreenStream(stream);
          } catch (err) {
              console.error("Screen share error:", err);
          }
      }
  };

  const startFreshSession = (newAstraMode: AstraMode, newGenMode: GenerationMode, intensity: 'normal' | 'nuclear' = skullIntensity) => {
      initializeChat(newGenMode, newAstraMode, undefined, intensity);
      setMessages([]);
  };

  const switchProtocol = (newMode: AstraMode, intensity: 'normal' | 'nuclear' = skullIntensity) => {
      setAstraMode(newMode);
      if (newMode === 'skull') setSkullIntensity(intensity);
      startFreshSession(newMode, genMode, intensity);
  };

  const switchGenMode = (newMode: GenerationMode) => {
      setGenMode(newMode);
      setFeatureMenuOpen(false);
      startFreshSession(astraMode, newMode, skullIntensity);
  };

  const clearHistory = () => {
      localStorage.removeItem('ASTRA_HISTORY');
      localStorage.removeItem('ASTRA_MODE');
      localStorage.removeItem('ASTRA_GEN_MODE');
      startFreshSession(astraMode, genMode, skullIntensity);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setAttachment({
                      file,
                      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
                      base64: (ev.target.result as string).split(',')[1],
                      mimeType: file.type
                  });
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleCopy = useCallback((text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleSpeakToggle = useCallback((text: string, id: string) => {
      if (speakingMessageId === id) {
          // Stop
          speakText('', astraMode, undefined, true);
          setSpeakingMessageId(null);
      } else {
          // Play
          setSpeakingMessageId(id);
          speakText(text, astraMode, voiceSettings[astraMode], false, () => {
              setSpeakingMessageId(prev => prev === id ? null : prev);
          });
      }
  }, [speakingMessageId, astraMode, voiceSettings]);

  const handleTranscription = async () => {
    if (isTranscribing) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      setIsTranscribing(true);
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const text = await transcribeAudio(base64, 'audio/webm');
          if (text && text !== "TRANSCRIPTION_FAILED" && text !== "ERROR_IN_TRANSCRIPTION") {
            setInput(prev => prev ? `${prev} ${text}` : text);
          }
          setIsTranscribing(false);
          stream.getTracks().forEach(t => t.stop());
        };
        reader.readAsDataURL(blob);
      };
      
      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 5000); // Record for 5 seconds
      
    } catch (err) {
      console.error("Mic Access Denied", err);
      setIsTranscribing(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;

    // --- TRIBUNAL MODE INTERCEPTION ---
    if (genMode === 'ASTRA_TRIBUNAL') {
        setTribunalPrompt(input);
        setShowTribunal(true);
        setInput('');
        setAttachment(null);
        return;
    }
    
    setPulseTrigger(Date.now()); // Background pulse on user input

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input,
      image: attachment?.previewUrl,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    let currentAttachment = attachment;
    setAttachment(null);
    
    if (!currentAttachment && screenStream && videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            currentAttachment = {
                file: new File([new Blob()], "screen.jpg", { type: "image/jpeg" }),
                previewUrl: dataUrl,
                base64: dataUrl.split(',')[1],
                mimeType: 'image/jpeg'
            };
            userMsg.image = dataUrl;
            setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, image: dataUrl } : m));
        }
    }

    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    const updateModelMsg = (text: string) => {
        setPulseTrigger(Date.now()); // Background pulse on AI response chunks
        setMessages(prev => {
            const exists = prev.find(m => m.id === modelMsgId);
            if (exists) return prev.map(m => m.id === modelMsgId ? { ...m, text } : m);
            return [...prev, { id: modelMsgId, role: Role.MODEL, text, timestamp: Date.now() }];
        });
    };
    
    // Callback kept for API compatibility but UI does not use metadata
    const updateMetadata = (metadata: GroundingMetadata) => {
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, groundingMetadata: metadata } : m));
    };

    try {
        if (genMode === 'IMAGE_EDIT') {
            updateModelMsg('>> RENDERING_VISUAL_DATA...');
            const imgBase64 = await generateEditedImage(userMsg.text, currentAttachment?.base64, currentAttachment?.mimeType);
            if (imgBase64) {
                setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: ">> IMAGE_GENERATED.", image: imgBase64 } : m));
            } else {
                updateModelMsg(">> ERROR: RENDER FAILED.");
            }
        } else if (genMode === 'ASTRA_DETECTION') {
            if (currentAttachment) {
                setScanningImage(currentAttachment.previewUrl);
                const detectionPromise = runAstraDetection(currentAttachment, updateModelMsg);
                const minTimePromise = new Promise(resolve => setTimeout(resolve, 5500));
                const [result] = await Promise.all([detectionPromise, minTimePromise]);
                updateModelMsg(result);
            } else {
                 updateModelMsg(">> SYSTEM_ALERT: NO MEDIA DETECTED. PLEASE UPLOAD AN IMAGE FOR FORENSIC ANALYSIS.");
            }
        } else if (genMode === 'VOICE_DETECTOR') {
            if (currentAttachment && currentAttachment.mimeType.startsWith('audio/')) {
                setScanningAudioName(currentAttachment.file.name);
                const detectionPromise = runAstraVoiceDetection(currentAttachment, updateModelMsg);
                const minTimePromise = new Promise(resolve => setTimeout(resolve, 5500));
                const [result] = await Promise.all([detectionPromise, minTimePromise]);
                updateModelMsg(result);
            } else {
                updateModelMsg(">> SYSTEM_ALERT: NO AUDIO DETECTED. PLEASE UPLOAD AN AUDIO FILE FOR VOICE ANALYSIS.");
            }
        } else if (genMode === 'ASTRA_AGENT') {
            updateModelMsg('>> INITIALIZING_REMOTE_AGENT_CORE...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            updateModelMsg('>> ESTABLISHING_SECURE_UPLINK...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            updateModelMsg('>> UPLINK_STABLE. ANALYZING_TASK_PARAMETERS...');
            
            const currentHistory = getHistoryForGemini([...messages, userMsg]);
            await sendMessageToGemini(
                userMsg.text, 
                currentAttachment, 
                genMode, 
                astraMode, 
                updateModelMsg, 
                updateMetadata,
                currentHistory
            );
        } else {
            let effectiveGenMode = genMode;
            if (genMode === 'CHAT' && !currentAttachment && detectNewsIntent(userMsg.text)) {
                effectiveGenMode = 'WEB_INTEL';
            }

            if (astraMode === 'root') {
                updateModelMsg('> [EXECUTING_ROOT_COMMAND]...');
            } else if (effectiveGenMode === 'WEB_INTEL' && genMode === 'CHAT') {
                updateModelMsg('Let me check the latest information for you... 🔍\n\n');
            }

            const currentHistory = getHistoryForGemini([...messages, userMsg]);
            await sendMessageToGemini(
                userMsg.text, 
                currentAttachment, 
                effectiveGenMode, 
                astraMode, 
                updateModelMsg, 
                updateMetadata,
                currentHistory
            );
        }
    } catch (error) {
        updateModelMsg(">> SYSTEM FAILURE.");
    }
    setIsLoading(false);
    setScanningImage(null);
    setScanningAudioName(null);
  };

  const toggleLiveSession = () => {
      if (isLiveMode) {
          liveSessionRef.current?.stop();
          liveSessionRef.current = null;
          setIsLiveMode(false);
      } else {
          setIsLiveMode(true);
          const session = new AstraLiveSession(astraMode, genMode, screenStream);
          session.start(() => {
              setIsLiveMode(false);
              liveSessionRef.current = null;
          });
          liveSessionRef.current = session;
      }
  };

  const getModeIcon = (m: GenerationMode) => {
      switch(m) {
          case 'DEEP_THINK': return BrainCircuit;
          case 'IMAGE_EDIT': return ImageIcon;
          case 'ASTRA_DETECTION': return ScanEye;
          case 'VOICE_DETECTOR': return Volume2;
          case 'ASTRA_CODER': return Code2;
          case 'ASTRA_AGENT': return Cpu;
          case 'ASTRA_TRIBUNAL': return Gavel;
          default: return Terminal;
      }
  }

  const getThemeClasses = () => {
      switch(astraMode) {
          case 'skull': return 'bg-red-950 text-red-100 font-sans'; 
          case 'root': return 'bg-black text-red-500 font-terminal crt-scanlines'; 
          default: return 'bg-black text-white font-sans';
      }
  };

  const features = [
      { id: 'CHAT', label: 'CORE CHAT', desc: 'Standard Astra Intelligence', icon: Terminal },
      { id: 'DEEP_THINK', label: 'DEEP REASONING', desc: 'Complex Problem Solving (High IQ)', icon: BrainCircuit },
      { id: 'IMAGE_EDIT', label: 'VISION EDIT', desc: 'Modify Images via Prompt', icon: ImageIcon },
      { id: 'ASTRA_DETECTION', label: 'AI DETECTOR', desc: 'Forensic Image Analysis', icon: ScanEye },
      { id: 'VOICE_DETECTOR', label: 'VOICE SENTINEL', desc: 'Deepfake Voice Detection', icon: Volume2 },
      { id: 'ASTRA_CODER', label: 'ASTRA CODER', desc: 'Gemini Canvas Style Dev', icon: Code2 }, 
      { id: 'ASTRA_TRIBUNAL', label: 'THE TRIBUNAL', desc: 'Multi-Agent Debate & Verdict', icon: Gavel },
      { id: 'ASTRA_AGENT', label: 'ASTRA AGENT', desc: 'Remote Task Automation', icon: Cpu },
  ];

  const CurrentModeIcon = getModeIcon(genMode);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col h-[100dvh] w-full overflow-hidden bg-hex-pattern ${getThemeClasses()}`}>
      
      {/* --- DYNAMIC BACKGROUND --- */}
      <CyberBackground mode={astraMode} isProcessing={isLoading} pulseTrigger={pulseTrigger} />

      {astraMode === 'root' && (
          <>
             <MatrixRain />
             <div className="fixed inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none animate-pulse">
                <Logo className="w-[300px] h-[300px]" isHackerMode={true} />
             </div>
             <div className="fixed inset-0 bg-red-500/5 z-0 pointer-events-none animate-pulse"></div>
          </>
      )}

      {/* --- HEADER --- */}
      <header className={`relative z-50 flex flex-col ${astraMode === 'root' ? 'bg-black/90' : 'bg-black/60 backdrop-blur-xl'} border-b border-white/10 transition-colors duration-500`}>
        
        <div className="flex items-center justify-between p-3 relative">
            {/* LEFT: LOGO & BACK */}
            <div className="flex items-center gap-3 flex-1">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Logo className="w-8 h-8" isHackerMode={astraMode === 'root'} />
                </button>
            </div>

            {/* CENTER: FEATURE DROPDOWN */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                 <div className="relative">
                    <button 
                    onClick={() => setFeatureMenuOpen(!featureMenuOpen)}
                    className={`flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/10 hover:border-astra-blue/50 transition-all group backdrop-blur-md shadow-lg ${astraMode === 'root' ? 'bg-red-900/40 text-red-500' : 'bg-white/5 text-astra-blue'}`}
                    >
                        <CurrentModeIcon size={18} className="group-hover:animate-pulse text-astra-saffron" />
                        <span className="font-orbitron text-xs font-bold tracking-wider hidden sm:inline-block">{genMode.replace('_', ' ')}</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 opacity-60 ${featureMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {featureMenuOpen && (
                            <>
                            <div className="fixed inset-0 z-40" onClick={() => setFeatureMenuOpen(false)}></div>
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95, x: "-50%" }}
                              animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                              exit={{ opacity: 0, y: -10, scale: 0.95, x: "-50%" }}
                              className="absolute top-full left-1/2 mt-3 w-[280px] sm:w-[320px] bg-[#050505]/95 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col z-50"
                            >
                                <div className="px-5 py-3 bg-white/5 text-[10px] font-orbitron tracking-widest text-gray-400 uppercase border-b border-white/10 flex items-center justify-between">
                                    <span>Select Protocol</span>
                                    <Activity size={12} className="text-astra-blue" />
                                </div>
                                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    {features.map((f) => (
                                        <button
                                          key={f.id}
                                          onClick={() => switchGenMode(f.id as GenerationMode)}
                                          className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all text-left border border-transparent group ${genMode === f.id ? 'bg-astra-blue/10 border-astra-blue/30' : 'hover:bg-white/5 hover:border-white/10'}`}
                                        >
                                            <div className={`p-2 rounded-lg ${genMode === f.id ? 'bg-astra-saffron text-black' : 'bg-white/10 text-gray-400 group-hover:text-white'}`}>
                                                <f.icon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-orbitron text-xs font-bold tracking-wide ${genMode === f.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {f.label}
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-tech leading-tight mt-0.5 group-hover:text-gray-400">
                                                    {f.desc}
                                                </div>
                                            </div>
                                            {genMode === f.id && <div className="w-1.5 h-1.5 rounded-full bg-astra-saffron shadow-[0_0_8px_#FF9933]"></div>}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                 </div>
            </div>

            {/* RIGHT: TOOLS */}
            <div className="flex items-center justify-end gap-2 flex-1">
                
                {/* SKULL INTENSITY TOGGLE */}
                {astraMode === 'skull' && (
                    <button 
                        onClick={() => {
                            const next = skullIntensity === 'normal' ? 'nuclear' : 'normal';
                            switchProtocol('skull', next);
                        }}
                        className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all font-bold text-[10px] tracking-wider ${
                            skullIntensity === 'nuclear' 
                            ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse' 
                            : 'bg-red-950/50 text-red-400 border-red-900/50 hover:bg-red-900/80'
                        }`}
                    >
                        <Flame size={14} className={skullIntensity === 'nuclear' ? 'fill-white' : ''} />
                        {skullIntensity === 'nuclear' ? 'NUCLEAR ☢️' : 'ROAST 🔥'}
                    </button>
                )}

                <Tooltip content="WIPE MEMORY" position="bottom">
                    <button 
                        onClick={clearHistory}
                        className="flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 sm:py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/60 text-red-500 rounded-lg transition-all"
                    >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline ml-2 text-[10px] font-orbitron tracking-widest">PURGE</span>
                    </button>
                </Tooltip>

                <Tooltip content={isVoiceEnabled ? "MUTE VOICE" : "ENABLE VOICE"} position="bottom">
                    <button 
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`p-2 rounded-lg transition-all border border-transparent ${isVoiceEnabled ? 'bg-astra-saffron text-black shadow-[0_0_10px_#FF9933]' : 'bg-white/5 text-gray-400 hover:text-white hover:border-white/20'}`}
                    >
                        {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                </Tooltip>
            </div>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </header>

      {/* --- MAIN CHAT AREA --- */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth pb-32 relative">
        {/* Background Grid Animation for Chat Area */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
             <motion.div 
               animate={{ opacity: [0.02, 0.05, 0.02] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"
             />
        </div>

        <div className="relative z-10 space-y-8">
            <AnimatePresence initial={false}>
            {messages.length === 0 ? (
                <EmptyStateDashboard 
                    astraMode={astraMode} 
                    genMode={genMode} 
                    onSelectPrompt={(prompt) => {
                        setInput(prompt);
                        // Optional: auto-send
                        // handleSend(new Event('submit') as any, prompt);
                    }} 
                />
            ) : (
                messages.map((msg, idx) => (
                  <MessageItem 
                    key={msg.id}
                    msg={msg}
                    astraMode={astraMode}
                    isLast={idx === messages.length - 1}
                    isLoading={isLoading}
                    copiedId={copiedId}
                    speakingMessageId={speakingMessageId}
                    handleCopy={handleCopy}
                    handleSpeakToggle={handleSpeakToggle}
                  />
                ))
            )}
            </AnimatePresence>
            
            {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                   <div className="flex items-center gap-2 h-8 px-4 bg-white/5 rounded-full border border-white/10">
                       <div className="w-1.5 h-1.5 bg-astra-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                       <div className="w-1.5 h-1.5 bg-astra-blue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                       <div className="w-1.5 h-1.5 bg-astra-blue rounded-full animate-bounce"></div>
                       <span className="text-[10px] font-tech text-astra-blue ml-2 tracking-widest">PROCESSING</span>
                   </div>
                </motion.div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </main>

      {/* --- LIVE VISUALIZER OVERLAY --- */}
      <AnimatePresence>
          {isLiveMode && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[60]"
              >
                  <VoiceVisualizer data={audioData} color={astraMode === 'root' ? "astra-green" : "astra-saffron"} count={24} />
              </motion.div>
          )}
      </AnimatePresence>

      {/* --- SCREEN SHARE PREVIEW --- */}
      <AnimatePresence>
          {screenStream && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  className="absolute top-24 right-4 z-40 w-32 sm:w-48 aspect-video bg-black rounded-lg border border-astra-blue/50 overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.2)]"
              >
                  <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-black/60 px-2 py-0.5 rounded text-[8px] text-astra-blue font-orbitron tracking-widest flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE SCREEN
                  </div>
                  <button 
                      onClick={toggleScreenShare}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500/80 text-white rounded transition-colors"
                  >
                      <X size={12} />
                  </button>
              </motion.div>
          )}
      </AnimatePresence>

      {/* --- INPUT AREA --- */}
      <div className={`p-4 ${astraMode === 'root' ? 'bg-black border-t-2 border-green-500' : 'bg-black/60 backdrop-blur-xl border-t border-white/10'}`}>
         
         {/* ATTACHMENT PREVIEW */}
         <AnimatePresence>
             {attachment && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 10 }}
                   className="absolute bottom-full left-4 mb-4 bg-gray-900 border border-white/20 p-2 rounded-lg flex items-center gap-3"
                 >
                     <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center bg-white/5">
                         {attachment.mimeType.startsWith('image/') ? (
                             <img src={attachment.previewUrl} className="w-full h-full object-cover" />
                         ) : (
                             <Volume2 size={20} className="text-astra-blue" />
                         )}
                     </div>
                     <div className="text-xs max-w-[150px] truncate">{attachment.file.name}</div>
                     <button onClick={() => setAttachment(null)} className="p-1 hover:bg-white/20 rounded-full"><X size={14} /></button>
                 </motion.div>
             )}
         </AnimatePresence>

         <div className="max-w-4xl mx-auto flex flex-wrap gap-2 sm:gap-3 items-end">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept={genMode === 'VOICE_DETECTOR' ? "audio/*" : "image/*"}
              onChange={handleFileSelect}
            />

            {/* TOOLS CONTAINER */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* PERSONALITY SWITCHER */}
                <div className="relative shrink-0" ref={personalityMenuRef}>
                   <Tooltip content="IDENTITY MATRIX" position="top" disabled={personalityMenuOpen}>
                       <motion.button 
                          layout
                          onClick={() => setPersonalityMenuOpen(!personalityMenuOpen)}
                          className={`p-3 rounded-xl transition-colors border relative overflow-hidden ${
                              astraMode === 'skull' ? 'border-red-500/50 text-red-500 bg-red-500/10' :
                              astraMode === 'root' ? 'border-green-500/50 text-green-500 bg-green-500/10' :
                              'border-white/10 text-astra-blue bg-white/5 hover:bg-white/10'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                       >
                           <AnimatePresence mode="wait" initial={false}>
                               <motion.div
                                   key={astraMode}
                                   initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                   animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                   exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                   transition={{ duration: 0.2 }}
                               >
                                   {astraMode === 'shield' && <Shield size={20} />}
                                   {astraMode === 'skull' && <Skull size={20} />}
                                   {astraMode === 'root' && <Terminal size={20} />}
                               </motion.div>
                           </AnimatePresence>
                       </motion.button>
                   </Tooltip>

                   <AnimatePresence>
                      {personalityMenuOpen && (
                          <motion.div 
                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
                             animate={{ opacity: 1, y: -10, scale: 1 }}
                             exit={{ opacity: 0, y: 10, scale: 0.95 }}
                             className="absolute bottom-full left-0 mb-2 w-56 bg-[#0a0a0a] border border-white/20 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.8)] z-50 flex flex-col backdrop-blur-xl"
                          >
                              <div className="px-4 py-3 text-[10px] text-gray-500 font-orbitron tracking-widest border-b border-white/10 bg-white/5">
                                  PERSONALITY MATRIX
                              </div>
                              
                              <motion.button 
                                 whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", x: 4 }}
                                 onClick={() => { switchProtocol('shield'); setPersonalityMenuOpen(false); }}
                                 className={`flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-white/5 w-full ${astraMode === 'shield' ? 'text-astra-blue' : 'text-gray-400'}`}
                              >
                                  <Shield size={16} />
                                  <div className="flex-1">
                                      <div className="font-bold text-xs">SHIELD</div>
                                      <div className="text-[10px] opacity-60">Standard Defense</div>
                                  </div>
                                  {astraMode === 'shield' && (
                                      <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-astra-blue" />
                                  )}
                              </motion.button>

                              <motion.div 
                                 whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)", x: 4 }}
                                 onClick={() => { switchProtocol('skull'); setPersonalityMenuOpen(false); }}
                                 className={`flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-white/5 w-full cursor-pointer ${astraMode === 'skull' ? 'text-red-500' : 'text-gray-400'}`}
                              >
                                  <Flame size={16} />
                                  <div className="flex-1">
                                      <div className="font-bold text-xs">ROAST / SKULL</div>
                                      <div className="text-[10px] opacity-60">Toxic & Savage</div>
                                  </div>
                                  {astraMode === 'skull' && (
                                      <div className="flex gap-1 items-center">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); const next = skullIntensity === 'normal' ? 'nuclear' : 'normal'; switchProtocol('skull', next); }}
                                            className={`px-1.5 py-0.5 rounded text-[8px] border ${skullIntensity === 'nuclear' ? 'bg-red-500 text-white border-red-500' : 'border-red-500/50 text-red-500 hover:bg-red-500/10'}`}
                                          >
                                              {skullIntensity === 'nuclear' ? 'NUCLEAR' : 'NORMAL'}
                                          </button>
                                          <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                      </div>
                                  )}
                              </motion.div>

                              <motion.button 
                                 whileHover={{ backgroundColor: "rgba(34, 197, 94, 0.1)", x: 4 }}
                                 onClick={() => { switchProtocol('root'); setPersonalityMenuOpen(false); }}
                                 className={`flex items-center gap-3 px-4 py-3 transition-colors text-left w-full ${astraMode === 'root' ? 'text-green-500' : 'text-gray-400'}`}
                              >
                                  <Terminal size={16} />
                                  <div className="flex-1">
                                      <div className="font-bold text-xs">ROOT SHELL</div>
                                      <div className="text-[10px] opacity-60">Hacker CLI</div>
                                  </div>
                                  {astraMode === 'root' && (
                                      <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                  )}
                              </motion.button>
                          </motion.div>
                      )}
                   </AnimatePresence>
                </div>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-xl transition-colors shrink-0 ${astraMode === 'root' ? 'border border-green-500 text-green-500 hover:bg-green-500/20' : 'bg-white/5 text-gray-400 hover:text-astra-blue hover:bg-white/10'}`}
                >
                    <Paperclip size={20} />
                </button>

                <Tooltip content={isTranscribing ? "RECORDING..." : "TRANSCRIBE AUDIO"} position="top">
                    <button 
                      onClick={handleTranscription}
                      className={`p-3 rounded-xl transition-all shrink-0 ${isTranscribing ? 'bg-red-500 text-white animate-pulse' : astraMode === 'root' ? 'border border-green-500 text-green-500 hover:bg-green-500/20' : 'bg-white/5 text-gray-400 hover:text-astra-blue hover:bg-white/10'}`}
                    >
                        <Mic size={20} />
                    </button>
                </Tooltip>
                
                <Tooltip content={screenStream ? "STOP SCREEN SHARE" : "SHARE SCREEN"} position="top">
                    <button 
                      onClick={toggleScreenShare}
                      className={`p-3 rounded-xl transition-all shrink-0 ${screenStream ? 'bg-astra-blue text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]' : astraMode === 'root' ? 'border border-green-500 text-green-500 hover:bg-green-500/20' : 'bg-white/5 text-gray-400 hover:text-astra-blue hover:bg-white/10'}`}
                    >
                        <MonitorUp size={20} />
                    </button>
                </Tooltip>

                <button
                   onClick={toggleLiveSession}
                   className={`p-3 rounded-xl transition-all relative shrink-0 ${isLiveMode ? 'bg-red-500 text-white animate-pulse' : astraMode === 'root' ? 'border border-green-500 text-green-500 hover:bg-green-500/20' : 'bg-white/5 text-gray-400 hover:text-astra-blue hover:bg-white/10'}`}
                >
                    {isLiveMode ? <StopCircle size={20} /> : <Radio size={20} />}
                </button>

                 {/* DEEP THINK TOGGLE BUTTON */}
                 <Tooltip content={genMode === 'DEEP_THINK' ? "DEEP THINKING ACTIVE" : "ENABLE DEEP REASONING"} position="top">
                    <button
                        onClick={() => switchGenMode(genMode === 'DEEP_THINK' ? 'CHAT' : 'DEEP_THINK')}
                        className={`p-3 rounded-xl transition-all relative shrink-0 ${
                            genMode === 'DEEP_THINK' 
                            ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' 
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        {genMode === 'DEEP_THINK' ? <BrainCircuit size={20} className="animate-pulse" /> : <Zap size={20} />}
                    </button>
                </Tooltip>
            </div>

            <motion.div 
              animate={{ 
                  borderColor: isInputFocused 
                      ? (astraMode === 'root' ? '#22c55e' : (astraMode === 'skull' ? '#ef4444' : 'rgba(0, 240, 255, 0.8)')) 
                      : (astraMode === 'root' ? '#15803d' : 'rgba(255, 255, 255, 0.1)'),
                  boxShadow: isInputFocused 
                      ? (astraMode === 'root' ? '0 0 15px rgba(34, 197, 94, 0.4)' : (astraMode === 'skull' ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(0, 240, 255, 0.3)'))
                      : 'none',
                  scale: isInputFocused ? 1.02 : 1,
                  y: isInputFocused ? -2 : 0
              }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              className={`flex-1 min-w-[250px] flex items-center gap-2 p-3 rounded-xl border ${astraMode === 'root' ? 'bg-black' : 'bg-black/40 backdrop-blur-md'}`}
            >
                {astraMode === 'root' && <span className="text-green-500 font-terminal mr-1">{'>'}</span>}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={(e) => {
                      if(e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                      }
                  }}
                  placeholder={astraMode === 'skull' ? (skullIntensity === 'nuclear' ? "Himmat hai toh bol... ☠️" : "Say something stupid...") : astraMode === 'root' ? "ENTER_COMMAND_MATRIX..." : "Message Astra..."}
                  className={`bg-transparent w-full resize-none outline-none max-h-32 text-sm ${astraMode === 'root' ? 'font-terminal text-green-500 placeholder-green-800' : 'text-white placeholder-gray-500'}`}
                  rows={1}
                />
            </motion.div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !attachment)}
              className={`p-3 rounded-xl transition-all disabled:opacity-50 ${
                  astraMode === 'root' 
                  ? 'bg-green-600 text-black hover:bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                  : 'bg-astra-blue text-black hover:bg-astra-blue/80 shadow-[0_0_20px_rgba(0,240,255,0.4)]'
              }`}
            >
                <Send size={20} className={(!input.trim() && !attachment) ? '' : 'animate-pulse'} />
            </motion.button>
         </div>
      </div>

      {/* --- SCANNERS & OVERLAYS --- */}
      <AnimatePresence>
          {showTribunal && <TribunalView prompt={tribunalPrompt} onClose={() => setShowTribunal(false)} />}
          {scanningImage && <AstraScanner imageUrl={scanningImage} />}
          {scanningAudioName && <VoiceScanner audioName={scanningAudioName} />}
      </AnimatePresence>
      {isVoiceEnabled && !isLoading && !isLiveMode && <div className="absolute top-20 right-4 pointer-events-none opacity-50"><VoiceVisualizer /></div>}

    </div>
  );
};
