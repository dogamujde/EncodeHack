'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { RealtimeTranscriber, SessionInformation } from 'assemblyai';

const ASSEMBLYAI_API_BASE_URL = "https://api.assemblyai.com/v2";

// Helper function to convert float32 to base64-encoded PCM16
const bufferToBase64 = (buffer: Float32Array) => {
  const pcm16 = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    // Clamp the sample to the [-1, 1] range
    let s = Math.max(-1, Math.min(1, buffer[i]));
    // Convert to 16-bit integer
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    pcm16[i] = s;
  }
  // Convert to base64
  return btoa(String.fromCharCode.apply(null, new Uint8Array(pcm16.buffer) as any));
};

export interface UseAssemblyAITranscriberOptions {
  onTranscript: (transcript: any) => void;
  onError?: (error: Error) => void;
  onClose?: (code: number, reason: string) => void;
}

export const useAssemblyAITranscriber = ({
  onTranscript,
  onError,
  onClose,
}: UseAssemblyAITranscriberOptions) => {
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false); // Ref to track ready state for callbacks

  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // States for real-time metrics
  const [confidence, setConfidence] = useState(0);
  const [talkingSpeed, setTalkingSpeed] = useState(0);
  const [clarity, setClarity] = useState(0);

  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Update ref whenever state changes
  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  const transcriberRef = useRef<RealtimeTranscriber | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<AudioWorkletNode | null>(null);
  const isSettingUp = useRef(false);

  const setup = useCallback(async (mediaStream: MediaStream) => {
    return new Promise<void>(async (resolve, reject) => {
      if (transcriberRef.current || isSettingUp.current) {
          console.log("[AssemblyAI] Setup already in progress or completed.");
          return resolve();
      }
      console.log("[AssemblyAI] Setup function called.");
      isSettingUp.current = true;
      
      try {
        console.log("[AssemblyAI] Setting up transcriber...");
        console.log("[AssemblyAI] Fetching token from /api/assemblyai-token...");
        const response = await fetch("/api/assemblyai-token");
        console.log(`[AssemblyAI] Token response received. Status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch AssemblyAI token. Status: ${response.status}`);
        }
        const data = await response.json();

        if (!data.token) {
          throw new Error("No token received from server");
        }
        
        const newTranscriber = new RealtimeTranscriber({ token: data.token });
        console.log("[AssemblyAI] Transcriber object created successfully. Attaching event listeners.");

        newTranscriber.on('open', (info) => {
          console.log('[AssemblyAI] Connection opened:', info);
          setIsConnected(true);
          setIsReady(true);
          resolve(); 
        });

        newTranscriber.on('transcript', (transcript) => {
          onTranscriptRef.current(transcript);

          // Update metrics based on transcript data
          if (transcript.message_type === 'PartialTranscript' || transcript.message_type === 'FinalTranscript') {
            setConfidence(transcript.confidence ?? 0);
            setClarity(transcript.confidence ?? 0); // Use confidence as a proxy for clarity

            if (transcript.words && transcript.words.length > 0) {
              const words = transcript.words;
              const firstWord = words[0];
              const lastWord = words[words.length - 1];
              const duration = (lastWord.end - firstWord.start) / 1000; // in seconds
              if (duration > 0) {
                const wpm = (words.length / duration) * 60;
                setTalkingSpeed(wpm);
              }
            }
          }
        });

        newTranscriber.on('error', (error) => {
          console.error('AssemblyAI Error:', error);
          onErrorRef.current?.(error);
          stop(); 
          reject(error); 
        });

        newTranscriber.on('close', (code, reason) => {
          console.log('[AssemblyAI] Connection closed:', code, reason);
          setIsConnected(false);
          onCloseRef.current?.(code, reason);
        });

        console.log("[AssemblyAI] Event listeners attached. Connecting to AssemblyAI...");
        await newTranscriber.connect();
        console.log("[AssemblyAI] connect() method called.");

        transcriberRef.current = newTranscriber;

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        }
        
        microphoneStreamRef.current = mediaStream;
        const source = audioContextRef.current.createMediaStreamSource(microphoneStreamRef.current);
        
        await audioContextRef.current.audioWorklet.addModule('/audio-worklets/audio-processor.js');
        console.log("[AssemblyAI] AudioWorklet module added.");
        
        const processorNode = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
        processorNodeRef.current = processorNode;
        
        processorNode.port.onmessage = (event) => {
          if (transcriberRef.current && isReadyRef.current) {
            const float32Data = new Float32Array(event.data);
            
            // Convert Float32Array to Int16Array
            const pcm16Data = new Int16Array(float32Data.length);
            for (let i = 0; i < float32Data.length; i++) {
              let s = Math.max(-1, Math.min(1, float32Data[i]));
              s = s < 0 ? s * 0x8000 : s * 0x7FFF;
              pcm16Data[i] = s;
            }
            
            // Send the Int16Array's buffer
            transcriberRef.current.sendAudio(pcm16Data.buffer);
          }
        };
        
        source.connect(processorNode);
        processorNode.connect(audioContextRef.current.destination);
      } catch (err) {
        console.error("Error during AssemblyAI setup:", err);
        if (onErrorRef.current) onErrorRef.current(err as Error);
        reject(err);
      } finally {
        isSettingUp.current = false;
      }
    });
  }, []); // REMOVED isReady from dependency array

  const start = useCallback(() => {
    if (transcriberRef.current) {
      console.log("[AssemblyAI] Starting transcription (AudioWorklet is already running).");
      setIsRecording(true);
    } else {
      console.warn("[AssemblyAI] Cannot start. Transcriber not set up.");
    }
  }, []);

  const stop = useCallback(async () => {
    console.log("[AssemblyAI] Stop function called.");
    setIsRecording(false);
    
    if (transcriberRef.current) {
        console.log("[AssemblyAI] Closing and nullifying transcriber.");
        await transcriberRef.current.close();
        transcriberRef.current = null;
    }

    if (processorNodeRef.current) {
        processorNodeRef.current.disconnect();
        processorNodeRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
        audioContextRef.current = null;
    }
    
    microphoneStreamRef.current = null;
    isSettingUp.current = false;
    setIsReady(false);
    setIsConnected(false);
  }, []);

  return { isReady, isRecording, isConnected, confidence, talkingSpeed, clarity, setup, start, stop };
}; 