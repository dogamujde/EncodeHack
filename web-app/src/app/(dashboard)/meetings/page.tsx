"use client"

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
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    title: "Q1 Marketing Strategy",
    date: "Tomorrow",
    time: "11:00 AM - 12:30 PM",
    participants: ["Lisa Park", "Jordan Kim"],
    type: "one-time",
    status: "upcoming"
  }
]

const recentMeetings = [
    {
        id: 5,
        title: "Sales Meeting",
        date: "Today",
        time: "4:30 AM",
        duration: "15 min",
        participants: ["Doga Mujde", "Kaan Dogan"],
        status: "completed",
        sentiment: "positive",
        insights: 12
    },
    {
        id: 3,
        title: "Project Phoenix Kickoff",
        date: "Yesterday",
        time: "4:00 PM",
        duration: "45 min",
        participants: ["Alex Rodriguez", "Sarah Chen", "Mike Johnson"],
        status: "completed",
        sentiment: "positive",
        insights: 8
    },
    {
        id: 4,
        title: "Client Check-in: Acme Corp",
        date: "3 days ago",
        time: "10:30 AM",
        duration: "30 min",
        participants: ["Lisa Park"],
        status: "completed",
        sentiment: "neutral",
        insights: 5
    }
]

export default function MeetingsPage() {
  const router = useRouter()

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Meetings</h1>
            <p className="text-gray-400 mt-1">Manage your upcoming and past meetings.</p>
          </div>
          <Button onClick={() => router.push('/live-meeting')}>
            <Video className="w-4 h-4 mr-2" />
            Start Live Meeting
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="mt-6 flex gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search meetings..."
              className="w-full bg-gray-800 border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Upcoming Meetings */}
      <Card>
        <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Upcoming Meetings</h2>
            <div className="space-y-4">
            {upcomingMeetings.map(meeting => (
                <Card key={meeting.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                    <h3 className="font-semibold text-white">{meeting.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{meeting.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{meeting.time}</span>
                        </div>
                    </div>
                    </div>
                    <Button variant="secondary">Join Now</Button>
                </CardContent>
                </Card>
            ))}
            </div>
        </CardContent>
      </Card>
      
      {/* Recent Meetings */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Recent Meetings</h2>
          <div className="space-y-4">
            {recentMeetings.map(meeting => (
              <Card key={meeting.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{meeting.title}</h3>
                      <p className="text-sm text-gray-400">{meeting.date} at {meeting.time} ({meeting.duration})</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={meeting.sentiment === 'positive' ? 'default' : 'secondary'}>
                            {meeting.sentiment}
                        </Badge>
                        <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                        </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-400">{meeting.participants.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span>{meeting.insights} Insights</span>
                        </div>
                        <Button onClick={() => router.push(`/meeting/${meeting.id}`)}>
                            View Analysis <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 