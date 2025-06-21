"use client"

import {
  Clock,
  Users,
  ChevronRight,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data
const mockNextMeeting = {
  title: "Weekly Team Standup",
  time: "2:00 PM - 3:00 PM",
  participants: ["Sarah Chen", "Mike Johnson", "Alex Rodriguez"]
}

const mockRecentMeetings = [
  {
    id: 1,
    title: "Q4 Strategy Planning",
    date: "Dec 15, 2024",
    time: "10:00 AM",
    participants: ["Sarah Chen", "Mike Johnson", "Lisa Park"],
    summary: "Discussed quarterly objectives and resource allocation. Key focus on market expansion and team growth initiatives. Action items assigned for budget review."
  },
  {
    id: 2,
    title: "Product Roadmap Review",
    date: "Dec 12, 2024", 
    time: "3:00 PM",
    participants: ["Alex Rodriguez", "Jordan Kim"],
    summary: "Reviewed feature priorities for next sprint. Identified technical dependencies and timeline adjustments. Stakeholder feedback incorporated into requirements."
  },
  {
    id: 3,
    title: "Client Presentation Prep",
    date: "Dec 10, 2024",
    time: "1:30 PM", 
    participants: ["Sarah Chen", "Mike Johnson", "Taylor Swift"],
    summary: "Finalized presentation materials and talking points. Rehearsed demo scenarios and Q&A responses. Confirmed logistics for upcoming client meeting."
  }
]

const mockInsights = {
  avgSpeakingTime: "3.2 minutes",
  topFillerWords: ["um", "like", "you know"],
  interruptionScore: "Low (2 per meeting)"
}

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Here&apos;s what&apos;s happening with your meetings</p>
      </div>

      {/* Next Meeting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Next Meeting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-semibold text-white">{mockNextMeeting.title}</h3>
            <p className="text-gray-400">{mockNextMeeting.time}</p>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-400">
                {mockNextMeeting.participants.join(", ")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Meeting Summaries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Meeting Summaries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentMeetings.map((meeting) => (
              <div key={meeting.id} className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{meeting.title}</h3>
                    <p className="text-sm text-gray-400">{meeting.date} at {meeting.time}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                    View full insights
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-400">
                      {meeting.participants.join(", ")}
                    </span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {meeting.summary}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insight Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Insight Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {mockInsights.avgSpeakingTime}
              </div>
              <div className="text-sm text-gray-400">
                Average Speaking Time
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {mockInsights.topFillerWords.join(", ")}
              </div>
              <div className="text-sm text-gray-400">
                Most Used Filler Words
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {mockInsights.interruptionScore}
              </div>
              <div className="text-sm text-gray-400">
                Interruption Score
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 