import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSendMicToAssemblyProps {
  isRecording: boolean;
  onTranscript: (text: string) => void;
  onSuggestion: (text: string) => void;
}

export const useSendMicToAssembly = ({ isRecording, onTranscript, onSuggestion }: UseSendMicToAssemblyProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullTranscriptRef = useRef('');
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tokenRetryCountRef = useRef(0);
  const isConnectingRef = useRef(false);
  const maxRetries = 3;

  const stopMediaAndSocket = useCallback(() => {
    console.log('🛑 Stopping media and socket...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (socketRef.current) {
      socketRef.current.close();
    }

    mediaRecorderRef.current = null;
    streamRef.current = null;
    socketRef.current = null;
    isConnectingRef.current = false;
    tokenRetryCountRef.current = 0;
    setIsConnected(false);
  }, []);

  const startTranscription = useCallback(async () => {
    if (!isRecording || isConnectingRef.current || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) {
      console.log('🚫 Transcription start condition not met.', { isRecording, isConnecting: isConnectingRef.current, socketState: socketRef.current?.readyState });
      return;
    }

    if (tokenRetryCountRef.current >= maxRetries) {
      console.log('🚫 Max retries reached.');
      setError('Failed to connect after multiple attempts');
      return;
    }

    isConnectingRef.current = true;
    tokenRetryCountRef.current++;
    console.log(`🔄 Initializing transcription (attempt ${tokenRetryCountRef.current}/${maxRetries})`);
    
    try {
      const response = await fetch('/api/assemblyai-token');
      if (!response.ok) throw new Error(`Token request failed: ${response.status}`);
      const data = await response.json();
      const token = data.token;

      const socket = new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`);
      socketRef.current = socket;

      socket.onopen = async () => {
        console.log('🔗 WebSocket connected');
        setIsConnected(true);
        isConnectingRef.current = false;
        tokenRetryCountRef.current = 0; // Reset on successful connection

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const supportedTypes = ['audio/webm','audio/mp4', 'audio/ogg','audio/wav'];
            const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
            
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                    socket.send(event.data);
                }
            };
            mediaRecorderRef.current.start(1000);
        } catch(err) {
            console.error('❌ Error getting audio stream:', err);
            setError('Failed to get microphone access');
            stopMediaAndSocket();
        }
      };

      socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.message_type === 'PartialTranscript' && data.text) {
          onTranscript(fullTranscriptRef.current + ' ' + data.text);
        } else if (data.message_type === 'FinalTranscript' && data.text) {
          fullTranscriptRef.current += ' ' + data.text;
          onTranscript(fullTranscriptRef.current.trim());
        }
      };

      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection error');
        isConnectingRef.current = false;
      };

      socket.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        isConnectingRef.current = false;
        if (isRecording && !event.wasClean) {
          console.log('🔄 Reconnecting...');
          setTimeout(startTranscription, 2000);
        }
      };
    } catch (err) {
      console.error('❌ Error initializing transcription:', err);
      setError(`Initialization failed: ${err}`);
      isConnectingRef.current = false;
    }
  }, [isRecording, onTranscript, stopMediaAndSocket]);
  
  useEffect(() => {
    if (isRecording) {
      fullTranscriptRef.current = '';
      startTranscription();
    } else {
      stopMediaAndSocket();
    }

    return () => {
      stopMediaAndSocket();
    };
  }, [isRecording, startTranscription, stopMediaAndSocket]);

  return { isConnected, error };
}; 