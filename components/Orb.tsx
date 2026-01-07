
import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, X, Loader2 } from 'lucide-react';
import { AppStatus } from '../types';

interface OrbProps {
  status: AppStatus;
  volume: number;
  onClick: () => void;
  onClose: () => void;
}

const Orb: React.FC<OrbProps> = ({ status, volume, onClick, onClose }) => {
  const isActive = status === AppStatus.ACTIVE;
  const isConnecting = status === AppStatus.CONNECTING;

  // Calculate dynamic glow based on volume for VAD visualization
  const dynamicGlow = isActive ? `0 0 ${20 + volume * 50}px rgba(59, 130, 246, ${0.4 + volume * 0.6})` : 'none';

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ 
        x: window.innerWidth < 768 ? (window.innerWidth / 2) - 40 : window.innerWidth - 120, 
        y: window.innerHeight - 150 
      }}
      className="fixed z-50 cursor-grab active:cursor-grabbing select-none"
      style={{ width: 80, height: 80 }}
    >
      {/* VAD Visualizer Ring */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1 + volume * 0.5, opacity: 0.3 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 rounded-full bg-blue-400"
          />
        )}
      </AnimatePresence>

      {/* Orb Body */}
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ boxShadow: dynamicGlow }}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-500
          ${isActive ? 'bg-blue-600' : 'bg-slate-800'}
          text-white shadow-2xl relative overflow-hidden
        `}
      >
        {isConnecting ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : isActive ? (
          <div className="flex flex-col items-center">
            <Mic className="w-8 h-8" />
            <motion.div 
              animate={{ height: volume * 10 }}
              className="w-1 bg-white rounded-full mt-1" 
            />
          </div>
        ) : (
          <MicOff className="w-8 h-8 opacity-60" />
        )}

        {/* Gloss Effect */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </motion.div>

      {/* Close Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute -top-1 -right-1 bg-slate-900 border border-slate-700 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
};

import { AnimatePresence } from 'framer-motion';
export default Orb;
