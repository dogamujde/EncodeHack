"use client"

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useFaceExpressions } from '@/hooks/useFaceExpressions';
import { useAssemblyAITranscriber } from '@/hooks/useAssemblyAITranscriber';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff, Video, VideoOff, Phone, Settings, MessageSquare, Maximize, CornerRightUp } from 'lucide-react';
import { DailyCall, DailyCallHandle } from '@/components/daily-call';
import MetricBar from '@/components/MetricBar';
import { FeedbackWarning } from '@/components/FeedbackWarning';

const DynamicDailyCall = dynamic(
  () => import('@/components/daily-call').then(mod => mod.DailyCall),
  { 
    ssr: false,
    loading: () => <p className="text-center">Loading Call...</p> 
  }
);

type ActiveView = 'camera' | 'screen';

export default function LiveMeetingPage() {
  const [fullTranscript, setFullTranscript] = useState("");
  const [currentUtterance, setCurrentUtterance] = useState("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isReadyForAnalysis, setIsReadyForAnalysis] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showMesh, setShowMesh] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('camera');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dailyCallRef = useRef<DailyCallHandle>(null);

  const handleTranscript = useCallback((transcript: any) => {
    if (transcript.message_type === 'PartialTranscript') {
      setCurrentUtterance(transcript.text);
    } else if (transcript.message_type === 'FinalTranscript') {
      setFullTranscript(prev => prev + transcript.text + ' ');
      setCurrentUtterance('');
    }
  }, []);
  
  const {
    isReady: isTranscriberReady,
    setup: setupTranscriber,
    start: startTranscribing,
    stop: stopTranscribing,
    confidence,
    talkingSpeed,
    clarity,
    warningMessage,
    onCloseWarning,
  } = useAssemblyAITranscriber({
    onTranscript: handleTranscript
  });

  const handleParticipantUpdate = useCallback((event: any) => {
    console.log("[LiveMeetingPage] Participant updated:", event);
    const participant = event.participant;
    if (participant.local) {
      setIsMicOn(participant.audio);
    }
  }, []);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 360, frameRate: 15 },
          audio: true 
        });
        
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error('[LiveMeetingPage] Error getting user media:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionError('Camera and microphone access was denied. Please allow access in your browser settings and refresh the page.');
        } else {
          setPermissionError(`An error occurred while accessing media devices: ${err.message}. Please check your hardware and browser settings.`);
        }
      }
    };
    getMedia();
  }, []); 

  useEffect(() => {
    const video = videoRef.current;
    if (video && mediaStream) {
      video.onloadedmetadata = () => {
        video.play().catch(e => console.error("[LiveMeetingPage] Error playing hidden video:", e));
      };
      video.onplaying = () => {
        setIsReadyForAnalysis(true);
      };
    }
  }, [mediaStream]);

  // Effect to setup transcription
  useEffect(() => {
    const setup = async () => {
      if (mediaStream && !isTranscriberReady) {
        console.log('[LiveMeetingPage] Media stream available. Setting up transcriber...');
        await setupTranscriber(mediaStream);
      }
    };
    setup();
  }, [mediaStream, isTranscriberReady, setupTranscriber]);

  // Effect to control transcription based on mic status and transcriber readiness
  useEffect(() => {
    if (isTranscriberReady && isMicOn) {
      startTranscribing();
    } else {
      stopTranscribing();
    }
  }, [isTranscriberReady, isMicOn, startTranscribing, stopTranscribing]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      stopTranscribing();
      mediaStream?.getTracks().forEach(track => track.stop());
    };
  }, [stopTranscribing, mediaStream]);

  const expressionAnalysis = useFaceExpressions({ 
    videoRef, 
    canvasRef, 
    isReady: isReadyForAnalysis,
    showMesh,
  });

  const getTalkingSpeedLabel = (speed: number) => {
    if (speed === 0) return '';
    if (speed < 120) return 'TOO SLOW';
    if (speed > 350) return 'TOO FAST';
    if (speed >= 140 && speed <= 250) return 'GOOD SPEED';
    return 'OK';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence === 0) return '';
    if (confidence < 0.4) return 'LOW';
    if (confidence < 0.7) return 'AVERAGE';
    return 'HIGH';
  };

  const confidenceGradient = 'linear-gradient(to right, #ef4444, #f59e0b 40%, #22c55e 70%)';
  const talkingSpeedGradient = 'linear-gradient(to right, #ef4444, #f59e0b 40%, #22c55e 70%)';

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white">
      <video ref={videoRef} autoPlay playsInline muted className="hidden"></video>
      
      <div className="flex-1 flex flex-col p-4 gap-4">
        <h1 className="text-2xl font-bold">Live Coaching Session</h1>
        
        <div className="flex-1 grid grid-rows-3 gap-4">
          <div className="row-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 w-full h-full bg-black rounded-lg relative overflow-hidden flex flex-col">
              <canvas ref={canvasRef} className="absolute z-10 pointer-events-none"></canvas>
              
              <div className="flex-1 w-full h-full relative">
                <FeedbackWarning message={warningMessage} onClose={onCloseWarning} />
                {mediaStream ? (
                  <DailyCall 
                    ref={dailyCallRef}
                    mediaStream={mediaStream}
                    onParticipantUpdated={handleParticipantUpdate}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-center p-4">
                    {permissionError ? (
                      <p className="text-red-400">{permissionError}</p>
                    ) : (
                      <p>Waiting for camera permissions...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full h-full flex flex-col gap-4">
              <div className="bg-[#1a1a1a] rounded-lg p-6 flex flex-col h-1/2">
                  <h2 className="text-xl font-bold mb-4">Real-time Feedback</h2>
                  <div className="flex-1 space-y-4 overflow-y-auto pr-2 flex flex-col justify-around">
                      <MetricBar 
                        label="Confidence"
                        value={confidence}
                        min={0}
                        max={1}
                        gradient={confidenceGradient}
                        unit="%"
                        valueLabel={getConfidenceLabel(confidence)}
                      />
                      <MetricBar 
                        label="Clarity"
                        value={clarity}
                        min={0}
                        max={1}
                        gradient={confidenceGradient}
                        unit="%"
                        valueLabel={getConfidenceLabel(clarity)}
                      />
                      <MetricBar 
                        label="Talking Speed"
                        value={talkingSpeed}
                        min={50}
                        max={400}
                        gradient={talkingSpeedGradient}
                        unit="wpm"
                        valueLabel={getTalkingSpeedLabel(talkingSpeed)}
                      />
                  </div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-4 flex flex-col h-1/2">
                  <h2 className="text-xl font-bold mb-4">Live Transcript</h2>
                  <div className="flex-1 overflow-y-auto text-gray-300">
                    <span>{fullTranscript}</span>
                    <span className="text-white">{currentUtterance}</span>
                    {!fullTranscript && !currentUtterance && "Transcript will appear here..."}
                  </div>
              </div>
            </div>
          </div>
          <div className="row-span-1 bg-[#1a1a1a] rounded-lg p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold mb-2">Expression Analysis</h3>
              <Button onClick={() => setShowMesh(!showMesh)} variant="outline" size="sm">
                {showMesh ? 'Hide' : 'Show'} Face Mesh
              </Button>
            </div>
             <div className="flex-1 overflow-y-auto text-sm pr-2">
                <p className="mb-2">
                  <span className="font-semibold">Detected Expressions: </span>
                  <span className="font-bold text-teal-400">{expressionAnalysis.dominantExpression}</span>
                </p>
                <ul className="space-y-1">
                  {Object.entries(expressionAnalysis.expressions)
                    .map(([expression, score]) => (
                    <li key={expression} className="flex items-center gap-2">
                      <span className="w-28 truncate" title={expression}>
                        {expression}
                      </span>
                      <div className="flex-1 bg-gray-600 rounded-sm relative h-4 flex items-center">
                        <div className="h-full bg-teal-400 rounded-sm" style={{ width: `${score * 100}%` }}></div>
                        <span className="absolute inset-y-0 left-2 flex items-center font-mono text-white mix-blend-difference">
                          {(score as number).toFixed(2)}
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