
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { createPcmBlob } from "../utils/audioUtils";

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';

// Worklet code as a string to be loaded via Blob
const WORKLET_CODE = `
  class OrbitProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      if (input && input.length > 0) {
        const samples = input[0];
        // We only send the first channel (mono)
        this.port.postMessage(samples);
      }
      return true;
    }
  }
  registerProcessor('orbit-processor', OrbitProcessor);
`;

export interface OrbitAiCallbacks {
  onTranscription: (text: string, isUser: boolean) => void;
  onError: (error: any) => void;
  onStatusChange: (status: 'connected' | 'closed' | 'error' | 'connecting') => void;
  onVolumeChange?: (volume: number) => void;
}

export type AudioSource = 'mic' | 'internal' | 'both';

export class OrbitAiService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private mixedStream: MediaStream | null = null;
  private analyzer: AnalyserNode | null = null;
  private animationFrame: number | null = null;
  private workletNode: AudioWorkletNode | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async start(callbacks: OrbitAiCallbacks, source: AudioSource = 'mic', language: string = 'Auto-detect') {
    try {
      callbacks.onStatusChange('connecting');
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      // Load the background-stable AudioWorklet
      const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);

      const destination = this.audioContext.createMediaStreamDestination();
      
      // 1. Microphone Source
      if (source === 'mic' || source === 'both') {
        const micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          } 
        });
        const micSource = this.audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);
      }

      // 2. Internal Audio Source (Display Media)
      if (source === 'internal' || source === 'both') {
        try {
          const displayStream = await (navigator.mediaDevices as any).getDisplayMedia({ 
            video: true,
            audio: { echoCancellation: false, noiseSuppression: false } 
          });
          const internalAudioTracks = displayStream.getAudioTracks();
          if (internalAudioTracks.length > 0) {
            const internalSource = this.audioContext.createMediaStreamSource(new MediaStream(internalAudioTracks));
            internalSource.connect(destination);
            displayStream.getVideoTracks().forEach(t => t.stop());
          }
        } catch (e) {
          console.warn('System audio capture declined', e);
        }
      }

      this.mixedStream = destination.stream;

      // Setup Analyzer for VAD visualization (even in background)
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 256;
      const analyzerSource = this.audioContext.createMediaStreamSource(this.mixedStream);
      analyzerSource.connect(this.analyzer);

      const monitorVolume = () => {
        if (!this.analyzer) return;
        const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
        this.analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        callbacks.onVolumeChange?.(average / 128); 
        this.animationFrame = requestAnimationFrame(monitorVolume);
      };
      monitorVolume();

      this.sessionPromise = this.ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are Orbit AI. Provide real-time high-fidelity transcription for: ${language}. 
          Maintain professional transcription standards. Filter background noise effectively.`,
        },
        callbacks: {
          onopen: () => {
            callbacks.onStatusChange('connected');
            this.setupWorkletStreaming();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
            }
            if (message.serverContent?.outputTranscription) {
              callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
            }
          },
          onerror: (e) => {
            callbacks.onStatusChange('error');
            callbacks.onError(e);
          },
          onclose: () => {
            callbacks.onStatusChange('closed');
          }
        }
      });

      return true;
    } catch (err) {
      callbacks.onStatusChange('error');
      throw err;
    }
  }

  private setupWorkletStreaming() {
    if (!this.audioContext || !this.mixedStream || !this.sessionPromise) return;

    const source = this.audioContext.createMediaStreamSource(this.mixedStream);
    this.workletNode = new AudioWorkletNode(this.audioContext, 'orbit-processor');

    this.workletNode.port.onmessage = (event) => {
      const samples = event.data;
      const pcmBlob = createPcmBlob(samples);
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(this.workletNode);
    // Worklets need to be connected to destination or they might be suspended
    this.workletNode.connect(this.audioContext.destination);
  }

  async stop() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.mixedStream) {
      this.mixedStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      await this.audioContext.close();
    }
    this.sessionPromise = null;
  }
}
