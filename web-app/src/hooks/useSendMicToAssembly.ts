import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSendMicToAssemblyProps {
  stream: MediaStream | null;
  isRecording: boolean;
  onTranscript: (text: string) => void;
  onSuggestion: (text: string) => void;
  onMetrics?: (metrics: { wpm: number; confidence: number; avgConfidence: number; total: number; finals: number; sessionSec: number }) => void;
}

export const useSendMicToAssembly = ({ stream, isRecording, onTranscript, onSuggestion, onMetrics }: UseSendMicToAssemblyProps) => {
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

  // Rolling metrics for smarter feedback
  const metricsRef = useRef({
    confidenceSum: 0,
    confidenceCount: 0,
    lastSuggestion: '',
    total: 0,
    finals: 0,
    startTime: Date.now()
  });

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
          } as any;
          
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
            const full = fullTranscriptRef.current.trim();
            onTranscript(full);

            // ---------------- Local heuristic feedback ----------------
            try {
              const wordsInSegment = data.text.split(/\s+/).filter(Boolean).length;
              const segmentDurationSec = (data.audio_end - data.audio_start) / 1000;
              const wpm = segmentDurationSec > 0 ? (wordsInSegment / segmentDurationSec) * 60 : 0;

              const lower = full.toLowerCase();
              const fillerMatches = lower.match(/\b(um|uh|like|you know)\b/g);
              const fillerCount = fillerMatches ? fillerMatches.length : 0;

              // Update rolling confidence
              metricsRef.current.confidenceSum += (data.confidence || 0);
              metricsRef.current.confidenceCount += 1;
              metricsRef.current.total += 1;
              if (data.message_type === 'FinalTranscript') {
                metricsRef.current.finals += 1;
              }

              const avgConfidence = metricsRef.current.confidenceCount > 0 ?
                metricsRef.current.confidenceSum / metricsRef.current.confidenceCount : 1;

              let suggestion = '';
              if (data.confidence && data.confidence < 0.75) {
                suggestion = 'Try speaking a bit more clearly to improve accuracy.';
              } else if (wpm > 180) {
                suggestion = 'You are speaking quite fast – slow down a little.';
              } else if (wpm < 90 && wordsInSegment > 5) {
                suggestion = 'You can speed up a bit to maintain engagement.';
              } else if (fillerCount >= 3) {
                suggestion = 'Consider reducing filler words to sound more confident.';
              } else if (avgConfidence < 0.85) {
                suggestion = `Average ASR confidence is ${(avgConfidence*100).toFixed(0)}%. Speak a bit clearer.`;
              }

              if (suggestion && suggestion !== metricsRef.current.lastSuggestion) {
                metricsRef.current.lastSuggestion = suggestion;
                onSuggestion(suggestion);
              }

              // emit metrics to UI if callback provided
              const now = Date.now();
              onMetrics?.({
                wpm,
                confidence: data.confidence ?? 1,
                avgConfidence,
                total: metricsRef.current.total,
                finals: metricsRef.current.finals,
                sessionSec: Math.floor((now - metricsRef.current.startTime)/1000)
              });
            } catch (e) {
              console.warn('heuristic feedback error', e);
            }
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
  }, [stream, onTranscript, onSuggestion, onMetrics]);

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