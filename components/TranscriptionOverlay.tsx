
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionOverlayProps {
  text: string;
  isVisible: boolean;
}

const TranscriptionOverlay: React.FC<TranscriptionOverlayProps> = ({ text, isVisible }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ 
            y: window.innerHeight - 250, 
            x: window.innerWidth < 640 ? 20 : (window.innerWidth / 2) - 250 
          }}
          className="fixed z-40 w-[calc(100%-40px)] max-w-xl cursor-move pointer-events-auto"
        >
          <div 
            ref={containerRef}
            className="bg-black/85 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 min-h-[140px] max-h-[300px] overflow-y-auto scrollbar-hide"
          >
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-white/80 text-[10px] font-black tracking-widest uppercase">Orbit AI Live</span>
              </div>
              <div className="text-white/40 text-[9px] font-medium px-2 py-0.5 rounded border border-white/10 uppercase tracking-tighter">
                Voice Focus: Active
              </div>
            </div>
            
            <p className="text-white text-lg md:text-xl font-semibold leading-relaxed tracking-tight">
              {text || (
                <span className="text-white/20 italic animate-pulse">
                  Listening through Orbit AI...
                </span>
              )}
            </p>
          </div>
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TranscriptionOverlay;
