"use client"

import { useState, useRef } from 'react'
import { MeetingDashboard } from '@/components/meeting-dashboard'
import { Users, ChevronDown } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function MeetingPage({ params }: PageProps) {
  // Consume params to avoid ESLint error
  void params;
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSeek = (timeInSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      videoRef.current.play();
    }
  };

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
        text: "So, to give you a bit of background, we started with a simple idea: helping university students find compatible roommates.",
        timestamp: "00:03-00:15",
        confidence: 0.95
      },
      {
        id: "2", 
        speaker: "Burak Aksar",
        text: "That makes sense. It's a common problem. How did that evolve?",
        timestamp: "00:16-00:22", 
        confidence: 0.92
      },
      {
        id: "3",
        speaker: "Deniz Müjde", 
        text: "Well, we realized that the bigger opportunity was in utilizing empty hotel rooms. We pivoted to a model where we rent those out to students, which has been quite successful.",
        timestamp: "00:23-00:45",
        confidence: 0.88
      },
      {
        id: "4",
        speaker: "Burak Aksar",
        text: "Interesting pivot. And you're looking to expand on that?",
        timestamp: "00:46-00:52",
        confidence: 0.94
      },
      {
        id: "5",
        speaker: "Deniz Müjde",
        text: "Exactly. We're planning to scale to other universities. That's where I'd love your advice on team expansion and business development.",
        timestamp: "00:53-01:10",
        confidence: 0.96
      },
      {
        id: "6",
        speaker: "Burak Aksar",
        text: "Of course. Rapid growth has its risks. It's crucial to take small, deliberate steps and find the right people. Building a solid core team of 2-3 people is a great first step.",
        timestamp: "01:11-01:35",
        confidence: 0.91
      },
      {
        id: "7",
        speaker: "Deniz Müjde",
        text: "That's very helpful. Regarding the hotel partnerships, we've found that they are quite receptive, but the legal side of things can be tricky. Any advice on that?",
        timestamp: "01:36-02:05",
        confidence: 0.93
      },
      {
        id: "8",
        speaker: "Burak Aksar",
        text: "Absolutely. You need a standardized contract that is fair but protects your startup. Have you consulted with a lawyer who specializes in contract law for the hospitality industry?",
        timestamp: "02:06-02:25",
        confidence: 0.95
      },
      {
        id: "9",
        speaker: "Deniz Müjde",
        text: "Not yet, we've been using a template we found online. We know that's not a long-term solution.",
        timestamp: "02:26-02:40",
        confidence: 0.89
      },
      {
        id: "10",
        speaker: "Burak Aksar",
        text: "I strongly recommend getting professional legal advice. It's an upfront cost, but it will save you massive headaches down the line. I can connect you with someone if you'd like.",
        timestamp: "02:41-03:10",
        confidence: 0.96
      },
      {
        id: "11",
        speaker: "Deniz Müjde",
        text: "That would be amazing, thank you. Shifting gears a bit, let's talk about customer acquisition. Right now, it's mostly word-of-mouth.",
        timestamp: "03:11-03:35",
        confidence: 0.94
      },
      {
        id: "12",
        speaker: "Burak Aksar",
        text: "Word-of-mouth is great, it means you have a product people like. To scale, you'll need more structured channels. Have you considered targeted social media ads or partnerships with university clubs?",
        timestamp: "03:36-04:01",
        confidence: 0.92
      },
      {
        id: "13",
        speaker: "Deniz Müjde",
        text: "We've tried some social media, but it felt a bit like shouting into the void. The university club idea is interesting, though. More direct access.",
        timestamp: "04:02-04:28",
        confidence: 0.91
      },
       {
        id: "14",
        speaker: "Burak Aksar",
        text: "Exactly. You can offer them a referral bonus. It's a low-cost way to get targeted leads. What about your tech stack? Is it scalable?",
        timestamp: "04:29-05:00",
        confidence: 0.94
      },
      {
        id: "15",
        speaker: "Deniz Müjde",
        text: "We're using a pretty standard stack - React on the frontend, Node.js on the backend. It's hosted on Vercel. We think it can handle the load for the next year or so.",
        timestamp: "05:01-05:25",
        confidence: 0.96
      },
      {
        id: "16",
        speaker: "Burak Aksar",
        text: "That sounds solid. Just make sure your database is optimized. As you get more users, database queries can become a bottleneck.",
        timestamp: "05:26-05:45",
        confidence: 0.93
      },
      {
        id: "17",
        speaker: "Deniz Müjde",
        text: "Good point. We'll keep an eye on that. What about funding? We've been bootstrapping so far.",
        timestamp: "05:46-06:05",
        confidence: 0.95
      },
      {
        id: "18",
        speaker: "Burak Aksar",
        text: "Bootstrapping is impressive. It gives you a lot of control. Have you put together a pitch deck and financial projections? You should be ready for when the right opportunity comes along.",
        timestamp: "06:06-06:35",
        confidence: 0.92
      },
      {
        id: "19",
        speaker: "Deniz Müjde",
        text: "We have a rough draft of a pitch deck, but our financial projections are very basic. That's another area where we could use some guidance.",
        timestamp: "06:36-06:58",
        confidence: 0.90
      },
      {
        id: "20",
        speaker: "Burak Aksar",
        text: "Let's set up a separate session for that. I can walk you through how to build a solid financial model. For now, focus on refining the pitch deck. It should tell a compelling story.",
        timestamp: "06:59-07:30",
        confidence: 0.96
      },
      {
        id: "21",
        speaker: "Deniz Müjde",
        text: "Perfect. Thank you so much for all this advice, Burak. It's been incredibly valuable.",
        timestamp: "07:31-07:45",
        confidence: 0.97
      },
      {
        id: "22",
        speaker: "Burak Aksar",
        text: "You're very welcome, Deniz. You have a great foundation here. Just keep executing and learning. Don't be afraid to make mistakes.",
        timestamp: "07:46-08:10",
        confidence: 0.95
      },
      {
        id: "23",
        speaker: "Deniz Müjde",
        text: "I will. It's great to know we have your support.",
        timestamp: "08:11-08:25",
        confidence: 0.94
      },
      {
        id: "24",
        speaker: "Burak Aksar",
        text: "Always. Let's touch base again in a couple of weeks to check on your progress with the legal contracts and pitch deck.",
        timestamp: "08:26-08:50",
        confidence: 0.93
      },
      {
        id: "25",
        speaker: "Deniz Müjde",
        text: "Sounds like a plan. I'll schedule something.",
        timestamp: "08:51-09:10",
        confidence: 0.96
      },
      {
        id: "26",
        speaker: "Burak Aksar",
        text: "Great. Before we wrap up, any final questions?",
        timestamp: "09:11-09:30",
        confidence: 0.92
      },
      {
        id: "27",
        speaker: "Deniz Müjde",
        text: "Just one more thing - what's the one piece of advice you wish you had when you were starting out?",
        timestamp: "09:31-09:55",
        confidence: 0.94
      },
      {
        id: "28",
        speaker: "Burak Aksar",
        text: "That's a great question. I'd say focus on the customer. Obsess over their problems and their feedback. If you do that, everything else tends to fall into place.",
        timestamp: "09:56-10:30",
        confidence: 0.97
      },
      {
        id: "29",
        speaker: "Deniz Müjde",
        text: "Focus on the customer. I'll remember that. Thanks again, Burak.",
        timestamp: "10:31-10:50",
        confidence: 0.96
      },
      {
        id: "30",
        speaker: "Burak Aksar",
        text: "Anytime. Talk to you soon.",
        timestamp: "10:51-11:15",
        confidence: 0.95
      },
      {
        id: "31",
        speaker: "Deniz Müjde",
        text: "You too. Bye.",
        timestamp: "11:16-12:05",
        confidence: 0.93
      },
      {
        id: "32",
        speaker: "Burak Aksar",
        text: "Bye for now.",
        timestamp: "12:06-13:25",
        confidence: 0.95
      },
      {
        id: "33",
        speaker: "Deniz Müjde",
        text: "Ok, so, I'm back. I just had a thought about our branding.",
        timestamp: "13:26-14:40",
        confidence: 0.89
      },
      {
        id: "34",
        speaker: "Burak Aksar",
        text: "Oh? Go on.",
        timestamp: "14:41-15:10",
        confidence: 0.96
      },
      {
        id: "35",
        speaker: "Deniz Müjde",
        text: "I feel like our current name is a bit generic. It doesn't really capture the sense of community we want to build.",
        timestamp: "15:11-16:35",
        confidence: 0.94
      },
      {
        id: "36",
        speaker: "Burak Aksar",
        text: "That's a valid point. A strong brand is a huge asset. Have you brainstormed any alternatives?",
        timestamp: "16:36-17:01",
        confidence: 0.92
      },
      {
        id: "37",
        speaker: "Deniz Müjde",
        text: "A few ideas. Something like 'CampusCove' or 'UniNest'. Something that feels safe and student-focused.",
        timestamp: "17:02-18:28",
        confidence: 0.91
      },
      {
        id: "38",
        speaker: "Burak Aksar",
        text: "I like those. 'UniNest' has a nice ring to it. Before you commit, make sure to check if the domain and social handles are available.",
        timestamp: "18:29-19:00",
        confidence: 0.94
      },
      {
        id: "39",
        speaker: "Deniz Müjde",
        text: "Good call. I'll do that right after this. It feels like a big step.",
        timestamp: "19:01-19:25",
        confidence: 0.96
      },
      {
        id: "40",
        speaker: "Burak Aksar",
        text: "It is. But rebranding early on is much easier than doing it when you're bigger. It's a good time to think about it.",
        timestamp: "19:26-20:00",
        confidence: 0.93
      },
      {
        id: "41",
        speaker: "Deniz Müjde",
        text: "Thanks for the encouragement. It's good to have a sounding board for these things.",
        timestamp: "20:01-20:30",
        confidence: 0.95
      },
      {
        id: "42",
        speaker: "Burak Aksar",
        text: "That's what mentors are for. Keep me posted on the name game.",
        timestamp: "20:31-21:10",
        confidence: 0.96
      }
    ],
    sentimentMoments: [
      {
        id: "1",
        timestamp: "03:40",
        speaker: "Burak Aksar",
        sentiment: 'positive' as const,
        confidence: 0.92,
        text: "Positive reinforcement and constructive advice.",
        coachingDetails: ["Excellent engagement and encouragement. This builds confidence."]
      },
      {
        id: "2", 
        timestamp: "06:45",
        speaker: "Deniz Müjde",
        sentiment: 'negative' as const,
        confidence: 0.85,
        text: "Appears uncertain about financial projections.",
        coachingDetails: ["Deniz seems hesitant when discussing numbers.", "Suggestion: Practice presenting financial data to build confidence and use clearer visuals."]
      },
      {
        id: "3",
        timestamp: "17:15",
        speaker: "Deniz Müjde",
        sentiment: 'neutral' as const,
        confidence: 0.90,
        text: "Discussing potential new brand names.",
        coachingDetails: ["This is a good brainstorming session. Both parties are contributing ideas."]
      },
      {
        id: "4",
        timestamp: "19:40",
        speaker: "Burak Aksar",
        sentiment: 'negative' as const,
        confidence: 0.78,
        text: "Shows signs of confusion regarding the brand direction.",
        coachingDetails: ["Burak's facial expression and tone indicate confusion.", "Suggestion: Pause and ask clarifying questions to ensure everyone is on the same page."]
      }
    ]
  }



  // Static speaking pattern data to prevent layout shifts
  const denizSpeakingPattern = Array(200).fill(0).map((_, i) => {
    // 40% talk ratio (80 segments of 200)
    if ((i >= 20 && i < 50) || (i >= 70 && i < 100) || (i >= 120 && i < 140)) {
      return 1;
    }
    return 0;
  });

  const burakSpeakingPattern = denizSpeakingPattern.map((denizSpeaks) => denizSpeaks ? 0 : 1);

  const screenSpeakingPattern = Array(200).fill(1);

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
              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <video ref={videoRef} src="/placeholder.m4v" controls className="w-full h-full rounded-lg"></video>
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
                        Deniz Müjde (Student)
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
                    <div className="flex items-center h-3 bg-gray-200 rounded-sm">
                      {denizSpeakingPattern.map((isSpeaking, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-full rounded-sm ${isSpeaking ? 'bg-purple-500' : 'bg-transparent'}`}
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
                          <div className="text-lg font-semibold text-red-500 mb-1 flex items-center">3% <span className="text-xs ml-1">▲</span></div>
                          <div className="text-xs text-gray-400">Suggested: 10% - 30%</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Talking Speed</div>
                          <div className="text-lg font-semibold text-red-500 mb-1 flex items-center">212 <span className="text-xs">words/min</span><span className="text-xs ml-1">▼</span></div>
                          <div className="text-xs text-gray-400">Suggested: 150 - 170</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Average Patience</div>
                          <div className="text-lg font-semibold text-red-500 mb-1 flex items-center">0.62 <span className="text-xs">Seconds</span><span className="text-xs ml-1">▲</span></div>
                          <div className="text-xs text-gray-400">Suggested: 1 - 1.8</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Talk Ratio</div>
                          <div className="text-lg font-semibold text-orange-500 mb-1 flex items-center">40% <span className="text-xs ml-1">▲</span></div>
                          <div className="text-xs text-gray-400">Suggested: 50% - 70%</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Language Positivity</div>
                          <div className="text-lg font-semibold text-orange-500 mb-1 flex items-center">25% <span className="text-xs ml-1">Positive▲</span></div>
                          <div className="text-xs text-gray-400">Suggested: 50% - 100%</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-md">
                          <div className="text-xs text-gray-500 mb-1">Voice Emotion</div>
                          <div className="text-lg font-semibold text-green-500 mb-1">84% Happy</div>
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
                    <div className="flex items-center h-3 bg-gray-200 rounded-sm">
                      {burakSpeakingPattern.map((isSpeaking, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-full rounded-sm ${isSpeaking ? 'bg-purple-500' : 'bg-transparent'}`}
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
                    <div className="flex items-center h-3 bg-gray-200 rounded-sm">
                      {screenSpeakingPattern.map((isSpeaking, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-full rounded-sm ${isSpeaking ? 'bg-gray-400' : 'bg-transparent'}`}
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
              <MeetingDashboard meeting={mockMeetingData} onSeek={handleSeek} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 