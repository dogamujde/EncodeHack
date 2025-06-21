'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Video, VideoOff, Users, ChevronDown, ChevronUp, X } from 'lucide-react'

// Types
interface FeedbackItem {
  id: string;
  message: string;
  timestamp: Date;
  type: 'speed' | 'volume' | 'suggestion';
  dismissed: boolean;
}

type CoachingStatus = 'idle' | 'active' | 'recent';

// Main component
export default function LiveMeetingPage() {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [liveFeedback, setLiveFeedback] = useState<string | null>(null);
  const [coachingStatus, setCoachingStatus] = useState<CoachingStatus>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Refs for media
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // NO MORE API CALLS - Pure demo mode
  console.log('🚀 Live Meeting Demo Mode - No API calls');

  // Unified media stream setup
  const startMediaCapture = async (videoEnabled?: boolean) => {
    try {
      setError(null);
      console.log('🎬 Starting demo media capture...');

      // Use passed parameter or current state
      const shouldUseVideo = videoEnabled !== undefined ? videoEnabled : isVideoOn;

      // Request both video and audio in one call
      const stream = await navigator.mediaDevices.getUserMedia({
        video: shouldUseVideo,
        audio: true // Always request audio for demo
      });

      streamRef.current = stream;

      // Set up video if enabled
      if (shouldUseVideo && videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('✅ Video feed connected to video element');
      }

      // Set up MediaRecorder for demo (no actual sending)
      if (isRecording) {
        // Check for supported MIME types
        const supportedTypes = [
          'audio/webm',
          'audio/mp4',
          'audio/ogg',
          'audio/wav'
        ];
        
        let mimeType = '';
        for (const type of supportedTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }
        
        if (!mimeType) {
          console.log('⚠️ No supported audio MIME type found, using default');
          mediaRecorderRef.current = new MediaRecorder(stream);
        } else {
          console.log('✅ Using supported MIME type:', mimeType);
          mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
        }

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            console.log('📡 Demo: Audio data captured:', event.data.size, 'bytes (not sent anywhere)');
          }
        };

        mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      }
      
      console.log('✅ Demo media capture started successfully');
      
    } catch (err) {
      console.error('❌ Error accessing media:', err);
      setError('Failed to access camera/microphone');
    }
  };

  // Stop all media capture
  const stopMediaCapture = () => {
    console.log('🛑 Stopping demo media capture...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Pure demo simulation (NO API CALLS)
  const startDemoSimulation = () => {
    console.log('🎭 Starting demo simulation...');
    setIsConnected(true);
    
    // Simulate transcript updates (demo only)
    if (isRecording) {
      const demoTexts = [
        'Hello, this is a demo transcript.',
        'Both camera and microphone are working properly.',
        'Real-time transcription would appear here.',
        'Speaking speed and volume are being monitored.'
      ];
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < demoTexts.length && isRecording) {
          setCurrentTranscript(prev => prev + ' ' + demoTexts[index]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 3000);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    
    if (newVideoState) {
      // Starting camera - need to get new stream with video
      console.log('📹 Starting camera...');
      await startMediaCapture(true);
    } else {
      // Turning off camera - stop current stream and restart with audio only
      console.log('📹 Stopping camera...');
      if (streamRef.current) {
        stopMediaCapture();
        // If recording is still active, restart with audio only
        if (isRecording) {
          setTimeout(() => startMediaCapture(false), 100);
        }
      }
    }
  };

  // Toggle recording
  const toggleRecording = async () => {
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);
    
    if (newRecordingState) {
      // Start recording
      console.log('🎤 Starting recording...');
      setCoachingStatus('active');
      setCurrentTranscript('');
      await startMediaCapture(); // Use current video state
      startDemoSimulation(); // No API calls, just demo
      
      // Demo feedback after 5 seconds
      setTimeout(() => {
        addFeedbackItem('Demo: Your speaking pace is good!', 'speed');
      }, 5000);
      
    } else {
      // Stop recording
      console.log('🎤 Stopping recording...');
      setCoachingStatus('recent');
      stopMediaCapture();
      setIsConnected(false);
    }
  };

  // Add feedback item
  const addFeedbackItem = (message: string, type: FeedbackItem['type']) => {
    const newFeedback: FeedbackItem = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type,
      dismissed: false
    };
    
    setFeedbackHistory(prev => [newFeedback, ...prev]);
    setLiveFeedback(message);
    
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setLiveFeedback(null);
    }, 8000);
  };

  // Dismiss feedback
  const dismissFeedback = (id: string) => {
    setFeedbackHistory(prev =>
      prev.map(item => item.id === id ? { ...item, dismissed: true } : item)
    );
  };

  // Initialize real voice transcription (controlled)
  useEffect(() => {
    let isInitialized = false;
    let websocket: WebSocket | null = null;
    let tokenRetryCount = 0;
    const maxRetries = 3;

    const initializeTranscription = async () => {
      if (isInitialized || !isRecording) return;
      
      try {
        console.log('🎯 Initializing real transcription...');
        isInitialized = true;
        
        // Get token with retry limit
        const getToken = async (): Promise<string> => {
          if (tokenRetryCount >= maxRetries) {
            throw new Error('Max token retries reached');
          }
          
          tokenRetryCount++;
          const response = await fetch('/api/assemblyai-token');
          
          if (!response.ok) {
            throw new Error(`Token request failed: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('✅ Got transcription token');
          return data.token;
        };

        const token = await getToken();
        
        // Connect to AssemblyAI WebSocket
        const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`;
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = () => {
          console.log('✅ Transcription WebSocket connected');
          setIsConnected(true);
        };
        
        websocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.message_type === 'FinalTranscript') {
            const transcript = data.text;
            console.log('📝 Transcript:', transcript);
            
            // Update live transcript
            setCurrentTranscript(prev => {
              const newEntry = `${new Date().toLocaleTimeString()}: ${transcript}`;
              return prev ? `${prev}\n${newEntry}` : newEntry;
            });
            
            // Generate demo coaching feedback
            if (transcript.length > 10) {
              setTimeout(() => {
                const suggestions = [
                  "Great pace! Keep speaking clearly.",
                  "Try to pause between thoughts for better clarity.",
                  "Excellent articulation - very easy to follow.",
                  "Consider varying your tone for more engagement."
                ];
                
                const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
                
                const newFeedback: FeedbackItem = {
                  id: Date.now().toString(),
                  message: randomSuggestion,
                  timestamp: new Date(),
                  type: 'suggestion',
                  dismissed: false
                };
                
                setFeedbackHistory(prev => [newFeedback, ...prev]);
              }, 2000);
            }
          }
        };
        
        websocket.onerror = (error) => {
          console.error('❌ Transcription WebSocket error:', error);
          setError('Transcription connection error');
        };
        
        websocket.onclose = () => {
          console.log('🔌 Transcription WebSocket closed');
          setIsConnected(false);
        };
        
        // Send audio data to WebSocket
        if (streamRef.current && mediaRecorderRef.current) {
          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0 && websocket?.readyState === WebSocket.OPEN) {
              // Convert audio data to base64 and send
              const reader = new FileReader();
              reader.onload = () => {
                const audioData = reader.result as ArrayBuffer;
                const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
                websocket?.send(JSON.stringify({
                  audio_data: base64Audio
                }));
              };
              reader.readAsArrayBuffer(event.data);
            }
          };
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize transcription:', error);
        setError(`Transcription setup failed: ${error.message}`);
        isInitialized = false;
      }
    };

    // Cleanup function
    const cleanup = () => {
      if (websocket) {
        websocket.close();
        websocket = null;
      }
      isInitialized = false;
      tokenRetryCount = 0;
      setIsConnected(false);
    };

    // Initialize when recording starts
    if (isRecording) {
      initializeTranscription();
    } else {
      cleanup();
    }

    // Cleanup on unmount
    return cleanup;
  }, [isRecording]); // Only depend on isRecording

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMediaCapture();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Coaching Session</h1>
            <p className="text-gray-600 mt-1">Real-time feedback and transcription</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`coaching-status-dot ${coachingStatus}`}></div>
              <span className="text-sm font-medium capitalize">{coachingStatus}</span>
            </div>
            
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            
            {error && (
              <Badge variant="destructive">
                Error: {error}
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Video className="h-5 w-5" />
                  <span>Camera Feed</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {isVideoOn ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center">
                        <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Camera is off</p>
                        <p className="text-sm opacity-75">Click the camera button to start</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Controls Overlay */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex space-x-4 bg-black bg-opacity-50 rounded-lg p-3">
                      <Button
                        onClick={toggleCamera}
                        variant={isVideoOn ? "default" : "secondary"}
                        size="sm"
                        className="text-white"
                      >
                        {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        onClick={toggleRecording}
                        variant={isRecording ? "destructive" : "secondary"}
                        size="sm"
                        className="text-white"
                      >
                        {isRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coaching Panel */}
          <div className="space-y-6">
            
            {/* Live Feedback */}
            {liveFeedback && (
              <div className="coaching-feedback-overlay">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="coaching-status-dot active"></div>
                    <span className="font-semibold text-blue-900">Live Coaching</span>
                  </div>
                  <Button
                    onClick={() => setLiveFeedback(null)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-blue-800">{liveFeedback}</p>
              </div>
            )}

            {/* Current Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[100px] max-h-[200px] overflow-y-auto bg-gray-50 rounded-lg p-3">
                  {currentTranscript ? (
                    <p className="text-sm text-gray-700">{currentTranscript}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      {isRecording ? "Start speaking to see transcript..." : "Click the microphone button to start recording"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feedback History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Feedback History</CardTitle>
                  <Button
                    onClick={() => setShowHistory(!showHistory)}
                    variant="ghost"
                    size="sm"
                  >
                    {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {showHistory && (
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {feedbackHistory.filter(item => !item.dismissed).length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No feedback yet. Start speaking to receive coaching!</p>
                    ) : (
                      feedbackHistory
                        .filter(item => !item.dismissed)
                        .map(item => (
                          <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant={
                                item.type === 'suggestion' ? 'default' :
                                item.type === 'speed' ? 'secondary' : 'outline'
                              }>
                                {item.type}
                              </Badge>
                              <Button
                                onClick={() => dismissFeedback(item.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{item.message}</p>
                            <p className="text-xs text-gray-500">
                              {item.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
      
      {/* CSS for coaching status indicator */}
      <style jsx>{`
        .coaching-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #6b7280;
        }
        
        .coaching-status-dot.active {
          background-color: #10b981;
          animation: pulse 2s infinite;
        }
        
        .coaching-status-dot.recent {
          background-color: #f59e0b;
        }
        
        .coaching-feedback-overlay {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
} 