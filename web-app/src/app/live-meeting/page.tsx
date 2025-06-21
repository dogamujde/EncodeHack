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
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Attach the Daily.co video track to our hidden video element for analysis
  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoRef.current.srcObject = new MediaStream([videoTrack]);
    }
  }, [videoTrack]);

  const expressionAnalysis = useFaceExpressions({ videoRef, canvasRef });

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white">
      {/* Hidden elements for face analysis */}
      <video ref={videoRef} autoPlay playsInline className="hidden"></video>
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <div className="flex-1 flex flex-col p-4 gap-4">
        <h1 className="text-2xl font-bold">Live Coaching Session</h1>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 w-full h-full bg-black rounded-lg relative overflow-hidden">
            <DailyCall 
              onTranscript={setTranscript} 
              onFeedback={setFeedback}
              onLocalVideoTrack={setVideoTrack}
            />
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
             <h3 className="text-lg font-bold mb-2">Expression Analysis</h3>
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