'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Users, Clock, Settings, Play, Square } from 'lucide-react'

export default function MeetingPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Meeting Room</h1>
            <p className="text-gray-600 mt-1">Real-time transcription and coaching</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={isConnected ? "default" : "secondary"} className="px-3 py-1">
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Recording Controls & Status */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Recording Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mic className="w-5 h-5 mr-2" />
                  Recording Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={() => setIsConnected(!isConnected)}
                    variant={isConnected ? "destructive" : "default"}
                    className="w-full"
                  >
                    {isConnected ? "Disconnect" : "Connect to AssemblyAI"}
                  </Button>
                  
                  <Button 
                    onClick={() => setIsRecording(!isRecording)}
                    disabled={!isConnected}
                    variant={isRecording ? "destructive" : "default"}
                    className="w-full"
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                </div>

                {/* Audio Visualizer Placeholder */}
                <div className="h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-1 bg-blue-400 rounded-full transition-all duration-150 ${
                          isRecording ? 'animate-pulse' : ''
                        }`}
                        style={{ 
                          height: isRecording ? `${Math.random() * 30 + 10}px` : '4px' 
                        }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Session Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">00:00</div>
                    <div className="text-xs text-gray-500">Duration</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-xs text-gray-500">Words</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">0%</div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-xs text-gray-500">Participants</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Transcripts & Analysis */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Live Transcripts */}
            <Card className="h-96">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Live Transcripts
                  </span>
                  <Button variant="outline" size="sm">Clear</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto space-y-3">
                  {isRecording ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>12:34:56 - Partial</span>
                          <span>Confidence: 85%</span>
                        </div>
                        <p className="text-gray-700">Hello, this is a sample transcript that would appear in real-time...</p>
                      </div>
                      <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>12:34:58 - Final</span>
                          <span>Confidence: 92%</span>
                        </div>
                        <p className="text-gray-700">This is a completed final transcript with high confidence.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Start recording to see live transcripts</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Coaching Insights */}
            <Card>
              <CardHeader>
                <CardTitle>🤖 AI Coaching Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold text-blue-700">Speaking Pace</div>
                    <div className="text-2xl font-bold text-blue-600">0 WPM</div>
                    <div className="text-xs text-blue-500 mt-1">Words per minute</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-700">Sentiment</div>
                    <div className="text-2xl font-bold text-green-600">Neutral</div>
                    <div className="text-xs text-green-500 mt-1">Overall tone</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-semibold text-purple-700">Questions</div>
                    <div className="text-2xl font-bold text-purple-600">0%</div>
                    <div className="text-xs text-purple-500 mt-1">Question ratio</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {isRecording ? (
                    <MicOff className="w-5 h-5 text-red-500" />
                  ) : (
                    <Mic className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">
                    {isRecording ? "Recording in progress..." : "Ready to record"}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">Export Transcript</Button>
                <Button variant="outline" size="sm">Save Session</Button>
                <Button variant="outline" size="sm">Share Results</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 