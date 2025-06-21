import { useState, useEffect, useRef, useCallback } from 'react';

interface Transcript {
  text: string;
  speaker?: string;
}

interface UseSendMicToAssemblyProps {
  stream: MediaStream | null;
  isRecording: boolean;
  onTranscript: (transcript: Transcript) => void;
  onSuggestion?: (text: string) => void;
}

export const useSendMicToAssembly = ({
  stream,
  isRecording,
  onTranscript,
}: UseSendMicToAssemblyProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isInitializedRef = useRef(false);

  const connect = useCallback(async () => {
    if (!stream || !isRecording) {
      return;
    }
    
    console.log('🎤 useSendMicToAssembly: Connecting...');
    isInitializedRef.current = true;
    setError(null);

    try {
      const response = await fetch('/api/assemblyai-token');
      if (!response.ok) {
        throw new Error('Failed to fetch AssemblyAI token');
      }
      const { token } = await response.json();

      if (!token) {
        throw new Error('AssemblyAI token not available');
      }

      let sampleRate = 16000;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && audioTrack.getSettings) {
        const settings = audioTrack.getSettings();
        sampleRate = settings.sampleRate || 16000;
        console.log('🔊 Using sample rate:', sampleRate, 'Hz');
      }

      const socket = new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}&token=${token}&speaker_labels=true`);
      socketRef.current = socket;

      socket.onopen = async () => {
        console.log('✅ AssemblyAI WebSocket connected');
        setIsConnected(true);

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(1024, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (event) => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            const inputData = event.inputBuffer.getChannelData(0);
            const data = Int16Array.from(inputData.map((n) => n * 32767));
            socketRef.current.send(JSON.stringify({ audio_data: Buffer.from(data.buffer).toString('base64') }));
          }
        };
      };

      socket.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data);
          
          if (data.message_type === 'FinalTranscript' && data.text) {
            const speaker = data.words && data.words.length > 0 ? data.words[0].speaker : undefined;
            onTranscript({ text: data.text, speaker });
          } else if (data.message_type === 'SessionBegins') {
            console.log('🎉 AssemblyAI session started');
          } else if (data.message_type === 'SessionTerminated') {
            console.log('🛑 AssemblyAI session terminated');
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket Error:', event);
        setError('An error occurred with the connection.');
        setIsConnected(false);
      };

      socket.onclose = (event) => {
        console.log('WebSocket Closed:', event.code, event.reason);
        setIsConnected(false);
        socketRef.current = null;
      };

    } catch (err: any) {
      console.error('Error connecting to AssemblyAI:', err);
      setError(err.message || 'Failed to connect');
      isInitializedRef.current = false;
    }
  }, [stream, isRecording, onTranscript]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnected');
      socketRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    isInitializedRef.current = false;
    setIsConnected(false);
    console.log('🎤 useSendMicToAssembly: Disconnected.');
  }, []);

  useEffect(() => {
    if (isRecording && !isInitializedRef.current) {
      connect();
    } else if (!isRecording && isInitializedRef.current) {
      disconnect();
    }
  }, [isRecording, connect, disconnect]);

  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  return { isConnected, error };
}; 