import { useEffect, useState, useRef, useCallback } from 'react';

interface UseSendMicToAssemblyProps {
  onSuggestion?: (suggestion: string) => void;
  onTranscript?: (transcript: string) => void;
  onSpeedFeedback?: (feedback: string) => void;
  onVolumeFeedback?: (feedback: string) => void;
}

interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

// Get AssemblyAI token from our API route
async function getRealtimeToken() {
  try {
    const response = await fetch('/api/assemblyai-token');
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error getting AssemblyAI token:', error);
    throw error;
  }
}

// Get supported audio format for MediaRecorder
function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/wav'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return 'audio/webm'; // fallback
}

export function useSendMicToAssembly({
  onSuggestion,
  onTranscript,
  onSpeedFeedback,
  onVolumeFeedback
}: UseSendMicToAssemblyProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for WebSocket and audio processing
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeMonitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Coaching feedback state
  const wordsBuffer = useRef<TranscriptWord[]>([]);
  const lastSpeedFeedback = useRef<number>(0);
  const lastVolumeFeedback = useRef<number>(0);
  const volumeBuffer = useRef<number[]>([]);
  
  // Audio volume monitoring
  const monitorVolume = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for volume
    const rms = Math.sqrt(
      dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length
    ) / 255;
    
    // Add to volume buffer (keep last 3 seconds worth of data)
    volumeBuffer.current.push(rms);
    if (volumeBuffer.current.length > 30) { // ~3 seconds at 10fps
      volumeBuffer.current.shift();
    }
    
    // Check for low volume (average over last 3 seconds)
    if (volumeBuffer.current.length >= 10) {
      const avgVolume = volumeBuffer.current.reduce((a, b) => a + b, 0) / volumeBuffer.current.length;
      
      // Trigger low volume feedback if below threshold and not recently triggered
      if (avgVolume < 0.3 && Date.now() - lastVolumeFeedback.current > 10000) {
        lastVolumeFeedback.current = Date.now();
        const feedback = `Your voice volume seems low (${Math.round(avgVolume * 100)}%). Try speaking louder for better clarity.`;
        onVolumeFeedback?.(feedback);
      }
    }
  }, [onVolumeFeedback]);
  
  // Speaking speed analysis
  const analyzeSpeed = useCallback((words: TranscriptWord[]) => {
    if (words.length < 2) return;
    
    const now = Date.now();
    const fiveSecondsAgo = now - 5000;
    
    // Filter words from last 5 seconds
    const recentWords = words.filter(word => 
      (word.start * 1000) > fiveSecondsAgo
    );
    
    if (recentWords.length >= 10) { // Need at least 10 words for analysis
      const timeSpan = (recentWords[recentWords.length - 1].end - recentWords[0].start);
      const wpm = (recentWords.length / timeSpan) * 60; // Words per minute
      
      // Trigger speed feedback if speaking too fast and not recently triggered
      if (wpm > 200 && now - lastSpeedFeedback.current > 10000) {
        lastSpeedFeedback.current = now;
        const feedback = `Speaking pace is quite fast (${Math.round(wpm)} WPM). Consider slowing down for better clarity.`;
        onSpeedFeedback?.(feedback);
      }
    }
  }, [onSpeedFeedback]);
  
  // Stop all audio processing
  const stopMicrophone = useCallback(() => {
    console.log('🛑 Stopping microphone and cleaning up...');
    
    if (volumeMonitorIntervalRef.current) {
      clearInterval(volumeMonitorIntervalRef.current);
      volumeMonitorIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setIsConnected(false);
  }, []);
  
  // Initialize WebSocket connection (mock for demo)
  const connectWebSocket = useCallback(async () => {
    // Prevent multiple simultaneous connections
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('🔌 Already connected to WebSocket');
      return;
    }
    
    try {
      setError(null);
      console.log('🔌 Getting token for WebSocket connection...');
      
      // Get token from our API route
      const token = await getRealtimeToken();
      console.log('✅ Got demo token');
      
      // For demo purposes, we'll simulate a connection
      // In production, you would connect to AssemblyAI WebSocket
      console.log('🔌 Demo mode: Simulating AssemblyAI WebSocket connection');
      setIsConnected(true);
      
      // Simulate periodic transcript updates for demo
      const simulateTranscript = () => {
        const demoTexts = [
          'Hello, this is a demo transcript.',
          'The microphone is working properly.',
          'Real-time transcription would appear here.',
          'Speaking speed and volume are being monitored.'
        ];
        
        let index = 0;
        const interval = setInterval(() => {
          if (index < demoTexts.length && socketRef.current) {
            onTranscript?.(demoTexts[index]);
            setCurrentTranscript(prev => prev + ' ' + demoTexts[index]);
            index++;
          } else {
            clearInterval(interval);
          }
        }, 3000);
        
        // Store interval reference for cleanup
        return interval;
      };
      
      // Start demo transcript after 2 seconds
      setTimeout(simulateTranscript, 2000);
      
    } catch (err) {
      console.error('❌ Error connecting to AssemblyAI:', err);
      setError('Failed to connect to transcription service');
      setIsConnected(false);
    }
  }, [onSuggestion, onTranscript, analyzeSpeed]);
  
  // Start microphone capture
  const startMicrophone = useCallback(async () => {
    // Prevent multiple simultaneous starts
    if (streamRef.current) {
      console.log('🎤 Microphone already started');
      return;
    }
    
    try {
      console.log('🎤 Starting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      streamRef.current = stream;
      
      // Set up audio context for volume monitoring
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Start volume monitoring with ref to allow cleanup
      volumeMonitorIntervalRef.current = setInterval(monitorVolume, 100);
      
      // Set up MediaRecorder with compatible format
      const supportedMimeType = getSupportedMimeType();
      console.log('🎵 Using audio format:', supportedMimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('📡 Audio data captured:', event.data.size, 'bytes');
          // In production, you would send this to AssemblyAI WebSocket
        }
      };
      
      mediaRecorder.start(100); // Send data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      
      console.log('✅ Microphone started successfully');
      
    } catch (err) {
      console.error('❌ Error accessing microphone:', err);
      setError('Failed to access microphone');
    }
  }, [monitorVolume]);
  
  // Manual reconnect function
  const reconnect = useCallback(async () => {
    console.log('🔄 Manual reconnection requested...');
    stopMicrophone();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await connectWebSocket();
    await startMicrophone();
  }, [connectWebSocket, startMicrophone, stopMicrophone]);
  
  // Initialize ONCE on mount - FIXED DEPENDENCY ISSUE
  useEffect(() => {
    if (isInitialized) return;
    
    console.log('🚀 Initializing microphone hook...');
    setIsInitialized(true);
    
    const initialize = async () => {
      await connectWebSocket();
      await startMicrophone();
    };
    
    initialize();
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up microphone hook...');
      stopMicrophone();
    };
  }, [isInitialized]); // Only depend on isInitialized flag
  
  return {
    isConnected,
    error,
    currentTranscript,
    startMicrophone,
    stopMicrophone,
    reconnect
  };
} 