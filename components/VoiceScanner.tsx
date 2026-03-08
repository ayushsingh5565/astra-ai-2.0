
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Volume2, Shield, Search, 
  AlertCircle, CheckCircle2, Radio,
  Waves, Mic2, Cpu, Zap
} from 'lucide-react';

export const VoiceScanner: React.FC<{ audioName: string }> = ({ audioName }) => {
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1000); // Spectral Analysis
    const t2 = setTimeout(() => setPhase(2), 3000); // Neural Audit
    const t3 = setTimeout(() => setPhase(3), 5000); // Finalizing
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden">
        
        {/* --- BACKGROUND AMBIANCE --- */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,153,51,0.1)_0%,transparent_70%)] opacity-50 pointer-events-none" />
        
        {/* --- MAIN HUD CLUSTER --- */}
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6">
            
            {/* CENTRAL VISUALIZER */}
            <div className="relative w-full max-w-2xl aspect-video bg-black/40 border border-white/10 rounded-3xl overflow-hidden flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,153,51,0.1)]">
                
                {/* Decorative Markers */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-astra-saffron rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-astra-saffron rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-astra-saffron rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-astra-saffron rounded-br-3xl" />

                {/* Waveform Animation */}
                <div className="flex items-center gap-1 h-32">
                    {[...Array(32)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 bg-astra-saffron rounded-full"
                            animate={{ 
                                height: phase < 3 ? [20, Math.random() * 100 + 20, 20] : [20, 30, 20],
                                opacity: phase < 3 ? [0.3, 1, 0.3] : 0.5
                            }}
                            transition={{ 
                                duration: 0.5 + Math.random(), 
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>

                {/* Scanning Line */}
                <AnimatePresence>
                    {phase < 3 && (
                        <motion.div 
                            className="absolute inset-y-0 w-1 bg-astra-saffron/50 shadow-[0_0_20px_#FF9933] z-20"
                            initial={{ left: "-10%" }}
                            animate={{ left: "110%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    )}
                </AnimatePresence>

                {/* Status Overlay */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <div className="font-orbitron text-xs font-bold text-astra-saffron tracking-[0.3em] animate-pulse">
                        {phase === 0 ? "INITIALIZING_STREAM" : phase === 1 ? "SPECTRAL_ANALYSIS" : phase === 2 ? "NEURAL_AUDIT" : "ANALYSIS_COMPLETE"}
                    </div>
                    <div className="font-tech text-[10px] text-gray-500 uppercase tracking-widest">
                        SOURCE: {audioName}
                    </div>
                </div>
            </div>

            {/* --- DATA LOG PANEL --- */}
            <div className="mt-8 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/60 border border-white/10 p-4 rounded-xl backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-3 text-astra-saffron font-orbitron text-[10px] tracking-widest">
                        <Cpu size={14} /> ACOUSTIC_ENGINE
                    </div>
                    <div className="space-y-2 font-tech text-[9px] text-gray-400">
                        <div className="flex justify-between">
                            <span>SAMPLE_RATE</span>
                            <span className="text-white">48.0 KHZ</span>
                        </div>
                        <div className="flex justify-between">
                            <span>BIT_DEPTH</span>
                            <span className="text-white">24-BIT PCM</span>
                        </div>
                        <div className="flex justify-between">
                            <span>CHANNELS</span>
                            <span className="text-white">MONO_AUDIT</span>
                        </div>
                    </div>
                </div>

                <div className="bg-black/60 border border-white/10 p-4 rounded-xl backdrop-blur-md font-mono text-[9px] text-gray-500 h-24 overflow-hidden flex flex-col justify-end">
                    <div className="text-astra-saffron mb-2 font-bold flex items-center gap-2 uppercase tracking-tighter"><Activity size={10} /> Live_Audit_Log</div>
                    {phase >= 0 && <motion.div initial={{opacity:0}} animate={{opacity:1}}> {" > "} STREAM_MOUNTED... OK </motion.div>}
                    {phase >= 1 && <motion.div initial={{opacity:0}} animate={{opacity:1}}> {" > "} SPECTRAL_DENSITY_SCAN... OK </motion.div>}
                    {phase >= 2 && <motion.div initial={{opacity:0}} animate={{opacity:1}}> {" > "} NEURAL_SYNC_CHECK... <span className="text-astra-saffron">PENDING</span> </motion.div>}
                    <motion.div animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity }}>_</motion.div>
                </div>
            </div>

            {/* --- BOTTOM STATUS --- */}
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-12 flex items-center gap-6 px-8 py-4 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl"
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${phase === 3 ? 'bg-green-500 shadow-[0_0_10px_#00FF41]' : 'bg-astra-saffron shadow-[0_0_10px_#FF9933] animate-pulse'}`} />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-current opacity-50 animate-ping" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-orbitron text-xs font-bold text-white tracking-[0.2em]">
                            ASTRA_VOICE_SENTINEL
                        </span>
                        <span className="font-tech text-[9px] text-astra-saffron">
                             ENCRYPTED_FORENSIC_STREAM // V.2.4.0
                        </span>
                    </div>
                </div>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                        <span className="font-tech text-[8px] text-gray-500">INTEGRITY</span>
                        <span className="font-orbitron text-xs text-white">{phase < 3 ? "CALC..." : "98.2%"}</span>
                    </div>
                    <Shield size={20} className="text-astra-saffron" />
                </div>
            </motion.div>

        </div>
    </div>
  );
};
