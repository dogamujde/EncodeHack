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
    }>
  }
}

export function MeetingDashboard({ meeting }: MeetingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'moments'>('overview')
  const [viewMode, setViewMode] = useState<'brief' | 'detailed'>('brief')

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
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'brief' ? "default" : "ghost"}
                onClick={() => setViewMode('brief')}
                className={`px-4 py-2 rounded-full text-sm ${
                  viewMode === 'brief' 
                    ? "bg-black text-white" 
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Brief
              </Button>
              <Button
                variant={viewMode === 'detailed' ? "default" : "ghost"}
                onClick={() => setViewMode('detailed')}
                className={`px-4 py-2 rounded-full text-sm ${
                  viewMode === 'detailed' 
                    ? "bg-orange-500 text-white" 
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Detailed
              </Button>
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Ekip Genişletme ve İş Modeli Geliştirme</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">06:03-17:09</Badge>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-white text-xs">B</span>
                      </div>
                      <span className="text-xs text-gray-500">DM</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Burak, Deniz&apos;e ekip genişletme ve iş modeli geliştirme konularında tavsiyelerde bulunuyor. Hızlı büyümenin 
                  risklerine dikkat çekerek, önce küçük adımlarla başlamanın önemini vurguluyor. İşe alım sürecinde yasal 
                  konulara dikkat edilmesi gerektiğini ve doğru insan profilini bulmanın önemini anlatıyor. Burak, Deniz&apos;e &apos;A takımı&apos; 
                  olarak nitelendirdiği yetenekli ve çok yönlü kişileri işe almanın önemini vurguluyor. Ayrıca, mevcut iş modelinin 
                  ötesinde düşünmeyi ve farklı gelir kaynakları yaratmayı öneriyor. Deniz, ekip kurma konusundaki zorlukların ve 
                  geçmiş deneyimlerini paylaşıyor.
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Küçük bir ekiple başlayarak kademeli büyüme planı oluşturmak (Deniz Müjde (Student))</li>
                  <li>• İşe alım sürecinde yasal konuları araştırmak ve uygulamak (Deniz Müjde (Student))</li>
                  <li>• Çok yönlü ve yetenekli &apos;A takımı&apos; üyeleri için işe alım stratejisi geliştirmek (Deniz Müjde (Student))</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Gelecek Planları ve Tavsiyeler</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">17:09-28:59</Badge>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-white text-xs">B</span>
                      </div>
                      <span className="text-xs text-gray-500">DM</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Burak, Deniz&apos;e gelecek planları için tavsiyelerde bulunuyor. Mevcut iş modelini geliştirirken yeni fırsatlara da 
                  açık olmanın önemini vurguluyor. Ekip genişletme konusunda acele etmemelerini, önce 2-3 kişilik bir çekirdek 
                  ekip oluşturmalarını öneriyor. Burak, Deniz&apos;e spesifik sorular olursa kendisine ulaşabileceğini belirtiyor ve 
                  destek olmaya hazır olduğunu ifade ediyor. Deniz, Burak&apos;ın tavsiyelerini dinliyor ve teşekkür ediyor. Görüşme, 
                  karşılıklı iyi dileklerle sona eriyor.
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• 2-3 kişilik çekirdek ekip oluşturmak için plan yapmak (Deniz Müjde (Student))</li>
                  <li>• Mevcut iş modelini geliştirirken yeni fırsatları değerlendirmek (Deniz Müjde (Student))</li>
                  <li>• Spesifik sorular için Burak ile iletişimde kalmak (Deniz Müjde (Student))</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            {meeting.transcript.map((item) => {
              const participant = meeting.participants.find(p => p.name.includes(item.speaker))
              return (
                <div key={item.id} className="flex space-x-3">
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
                  <div key={moment.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {moment.speaker[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{moment.speaker}</span>
                        <span className="text-xs text-gray-500">{moment.timestamp}</span>
                        <Badge 
                          variant={moment.sentiment === 'positive' ? 'default' : moment.sentiment === 'negative' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {moment.sentiment}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{moment.text}</p>
                    </div>
                    <div className="w-16">
                      <div className={`h-2 rounded-full ${
                        moment.sentiment === 'positive' ? 'bg-green-500' : 
                        moment.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-300'
                      }`} style={{ width: `${moment.confidence * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Visualization */}
            <div>
              <h3 className="font-semibold mb-4">Sentiment Timeline</h3>
              <div className="h-32 bg-gray-50 rounded-lg p-4 flex items-end space-x-1">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${
                      Math.random() > 0.5 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ height: `${Math.random() * 80 + 20}%` }}
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