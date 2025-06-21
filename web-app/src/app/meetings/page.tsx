"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Search,
  Filter,
  TrendingUp,
  ArrowRight,
  Play,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'

// Mock data for meetings
const upcomingMeetings = [
  {
    id: 1,
    title: "Weekly Team Standup",
    date: "Today",
    time: "2:00 PM - 3:00 PM",
    participants: ["Sarah Chen", "Mike Johnson", "Alex Rodriguez"],
    type: "recurring",
    status: "upcoming"
  },
  {
    id: 2,
    title: "Q1 Strategy Review",
    date: "Tomorrow",
    time: "10:00 AM - 11:30 AM",
    participants: ["Sarah Chen", "Mike Johnson", "Lisa Park", "Jordan Kim"],
    type: "meeting",
    status: "upcoming"
  },
  {
    id: 3,
    title: "Client Presentation",
    date: "Dec 22",
    time: "3:00 PM - 4:00 PM",
    participants: ["Sarah Chen", "Mike Johnson"],
    type: "presentation",
    status: "upcoming"
  }
]

const recentMeetings = [
  {
    id: 4,
    title: "Product Roadmap Discussion",
    date: "Dec 15, 2024",
    time: "2:00 PM - 3:30 PM",
    participants: ["Alex Rodriguez", "Jordan Kim", "Taylor Swift"],
    duration: "1h 28m",
    insights: {
      sentiment: "positive",
      participation: 92,
      keyPoints: 8
    }
  },
  {
    id: 5,
    title: "Budget Planning Session",
    date: "Dec 12, 2024",
    time: "10:00 AM - 12:00 PM",
    participants: ["Sarah Chen", "Mike Johnson", "Lisa Park"],
    duration: "1h 52m",
    insights: {
      sentiment: "neutral",
      participation: 85,
      keyPoints: 12
    }
  },
  {
    id: 6,
    title: "Team Retrospective",
    date: "Dec 10, 2024",
    time: "4:00 PM - 5:00 PM",
    participants: ["All Team"],
    duration: "58m",
    insights: {
      sentiment: "positive",
      participation: 96,
      keyPoints: 6
    }
  }
]

export default function MeetingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-white">Meetings</h1>
            <p className="text-gray-400 mt-1">Manage and analyze your meetings</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push('/live-meeting')} className="bg-blue-500 hover:bg-blue-600">
              <Video className="w-4 h-4 mr-2" />
              Start Live Meeting
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer" onClick={() => router.push('/live-meeting')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Start Live Meeting</h3>
              <p className="text-gray-400 text-sm">Begin a new meeting with real-time transcription and AI insights</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Schedule Meeting</h3>
              <p className="text-gray-400 text-sm">Plan and schedule upcoming meetings with your team</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Meeting Analytics</h3>
              <p className="text-gray-400 text-sm">View insights and trends from your meeting history</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'recent'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Recent
          </button>
        </div>

        {/* Meeting Lists */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Upcoming Meetings</h2>
            {upcomingMeetings.map((meeting) => (
              <Card key={meeting.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{meeting.title}</h3>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            meeting.type === 'recurring' ? 'bg-blue-500/20 text-blue-400' :
                            meeting.type === 'presentation' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {meeting.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {meeting.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meeting.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {meeting.participants.length} participants
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {meeting.participants.slice(0, 3).map((participant, index) => (
                          <span key={index} className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                            {participant}
                          </span>
                        ))}
                        {meeting.participants.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{meeting.participants.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" onClick={() => router.push('/live-meeting')}>
                        <Play className="w-4 h-4 mr-2" />
                        Join
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Meetings</h2>
            {recentMeetings.map((meeting) => (
              <Card key={meeting.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">{meeting.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {meeting.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meeting.time}
                        </div>
                        <div className="text-blue-400">
                          Duration: {meeting.duration}
                        </div>
                      </div>
                      
                      {/* Meeting Insights */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-gray-400">Sentiment</div>
                          <div className={`text-lg font-semibold ${
                            meeting.insights.sentiment === 'positive' ? 'text-green-400' :
                            meeting.insights.sentiment === 'negative' ? 'text-red-400' :
                            'text-blue-400'
                          }`}>
                            {meeting.insights.sentiment}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-gray-400">Participation</div>
                          <div className="text-lg font-semibold text-purple-400">
                            {meeting.insights.participation}%
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-800 rounded-lg">
                          <div className="text-sm text-gray-400">Key Points</div>
                          <div className="text-lg font-semibold text-orange-400">
                            {meeting.insights.keyPoints}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {meeting.participants.slice(0, 3).map((participant, index) => (
                          <span key={index} className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                            {participant}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        View Analysis
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 