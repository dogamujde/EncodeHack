"use client"

import { useState } from 'react'
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Target,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

export default function ProductDemoPage() {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedDemo, setSelectedDemo] = useState('realtime')

  // Mock demo data
  const demoSections = [
    {
      id: 'realtime',
      title: 'Real-time Transcription',
      description: 'See how our AI captures every word as it&apos;s spoken',
      duration: '2:30'
    },
    {
      id: 'sentiment',
      title: 'Sentiment Analysis',
      description: 'Track emotional tone and engagement throughout meetings',
      duration: '1:45'
    },
    {
      id: 'coaching',
      title: 'AI Coaching Insights',
      description: 'Get personalized feedback to improve your communication',
      duration: '3:15'
    },
    {
      id: 'analytics',
      title: 'Meeting Analytics',
      description: 'Comprehensive insights and actionable recommendations',
      duration: '2:00'
    }
  ]

  const mockTranscripts = [
    {
      id: 1,
      speaker: "Sarah Chen",
      text: "Good morning everyone! Let's start with our quarterly review. I'm excited to share the progress we've made.",
      timestamp: "00:15",
      sentiment: "positive",
      confidence: 0.95
    },
    {
      id: 2,
      speaker: "Mike Johnson",
      text: "Thanks Sarah. The numbers look really promising. I think we're on track to exceed our targets.",
      timestamp: "00:28",
      sentiment: "positive",
      confidence: 0.92
    },
    {
      id: 3,
      speaker: "Alex Rodriguez",
      text: "I have some concerns about the timeline though. We might need to adjust our approach for Q2.",
      timestamp: "00:45",
      sentiment: "neutral",
      confidence: 0.88
    }
  ]

  const mockMetrics = {
    speakingTime: {
      sarah: 45,
      mike: 30,
      alex: 25
    },
    sentimentScore: 78,
    questionRatio: 15,
    interruptionCount: 3,
    engagementLevel: 92
  }

  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Transcription",
      description: "Accurate speech-to-text with speaker identification and confidence scores"
    },
    {
      icon: TrendingUp,
      title: "Sentiment Analysis",
      description: "Track emotional tone and engagement levels throughout the conversation"
    },
    {
      icon: Target,
      title: "Coaching Insights",
      description: "Get personalized feedback on speaking patterns, pace, and communication style"
    },
    {
      icon: Users,
      title: "Speaker Analytics",
      description: "Analyze participation, interruptions, and speaking time distribution"
    },
    {
      icon: Zap,
      title: "Live Feedback",
      description: "Receive real-time suggestions to improve your meeting effectiveness"
    },
    {
      icon: CheckCircle,
      title: "Action Items",
      description: "Automatically extract and organize follow-up tasks and decisions"
    }
  ]

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-white">Product Demo</h1>
            <p className="text-gray-400 mt-1">Experience the power of AI-driven meeting insights</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/')}>
              Back to Home
            </Button>
            <Button onClick={() => router.push('/live-meeting')}>
              Try Live Demo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Transform Your Meetings with AI
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Watch how our platform captures, analyzes, and provides actionable insights 
            from your conversations in real-time.
          </p>
        </div>

        {/* Demo Video Player */}
        <div className="mb-12">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              {/* Video Area */}
              <div className="relative bg-black rounded-t-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-blue-400" />
                    ) : (
                      <Play className="w-8 h-8 text-blue-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {demoSections.find(s => s.id === selectedDemo)?.title}
                  </h3>
                  <p className="text-gray-400">
                    {demoSections.find(s => s.id === selectedDemo)?.description}
                  </p>
                </div>

                {/* Play Button Overlay */}
                <button
                  onClick={togglePlayback}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors"
                >
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" />
                    )}
                  </div>
                </button>
              </div>

              {/* Video Controls */}
              <div className="p-4 bg-gray-800">
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentTime(Math.min(150, currentTime + 10))}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentTime / 150) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, '0')} / 2:30
                  </span>
                  <Volume2 className="w-4 h-4 text-gray-400" />
                </div>

                {/* Demo Section Selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {demoSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setSelectedDemo(section.id)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        selectedDemo === section.id
                          ? 'bg-blue-500/20 border border-blue-500'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-semibold text-sm text-white">{section.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{section.duration}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Demo Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Live Transcription */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                Live Transcription Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTranscripts.map((transcript) => (
                  <div
                    key={transcript.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      transcript.sentiment === 'positive'
                        ? 'bg-green-500/10 border-green-400'
                        : transcript.sentiment === 'negative'
                        ? 'bg-red-500/10 border-red-400'
                        : 'bg-blue-500/10 border-blue-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-white">{transcript.speaker}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            transcript.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                            transcript.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {transcript.sentiment}
                        </Badge>
                        <span className="text-xs text-gray-400">{transcript.timestamp}</span>
                      </div>
                    </div>
                    <p className="text-gray-200">{transcript.text}</p>
                    <div className="mt-2 text-xs text-gray-400">
                      Confidence: {Math.round(transcript.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Real-time Analytics */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Real-time Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Speaking Time Distribution */}
                <div>
                  <h4 className="font-semibold text-white mb-3">Speaking Time Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(mockMetrics.speakingTime).map(([speaker, percentage]) => (
                      <div key={speaker} className="flex items-center gap-3">
                        <div className="w-16 text-sm text-gray-400 capitalize">{speaker}</div>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="w-10 text-sm text-gray-300">{percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-400">Sentiment Score</div>
                    <div className="text-xl font-bold text-green-400">{mockMetrics.sentimentScore}%</div>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-400">Question Ratio</div>
                    <div className="text-xl font-bold text-blue-400">{mockMetrics.questionRatio}%</div>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-400">Interruptions</div>
                    <div className="text-xl font-bold text-orange-400">{mockMetrics.interruptionCount}</div>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-400">Engagement</div>
                    <div className="text-xl font-bold text-purple-400">{mockMetrics.engagementLevel}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">Powerful Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-white">{feature.title}</h4>
                  </div>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Meetings?</h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Experience the power of AI-driven meeting insights. Start with a free trial and see 
            how our platform can revolutionize your team&apos;s communication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => router.push('/live-meeting')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Start Live Demo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push('/')}
            >
              Sign Up Free
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 