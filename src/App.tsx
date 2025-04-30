import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Copy, Moon, Sun, Share2, Settings, Clock, ChevronDown, Edit } from 'lucide-react';
import type { Note, YouTubePlayerRef, ExportFormat, VideoNotes } from './types';
import { supabase } from './supabase';
import { VideoPlayer } from './components/VideoPlayer';
import { NotesList } from './components/NotesList';
import { SettingsDialog } from './components/SettingsDialog';
import { ShareDialog } from './components/ShareDialog';
import { PinDialog } from './components/PinDialog';
import { Toast } from './components/Toast';
import { extractVideoId, formatTimestamp } from './utils';

const SEEK_SECONDS = 5;

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'markdown',
    name: 'Markdown',
    format: (notes, videoId) => notes
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(note => {
        const timeString = formatTimestamp(note.timestamp);
        const videoUrl = `https://youtube.com/watch?v=${videoId}&t=${note.timestamp}`;
        const tags = note.tags?.length ? `\nTags: ${note.tags.join(', ')}` : '';
        return `### [${timeString}](${videoUrl})\n\n${note.content}${tags}\n\n`;
      })
      .join('\n\n')
  },
  {
    id: 'json',
    name: 'JSON',
    format: (notes, videoId) => JSON.stringify({ videoId, notes }, null, 2)
  }
];

