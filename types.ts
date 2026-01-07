
export interface TranscriptionPart {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}

export interface Position {
  x: number;
  y: number;
}
