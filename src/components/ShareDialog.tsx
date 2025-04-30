import React, { useState } from 'react';
import { X, Link } from 'lucide-react';

interface ShareDialogProps {
  darkMode: boolean;
  authorName: string;
  onAuthorNameChange: (name: string) => void;
  onShare: (pinCode: string) => void;
  onClose: () => void;
}

export function ShareDialog({
  darkMode,
  authorName,
  onAuthorNameChange,
  onShare,
  onClose,
}: ShareDialogProps) {
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!authorName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!/^\d{4}$/.test(pinCode)) {
      setError('PIN code must be exactly 4 digits');
      return;
    }

    onShare(pinCode);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPinCode(value);
    setError('');
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
      <div className={`w-[400px] rounded-lg shadow-lg p-6 ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Share Notes</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => onAuthorNameChange(e.target.value)}
              placeholder="Enter your name"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
              }`}
            />
          </div>
          <div>
            <label htmlFor="pinCode" className="block text-sm font-medium mb-2">
              PIN Code (4 digits)
            </label>
            <input
              type="text"
              id="pinCode"
              value={pinCode}
              onChange={handlePinChange}
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
              }`}
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!authorName.trim() || !/^\d{4}$/.test(pinCode)}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Link size={20} /> Generate Share Link
          </button>
        </div>
      </div>
    </div>
  );
}