"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity, 
  Users, 
  Target,
  Play,
  ArrowRight,
  Eye,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'

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
    sentimentChange: "+5%", 
    participationChange: "-2%"
  }
}

const chartData = [
  { month: "Nov", meetings: 18, hours: 32, sentiment: 78 },
  { month: "Dec", meetings: 24, hours: 42, sentiment: 82 },
  { month: "Jan", meetings: 28, hours: 48, sentiment: 85 }
]

const topInsights = [
  {
    title: "Meeting Duration Optimization",
    description: "Meetings are averaging 15% longer than scheduled time",
    impact: "high",
    suggestion: "Consider time-boxing discussion topics"
  },
  {
    title: "Participation Imbalance",
    description: "3 team members dominate 70% of speaking time",
    impact: "medium", 
    suggestion: "Implement round-robin discussion format"
  },
  {
    title: "Positive Sentiment Trend",
    description: "Team sentiment has improved 15% over last month",
    impact: "positive",
    suggestion: "Continue current meeting practices"
  }
]

export default function InsightsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeView, setActiveView] = useState('overview')

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
            <h1 className="text-3xl font-bold text-white">Insights & Analytics</h1>
            <p className="text-gray-400 mt-1">Understand your meeting patterns and performance</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push('/demo')} className="bg-purple-500 hover:bg-purple-600">
              <Play className="w-4 h-4 mr-2" />
              View Product Demo
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer" onClick={() => router.push('/demo')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Play className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Product Demo</h3>
              <p className="text-gray-400 text-sm">See our AI features in action</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Detailed Reports</h3>
              <p className="text-gray-400 text-sm">Export comprehensive analytics</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Goal Tracking</h3>
              <p className="text-gray-400 text-sm">Monitor meeting objectives</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Real-time Metrics</h3>
              <p className="text-gray-400 text-sm">Live meeting performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
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
    </div>
  )
} 