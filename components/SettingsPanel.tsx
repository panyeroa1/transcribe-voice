
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Monitor, Layers, Volume2, ShieldCheck, Languages } from 'lucide-react';
import { AudioSource } from '../services/orbitAi';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  source: AudioSource;
  setSource: (s: AudioSource) => void;
  language: string;
  setLanguage: (l: string) => void;
  voiceFocus: boolean;
  setVoiceFocus: (v: boolean) => void;
}

const LANGUAGES = ['Auto-detect', 'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese'];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen, onClose, source, setSource, language, setLanguage, voiceFocus, setVoiceFocus 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
        >
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-md h-auto max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 pointer-events-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Layers size={18} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Orbit AI Config</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Audio Source */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Audio Source</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'mic', icon: Mic, label: 'Mic' },
                    { id: 'internal', icon: Monitor, label: 'System' },
                    { id: 'both', icon: Volume2, label: 'Mixed' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSource(item.id as AudioSource)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        source === item.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selector */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                  <Languages size={14} /> Transcription Language
                </label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
              </div>

              {/* Advanced Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex gap-3">
                    <div className="text-blue-600"><ShieldCheck size={20} /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Voice Focus (VAD)</p>
                      <p className="text-[10px] text-slate-500">Isolates primary voice automatically</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setVoiceFocus(!voiceFocus)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${voiceFocus ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      animate={{ x: voiceFocus ? 24 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-colors"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
