'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { RealtimeTranscriber, SessionInformation } from 'assemblyai';

const ASSEMBLYAI_API_BASE_URL = "https://api.assemblyai.com/v2";

export interface UseAssemblyAITranscriberOptions {
  onTranscript: (transcript: any) => void;
  onSessionInfo?: (info: SessionInformation) => void;
  onError?: (error: Error) => void;
  onClose?: (code: number, reason: string) => void;
}

export const useAssemblyAITranscriber = ({
  onTranscript,
  onSessionInfo,
  onError,
  onClose,
}: UseAssemblyAITranscriberOptions) => {
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const isConnectedRef = useRef(false);
  
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
          console.log('[AssemblyAI] RAW OPEN INFO:', info); // Log the raw object
          const sessionInfo: SessionInformation = {
            message_type: 'SessionInformation', // This is a guess, but required by the type
            ...info
          };
          console.log('[AssemblyAI] Connection opened:', sessionInfo);
          setIsConnected(true);
          isConnectedRef.current = true;
          onSessionInfo?.(sessionInfo);
          setIsReady(true);
          resolve();
        });

        newTranscriber.on('transcript', onTranscript);

        newTranscriber.on('error', (error) => {
          console.error('AssemblyAI Error:', error);
          onError?.(error);
          stop();
          reject(error);
        });

        newTranscriber.on('close', (code, reason) => {
          console.log('[AssemblyAI] Connection closed:', code, reason);
          setIsConnected(false);
          isConnectedRef.current = false;
          onClose?.(code, reason);
        });

        console.log("[AssemblyAI] Event listeners attached. Connecting to AssemblyAI...");
        await newTranscriber.connect();
        console.log("[AssemblyAI] connect() method called.");

        transcriberRef.current = newTranscriber;

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        
        microphoneStreamRef.current = mediaStream;
        const source = audioContextRef.current.createMediaStreamSource(microphoneStreamRef.current);
        
        await audioContextRef.current.audioWorklet.addModule('/audio-worklets/audio-processor.js');
        console.log("[AssemblyAI] AudioWorklet module added.");
        
        const processorNode = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
        processorNode.port.onmessage = (event) => {
          if (transcriberRef.current && isConnectedRef.current) {
            transcriberRef.current.sendAudio(event.data);
          }
        };
        
        source.connect(processorNode);
        processorNode.connect(audioContextRef.current.destination);
        processorNodeRef.current = processorNode;

      } catch (err) {
        console.error("Error during AssemblyAI setup:", err);
        if (onError) onError(err as Error);
        reject(err);
      } finally {
        isSettingUp.current = false;
      }
    });
  }, [onTranscript, onSessionInfo, onError, onClose]);

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
    isConnectedRef.current = false;
  }, []);

  return { isReady, isRecording, isConnected, setup, start, stop };
}; 