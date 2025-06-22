'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Video, VideoOff, Users, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useSendMicToAssembly } from '@/hooks/useSendMicToAssembly'

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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs for media
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Unified media stream setup
  const setupMediaStream = async (video: boolean, audio: boolean) => {
    try {
      console.log('🎥 Setting up media stream:', { video, audio });
      
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      if (!video && !audio) {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setIsVideoOn(false);
        return;
      }

      // Configure constraints for AssemblyAI compatibility
      // Try simpler constraints first, let browser choose optimal settings
      const constraints: MediaStreamConstraints = {
        video: video || false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
      };

      console.log('🎯 Requesting media with constraints:', constraints);

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Log actual audio track settings
      if (audio && newStream.getAudioTracks().length > 0) {
        const audioTrack = newStream.getAudioTracks()[0];
        const settings = audioTrack.getSettings();
        console.log('🔊 Actual audio track settings:', settings);
      }

      console.log('🎤 Media stream created:', { 
        audioTracks: newStream.getAudioTracks().length,
        videoTracks: newStream.getVideoTracks().length 
      });

      setStream(newStream);

      // Start audio level monitoring if audio is enabled
      if (audio) {
        startAudioLevelMonitoring(newStream);
      } else {
        stopAudioLevelMonitoring();
      }

      if (video && videoRef.current) {
        videoRef.current.srcObject = newStream;
        try {
          // Some browsers (Safari) need an explicit play() call
          await (videoRef.current as HTMLVideoElement).play();
        } catch (err) {
          console.warn('⚠️ video.play() failed:', err);
        }
        setIsVideoOn(true);
      } else if (!video && videoRef.current) {
        videoRef.current.srcObject = null;
        setIsVideoOn(false);
      }
      
      // Ensure state reflects requested video flag even if element wasn't ready yet
      if (!video) {
        setIsVideoOn(false);
      } else if (video) {
        setIsVideoOn(true);
      }

    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      setStream(null);
    }
  };

  const toggleVideo = async () => {
    const newVideoState = !isVideoOn;
    await setupMediaStream(newVideoState, isRecording);
  };
  
  const toggleRecording = async () => {
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);
    
          if (!newRecordingState && !isVideoOn) {
        // If both are off, stop stream completely
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        stopAudioLevelMonitoring();
      } else {
        await setupMediaStream(isVideoOn, newRecordingState);
      }
  };

  // Initialize transcription with coaching callbacks
  const { isConnected: transcriptConnected, error: transcriptError } = useSendMicToAssembly({
    stream: stream, // Use state instead of ref
    isRecording,
    onSuggestion: (suggestion: string) => {
      console.log('🎯 Received suggestion:', suggestion);
      setLiveFeedback(suggestion);
      addFeedbackItem(suggestion, 'suggestion');
      setCoachingStatus('active');
      
      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setLiveFeedback(null);
        setCoachingStatus('recent');
        
        // Set to idle after 30 seconds total
        setTimeout(() => setCoachingStatus('idle'), 20000);
      }, 10000);
    },
    onTranscript: (transcript: string) => {
      console.log('📝 Received transcript:', transcript);
      setCurrentTranscript(transcript);
    }
  });

  // Feedback management
  const addFeedbackItem = (message: string, type: FeedbackItem['type']) => {
    const newFeedback: FeedbackItem = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type,
      dismissed: false
    };

    setFeedbackHistory(prev => [newFeedback, ...prev.slice(0, 9)]); // Keep last 10
  };

  const dismissFeedback = (id: string) => {
    setFeedbackHistory(prev =>
      prev.map(item => item.id === id ? { ...item, dismissed: true } : item)
    );
  };

  // Update connection status
  useEffect(() => {
    setIsConnected(transcriptConnected);
    console.log('🔗 Transcription connection status:', transcriptConnected);
  }, [transcriptConnected]);

  // Log errors
  useEffect(() => {
    if (transcriptError) {
      console.error('❌ Transcription error:', transcriptError);
    }
  }, [transcriptError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up media stream on unmount');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      stopAudioLevelMonitoring();
    };
  }, [stream]);

  // Audio level monitoring
  const startAudioLevelMonitoring = (mediaStream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(mediaStream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.round(average));
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('❌ Error setting up audio level monitoring:', error);
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Ensure video element is linked to stream after rerenders (React StrictMode double mount)
  useEffect(() => {
    if (isVideoOn && stream && videoRef.current) {
      console.log('🔄 Binding video element to current stream');
      videoRef.current.srcObject = stream;
      (videoRef.current as HTMLVideoElement)
        .play()
        .catch(err => console.warn('⚠️ video.play() error:', err));
    }
  }, [isVideoOn, stream]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reflectly Session</h1>
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
            
            {/* Debug info */}
            <div className="text-xs text-gray-500">
              Stream: {stream ? `Audio: ${stream.getAudioTracks().length}, Video: ${stream.getVideoTracks().length}` : 'None'}
              {isRecording && <div>Audio Level: {audioLevel}</div>}
              {transcriptError && <div className="text-red-500">Error: {transcriptError}</div>}
            </div>
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
                        onClick={toggleVideo}
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
                    <span className="font-semibold text-blue-900">Reflectly</span>
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
                      {isConnected ? "Start speaking to see transcript..." : "Connecting to transcription service..."}
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
                  <div className="feedback-history-panel p-3">
                    {feedbackHistory.filter(item => !item.dismissed).length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No feedback yet. Start speaking to receive coaching tips!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {feedbackHistory
                          .filter(item => !item.dismissed)
                          .map(item => (
                            <div
                              key={item.id}
                              className={`p-3 rounded-lg border-l-4 ${
                                item.type === 'speed' ? 'border-yellow-400 bg-yellow-50' :
                                item.type === 'volume' ? 'border-red-400 bg-red-50' :
                                'border-blue-400 bg-blue-50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium capitalize">{item.type}</p>
                                  <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {item.timestamp.toLocaleTimeString()}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => dismissFeedback(item.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={isConnected ? "default" : "destructive"}>
                      {isConnected ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Camera:</span>
                    <Badge variant={isVideoOn ? "default" : "secondary"}>
                      {isVideoOn ? "On" : "Off"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Feedback Items:</span>
                    <span className="text-sm font-medium">
                      {feedbackHistory.filter(item => !item.dismissed).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 