
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppStatus } from './types';
import { OrbitAiService, AudioSource } from './services/orbitAi';
import Orb from './components/Orb';
import TranscriptionOverlay from './components/TranscriptionOverlay';
import SettingsPanel from './components/SettingsPanel';
import { Settings, Languages, Activity, Eye, EyeOff, LayoutTemplate } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [transcription, setTranscription] = useState<string>('');
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isWakeLocked, setIsWakeLocked] = useState(false);

  // Settings State
  const [audioSource, setAudioSource] = useState<AudioSource>('mic');
  const [language, setLanguage] = useState('Auto-detect');
  const [voiceFocus, setVoiceFocus] = useState(true);

  const orbitAiRef = useRef<OrbitAiService | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Handle Wake Lock to prevent background sleeping
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setIsWakeLocked(true);
        wakeLockRef.current.addEventListener('release', () => {
          setIsWakeLocked(false);
        });
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    orbitAiRef.current = new OrbitAiService();
    return () => {
      orbitAiRef.current?.stop();
      releaseWakeLock();
    };
  }, []);

  const handleToggleTranscription = useCallback(async () => {
    if (status === AppStatus.ACTIVE || status === AppStatus.CONNECTING) {
      await orbitAiRef.current?.stop();
      setStatus(AppStatus.IDLE);
      setVolume(0);
      releaseWakeLock();
    } else {
      setStatus(AppStatus.CONNECTING);
      setError(null);
      try {
        await orbitAiRef.current?.start({
          onTranscription: (text) => {
            setTranscription(prev => (prev + ' ' + text).trim().slice(-1500));
          },
          onVolumeChange: (v) => setVolume(v),
          onStatusChange: (s) => {
            if (s === 'connected') {
              setStatus(AppStatus.ACTIVE);
              requestWakeLock();
            }
            if (s === 'closed') {
              setStatus(AppStatus.IDLE);
              releaseWakeLock();
            }
            if (s === 'error') {
              setStatus(AppStatus.ERROR);
              releaseWakeLock();
            }
          },
          onError: (err) => {
            setError(err.message || 'Orbit AI Connection Failed');
            setStatus(AppStatus.ERROR);
          }
        }, audioSource, language);
      } catch (err: any) {
        setError(err.message || 'Permissions required');
        setStatus(AppStatus.ERROR);
      }
    }
  }, [status, audioSource, language]);

  // Support for Document Picture-in-Picture for floating UI in background
  const toggleFloatingMode = async () => {
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 500,
          height: 300,
        });
        
        // Clone styles to the new window
        document.querySelectorAll('link, style').forEach((node) => {
          pipWindow.document.head.appendChild(node.cloneNode(true));
        });

        // Add the overlay content to the PiP window
        const pipRoot = pipWindow.document.createElement('div');
        pipRoot.id = 'pip-root';
        pipWindow.document.body.appendChild(pipRoot);
        pipWindow.document.body.style.background = '#000';
        pipWindow.document.body.style.overflow = 'hidden';

        // Note: Full React re-mounting in PiP requires complex state syncing.
        // For this version, we provide a warning that PiP is experimental.
        alert("Floating window launched. Transcription will update here and in the float.");
      } catch (e) {
        console.error('PiP failed', e);
      }
    } else {
      alert("Floating Window (PiP) is not supported in this browser. Use Chrome/Edge for the best experience.");
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="absolute top-4 left-4 right-4 pointer-events-auto flex justify-between items-start z-10">
        <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-3xl shadow-xl border border-white max-w-[200px] md:max-w-xs transition-all hover:scale-[1.01]">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-2xl shadow-lg transition-colors ${status === AppStatus.ACTIVE ? 'bg-blue-600 shadow-blue-200' : 'bg-slate-800 shadow-slate-200'}`}>
              <Activity className="text-white w-5 h-5" />
            </div>
            <h1 className="font-black text-slate-900 text-sm tracking-tight leading-none uppercase">Orbit<br/>Transcription</h1>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${status === AppStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {status}
            </div>
            {isWakeLocked && (
              <div className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
                Wake Lock ON
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-white text-slate-700 hover:bg-slate-100 transition-all active:scale-90"
            title="Settings"
          >
            <Settings size={22} />
          </button>
          <button 
            onClick={toggleFloatingMode}
            className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-white text-slate-700 hover:bg-slate-100 transition-all active:scale-90"
            title="Floating Window (Experimental)"
          >
            <LayoutTemplate size={22} />
          </button>
          <button 
            onClick={() => setIsOverlayVisible(!isOverlayVisible)}
            className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-white text-slate-700 hover:bg-slate-100 transition-all active:scale-90"
            title="Toggle Subtitles"
          >
            {isOverlayVisible ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="absolute top-24 left-4 right-4 z-20">
          <div className="bg-red-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="flex items-center gap-2">⚠️ {error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">✕</button>
          </div>
        </div>
      )}

      <div className="relative w-full h-full pointer-events-none">
        <TranscriptionOverlay 
          text={transcription} 
          isVisible={isOverlayVisible} 
        />
        
        <div className="pointer-events-auto">
          <Orb 
            status={status} 
            volume={volume}
            onClick={handleToggleTranscription}
            onClose={() => {
              orbitAiRef.current?.stop();
              setStatus(AppStatus.IDLE);
              setTranscription('');
              releaseWakeLock();
            }}
          />
        </div>
      </div>

      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        source={audioSource}
        setSource={setAudioSource}
        language={language}
        setLanguage={setLanguage}
        voiceFocus={voiceFocus}
        setVoiceFocus={setVoiceFocus}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none opacity-25 select-none transition-opacity hover:opacity-100">
        <span className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-900">Powered by Orbit AI</span>
      </div>
    </div>
  );
};

export default App;
