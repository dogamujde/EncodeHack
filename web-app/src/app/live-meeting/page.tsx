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

  // Refs for media
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Unified media stream setup
  const setupMediaStream = async (video: boolean, audio: boolean) => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (!video && !audio) {
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setIsVideoOn(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: video,
        audio: audio
      });

      streamRef.current = stream;

      if (video && videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsVideoOn(true);
      } else if (!video && videoRef.current) {
        videoRef.current.srcObject = null;
        setIsVideoOn(false);
      }
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const toggleVideo = () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    setupMediaStream(newVideoState, isRecording);
  };
  
  const toggleRecording = () => {
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);
    if (!newRecordingState && !isVideoOn) {
      // If both are off, stop stream completely
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } else {
      setupMediaStream(isVideoOn, newRecordingState);
    }
  };

  // Initialize transcription with coaching callbacks
  const { isConnected: transcriptConnected, error: transcriptError } = useSendMicToAssembly({
    stream: streamRef.current,
    isRecording,
    onSuggestion: (suggestion: string) => {
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
  }, [transcriptConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
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