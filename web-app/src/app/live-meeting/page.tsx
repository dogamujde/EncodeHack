"use client"

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
import { useFaceExpressions } from '@/hooks/useFaceExpressions';
import { Camera, CameraOff, Mic, MicOff, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DailyCall = dynamic(
  () => import('@/components/daily-call').then(mod => mod.DailyCall),
  { 
    ssr: false,
    loading: () => <p className="text-center">Loading Call...</p> 
  }
);

export default function LiveMeetingPage() {
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<string[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isReadyForAnalysis, setIsReadyForAnalysis] = useState(false);
  const [showMesh, setShowMesh] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Step 1: Get the local camera stream as soon as the component mounts.
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 360, frameRate: 15 }, // Request a modest resolution
      audio: true 
    })
    .then(stream => {
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    })
    .catch(err => {
      console.error('[LiveMeetingPage] Error getting user media:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera and microphone access was denied. Please allow access in your browser settings and refresh the page.');
      } else {
        setPermissionError(`An error occurred while accessing media devices: ${err.message}. Please check your hardware and browser settings.`);
      }
    });

    // Cleanup: stop the stream when the component unmounts
    return () => {
      mediaStream?.getTracks().forEach(track => track.stop());
    };
  }, []); // Empty dependency array ensures this runs only once

  // Step 2: Set up the video element for analysis once the stream is ready.
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

  const expressionAnalysis = useFaceExpressions({ 
    videoRef, 
    canvasRef, 
    isReady: isReadyForAnalysis,
    showMesh,
  });

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white">
      {/* Hidden elements for face analysis */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden"></video>
      
      <div className="flex-1 flex flex-col p-4 gap-4">
        <h1 className="text-2xl font-bold">Live Coaching Session</h1>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 w-full h-full bg-black rounded-lg relative overflow-hidden">
            {/* The canvas is positioned absolutely within this container, on top of the Daily iframe */}
            <canvas ref={canvasRef} className="absolute z-10 pointer-events-none"></canvas>
            
            {mediaStream ? (
              <DailyCall 
                onTranscript={setTranscript} 
                onFeedback={setFeedback}
                mediaStream={mediaStream}
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
                <div className="flex-1 space-y-2 overflow-y-auto">
                    {feedback.length > 0 ? (
                        feedback.map((fb, i) => (
                        <div key={i} className="bg-gray-700 p-2 rounded-lg text-sm">{fb}</div>
                        ))
                    ) : (
                        <p className="text-gray-400">No feedback yet.</p>
                    )}
                </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 flex flex-col h-1/2">
                <h2 className="text-xl font-bold mb-4">Live Transcript</h2>
                <div className="flex-1 overflow-y-auto text-gray-300">
                {transcript || "Transcript will appear here..."}
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