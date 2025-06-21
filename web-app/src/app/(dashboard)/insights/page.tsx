"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Users, 
  ArrowRight,
  Eye,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock analytics data
const analyticsOverview = {
  totalMeetings: 24,
  totalHours: 42.5,
  avgParticipants: 4.2,
  avgDuration: 65, // minutes
  topSentiment: "positive",
  participationRate: 87,
  trends: {
    meetingsChange: "+12%",
    durationChange: "-5%",
    participationChange: "+3%",
    sentimentChange: "+8%"
  }
}

const topInsights = [
  {
    title: "Increased positive sentiment in Q4",
    description: "Team meetings have shown a significant increase in positive language and engagement.",
    impact: "high",
    suggestion: "Continue fostering open communication and positive reinforcement."
  },
  {
    title: "Talking speed slightly above optimal range",
    description: "Average talking speed is 165 WPM, slightly higher than the recommended 140-160 WPM.",
    impact: "medium",
    suggestion: "Encourage team members to be mindful of their pacing for better clarity."
  },
  {
      title: "Action items are consistently assigned",
      description: "95% of meetings result in clearly defined action items, improving accountability.",
      impact: "positive",
      suggestion: "Leverage the AI assistant to automatically track and follow up on action items."
  }
]

// Mock chart data
const chartData = [
  { month: "October", meetings: 8, hours: 14, sentiment: 82 },
  { month: "November", meetings: 10, hours: 18, sentiment: 85 },
  { month: "December", meetings: 6, hours: 10.5, sentiment: 90 },
]

export default function InsightsPage() {
  const router = useRouter()
  const [activeView, setActiveView] = useState('overview')

  return (
    <div className="p-6 space-y-8">
        {/* Header */}
        <div>
            <h1 className="text-2xl font-bold text-white">Insights</h1>
            <p className="text-gray-400 mt-1">Analyze your team&apos;s meeting performance.</p>
        </div>
        
        {/* Overview Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{analyticsOverview.totalMeetings}</div>
              <div className="text-gray-400 text-sm mb-2">Total Meetings</div>
              <div className="text-green-400 text-xs font-medium">{analyticsOverview.trends.meetingsChange} from last month</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{analyticsOverview.totalHours}h</div>
              <div className="text-gray-400 text-sm mb-2">Total Meeting Hours</div>
              <div className="text-blue-400 text-xs font-medium">Avg {analyticsOverview.avgDuration}min per meeting</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{analyticsOverview.participationRate}%</div>
              <div className="text-gray-400 text-sm mb-2">Participation Rate</div>
              <div className="text-red-400 text-xs font-medium">{analyticsOverview.trends.participationChange} from last month</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2 capitalize">{analyticsOverview.topSentiment}</div>
              <div className="text-gray-400 text-sm mb-2">Overall Sentiment</div>
              <div className="text-green-400 text-xs font-medium">{analyticsOverview.trends.sentimentChange} improvement</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('trends')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'trends'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setActiveView('team')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'team'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Team Analysis
          </button>
        </div>

        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Top Insights */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topInsights.map((insight, index) => (
                    <div key={index} className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">{insight.title}</h3>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                                insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                insight.impact === 'positive' ? 'bg-green-500/20 text-green-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {insight.impact}
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{insight.description}</p>
                          <p className="text-blue-400 text-sm">💡 {insight.suggestion}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts Placeholder */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-400" />
                    Meeting Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500">Chart visualization coming soon</p>
                      <p className="text-xs text-gray-600 mt-2">Click &quot;Product Demo&quot; to see sample charts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-400" />
                    Sentiment Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500">Chart visualization coming soon</p>
                      <p className="text-xs text-gray-600 mt-2">Click &quot;Product Demo&quot; to see sample charts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeView === 'trends' && (
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{month.month}</h3>
                          <p className="text-gray-400 text-sm">{month.meetings} meetings, {month.hours}h total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-white">{month.sentiment}%</div>
                        <div className="text-xs text-gray-400">Avg sentiment</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'team' && (
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Team Analytics Coming Soon</h3>
                  <p className="text-gray-400 mb-4">Individual performance metrics and team collaboration insights</p>
                  <Button onClick={() => router.push('/demo')} variant="outline">
                    View Demo Preview
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  )
} 