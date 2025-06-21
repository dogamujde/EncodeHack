"use client"

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useFaceExpressions } from '@/hooks/useFaceExpressions';
import { Camera, CameraOff, Mic, MicOff, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAssemblyAITranscriber } from '@/hooks/useAssemblyAITranscriber';

const DailyCall = dynamic(
  () => import('@/components/daily-call').then(mod => mod.DailyCall),
  { 
    ssr: false,
    loading: () => <p className="text-center">Loading Call...</p> 
  }
);

export default function LiveMeetingPage() {
  const [fullTranscript, setFullTranscript] = useState("");
  const [currentUtterance, setCurrentUtterance] = useState("");
  const [feedback, setFeedback] = useState<string[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isReadyForAnalysis, setIsReadyForAnalysis] = useState(false);
  const [showMesh, setShowMesh] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isCallJoined, setIsCallJoined] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
  } = useAssemblyAITranscriber({
    onTranscript: handleTranscript
  });

  const handleJoinedMeeting = useCallback(() => {
    console.log('[LiveMeetingPage] handleJoinedMeeting callback triggered.');
    setIsCallJoined(true);
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

  // Effect to setup and start transcription
  useEffect(() => {
    const setupAndStart = async () => {
      if (mediaStream && !isTranscriberReady) {
        console.log('[LiveMeetingPage] Media stream available. Setting up transcriber...');
        await setupTranscriber(mediaStream);
      }
      
      if (isCallJoined && isTranscriberReady) {
        console.log('[LiveMeetingPage] Call joined and transcriber ready. Starting transcription.');
        startTranscribing();
      }
    };
    setupAndStart();
  }, [mediaStream, isCallJoined, isTranscriberReady, setupTranscriber, startTranscribing]);
  
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

  const renderMetric = (label: string, value: number, unit: string, max: number) => (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-40 truncate" title={label}>{label}</span>
      <div className="flex-1 bg-gray-600 rounded-sm relative h-5 flex items-center">
        <div className="h-full bg-sky-400 rounded-sm" style={{ width: `${(value / max) * 100}%` }}></div>
        <span className="absolute inset-y-0 left-2 flex items-center font-mono text-white mix-blend-difference">
          {value.toFixed(2)} {unit}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white">
      {/* Hidden elements for face analysis */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden"></video>
      
      <div className="flex-1 flex flex-col p-4 gap-4">
        <h1 className="text-2xl font-bold">Live Coaching Session</h1>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 w-full h-full bg-black rounded-lg relative overflow-hidden">
            <canvas ref={canvasRef} className="absolute z-10 pointer-events-none"></canvas>
            
            {mediaStream ? (
              <DailyCall 
                onTranscript={() => {}} 
                onFeedback={setFeedback}
                mediaStream={mediaStream}
                onJoinedMeeting={handleJoinedMeeting}
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
          <div className="w-full h-full flex flex-col gap-4">
            <div className="bg-[#1a1a1a] rounded-lg p-4 flex flex-col h-1/2">
                <h2 className="text-xl font-bold mb-4">Real-time Feedback</h2>
                <div className="flex-1 space-y-3 overflow-y-auto">
                    {/* Metrics will be re-integrated later */}
                    <p className="text-gray-400 text-center pt-4">AI feedback will appear here...</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-48">
          {/* Expression Analysis */}
          <div className="md:col-span-3 bg-[#1a1a1a] rounded-lg p-4 flex flex-col">
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