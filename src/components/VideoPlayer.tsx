import React from 'react';
import YouTube from 'react-youtube';
import { FastForward, Rewind, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { YouTubePlayerRef } from '../types';

interface VideoPlayerProps {
  videoId: string;
  playerRef: React.MutableRefObject<YouTubePlayerRef | null>;
  playbackRate: number;
  darkMode: boolean;
  onPlaybackRateChange: (rate: number) => void;
  onSeek: (seconds: number) => void;
  selectedNoteIndex: number;
  totalNotes: number;
  onNoteChange: (direction: 'prev' | 'next') => void;
}

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SEEK_SECONDS = 5;

export function VideoPlayer({
  videoId,
  playerRef,
  playbackRate,
  darkMode,
  onPlaybackRateChange,
  onSeek,
  selectedNoteIndex,
  totalNotes,
  onNoteChange,
}: VideoPlayerProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
        <div className="relative w-full max-w-[1920px] mx-auto">
          <div className="aspect-video">
            <YouTube
              videoId={videoId}
              onReady={(event) => {
                playerRef.current = event.target;
              }}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  controls: 1,
                },
              }}
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSeek(-SEEK_SECONDS)}
            className={`p-3 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title={`Rewind ${SEEK_SECONDS}s`}
          >
            <ArrowLeft size={20} className={darkMode ? 'text-white' : 'text-gray-700'} />
          </button>
          <button
            onClick={() => onSeek(SEEK_SECONDS)}
            className={`p-3 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title={`Forward ${SEEK_SECONDS}s`}
          >
            <ArrowRight size={20} className={darkMode ? 'text-white' : 'text-gray-700'} />
          </button>
          <button
            onClick={() => onPlaybackRateChange(Math.max(...PLAYBACK_RATES.filter(r => r < playbackRate)))}
            className={`p-3 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Decrease Speed"
          >
            <Rewind size={20} className={darkMode ? 'text-white' : 'text-gray-700'} />
          </button>
          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
            {playbackRate}x
          </span>
          <button
            onClick={() => onPlaybackRateChange(Math.min(...PLAYBACK_RATES.filter(r => r > playbackRate)))}
            className={`p-3 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Increase Speed"
          >
            <FastForward size={20} className={darkMode ? 'text-white' : 'text-gray-700'} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNoteChange('prev')}
            disabled={selectedNoteIndex <= 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 disabled:opacity-50 text-white' 
                : 'hover:bg-gray-200 disabled:opacity-50 text-gray-700'
            }`}
          >
            <ChevronLeft size={20} />
            <span>Previous Note</span>
          </button>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {totalNotes > 0 ? `${selectedNoteIndex + 1} / ${totalNotes}` : 'No notes'}
          </span>
          <button
            onClick={() => onNoteChange('next')}
            disabled={selectedNoteIndex >= totalNotes - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 disabled:opacity-50 text-white' 
                : 'hover:bg-gray-200 disabled:opacity-50 text-gray-700'
            }`}
          >
            <span>Next Note</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}