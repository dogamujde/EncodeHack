"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  Settings, 
  LogOut,
  Clock,
  Users,
  ChevronRight,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

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

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", current: true },
  { name: "Meetings", icon: Calendar, href: "/meetings", current: false },
  { name: "Insights", icon: TrendingUp, href: "/insights", current: false },
  { name: "Settings", icon: Settings, href: "/settings", current: false },
]

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Redirect to landing page if not authenticated
  React.useEffect(() => {
    if (!user && !isLoading) {
      router.push('/')
    }
  }, [user, isLoading, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // Don't render if user is not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 shadow-xl">
            <SidebarContent onLogout={handleLogout} userEmail={user.email} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:w-64 lg:flex lg:flex-col">
        <div className="bg-gray-900 flex-1">
          <SidebarContent onLogout={handleLogout} userEmail={user.email} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
          <button
            type="button"
            className="text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="p-6 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {user.email?.split('@')[0]}</h1>
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
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ onLogout, userEmail }: { onLogout: () => void; userEmail?: string }) {
  const router = useRouter()
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-800">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <span className="text-xl font-semibold text-white">ProductivAI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              if (item.href === '/dashboard') {
                // Already on dashboard, do nothing
                return
              } else if (item.href === '/meetings') {
                router.push('/meetings')
              } else if (item.href === '/insights') {
                router.push('/insights')
              } else if (item.href === '/settings') {
                // Settings page not implemented yet
                alert('Settings page coming soon!')
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              item.current
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </button>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-800">
        <div className="mb-4">
          <p className="text-sm text-gray-400">Signed in as</p>
          <p className="text-sm font-medium text-white truncate">{userEmail}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </div>
  )
} 