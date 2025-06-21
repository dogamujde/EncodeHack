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
  
  const [finalTranscripts, setFinalTranscripts] = useState<Transcript[]>([]);
  
  // Speaker diarization logic
  const speakerMapRef = useRef<Record<string, number>>({});
  const nextSpeakerIdRef = useRef(1);
  const getSpeakerDisplayName = (speakerLabel?: string): string => {
    if (!speakerLabel) return 'SPEAKER';
    if (!speakerMapRef.current[speakerLabel]) {
      speakerMapRef.current[speakerLabel] = nextSpeakerIdRef.current++;
    }
    return `SPEAKER ${speakerMapRef.current[speakerLabel]}`;
  };

  // --- HOOKS ---
  const expressionFeedback = useFaceExpressions({ stream });
  const currentSpeaker = useLiveKitSpeaker();

  useSendMicToAssembly({
    stream,
    isRecording,
    onTranscript: (transcript) => {
      const speaker = currentSpeaker ? currentSpeaker.toUpperCase() : 'SPEAKER';
      setFinalTranscripts(prev => [...prev, { ...transcript, speaker }]);
    },
  });

  // Timer logic
  const [elapsedTime, setElapsedTime] = useState(0);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formattedTime = new Date(elapsedTime * 1000).toISOString().substr(14, 5);

  // --- MEDIA STREAM MANAGEMENT ---
  useEffect(() => {
    let isCancelled = false;
    async function getMedia() {
      if (isCancelled) return;
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        if (!isCancelled) {
          setStream(mediaStream);
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    }

    if (isVideoOn) {
      getMedia();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      isCancelled = true;
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideoOn]);

  // --- UI HANDLERS ---
  const handleToggleRecording = () => setIsRecording(prev => !prev);
  const handleToggleVideo = () => setIsVideoOn(prev => !prev);
  const handleToggleMute = () => {
    setIsMuted(prev => {
      const nextMuted = !prev;
      if (stream) stream.getAudioTracks().forEach(track => track.enabled = !nextMuted);
      return nextMuted;
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white">
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 w-full h-full bg-black rounded-lg relative overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            {!stream && isVideoOn && 
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <p>Requesting camera access...</p>
              </div>
            }
            {!isVideoOn && (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <CameraOff className="h-16 w-16 text-gray-500" />
              </div>
            )}
            {expressionFeedback && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg transition-opacity duration-300">
                {expressionFeedback}
              </div>
            )}
          </div>
          <div className="w-full h-full bg-[#1a1a1a] rounded-lg p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Live Transcript</h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {finalTranscripts.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="font-bold w-24 flex-shrink-0 text-gray-400">{item.speaker}:</div>
                  <div className="text-gray-200">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="h-24 bg-[#1a1a1a] rounded-lg flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold">{formattedTime}</span>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleToggleVideo} variant="outline" size="lg" className="bg-transparent border-gray-600 hover:bg-gray-700">
              {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>
            <Button onClick={handleToggleMute} variant="outline" size="lg" className="bg-transparent border-gray-600 hover:bg-gray-700">
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            <Button onClick={handleToggleRecording} variant={isRecording ? 'destructive' : 'default'} size="lg">
              {isRecording ? <Square className="h-6 w-6 mr-2" /> : <Play className="h-6 w-6 mr-2" />}
              {isRecording ? 'Stop' : 'Record'}
            </Button>
          </div>
           <div className="w-48"></div> {/* Spacer */}
        </div>
      </div>
    </div>
  );
} 