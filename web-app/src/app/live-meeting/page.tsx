"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Play,
  Square,
  Video,
  VideoOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSendMicToAssembly } from '@/hooks/useSendMicToAssembly'
import { useFaceExpressions } from '@/hooks/useFaceExpressions'
import { useLiveKitSpeaker } from '@/hooks/useLiveKitSpeaker'

interface Transcript {
  text: string;
  speaker?: string;
}

export default function LiveMeetingPage() {
  const router = useRouter()
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [finalTranscripts, setFinalTranscripts] = useState<Transcript[]>([]);
  
  // Speaker diarization logic
  const speakerMapRef = useRef<Record<string, number>>({});
  
  const handleToggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
      }
    }
    setIsVideoOn(!isVideoOn);
  };
  
  const handleToggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
      }
    }
    setIsMuted(!isMuted);
  };
  
  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // --- HOOKS ---
  const expressionAnalysis = useFaceExpressions({ videoRef, canvasRef });
  const currentSpeaker = useLiveKitSpeaker();

  useSendMicToAssembly({
    stream,
    isRecording,
    onTranscript: (transcript) => {
      const speaker = currentSpeaker ? currentSpeaker.toUpperCase() : 'SPEAKER';
      setFinalTranscripts(prev => [...prev, { ...transcript, speaker }]);
    },
  });

  useEffect(() => {
    async function getMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    }
    getMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white">
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 w-full h-full bg-black rounded-lg relative overflow-hidden aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full transform -scale-x-100" />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform -scale-x-100" />
            {!stream && isVideoOn && 
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <p>Starting camera...</p>
              </div>
            }
            {!isVideoOn && 
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <CameraOff className="h-16 w-16 text-gray-500" />
              </div>
            }
          </div>
          <div className="w-full h-full bg-[#1a1a1a] rounded-lg p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Live Transcript</h2>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {finalTranscripts.map((item, index) => (
                <div key={index}>
                  <span className="font-semibold text-blue-400">{item.speaker}: </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-48">
          {/* Audio & Recording Controls */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 flex flex-col justify-between">
            <h3 className="text-lg font-bold mb-2">Audio & Recording</h3>
            <div className="flex items-center justify-around">
              <Button onClick={handleToggleMute} variant="ghost">
                {isMuted ? <MicOff /> : <Mic />}
              </Button>
              <Button onClick={handleToggleVideo} variant="ghost">
                {isVideoOn ? <Camera /> : <CameraOff />}
              </Button>
              <Button onClick={handleToggleRecording} variant={isRecording ? 'destructive' : 'default'}>
                {isRecording ? <Square className="mr-2" /> : <Play className="mr-2" />}
                {isRecording ? 'Stop' : 'Record'}
              </Button>
            </div>
          </div>

          {/* Expression Analysis */}
          <div className="md:col-span-2 bg-[#1a1a1a] rounded-lg p-4 flex flex-col">
             <h3 className="text-lg font-bold mb-2">Expression Analysis</h3>
             <div className="flex-1 overflow-y-auto text-sm pr-2">
                <p className="mb-2">
                  <span className="font-semibold">Detected Expressions: </span>
                  <span className="font-bold text-teal-400">{expressionAnalysis.dominantExpression}</span>
                </p>
                <ul className="space-y-1">
                  {Object.entries(expressionAnalysis.expressions).map(([expression, score]) => (
                    <li key={expression} className="flex items-center gap-2">
                      <span className="w-32 truncate" title={expression}>
                        {expression}
                      </span>
                      <div className="flex-1 bg-gray-600 rounded-sm relative h-4 flex items-center">
                        <div className="h-full bg-teal-400 rounded-sm" style={{ width: `${score * 100}%` }}></div>
                        <span className="absolute inset-y-0 left-2 flex items-center font-mono text-white mix-blend-difference">
                          {(score as number).toFixed(4)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
} 