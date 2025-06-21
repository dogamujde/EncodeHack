'use client';

import { useState, useRef, useCallback } from 'react';
import { AssemblyAI } from 'assemblyai';

export function useAssemblyAITranscriber() {
  const [transcript, setTranscript] = useState('');
  const [isReady, setIsReady] = useState(false);
  const transcriberRef = useRef<any>(null);

  const setup = useCallback(async () => {
    if (transcriberRef.current) {
      console.log("Transcription service already set up.");
      return;
    }
    try {
      const response = await fetch('/api/assemblyai-token');
      const data = await response.json();

      if (response.status !== 200) {
        throw new Error(data.error || 'Failed to fetch AssemblyAI token');
      }

      const newTranscriber = new AssemblyAI({
        apiKey: data.token,
      }).realtime.transcriber({
        sampleRate: 16000,
      });

      newTranscriber.on('open', () => setIsReady(true));
      newTranscriber.on('transcript', (message) => {
        if (message.text) {
          setTranscript((prev) => `${prev} ${message.text}`);
        }
      });
      newTranscriber.on('error', (error) => console.error('AssemblyAI Error:', error));
      
      transcriberRef.current = newTranscriber;
    } catch (error) {
      console.error('Error setting up transcriber:', error);
    }
  }, []);

  const stop = useCallback(() => {
    if (transcriberRef.current) {
      transcriberRef.current.close();
      transcriberRef.current = null;
      setIsReady(false);
    }
  }, []);

  const start = useCallback((audioData: string) => {
    if (transcriberRef.current && isReady) {
      transcriberRef.current.send(audioData);
    }
  }, [isReady]);

  return { transcript, isReady, setup, start, stop };
} 