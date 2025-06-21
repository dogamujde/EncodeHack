"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Mic, 
  MicOff, 
  Volume2,
  Camera,
  CameraOff,
  Users,
  Clock,
  Play,
  Square,
  Headphones
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSendMicToAssembly } from '@/hooks/useSendMicToAssembly'

type AudioDevice = 'computer' | 'phone'
interface Transcript {
  text: string;
  speaker?: string;
}

export default function LiveMeetingPage() {
  const router = useRouter()
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<AudioDevice>('computer')
  const [volume, setVolume] = useState(75)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [finalTranscripts, setFinalTranscripts] = useState<Transcript[]>([])

  const speakerMapRef = useRef<Record<string, number>>({});
  const nextSpeakerIdRef = useRef(1);

  const getSpeakerDisplayName = (speakerLabel?: string): string => {
    if (!speakerLabel) return 'SPEAKER';
    if (!speakerMapRef.current[speakerLabel]) {
      speakerMapRef.current[speakerLabel] = nextSpeakerIdRef.current++;
    }
    return `SPEAKER ${speakerMapRef.current[speakerLabel]}`;
  };

  useSendMicToAssembly({
    stream: stream,
    isRecording,
    onTranscript: (transcript) => {
      setFinalTranscripts(prev => [...prev, transcript]);
    },
  });

  // Initialize camera
  useEffect(() => {
    // Stop any existing stream when the camera is turned off
    if (!isVideoOn) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
        setIsConnected(false)
      }
      return
    }

    let isCancelled = false

    const startStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        })
        if (!isCancelled) {
          setStream(mediaStream)
          setIsConnected(true)
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
        setIsConnected(false)
        if (!isCancelled) {
          setIsVideoOn(false) // Turn off toggle if permission is denied
        }
      }
    }

    startStream()

    return () => {
      isCancelled = true
      // The main stream cleanup is now handled when isVideoOn becomes false
    }
  }, [isVideoOn])

  // Effect to attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const toggleCamera = () => {
    setIsVideoOn(!isVideoOn)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted
      })
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  const handleEndMeeting = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Live Meeting</h1>
            <p className="text-gray-400 mt-1">Real-time transcription and AI insights</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? "default" : "secondary"} className="px-3 py-1">
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </Badge>
            <Badge variant={isRecording ? "default" : "secondary"} className="px-3 py-1">
              {isRecording ? "🔴 Recording" : "⏸️ Stopped"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Panel - Video and Controls */}
        <div className="w-1/2 p-6 space-y-6">
          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Video Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                {isVideoOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <CameraOff className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {/* Video Controls */}
                <div className="absolute bottom-4 left-4 flex gap-3">
                  <Button
                    onClick={toggleCamera}
                    variant={isVideoOn ? "secondary" : "destructive"}
                    size="sm"
                  >
                    {isVideoOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    onClick={toggleMute}
                    variant={!isMuted ? "secondary" : "destructive"}
                    size="sm"
                  >
                    {!isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audio & Recording Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                Audio & Recording
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Audio Device Selection */}
              <div 
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedAudioDevice === 'computer' 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => setSelectedAudioDevice('computer')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-sm">Computer Audio</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedAudioDevice === 'computer' ? 'border-blue-500' : 'border-gray-400'
                  }`}>
                    {selectedAudioDevice === 'computer' && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Volume & Recording Controls */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex-1 space-y-2">
                   {/* Volume Control */}
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{volume}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "default"}
                    size="sm"
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEndMeeting}>
                    End
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Live Transcripts and Insights */}
        <div className="w-1/2 p-6 space-y-6">
          {/* Live Transcripts */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Live Transcripts
                </span>
                <Button variant="outline" size="sm" onClick={() => {
                  setFinalTranscripts([])
                }}>
                  Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 overflow-y-auto space-y-4">
              {finalTranscripts.map((transcript, index) => (
                <div key={index}>
                  <p className="text-white">
                    <span className="font-semibold text-blue-400">{getSpeakerDisplayName(transcript.speaker)}:</span>
                    {' '}
                    {transcript.text}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle>🤖 Real-time AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-sm font-semibold text-blue-400">Speaking Pace</div>
                  <div className="text-xl font-bold text-blue-300">
                    {isRecording ? "165 WPM" : "0 WPM"}
                  </div>
                  <div className="text-xs text-blue-400/70 mt-1">Words per minute</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-sm font-semibold text-green-400">Sentiment</div>
                  <div className="text-xl font-bold text-green-300">
                    {isRecording ? "Positive" : "Neutral"}
                  </div>
                  <div className="text-xs text-green-400/70 mt-1">Overall tone</div>
                </div>
                <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-sm font-semibold text-purple-400">Questions</div>
                  <div className="text-xl font-bold text-purple-300">
                    {isRecording ? "12%" : "0%"}
                  </div>
                  <div className="text-xs text-purple-400/70 mt-1">Question ratio</div>
                </div>
                <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="text-sm font-semibold text-orange-400">Interruptions</div>
                  <div className="text-xl font-bold text-orange-300">
                    {isRecording ? "2" : "0"}
                  </div>
                  <div className="text-xs text-orange-400/70 mt-1">Total count</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 