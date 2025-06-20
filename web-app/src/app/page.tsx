import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Video, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Meeting Analysis Platform
          </h1>
          <p className="text-xl text-gray-600">
            Advanced AI-powered meeting insights and coaching analytics
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Video className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Real-time Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                AI-powered speaker identification and sentiment analysis during meetings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Detailed coaching metrics including talking speed, question ratios, and emotional analysis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Team Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Comprehensive participant analysis with personalized coaching recommendations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Try the Demo</CardTitle>
            <p className="text-gray-600">
              Experience our meeting analysis platform with a sample interview session
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Sample Meeting: Startup Interview
                </h3>
                <p className="text-blue-800 text-sm mb-3">
                  An in-depth interview discussion between Burak Aksar and Deniz Müjde about startup development, 
                  featuring advanced sentiment analysis and coaching insights.
                </p>
                <div className="flex items-center gap-4 text-sm text-blue-700">
                  <span>• 30 min duration</span>
                  <span>• 2 participants</span>
                  <span>• Full analysis available</span>
                </div>
              </div>
              
              <Link href="/meeting/sample-meeting">
                <Button size="lg" className="w-full">
                  View Sample Meeting Analysis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Analysis Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Real-time speaker identification</li>
              <li>• Sentiment moment detection</li>
              <li>• Interactive timeline visualization</li>
              <li>• Automatic topic extraction</li>
              <li>• Full transcript with timestamps</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coaching Metrics</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Question ratio analysis</li>
              <li>• Talking speed measurement</li>
              <li>• Average patience calculation</li>
              <li>• Language positivity scoring</li>
              <li>• Voice emotion detection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
