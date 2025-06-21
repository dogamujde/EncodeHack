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
import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

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

async function getRecentMeetings() {
  const recordingsDir = path.join(process.cwd(), '..', 'recordings')
  try {
    await fs.access(recordingsDir)
    const files = await fs.readdir(recordingsDir)
    const webmFiles = files.filter(file => file.endsWith('.webm'))

    const meetings = await Promise.all(
      webmFiles.map(async file => {
        const filePath = path.join(recordingsDir, file)
        const stats = await fs.stat(filePath)
        return {
          id: file, // Use the full filename as the ID
          title: `Recording - ${new Date(
            stats.mtime
          ).toLocaleString()}`,
          date: stats.mtime.toLocaleDateString(),
          time: stats.mtime.toLocaleTimeString(),
          duration: 'N/A', // Placeholder
          participants: ['You'], // Placeholder
          status: 'completed',
          sentiment: 'neutral', // Placeholder
          insights: 0 // Placeholder
        }
      })
    )
    return meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error reading recordings directory:', error)
    return []
  }
}

async function deleteRecording(filename: string) {
  'use server'
  const recordingsDir = path.join(process.cwd(), '..', 'recordings')
  const filePath = path.join(recordingsDir, filename)
  try {
    await fs.unlink(filePath)
    console.log(`Deleted recording: ${filename}`)
    revalidatePath('/meetings') // Revalidate the meetings page
  } catch (error) {
    console.error(`Error deleting recording ${filename}:`, error)
    throw new Error('Failed to delete recording.')
  }
}

export default async function MeetingsPage() {
  const router = useRouter()
  const recentMeetings = await getRecentMeetings()

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Meetings</h1>
            <p className="text-gray-400 mt-1">Manage your upcoming and past meetings.</p>
          </div>
          <Link href="/live-meeting">
            <Button>
              <Video className="w-4 h-4 mr-2" />
              Start Live Meeting
            </Button>
          </Link>
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentMeetings.map(meeting => (
               <Card key={meeting.id} className="overflow-hidden">
               <CardContent className="p-4">
                 <video controls className="mb-4 h-40 w-full rounded-lg object-cover">
                   <source src={`/recordings/${meeting.id}`} type="video/webm" />
                   Your browser does not support the video tag.
                 </video>
                 <h3 className="mb-2 font-semibold">{meeting.title}</h3>
                 <div className="mb-4 text-sm text-gray-400">
                   <p>{meeting.date} at {meeting.time}</p>
                 </div>
                 <div className="flex justify-between">
                   <Link href={`/meeting/${meeting.id}`}>
                      <Button>
                          View Analysis <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                   </Link>
                   <form action={async () => {
                       'use server'
                       await deleteRecording(meeting.id)
                   }}>
                       <Button variant="destructive" size="sm" type="submit">Delete</Button>
                   </form>
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