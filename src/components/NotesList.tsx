import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import type { Note } from '../types';
import { formatTimestamp } from '../utils';

interface NotesListProps {
  notes: Note[];
  selectedNoteIndex: number;
  darkMode: boolean;
  isSharedView: boolean;
  onNoteSelect: (index: number) => void;
  onNoteDelete: (id: string) => void;
  onNoteChange: (id: string, content: string) => void;
  onTimestampClick: (timestamp: number) => void;
  textareaRefs: React.MutableRefObject<{ [key: string]: HTMLTextAreaElement | null }>;
  activeNoteRef: React.MutableRefObject<HTMLDivElement | null>;
  notesEndRef: React.MutableRefObject<HTMLDivElement | null>;
}

export function NotesList({
  notes,
  selectedNoteIndex,
  darkMode,
  isSharedView,
  onNoteSelect,
  onNoteDelete,
  onNoteChange,
  onTimestampClick,
  textareaRefs,
  activeNoteRef,
  notesEndRef,
}: NotesListProps) {
  return (
    <div className="flex-1 p-6 space-y-4">
      {notes.map((note, index) => (
        <div
          key={note.id}
          ref={index === selectedNoteIndex ? activeNoteRef : null}
          className={`border rounded-lg p-4 transition-colors ${
            darkMode
              ? index === selectedNoteIndex
                ? 'border-blue-500 bg-gray-700'
                : 'border-gray-700 hover:border-gray-600'
              : index === selectedNoteIndex
                ? 'border-blue-500 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => {onNoteSelect(index), onTimestampClick(note.timestamp)}}
        >
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <button
              onClick={() => onTimestampClick(note.timestamp)}
              className="flex items-center gap-2 hover:text-blue-500 transition-colors"
            >
              <Clock size={16} />
              <span className="font-medium">{formatTimestamp(note.timestamp)}</span>
            </button>
            {!isSharedView && (
              <button
                onClick={() => onNoteDelete(note.id)}
                className={`hover:text-red-500 transition-colors p-1 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'
                }`}
                title="Delete note"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <textarea
            ref={el => textareaRefs.current[note.id] = el}
            value={note.content}
            onChange={(e) => onNoteChange(note.id, e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            }`}
            rows={4}
            placeholder="Enter your note..."
            readOnly={isSharedView}
          />
        </div>
      ))}
      <div ref={notesEndRef} />
    </div>
  );
}