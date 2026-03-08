import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Skull, Sprout, BrainCircuit, X, Gavel } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { runTribunal } from '../services/geminiService';

interface TribunalViewProps {
  prompt: string;
  onClose: () => void;
}

export const TribunalView: React.FC<TribunalViewProps> = ({ prompt, onClose }) => {
  const [architectText, setArchitectText] = useState('');
  const [hackerText, setHackerText] = useState('');
  const [sageText, setSageText] = useState('');
  const [synthesisText, setSynthesisText] = useState('');
  const [stage, setStage] = useState<'analyzing' | 'synthesizing' | 'complete'>('analyzing');
  
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const startTribunal = async () => {
      await runTribunal(
        prompt,
        (t) => isMounted && setArchitectText(t),
        (t) => isMounted && setHackerText(t),
        (t) => isMounted && setSageText(t),
        (t) => {
             if (isMounted) {
                 setStage('synthesizing');
                 setSynthesisText(t);
             }
        }
      );
      if (isMounted) setStage('complete');
    };

    startTribunal();

    return () => { isMounted = false; };
  }, [prompt]);

  useEffect(() => {
      if (scrollRef.current && !isExpanded) {
          scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [synthesisText, isExpanded]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col overflow-hidden font-mono"
    >
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Gavel className="w-6 h-6 text-purple-500" />
          <span className="text-xl font-bold tracking-wider text-purple-500">THE TRIBUNAL</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 overflow-y-auto p-4 md:p-0">
        
        {/* Architect Column */}
        <div className="bg-black/90 p-6 border-r border-white/5 flex flex-col gap-4 min-h-[50vh]">
          <div className="flex items-center gap-2 text-blue-400 border-b border-blue-500/30 pb-2">
            <Shield className="w-5 h-5" />
            <span className="font-bold tracking-widest">THE ARCHITECT</span>
          </div>
          <div className="text-xs text-blue-300/70 leading-relaxed overflow-y-auto custom-scrollbar">
            <ReactMarkdown>{architectText}</ReactMarkdown>
            {!architectText && <span className="animate-pulse">Initializing structural analysis...</span>}
          </div>
        </div>

        {/* Hacker Column */}
        <div className="bg-black/90 p-6 border-r border-white/5 flex flex-col gap-4 min-h-[50vh]">
          <div className="flex items-center gap-2 text-red-500 border-b border-red-500/30 pb-2">
            <Skull className="w-5 h-5" />
            <span className="font-bold tracking-widest">THE HACKER</span>
          </div>
          <div className="text-xs text-red-300/70 leading-relaxed overflow-y-auto custom-scrollbar">
            <ReactMarkdown>{hackerText}</ReactMarkdown>
            {!hackerText && <span className="animate-pulse">Bypassing security protocols...</span>}
          </div>
        </div>

        {/* Sage Column */}
        <div className="bg-black/90 p-6 flex flex-col gap-4 min-h-[50vh]">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-emerald-500/30 pb-2">
            <Sprout className="w-5 h-5" />
            <span className="font-bold tracking-widest">THE SAGE</span>
          </div>
          <div className="text-xs text-emerald-300/70 leading-relaxed overflow-y-auto custom-scrollbar">
            <ReactMarkdown>{sageText}</ReactMarkdown>
            {!sageText && <span className="animate-pulse">Consulting the archives...</span>}
          </div>
        </div>
      </div>

      {/* Synthesis Section */}
      <AnimatePresence>
        {(stage === 'synthesizing' || stage === 'complete') && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0, height: isExpanded ? '85%' : '35%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 border-t border-purple-500/50 bg-black/95 backdrop-blur-xl shadow-[0_-10px_40px_-10px_rgba(168,85,247,0.3)] flex flex-col z-50"
          >
            {/* Drag Handle */}
            <div 
              className="h-8 w-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="w-16 h-1 bg-purple-500/50 rounded-full" />
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-4 text-purple-400 sticky top-0 bg-black/95 py-2 z-10 border-b border-purple-500/20">
                        <div className="flex items-center gap-3">
                            <BrainCircuit className="w-6 h-6 animate-spin-slow" />
                            <span className="text-lg font-bold tracking-[0.2em]">ASTRA PRIME // SYNTHESIS</span>
                        </div>
                        <button 
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="text-xs uppercase tracking-widest hover:text-purple-300 transition-colors"
                        >
                          {isExpanded ? 'Minimize' : 'Expand Verdict'}
                        </button>
                    </div>
                    
                    <div className="text-sm md:text-base text-purple-100/90 leading-relaxed font-sans pb-10">
                        <ReactMarkdown>{synthesisText}</ReactMarkdown>
                    </div>
                    <div ref={scrollRef} />
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
