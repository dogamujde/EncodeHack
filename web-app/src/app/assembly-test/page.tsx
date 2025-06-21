'use client';

import { useState, useRef, useCallback } from 'react';
import { useAssemblyAITranscriber } from '@/hooks/useAssemblyAITranscriber';
import { Button } from '@/components/ui/button';

export default function AssemblyTestPage() {
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  
  const streamRef = useRef<MediaStream | null>(null);

  const {
    isReady,
    isRecording,
    isConnected,
    setup,
    start,
    stop,
  } = useAssemblyAITranscriber({
    onTranscript: (message) => {
      console.log('[AssemblyAI] Transcript message received:', message);
      if (message.message_type === 'FinalTranscript') {
        setTranscript(prev => `${prev} ${message.text}`);
      } else if (message.message_type === 'PartialTranscript') {
        // You can handle partial transcripts here if needed
      }
    },
    onError: (err) => setError(err.message),
    onClose: (code, reason) => console.log(`Connection closed: ${code} - ${reason}`),
  });


  const startRecording = async () => {
    setError(null);
    if (isRecording) {
      console.log('Recording is already in progress.');
      return;
    }

    try {
      console.log('Requesting media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      console.log('Media stream acquired.');

      console.log('Setting up transcriber...');
      await setup(stream); 

      start(); 

    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(`Failed to start recording: ${err.message}`);
    }
  };

  const stopRecording = useCallback(async () => {
    await stop();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      console.log('MediaStream tracks stopped.');
    }
    
    setTranscript('');
  }, [stop]);

  return (
    <div className="container mx-auto p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">AssemblyAI Real-time Test</h1>
      
      <div className="flex items-center gap-4 mb-6">
        <Button 
          onClick={startRecording} 
          disabled={isRecording}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
        >
          Start Recording
        </Button>
        <Button 
          onClick={stopRecording} 
          disabled={!isRecording}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500"
        >
          Stop Recording
        </Button>
      </div>

      {error && <p className="text-red-500 mb-4">Error: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <div className="space-y-2">
            <p><strong>Transcriber Ready:</strong> <span className={isReady ? 'text-green-400' : 'text-yellow-400'}>{isReady ? 'Yes' : 'No'}</span></p>
            <p><strong>WS Connected:</strong> <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>{isConnected ? 'Yes' : 'No'}</span></p>
            <p><strong>Recording Active:</strong> <span className={isRecording ? 'text-green-400' : 'text-yellow-400'}>{isRecording ? 'Yes' : 'No'}</span></p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Live Transcript</h2>
          <p className="text-gray-300 min-h-[100px]">{transcript || "Waiting for transcription..."}</p>
        </div>
      </div>
    </div>
  );
} 