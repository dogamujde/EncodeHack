"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

interface MeetingDashboardProps {
  meeting: {
    id: string
    title: string
    date: string
    participants: Array<{
      id: string
      name: string
      role: string
      avatar: string
    }>
    transcript: Array<{
      id: string
      speaker: string
      text: string
      timestamp: string
      confidence: number
    }>
    sentimentMoments: Array<{
      id: string
      timestamp: string
      speaker: string
      sentiment: 'positive' | 'negative' | 'neutral'
      confidence: number
      text: string
      coachingDetails?: string[]
    }>
  },
  onSeek: (timeInSeconds: number) => void;
}

export function MeetingDashboard({ meeting, onSeek }: MeetingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'moments'>('moments')
  const [viewMode, setViewMode] = useState<'brief' | 'detailed'>('brief')
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);

  const timeStringToSeconds = (timeString: string) => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  return (
    <div className="h-full">
      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <Button
          variant={activeTab === 'overview' ? "default" : "ghost"}
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2 rounded-full ${
            activeTab === 'overview' 
              ? "bg-orange-500 text-white hover:bg-orange-600" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'transcript' ? "default" : "ghost"}
          onClick={() => setActiveTab('transcript')}
          className={`px-6 py-2 rounded-full ${
            activeTab === 'transcript' 
              ? "bg-orange-500 text-white hover:bg-orange-600" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Transcript
        </Button>
        <Button
          variant={activeTab === 'moments' ? "default" : "ghost"}
          onClick={() => setActiveTab('moments')}
          className={`px-6 py-2 rounded-full ${
            activeTab === 'moments' 
              ? "bg-orange-500 text-white hover:bg-orange-600" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Moments
        </Button>
      </div>

      {/* Content Area */}
      <div className="h-[calc(100%-80px)] overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Brief/Detailed Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'brief' ? "default" : "ghost"}
                  onClick={() => setViewMode('brief')}
                  className={`px-4 py-1 text-sm rounded-md font-semibold transition-colors ${
                    viewMode === 'brief' 
                      ? "bg-orange-400 text-white" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Brief
                </Button>
                <Button
                  variant={viewMode === 'detailed' ? "default" : "ghost"}
                  onClick={() => setViewMode('detailed')}
                  className={`px-4 py-1 text-sm rounded-md font-semibold transition-colors ${
                    viewMode === 'detailed' 
                      ? "bg-orange-400 text-white" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Detailed
                </Button>
              </div>
              <Button variant="ghost" size="icon">
                <i className="far fa-copy"></i>
              </Button>
            </div>

            {/* Content Sections */}
            <div className="space-y-6 text-gray-800">
              {viewMode === 'brief' && (
                <div>
                  <p className="text-sm leading-relaxed">
                    In this meeting, a student entrepreneur named Deniz Müjde talks with Burak Aksar about her startup. Deniz explains that they are working on a startup that offers accommodation solutions for university students. She clarifies that they initially started with the idea of matching roommates but later switched to a model of renting empty hotel rooms to students. She states that this model has been successful and they plan to expand it to other universities in the future. Burak advises Deniz on team expansion, business model development, and future plans. He particularly highlights the risks of rapid growth, emphasizing the importance of progressing with small steps and finding the right human resources. Critical next steps include forming a core team of 2-3 people, being open to new opportunities while developing the current business model, and paying attention to legal issues in the hiring process. Burak offers his support, stating that Deniz can reach out to him for specific questions.
                  </p>
                </div>
              )}
              {viewMode === 'detailed' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Team Expansion and Business Model Development</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">03:00-10:00</Badge>
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <span className="text-white text-xs">B</span>
                          </div>
                          <span className="text-xs text-gray-500">DM</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Burak advises Deniz on team expansion and business model development. He highlights the risks of rapid growth, emphasizing the importance of starting with small steps. He explains the need to pay attention to legal issues during the hiring process and the importance of finding the right employee profile. Burak stresses the importance of hiring talented and versatile individuals he refers to as the &apos;A-team&apos;. He also suggests thinking beyond the current business model and creating different revenue streams. Deniz shares the challenges of building a team and her past experiences.
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Create a gradual growth plan starting with a small team (Deniz Müjde (Student))</li>
                      <li>• Research and implement legal aspects in the hiring process (Deniz Müjde (Student))</li>
                      <li>• Develop a hiring strategy for versatile and talented &apos;A-team&apos; members (Deniz Müjde (Student))</li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Future Plans and Recommendations</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">10:00-20:30</Badge>
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <span className="text-white text-xs">B</span>
                          </div>
                          <span className="text-xs text-gray-500">DM</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Burak gives Deniz advice for future plans. He emphasizes the importance of being open to new opportunities while developing the current business model. He advises them not to rush team expansion, suggesting they first form a core team of 2-3 people. Burak tells Deniz that she can reach out to him if she has specific questions and expresses his readiness to provide support. Deniz listens to Burak&apos;s advice and thanks him. The meeting ends with mutual good wishes.
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Make a plan to form a core team of 2-3 people (Deniz Müjde (Student))</li>
                      <li>• Evaluate new opportunities while developing the current business model (Deniz Müjde (Student))</li>
                      <li>• Stay in touch with Burak for specific questions (Deniz Müjde (Student))</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4 h-full overflow-y-auto pr-2">
            {meeting.transcript.map((item) => {
              const participant = meeting.participants.find(p => p.name.includes(item.speaker))
              const startTime = item.timestamp.split('-')[0];
              const startTimeInSeconds = timeStringToSeconds(startTime);

              return (
                <div 
                  key={item.id} 
                  className="flex space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                  onClick={() => onSeek(startTimeInSeconds)}
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {participant?.name.split(' ').map(n => n[0]).join('') || item.speaker[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{participant?.name || item.speaker}</span>
                      <span className="text-xs text-gray-500">{item.timestamp}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(item.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">{item.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'moments' && (
          <div className="space-y-6">
            {/* Sentiment Table */}
            <div>
              <h3 className="font-semibold mb-4">Sentiment Analysis</h3>
              <div className="space-y-2">
                {meeting.sentimentMoments.map((moment) => (
                  <div key={moment.id}>
                    <div 
                      className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedMomentId(selectedMomentId === moment.id ? null : moment.id)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        moment.sentiment === 'positive' ? 'bg-green-100' : 
                        moment.sentiment === 'negative' ? 'bg-red-100' : 'bg-gray-200'
                      }`}>
                        <span className={`text-xs font-semibold ${
                          moment.sentiment === 'positive' ? 'text-green-800' :
                          moment.sentiment === 'negative' ? 'text-red-800' : 'text-gray-700'
                        }`}>
                          {moment.speaker.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{moment.speaker}</span>
                          <span className="text-xs text-gray-500">{moment.timestamp}</span>
                          <Badge 
                            className={`capitalize text-white text-xs px-2 py-0.5 rounded-full ${
                              moment.sentiment === 'positive' ? 'bg-green-600' :
                              moment.sentiment === 'negative' ? 'bg-red-600' :
                              'bg-gray-600'
                            }`}
                          >
                            {moment.sentiment}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{moment.text}</p>
                      </div>
                      <div className="w-24 text-right">
                        <div className="h-2 rounded-full bg-gray-200">
                          <div className={`h-full rounded-full ${
                            moment.sentiment === 'positive' ? 'bg-green-500' : 
                            moment.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                          }`} style={{ width: `${moment.confidence * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    {selectedMomentId === moment.id && (
                      <div className="p-4 bg-gray-50 rounded-b-lg">
                        {moment.coachingDetails && moment.coachingDetails.length > 0 ? (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Coaching Details:</h4>
                            {moment.coachingDetails.map((detail, index) => (
                              <p key={index} className={`text-sm mt-1 ${
                                moment.sentiment === 'negative' ? 'text-red-700' :
                                moment.sentiment === 'positive' ? 'text-green-700' :
                                'text-gray-700'
                              }`}>
                                {detail}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No specific details available for this moment.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Visualization */}
            <div>
              <h3 className="font-semibold mb-4">Sentiment Timeline</h3>
              <div className="h-32 bg-gray-50 rounded-lg p-4 flex items-end space-x-1">
                {meeting.sentimentMoments.map((moment, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${
                      moment.sentiment === 'positive' ? 'bg-green-500' :
                      moment.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    style={{ height: `${moment.confidence * 80 + 20}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 