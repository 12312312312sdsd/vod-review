import React from 'react';
import { X } from 'lucide-react';

interface SettingsDialogProps {
  darkMode: boolean;
  playbackRate: number;
  onClose: () => void;
  onPlaybackRateChange: (rate: number) => void;
}

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function SettingsDialog({
  darkMode,
  playbackRate,
  onClose,
  onPlaybackRateChange,
}: SettingsDialogProps) {
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
      <div className={`w-[500px] rounded-lg shadow-lg p-6 ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Playback Speed</h4>
            <div className="flex gap-2 flex-wrap">
              {PLAYBACK_RATES.map(rate => (
                <button
                  key={rate}
                  onClick={() => onPlaybackRateChange(rate)}
                  className={`px-3 py-1 rounded ${
                    rate === playbackRate
                      ? 'bg-blue-500 text-white'
                      : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}