export interface Note {
  id: string;
  content: string;
  timestamp: number;
  createdAt: Date;
  tags?: string[];
}

export interface YouTubePlayerRef {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
}

export interface ExportFormat {
  id: string;
  name: string;
  format: (notes: Note[], videoId: string) => string;
}

export interface SharedNotes {
  id: string;
  video_id: string;
  author_name: string;
  notes: Note[];
  created_at: string;
  share_id: string;
  pin_code?: string;
}

export interface VideoNotes {
  author_name: string;
  created_at: string;
  share_id: string;
}