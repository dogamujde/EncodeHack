"use client"

import { useState } from 'react'
import { MeetingDashboard } from '@/components/meeting-dashboard'
import { Users, ChevronDown } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function MeetingPage({ params }: PageProps) {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    'deniz': true,  // Deniz starts expanded
    'burak': false, // Burak starts collapsed
    'screen': false // Screen sharing starts collapsed
  })

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Mock data matching the screenshots
  const mockMeetingData = {
    id: "sample-meeting",
    title: "Adhoc Meeting between Burak Aksar and Deniz Müjde",
    date: "Apr 4, 2025 at 7:00 PM",
    participants: [
      {
        id: "BA",
        name: "Burak Aksar",
        role: "interviewer" as const,
        avatar: "BA"
      },
      {
        id: "DM", 
        name: "Deniz Müjde",
        role: "candidate" as const,
        avatar: "DM"
      }
    ],
    transcript: [
      {
        id: "1",
        speaker: "Deniz Müjde",
        text: "Konaklama Durumu ve Startup Fikri",
        timestamp: "00:03-01:03",
        confidence: 0.95
      },
      {
        id: "2", 
        speaker: "Deniz Müjde",
        text: "Konaklama Durumu ve Startup Fikri",
        timestamp: "01:33-04:11", 
        confidence: 0.92
      },
      {
        id: "3",
        speaker: "Deniz Müjde", 
        text: "Konaklama Durumu ve Startup Fikri",
        timestamp: "04:11-06:02",
        confidence: 0.88
      }
    ],
    sentimentMoments: [
      {
        id: "1",
        timestamp: "06:03",
        speaker: "Deniz Müjde",
        sentiment: 'positive' as const,
        confidence: 0.85,
        text: "Ekip genişletme konusunda pozitif yaklaşım"
      },
      {
        id: "2", 
        timestamp: "12:15",
        speaker: "Burak Aksar",
        sentiment: 'positive' as const,
        confidence: 0.92,
        text: "Yapıcı öneriler ve rehberlik"
      }
    ]
  }

  const mockCoachingData = {
    questionRatio: { value: 3, suggested: "10% - 30%" },
    talkingSpeed: { value: 212, unit: "words/min", suggested: "150 - 170" },
    averagePatience: { value: 0.62, unit: "Seconds", suggested: "1 - 1.8" },
    talkRatio: { value: 40, suggested: "50% - 70%" },
    languagePositivity: { value: 25, label: "Positive", suggested: "50% - 100%" },
    voiceEmotion: { value: 84, label: "Happy", suggested: "15% - 100%" }
  }

  // Static speaking pattern data to prevent layout shifts
  const denizSpeakingPattern = Array.from({ length: 40 }, (_, i) => {
    // Generate consistent heights based on index
    const heights = [8, 12, 6, 14, 10, 16, 4, 18, 8, 12, 15, 7, 11, 9, 13, 5, 17, 8, 10, 14, 
                     6, 12, 9, 15, 7, 11, 13, 8, 16, 4, 10, 12, 14, 6, 9, 15, 7, 11, 8, 13];
    return heights[i] || 8;
  });

  const burakSpeakingPattern = Array.from({ length: 40 }, (_, i) => {
    // Different pattern for Burak
    const heights = [10, 14, 8, 16, 12, 6, 18, 9, 13, 7, 11, 15, 5, 17, 10, 12, 8, 14, 6, 16,
                     9, 13, 11, 7, 15, 8, 12, 10, 14, 6, 18, 9, 13, 7, 11, 15, 8, 12, 10, 14];
    return heights[i] || 10;
  });

  const screenSpeakingPattern = Array.from({ length: 40 }, (_, i) => {
    // Minimal pattern for screen sharing
    const heights = [3, 5, 2, 6, 4, 3, 7, 2, 5, 3, 4, 6, 2, 8, 3, 5, 2, 6, 4, 7,
                     3, 5, 4, 2, 6, 3, 5, 4, 6, 2, 8, 3, 5, 2, 4, 6, 3, 5, 4, 6];
    return heights[i] || 3;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {mockMeetingData.title}
            </h1>
            <p className="text-gray-600 mt-1">{mockMeetingData.date}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Participants ({mockMeetingData.participants.length})
              </span>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-4 mt-4">
          {mockMeetingData.participants.map((participant) => (
            <div key={participant.id} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {participant.avatar}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{participant.name}</p>
                <p className="text-xs text-gray-500 capitalize">{participant.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left side - Meeting Dashboard with Video and Coaching */}
        <div className="flex-1 p-6">
          <div className="flex h-full">
            {/* Video and Next Meeting on the left */}
            <div className="w-1/2 pr-4 space-y-4">
              {/* Video Placeholder */}
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-gray-400 text-lg">Video Placeholder</div>
              </div>
              
              {/* Next Meeting Card */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Meeting</span>
                  <button className="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>
              </div>

              {/* Coaching Dashboard */}
              <div className="bg-white rounded-lg border p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Coaching</h2>
                
                {/* Deniz Müjde - Expandable */}
                <div className="mb-4 relative">
                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">DM</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Deniz Müjde
                      </span>
                    </div>
                    <button className="text-gray-400 flex-shrink-0" onClick={() => toggleSection('deniz')}>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                        expandedSections.deniz ? 'rotate-0' : 'rotate-[-90deg]'
                      }`} />
                    </button>
                  </div>
                  
                  {/* Speaking Pattern for Deniz - Always visible */}
                  <div className="mt-2 relative">
                    <div className="flex items-center space-x-1 h-6">
                      {denizSpeakingPattern.map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-purple-400 rounded-full"
                          style={{ height: `${height}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Expandable Content */}
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    expandedSections.deniz 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}>
                    <div className="pt-2">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Question Ratio</div>
                          <div className="text-lg font-semibold text-orange-500 mb-1">3%</div>
                          <div className="text-xs text-gray-400">Suggested: 10% - 30%</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Talking Speed</div>
                          <div className="text-lg font-semibold text-orange-500 mb-1">212 <span className="text-xs">words/min</span></div>
                          <div className="text-xs text-gray-400">Suggested: 150 - 170</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Average Patience</div>
                          <div className="text-lg font-semibold text-orange-500 mb-1">0.62 <span className="text-xs">Seconds</span></div>
                          <div className="text-xs text-gray-400">Suggested: 1 - 1.8</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Talk Ratio</div>
                          <div className="text-lg font-semibold text-orange-500 mb-1">40%</div>
                          <div className="text-xs text-gray-400">Suggested: 50% - 70%</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Language Positivity</div>
                          <div className="text-lg font-semibold text-orange-500 mb-1">25%</div>
                          <div className="text-xs text-orange-500 mb-1">Positive</div>
                          <div className="text-xs text-gray-400">Suggested: 50% - 100%</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Voice Emotion</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">84%</div>
                          <div className="text-xs text-green-500 mb-1">Happy</div>
                          <div className="text-xs text-gray-400">Suggested: 15% - 100%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Burak Aksar - Expandable */}
                <div className="mb-4 relative">
                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">BA</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Burak Aksar
                      </span>
                    </div>
                    <button className="text-gray-400 flex-shrink-0" onClick={() => toggleSection('burak')}>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                        expandedSections.burak ? 'rotate-0' : 'rotate-[-90deg]'
                      }`} />
                    </button>
                  </div>
                  
                  {/* Speaking Pattern for Burak - Always visible */}
                  <div className="mt-2 relative">
                    <div className="flex items-center space-x-1 h-6">
                      {burakSpeakingPattern.map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-purple-400 rounded-full"
                          style={{ height: `${height}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Expandable Content */}
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    expandedSections.burak 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}>
                    <div className="pt-2">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Question Ratio</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">15%</div>
                          <div className="text-xs text-gray-400">Suggested: 10% - 30%</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Talking Speed</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">165 <span className="text-xs">words/min</span></div>
                          <div className="text-xs text-gray-400">Suggested: 150 - 170</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Average Patience</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">1.4 <span className="text-xs">Seconds</span></div>
                          <div className="text-xs text-gray-400">Suggested: 1 - 1.8</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Talk Ratio</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">60%</div>
                          <div className="text-xs text-gray-400">Suggested: 50% - 70%</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Language Positivity</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">78%</div>
                          <div className="text-xs text-green-500 mb-1">Positive</div>
                          <div className="text-xs text-gray-400">Suggested: 50% - 100%</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Voice Emotion</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">92%</div>
                          <div className="text-xs text-green-500 mb-1">Happy</div>
                          <div className="text-xs text-gray-400">Suggested: 15% - 100%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Screen Sharing - Expandable */}
                <div className="border-t pt-4 relative">
                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-black rounded flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-2 border border-white rounded-sm"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Screen Sharing</span>
                    </div>
                    <button className="text-gray-400 flex-shrink-0" onClick={() => toggleSection('screen')}>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                        expandedSections.screen ? 'rotate-0' : 'rotate-[-90deg]'
                      }`} />
                    </button>
                  </div>
                  
                  {/* Speaking Pattern for Screen Sharing - Always visible */}
                  <div className="mt-2 relative">
                    <div className="flex items-center space-x-1 h-6">
                      {screenSpeakingPattern.map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gray-300 rounded-full"
                          style={{ height: `${height}px` }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Expandable Content */}
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    expandedSections.screen 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}>
                    <div className="pt-2">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Screen Time</div>
                          <div className="text-lg font-semibold text-blue-500 mb-1">8:30</div>
                          <div className="text-xs text-gray-400">Total Duration</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Engagement</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">95%</div>
                          <div className="text-xs text-gray-400">Audience Focus</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Clarity</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">High</div>
                          <div className="text-xs text-gray-400">Visual Quality</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Interaction</div>
                          <div className="text-lg font-semibold text-blue-500 mb-1">12</div>
                          <div className="text-xs text-gray-400">Click Events</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Content Type</div>
                          <div className="text-lg font-semibold text-purple-500 mb-1">Slides</div>
                          <div className="text-xs text-purple-500 mb-1">Presentation</div>
                          <div className="text-xs text-gray-400">Primary Format</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Effectiveness</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">88%</div>
                          <div className="text-xs text-green-500 mb-1">Excellent</div>
                          <div className="text-xs text-gray-400">Overall Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs and Content on the right */}
            <div className="w-1/2 pl-4">
              <MeetingDashboard meeting={mockMeetingData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 