function App() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [videoId, setVideoId] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [darkMode, setDarkMode] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [isSharedView, setIsSharedView] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number>(-1);
  const [availableNotes, setAvailableNotes] = useState<VideoNotes[]>([]);
  const [showAvailableNotes, setShowAvailableNotes] = useState(false);
  const playerRef = useRef<YouTubePlayerRef | null>(null);
  const toastTimeoutRef = useRef<number>();
  const notesEndRef = useRef<HTMLDivElement>(null);
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const activeNoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shareId) {
      loadSharedNotes(shareId);
    }
  }, [shareId]);

  useEffect(() => {
    if (videoId) {
      loadAvailableNotes();
    }
  }, [videoId]);

  useEffect(() => {
    if (selectedNoteIndex >= 0 && activeNoteRef.current) {
      activeNoteRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedNoteIndex]);

  useEffect(() => {
    const darkModeClass = 'dark';
    if (darkMode) {
      document.documentElement.classList.add(darkModeClass);
    } else {
      document.documentElement.classList.remove(darkModeClass);
    }
  }, [darkMode]);

  const loadAvailableNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_notes')
        .select('author_name, created_at, share_id')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAvailableNotes(data || []);
    } catch (error) {
      showToastMessage('Failed to load available notes', 'error');
    }
  };

  const loadSharedNotes = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('shared_notes')
        .select('*')
        .eq('share_id', id)
        .single();

      if (error) throw error;

      if (data) {
        setVideoId(data.video_id);
        setNotes(data.notes);
        setIsSharedView(true);
        setAuthorName(data.author_name);
        showToastMessage(`Viewing notes shared by ${data.author_name}`);
      }
    } catch (error) {
      showToastMessage('Failed to load shared notes', 'error');
    }
  };

  const verifyPin = async (pinCode: string) => {
    try {
      const { data, error } = await supabase
        .from('shared_notes')
        .select('pin_code')
        .eq('share_id', shareId)
        .single();

      if (error) throw error;

      if (data.pin_code === pinCode) {
        setIsEditMode(true);
        setIsSharedView(false);
        setShowPinDialog(false);
        showToastMessage('Edit mode enabled');
      } else {
        showToastMessage('Incorrect PIN code', 'error');
      }
    } catch (err) {
      showToastMessage('Failed to verify PIN code', 'error');
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(videoUrl);
    if (id) {
      setVideoId(id);
      navigate('/');
    } else {
      showToastMessage('Please enter a valid YouTube URL', 'error');
    }
  };

  const addNote = async () => {
    if (!playerRef.current || isSharedView) return;
    
    const timestamp = Math.max(0, Math.floor(playerRef.current.getCurrentTime()) - 10);
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      timestamp,
      createdAt: new Date(),
      tags: []
    };
    setNotes(prev => [...prev, newNote]);
    
    setTimeout(() => {
      notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRefs.current[newNote.id]?.focus();
    }, 100);
  };

  const saveNote = (id: string, content: string) => {
    if (isSharedView) return;
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ));
  };

  const deleteNote = (id: string) => {
    if (isSharedView) return;
    setNotes(notes.filter(note => note.id !== id));
    showToastMessage('Note deleted');
  };

  const jumpToTimestamp = (timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp);
    }
  };

  const seekVideo = (seconds: number) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime + seconds);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(rate);
      setPlaybackRate(rate);
    }
  };

  const exportNotes = async (format: ExportFormat) => {
    if (!videoId || notes.length === 0) {
      showToastMessage('No notes to export', 'error');
      return;
    }

    try {
      const content = format.format(notes, videoId);
      await navigator.clipboard.writeText(content);
      showToastMessage(`Notes copied to clipboard as ${format.name}!`);
    } catch (err) {
      showToastMessage('Failed to copy to clipboard', 'error');
    }
  };

  const shareNotes = async (pinCode: string) => {
    if (!videoId || notes.length === 0) {
      showToastMessage('No notes to share', 'error');
      return;
    }

    if (!authorName.trim()) {
      setShowShareDialog(true);
      return;
    }

    try {
      let shareUrl;
      
      if (shareId) {
        // Update existing shared notes
        const { data: existingNote, error: fetchError } = await supabase
          .from('shared_notes')
          .select('pin_code')
          .eq('share_id', shareId)
          .single();

        if (fetchError) throw fetchError;

        if (existingNote.pin_code !== pinCode) {
          showToastMessage('Incorrect PIN code', 'error');
          return;
        }

        const { error: updateError } = await supabase
          .from('shared_notes')
          .update({
            notes: notes,
            author_name: authorName.trim()
          })
          .eq('share_id', shareId);

        if (updateError) throw updateError;
        
        shareUrl = `${window.location.origin}/shared/${shareId}`;
        showToastMessage('Notes updated successfully! Share URL copied to clipboard.');
      } else {
        // Create new shared notes
        const { data, error } = await supabase
          .from('shared_notes')
          .insert({
            video_id: videoId,
            author_name: authorName.trim(),
            notes: notes,
            pin_code: pinCode
          })
          .select()
          .single();

        if (error) throw error;

        shareUrl = `${window.location.origin}/shared/${data.share_id}`;
        showToastMessage('Share URL copied to clipboard! Your PIN code is: ' + pinCode);
      }

      await navigator.clipboard.writeText(shareUrl);
      setShowShareDialog(false);
    } catch (err) {
      showToastMessage('Failed to share notes', 'error');
    }
  };

  const navigateNotes = (direction: 'prev' | 'next') => {
    if (filteredNotes.length === 0) return;

    let newIndex = selectedNoteIndex;
    if (direction === 'prev') {
      newIndex = selectedNoteIndex <= 0 ? filteredNotes.length - 1 : selectedNoteIndex - 1;
    } else {
      newIndex = selectedNoteIndex >= filteredNotes.length - 1 ? 0 : selectedNoteIndex + 1;
    }

    setSelectedNoteIndex(newIndex);
    jumpToTimestamp(filteredNotes[newIndex].timestamp);
  };

  const filteredNotes = notes.sort((a, b) => a.timestamp - b.timestamp);
  const activeNote = selectedNoteIndex >= 0 ? filteredNotes[selectedNoteIndex] : null;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      {showToast && <Toast message={toastMessage} type={toastType} />}
      {showPinDialog && (
        <PinDialog
          darkMode={darkMode}
          onSubmit={verifyPin}
          onClose={() => setShowPinDialog(false)}
        />
      )}

      {!videoId ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <form onSubmit={handleUrlSubmit} className="w-full max-w-2xl">
            <div className={`p-8 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
              <h1 className="text-3xl font-bold mb-6">Bored Apes VOD Reviewer</h1>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Enter YouTube URL"
                  className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  }`}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Load Video
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
            <VideoPlayer
              videoId={videoId}
              playerRef={playerRef}
              playbackRate={playbackRate}
              darkMode={darkMode}
              onPlaybackRateChange={handlePlaybackRateChange}
              onSeek={seekVideo}
              selectedNoteIndex={selectedNoteIndex}
              totalNotes={filteredNotes.length}
              onNoteChange={navigateNotes}
            />

            {activeNote && (
              <div className={`p-6 rounded-lg shadow-lg relative z-10 ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
              }`}>
                <div className="flex items-center justify-between text-gray-500 mb-3">
                  <button
                    onClick={() => jumpToTimestamp(activeNote.timestamp)}
                    className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                  >
                    <Clock size={16} />
                    <span className="font-medium">{formatTimestamp(activeNote.timestamp)}</span>
                  </button>
                </div>
                <div className="prose prose-lg max-w-none">
                  {activeNote.content}
                </div>
              </div>
            )}
          </div>

          <div className={`w-[400px] shadow-lg overflow-y-auto flex flex-col ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          }`}>
            <div className={`sticky top-0 z-10 p-6 ${
              darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold">Notes</h2>
                  {availableNotes.length > 0 && (
                    <div className="relative mt-2">
                      <button
                        onClick={() => setShowAvailableNotes(!showAvailableNotes)}
                        className={`flex items-center gap-2 text-sm ${
                          darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <span>{availableNotes.length} shared notes available</span>
                        <ChevronDown
                          size={16}
                          className={`transform transition-transform ${showAvailableNotes ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {showAvailableNotes && (
                        <div className={`absolute left-0 right-0 mt-2 p-2 rounded-lg shadow-lg ${
                          darkMode ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {availableNotes.map((note) => (
                              <div
                                key={note.share_id}
                                className={`p-3 rounded-lg ${
                                  darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                                } cursor-pointer transition-colors`}
                                onClick={() => {
                                  navigate(`/shared/${note.share_id}`);
                                  setShowAvailableNotes(false);
                                }}
                              >
                                <div className="font-medium">{note.author_name}</div>
                                <div className="text-sm text-gray-500">
                                  {new Date(note.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isSharedView ? (
                    <button
                      onClick={() => setShowPinDialog(true)}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      <Edit size={18} /> Edit Notes
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={addNote}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        <Plus size={18} /> New Note
                      </button>
                      <button
                        onClick={() => setShowShareDialog(true)}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        <Share2 size={18} /> Share
                      </button>
                    </>
                  )}
                </div>
              </div>
              {!isSharedView && (
                <div className="flex gap-2">
                  {EXPORT_FORMATS.map(format => (
                    <button
                      key={format.id}
                      onClick={() => exportNotes(format)}
                      className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                    >
                      <Copy size={16} /> {format.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <NotesList
              notes={filteredNotes}
              selectedNoteIndex={selectedNoteIndex}
              darkMode={darkMode}
              isSharedView={isSharedView}
              onNoteSelect={setSelectedNoteIndex}
              onNoteDelete={deleteNote}
              onNoteChange={saveNote}
              onTimestampClick={jumpToTimestamp}
              textareaRefs={textareaRefs}
              activeNoteRef={activeNoteRef}
              notesEndRef={notesEndRef}
            />
          </div>

          {showSettings && (
            <SettingsDialog
              darkMode={darkMode}
              playbackRate={playbackRate}
              onClose={() => setShowSettings(false)}
              onPlaybackRateChange={handlePlaybackRateChange}
            />
          )}

          {showShareDialog && (
            <ShareDialog
              darkMode={darkMode}
              authorName={authorName}
              onAuthorNameChange={setAuthorName}
              onShare={shareNotes}
              onClose={() => setShowShareDialog(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;