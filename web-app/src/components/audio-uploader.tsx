'use client';

import { useState, useRef } from 'react';
import { cn, formatFileSize } from '@/lib/utils';

interface AudioUploaderProps {
  onSuccess: (interviewId: string) => void;
}

export function AudioUploader({ onSuccess }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [speakers, setSpeakers] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/'));
    
    if (audioFile) {
      setSelectedFile(audioFile);
      setError(null);
    } else {
      setError('Please drop an audio file (MP3, WAV, etc.)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('speakers', speakers.toString());

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      onSuccess(result.interview_id);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Upload Interview Audio
        </h2>

        {/* File Drop Zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400",
            selectedFile && "border-green-500 bg-green-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-2">
              <div className="text-4xl">✅</div>
              <p className="text-lg font-medium text-gray-900">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-600">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">🎤</div>
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your audio file here
                </p>
                <p className="text-sm text-gray-600">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports MP3, WAV, M4A and other audio formats
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Speaker Count Selection */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected number of speakers
          </label>
          <div className="flex space-x-4">
            {[2, 3, 4, 5].map((count) => (
              <button
                key={count}
                onClick={() => setSpeakers(count)}
                className={cn(
                  "px-4 py-2 rounded-lg border transition-colors",
                  speakers === count
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                {count} speakers
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className={cn(
            "w-full mt-6 px-6 py-3 rounded-lg font-medium transition-colors",
            selectedFile && !isUploading
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            'Start Analysis'
          )}
        </button>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">What we analyze:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Speaker identification and balance</li>
              <li>• Sentiment analysis throughout the conversation</li>
              <li>• Key phrases and topics discussed</li>
              <li>• Speaking patterns and confidence metrics</li>
              <li>• AI-generated visual summary</li>
            </ul>
        </div>
      </div>
    </div>
  );
} 