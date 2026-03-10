
import React from 'react';
import { Terminal, Cpu, Zap, Globe, ChevronRight, Shield, Code2, Activity, Scan, Disc, Aperture, Volume2 } from 'lucide-react';
import { Typewriter } from './Typewriter';
import { Logo } from './Logo';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen w-full relative flex flex-col bg-hex-pattern selection:bg-astra-blue selection:text-black overflow-hidden">
      
      {/* BACKGROUND ANIMATIONS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Moving Scanline */}
        <motion.div 
          animate={{ y: ['-100%', '1000%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="w-full h-[2px] bg-astra-blue/20 shadow-[0_0_15px_rgba(0,240,255,0.5)]"
        />
        
        {/* Random Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5
            }}
            animate={{ 
              y: [null, Math.random() * -100 + "px"],
              opacity: [0, 0.5, 0]
            }}
            transition={{ 
              duration: Math.random() * 5 + 5, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 5
            }}
            className="absolute w-1 h-1 bg-astra-blue rounded-full"
          />
        ))}

        {/* Pulsing Grid Overlay */}
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"
        />
      </div>

      {/* HUD CORNER BRACKETS */}
      <div className="fixed inset-4 pointer-events-none z-50 border border-white/5">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-astra-blue"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-astra-blue"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-astra-blue"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-astra-blue"></div>
        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 opacity-20">
           <div className="w-full h-px bg-white"></div>
           <div className="h-full w-px bg-white absolute top-0 left-1/2 -translate-x-1/2"></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-4 md:p-8">
        
        {/* --- HEADER: DATA STREAM STYLE --- */}
        <header className="flex justify-between items-end border-b border-white/10 pb-4 mb-10">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <motion.div 
               initial={{ rotate: -90, opacity: 0 }}
               animate={{ rotate: 0, opacity: 1 }}
               className="relative"
            >
              <div className="absolute inset-0 bg-astra-blue blur-xl opacity-20"></div>
              <Logo className="w-12 h-12 relative z-10 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
            </motion.div>
            <div>
              <motion.h1 
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="font-orbitron text-3xl font-bold tracking-tighter text-white"
              >
                ASTRA<span className="text-astra-blue">.AI</span>
              </motion.h1>
              <div className="flex items-center gap-2 text-[10px] text-astra-blue font-tech tracking-[0.3em]">
                 <motion.span
                   animate={{ opacity: [0.4, 1, 0.4] }}
                   transition={{ duration: 2, repeat: Infinity }}
                 >
                   // CYBER-CORE
                 </motion.span>
                 <span className="animate-pulse">●</span>
                 <span>V.2.0.9</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="hidden md:block text-right font-tech text-xs text-gray-500"
          >
            <div className="flex items-center justify-end gap-2">
              <div className="w-2 h-2 bg-astra-green animate-pulse"></div>
              <span>SYS.STATUS: OPTIMAL</span>
            </div>
            <div>LOC: INDIA_SECURE_SERVER</div>
            <div>UPTIME: 99.999%</div>
          </motion.div>
        </header>

        {/* --- HERO SECTION: HOLOGRAPHIC PROJECTION --- */}
        <main className="flex-1 flex flex-col items-center justify-center text-center relative">
          
          {/* Decorative Data Strings */}
          <div className="absolute top-10 left-10 font-tech text-xs text-white/10 rotate-90 hidden md:block">
             0xFFA1 // MEMORY_ALLOC
          </div>
          <div className="absolute bottom-20 right-20 font-tech text-xs text-white/10 -rotate-90 hidden md:block">
             SECURE_PROTOCOL_INIT
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-8"
          >
             <motion.div
               animate={{ 
                 textShadow: [
                   "0 0 10px rgba(0,240,255,0.5)",
                   "0 0 20px rgba(0,240,255,0.8)",
                   "0 0 10px rgba(0,240,255,0.5)"
                 ]
               }}
               transition={{ duration: 2, repeat: Infinity }}
               className="glitch-header font-orbitron text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-astra-blue to-blue-600" 
               data-text="CYBER-SENTINEL"
             >
               CYBER-SENTINEL
             </motion.div>
             <div className="h-1 w-32 bg-astra-blue mx-auto mt-2 shadow-[0_0_15px_#00F0FF] animate-pulse"></div>
             
             {/* ALWAYS ANIMATED INTELLIGENCE LABEL */}
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ 
                 opacity: [0.6, 1, 0.6],
                 y: [0, -5, 0],
                 scale: [1, 1.05, 1]
               }}
               transition={{ 
                 duration: 3, 
                 repeat: Infinity,
                 ease: "easeInOut"
               }}
               className="mt-4 font-tech text-astra-blue tracking-[0.5em] text-sm font-bold"
             >
               ASTRA INTELLIGENCE SYSTEM
             </motion.div>
          </motion.div>

          <div className="font-mono text-sm md:text-xl text-astra-blue/80 max-w-2xl mb-12 bg-black/50 backdrop-blur-sm p-4 border-l-2 border-astra-blue">
             <Typewriter text=">> INITIALIZING INDIAN CYBER-GUARDIAN... SYSTEM READY. UNAPOLOGETICALLY SAVAGE. [ARCHITECT: AYUSH SINGH]" speed={40} />
          </div>

          {/* REDESIGNED INITIALIZE BUTTON: CYBER-PORTAL STYLE */}
          <div className="flex flex-col md:flex-row gap-8 items-center mt-12">
            <motion.button
              onClick={() => { onStart(); }}
              whileHover="hover"
              whileTap="tap"
              initial="initial"
              className="relative w-80 h-24 flex items-center justify-center group"
            >
              {/* Button Body with Liquid/Portal Effect */}
              <motion.div 
                variants={{
                  initial: { scale: 1 },
                  hover: { scale: 1.05 },
                  tap: { scale: 0.95 }
                }}
                className="relative z-10 w-full h-full bg-black border-2 border-astra-saffron/50 clip-button overflow-hidden group-hover:border-astra-saffron transition-colors"
              >
                {/* Liquid Fill Animation */}
                <motion.div 
                  animate={{ 
                    y: ['100%', '0%', '100%'],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-astra-saffron pointer-events-none"
                />

                {/* Scanning Line inside Button */}
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-astra-saffron/40 to-transparent skew-x-12 pointer-events-none"
                />

                {/* Content */}
                <div className="relative z-20 flex flex-col items-center justify-center h-full">
                  <div className="flex items-center gap-4">
                    <motion.div
                      variants={{
                        hover: { rotate: 180, scale: 1.2 }
                      }}
                    >
                      <Zap className="w-8 h-8 text-astra-saffron drop-shadow-[0_0_10px_#FF9933]" />
                    </motion.div>
                    <span className="font-orbitron font-black text-3xl text-white tracking-[0.2em] group-hover:text-astra-saffron transition-colors">
                      INITIALIZE
                    </span>
                  </div>
                  <motion.div 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-[10px] font-tech text-astra-saffron/80 tracking-[0.4em] mt-2"
                  >
                    SYSTEM_LINK_READY
                  </motion.div>
                </div>
              </motion.div>

              {/* Glitch Overlay on Hover */}
              <motion.div 
                variants={{
                  hover: { opacity: [0, 0.5, 0, 0.8, 0], x: [-2, 2, -1, 1, 0] }
                }}
                transition={{ duration: 0.2, repeat: Infinity }}
                className="absolute inset-0 bg-astra-saffron/10 clip-button pointer-events-none opacity-0"
              />

              {/* Energy Sparks */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hover: { 
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                      x: (i % 2 === 0 ? 40 : -40) + Math.random() * 20,
                      y: (i < 2 ? 40 : -40) + Math.random() * 20
                    }
                  }}
                  className="absolute w-2 h-2 bg-astra-saffron rounded-full blur-sm pointer-events-none opacity-0"
                />
              ))}
            </motion.button>
          </div>

        </main>

        {/* --- FEATURE GRID: HUD MODULES --- */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
          {[
            { icon: Terminal, label: "HACKER_MODE", sub: "TERMINAL_UI" },
            { icon: Volume2, label: "VOICE_SENTINEL", sub: "DEEPFAKE_DETECTOR" },
            { icon: Scan, label: "ASTRA_VISION", sub: "IMAGE_ANALYSIS" },
            { icon: Code2, label: "ASTRA_CODER", sub: "CANVAS_ENGINE" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ 
                y: -10,
                boxShadow: "0 0 20px rgba(0,240,255,0.2)",
                borderColor: "rgba(0,240,255,0.5)"
              }}
              className="clip-hud bg-white/5 border border-white/10 p-6 hover:bg-astra-blue/5 transition-all group cursor-pointer relative overflow-hidden"
            >
               <div className="flex items-center justify-between mb-4 opacity-50 group-hover:opacity-100">
                 <item.icon className="w-8 h-8 text-astra-blue group-hover:text-astra-blue transition-colors" />
                 <span className="font-tech text-xs">MOD_0{i+1}</span>
               </div>
               <h3 className="font-orbitron font-bold text-white text-lg">{item.label}</h3>
               <p className="font-mono text-xs text-gray-500 mt-1">{" >> "} {item.sub}</p>
               
               {/* Animated background element */}
               <motion.div 
                 animate={{ 
                   opacity: [0.1, 0.3, 0.1],
                   scale: [1, 1.2, 1]
                 }}
                 transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                 className="absolute -right-4 -bottom-4 w-16 h-16 bg-astra-blue/10 rounded-full blur-2xl pointer-events-none"
               />
            </motion.div>
          ))}
        </section>

        {/* --- SYSTEM CAPABILITIES: TECHNICAL SPECIFICATIONS --- */}
        <section className="mt-24 relative">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-astra-blue/30"></div>
            <h2 className="font-orbitron text-xl font-bold text-astra-blue tracking-[0.3em] flex items-center gap-3">
              <Activity className="w-5 h-5" />
              CORE_MODULE_SPECS
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-astra-blue/30"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* VOICE SENTINEL TECH */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-black/40 border border-astra-blue/20 p-6 clip-hud relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5 font-tech text-4xl">VOICE</div>
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-astra-blue/10 border border-astra-blue/30 rounded-lg">
                  <Volume2 className="w-8 h-8 text-astra-blue" />
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-xl">VOICE_SENTINEL</h3>
                  <p className="text-astra-blue font-tech text-[10px] tracking-widest">DEEP_AUDIO_AUDIT_V4</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 border-l-2 border-astra-blue">
                  <h4 className="text-white font-orbitron text-xs mb-2 tracking-wider">TECH_STACK: SPECTRAL_ANALYSIS</h4>
                  <ul className="text-[11px] font-mono text-gray-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      Neural Frequency Fingerprinting (NFF)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      Real-time Phonic Anomaly Detection
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      AI-Generated Artifact Identification
                    </li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-1 bg-astra-blue/20 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ['0%', '85%', '85%'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-full bg-astra-blue"
                    />
                  </div>
                  <span className="text-[9px] font-tech text-astra-blue">85%_ACCURACY</span>
                </div>
              </div>
            </motion.div>

            {/* ASTRA VISION TECH */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-black/40 border border-astra-blue/20 p-6 clip-hud relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5 font-tech text-4xl">VISION</div>
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-astra-blue/10 border border-astra-blue/30 rounded-lg">
                  <Scan className="w-8 h-8 text-astra-blue" />
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-xl">ASTRA_VISION</h3>
                  <p className="text-astra-blue font-tech text-[10px] tracking-widest">GAN_DETECTION_ENGINE</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 border-l-2 border-astra-blue">
                  <h4 className="text-white font-orbitron text-xs mb-2 tracking-wider">TECH_STACK: PIXEL_FORENSICS</h4>
                  <ul className="text-[11px] font-mono text-gray-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      GAN Artifact & Noise Pattern Analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      Deepfake Face-Swap Consistency Check
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      Metadata & Compression Forensics
                    </li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-1 bg-astra-blue/20 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ['0%', '92%', '92%'] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="h-full bg-astra-blue"
                    />
                  </div>
                  <span className="text-[9px] font-tech text-astra-blue">92%_ACCURACY</span>
                </div>
              </div>
            </motion.div>

            {/* HACKER MODE TECH */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-black/40 border border-astra-blue/20 p-6 clip-hud relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5 font-tech text-4xl">HACK</div>
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-astra-blue/10 border border-astra-blue/30 rounded-lg">
                  <Terminal className="w-8 h-8 text-astra-blue" />
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-xl">HACKER_MODE</h3>
                  <p className="text-astra-blue font-tech text-[10px] tracking-widest">THREAT_INTEL_CORE</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 border-l-2 border-astra-blue">
                  <h4 className="text-white font-orbitron text-xs mb-2 tracking-wider">TECH_STACK: LLM_EXPLOIT_ANALYSIS</h4>
                  <ul className="text-[11px] font-mono text-gray-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      Real-time Vulnerability Modeling
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      Automated Exploit Payload Synthesis
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      Sandboxed Code Execution Environment
                    </li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-1 bg-astra-blue/20 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ['0%', '98%', '98%'] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      className="h-full bg-astra-blue"
                    />
                  </div>
                  <span className="text-[9px] font-tech text-astra-blue">98%_EFFICIENCY</span>
                </div>
              </div>
            </motion.div>

            {/* ASTRA CODER TECH */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-black/40 border border-astra-blue/20 p-6 clip-hud relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5 font-tech text-4xl">CODE</div>
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-astra-blue/10 border border-astra-blue/30 rounded-lg">
                  <Code2 className="w-8 h-8 text-astra-blue" />
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-xl">ASTRA_CODER</h3>
                  <p className="text-astra-blue font-tech text-[10px] tracking-widest">CANVAS_SYNTH_ENGINE</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 border-l-2 border-astra-blue">
                  <h4 className="text-white font-orbitron text-xs mb-2 tracking-wider">TECH_STACK: AST_LOGIC_MAPPING</h4>
                  <ul className="text-[11px] font-mono text-gray-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      Abstract Syntax Tree (AST) Parsing
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      Real-time Logic-to-Canvas Rendering
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-astra-blue"></div>
                      Multi-User State Synchronization
                    </li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-1 bg-astra-blue/20 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ['0%', '95%', '95%'] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                      className="h-full bg-astra-blue"
                    />
                  </div>
                  <span className="text-[9px] font-tech text-astra-blue">95%_PRECISION</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- CREATOR DOSSIER: CLASSIFIED PROFILE --- */}
        <section className="mt-24 relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-astra-blue/30"></div>
            <h2 className="font-orbitron text-xl font-bold text-astra-blue tracking-[0.3em] flex items-center gap-3">
              <Shield className="w-5 h-5" />
              ARCHITECT_DOSSIER
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-astra-blue/30"></div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-black/40 backdrop-blur-xl border border-white/10 p-8 clip-hud relative overflow-hidden group"
          >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 p-4 opacity-10 font-tech text-[80px] leading-none pointer-events-none">
              AYUSH
            </div>
            
            {/* Profile Image / Avatar Placeholder */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-astra-blue/40 rounded-full"
                />
                <div className="absolute inset-4 bg-astra-blue/10 rounded-full flex items-center justify-center border border-astra-blue/30 overflow-hidden">
                   <Logo className="w-24 h-24 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Scanning line on avatar */}
                <motion.div 
                  animate={{ y: [-20, 180, -20] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-astra-blue/50 shadow-[0_0_10px_#00F0FF] z-20"
                />
              </div>
              <h3 className="mt-6 font-orbitron text-2xl font-black text-white tracking-widest">AYUSH SINGH</h3>
              <p className="font-tech text-astra-blue text-sm tracking-[0.2em] mt-1">LEAD_SYSTEM_ARCHITECT</p>
            </div>

            {/* Stats / Bio */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border-l-2 border-astra-blue pl-4">
                  <div className="text-[10px] text-gray-500 font-tech uppercase">Current_Objective</div>
                  <div className="text-white font-mono text-sm italic">"Building the next generation of unapologetic cyber-intelligence."</div>
                </div>
                <div className="border-l-2 border-astra-blue pl-4">
                  <div className="text-[10px] text-gray-500 font-tech uppercase">Specialization</div>
                  <div className="text-white font-mono text-sm">Neural Networks // Cyber-Security // Savage UI/UX</div>
                </div>
                <div className="border-l-2 border-astra-blue pl-4">
                  <div className="text-[10px] text-gray-500 font-tech uppercase">Location</div>
                  <div className="text-white font-mono text-sm">India // Global_Grid</div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "NEURAL_LINK", val: "99%" },
                  { label: "SYSTEM_AUTHORITY", val: "ROOT" },
                  { label: "THREAT_LEVEL", val: "EXTREME" },
                  { label: "CREATIVITY_INDEX", val: "∞" },
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-white/5 pb-1">
                    <span className="font-tech text-[10px] text-astra-blue">{stat.label}</span>
                    <span className="font-orbitron text-sm text-white font-bold">{stat.val}</span>
                  </div>
                ))}
                
                <div className="mt-4 p-3 bg-astra-blue/5 border border-astra-blue/20 rounded text-[10px] font-mono text-astra-blue leading-relaxed">
                  // LOG_ENTRY: Architect Singh has successfully deployed ASTRA.AI V.2.0.9. 
                  All systems operating at peak efficiency. No mercy for sub-optimal code.
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* --- FOOTER: DATA LOG --- */}
        <footer className="mt-16 border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center font-tech text-xs text-gray-600 gap-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-astra-blue/50 grayscale hover:grayscale-0 transition-all">
                 <Logo className="w-full h-full" />
              </div>
              <div>
                 <div className="text-white">ARCHITECT: AYUSH SINGH</div>
                 <div>RTMS SECURITY LAYER // ENCRYPTED</div>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <span>LAT: 20.5937° N</span>
              <span>LON: 78.9629° E</span>
              <span className="text-astra-blue">MADE_IN_INDIA</span>
           </div>
        </footer>

      </div>
    </div>
  );
};
