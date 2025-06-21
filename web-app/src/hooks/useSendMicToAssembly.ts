import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSendMicToAssemblyProps {
  stream: MediaStream | null;
  isRecording: boolean;
  onTranscript: (text: string) => void;
  onSuggestion?: (text: string) => void;
}

export const useSendMicToAssembly = ({ stream, isRecording, onTranscript }: UseSendMicToAssemblyProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullTranscriptRef = useRef('');
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isConnectingRef = useRef(false);
  const shouldReconnectRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;
  const retryCountRef = useRef(0);
  const isInitializedRef = useRef(false);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up resources...');
    
    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop audio processing
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.stop) {
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        console.warn('⚠️ Error stopping audio processing:', err);
      }
      mediaRecorderRef.current = null;
    }

    // Close WebSocket
    if (socketRef.current) {
      try {
        socketRef.current.close(1000, 'Component cleanup');
      } catch (err) {
        console.warn('⚠️ Error closing WebSocket:', err);
      }
      socketRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const startTranscription = useCallback(async () => {
    // Prevent multiple simultaneous connections
    if (isConnectingRef.current || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) {
      console.log('🚫 Already connecting or connected');
      return;
    }

    // Check if we should start
    if (!shouldReconnectRef.current || !stream) {
      console.log('🚫 Should not start transcription', { 
        shouldReconnect: shouldReconnectRef.current, 
        hasStream: !!stream 
      });
      return;
    }

    // Check retry limit
    if (retryCountRef.current >= maxRetries) {
      console.log('🚫 Max retries reached');
      setError('Failed to connect after multiple attempts');
      shouldReconnectRef.current = false;
      return;
    }

    isConnectingRef.current = true;
    retryCountRef.current++;
    console.log(`🔄 Starting transcription (attempt ${retryCountRef.current}/${maxRetries})`);
    
    try {
      const response = await fetch('/api/assemblyai-token');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      const token = data.token;

      // Check if we should still proceed (component might have unmounted)
      if (!shouldReconnectRef.current) {
        console.log('🚫 Component unmounted, aborting connection');
        isConnectingRef.current = false;
        return;
      }

      // Get the actual sample rate from the audio track
      let sampleRate = 16000; // default
      if (stream && stream.getAudioTracks().length > 0) {
        const audioTrack = stream.getAudioTracks()[0];
        const settings = audioTrack.getSettings();
        sampleRate = settings.sampleRate || 16000;
        console.log('🔊 Using sample rate:', sampleRate, 'Hz');
      }

      const socket = new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}&token=${token}`);
      socketRef.current = socket;

      socket.onopen = async () => {
        console.log('🔗 WebSocket connected');
        setIsConnected(true);
        setError(null);
        isConnectingRef.current = false;
        retryCountRef.current = 0; // Reset on successful connection

        // Only start recording if we still should be connected
        if (!shouldReconnectRef.current || !stream) {
          console.log('🚫 Should not start recording');
          socket.close();
          return;
        }

        try {
          console.log('🎙️ Setting up audio processing for AssemblyAI...');
          console.log('🎙️ Stream audio tracks:', stream.getAudioTracks().length);
          
          // Use Web Audio API to process audio for AssemblyAI
          const audioContext = new AudioContext({ sampleRate: sampleRate });
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          
          source.connect(processor);
          processor.connect(audioContext.destination);
          
          processor.onaudioprocess = (event) => {
            if (socket.readyState === WebSocket.OPEN) {
              const inputBuffer = event.inputBuffer;
              const inputData = inputBuffer.getChannelData(0);
              
              // Convert float32 to int16 PCM
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              console.log('🎵 Sending PCM audio data:', pcmData.length, 'samples');
              socket.send(pcmData.buffer);
            }
          };
          
          // Store references for cleanup
          mediaRecorderRef.current = { 
            audioContext, 
            processor,
            stop: () => {
              console.log('🛑 Stopping audio processing');
              processor.disconnect();
              source.disconnect();
              audioContext.close();
            },
            state: 'recording'
          } as unknown as MediaRecorder;
          
          console.log('✅ Audio processing started');
        } catch (err) {
          console.error('❌ Error starting audio processing:', err);
          setError('Failed to start audio processing');
          socket.close();
        }
      };

      socket.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data);
          console.log('📨 Received WebSocket message:', data);
          
          if (data.message_type === 'PartialTranscript' && data.text) {
            console.log('📝 Partial transcript:', data.text);
            onTranscript(fullTranscriptRef.current + ' ' + data.text);
          } else if (data.message_type === 'FinalTranscript' && data.text) {
            console.log('✅ Final transcript:', data.text);
            fullTranscriptRef.current += ' ' + data.text;
            onTranscript(fullTranscriptRef.current.trim());
          } else if (data.message_type === 'SessionBegins') {
            console.log('🎉 AssemblyAI session started');
          } else {
            console.log('ℹ️ Other message type:', data.message_type);
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
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
        
        // Only reconnect if we should still be connected and it wasn't a clean close
        if (shouldReconnectRef.current && event.code !== 1000 && retryCountRef.current < maxRetries) {
          console.log('🔄 Scheduling reconnection...');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              startTranscription();
            }
          }, 2000);
        }
      };

    } catch (err) {
      console.error('❌ Error initializing transcription:', err);
      setError(`Initialization failed: ${err}`);
      isConnectingRef.current = false;
      
      // Retry on token fetch failure
      if (shouldReconnectRef.current && retryCountRef.current < maxRetries) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldReconnectRef.current) {
            startTranscription();
          }
        }, 3000);
      }
    }
  }, [stream, onTranscript]);

  // Initialize once when recording starts
  useEffect(() => {
    if (isRecording && stream && !isInitializedRef.current) {
      console.log('🎯 Initializing transcription service...');
      isInitializedRef.current = true;
      fullTranscriptRef.current = '';
      shouldReconnectRef.current = true;
      retryCountRef.current = 0;
      startTranscription();
    } else if (!isRecording || !stream) {
      console.log('🛑 Stopping transcription service...');
      isInitializedRef.current = false;
      shouldReconnectRef.current = false;
      cleanup();
    }
  }, [isRecording, stream, startTranscription, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🔚 Component unmounting, cleaning up...');
      shouldReconnectRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return { isConnected, error };
}; 