"use client"

import dynamic from 'next/dynamic';
import { useState } from 'react';

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

  return (
    <div className="flex h-screen w-full bg-[#0c0c0c] text-white">
      <div className="flex-1 flex flex-col p-4 gap-4">
        <h1 className="text-2xl font-bold">Live Coaching Session</h1>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 w-full h-full bg-black rounded-lg relative overflow-hidden">
            <DailyCall onTranscript={setTranscript} onFeedback={setFeedback} />
          </div>
          <div className="w-full h-full bg-[#1a1a1a] rounded-lg p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Real-time Feedback</h2>
            <div className="mb-4 space-y-2">
              {feedback.length > 0 ? (
                feedback.map((fb, i) => (
                  <div key={i} className="bg-gray-700 p-2 rounded-lg text-sm">{fb}</div>
                ))
              ) : (
                <p className="text-gray-400">No feedback yet.</p>
              )}
            </div>
            <hr className="border-gray-600 my-4" />
            <h2 className="text-xl font-bold mb-4">Live Transcript</h2>
            <div className="flex-1 overflow-y-auto text-gray-300">
              {transcript || "Transcript will appear here..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 