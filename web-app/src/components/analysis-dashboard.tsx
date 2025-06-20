'use client';

import { formatDuration, formatPercentage } from '@/lib/utils';

interface AnalysisDashboardProps {
  data: {
    analysis: {
      speakers: Record<string, {
        words: any[];
        totalDuration: number;
        wordCount: number;
        segments: number;
      }>;
      speakerBalance: number;
      overallSentiment: string;
      keyPhrases: string[];
      totalWords: number;
      duration: number;
      confidence: number;
      sentimentBreakdown: {
        positive: number;
        negative: number;
        neutral: number;
      };
    };
    ai_visual_url?: string;
  };
}

export function AnalysisDashboard({ data }: AnalysisDashboardProps) {
  const { analysis, ai_visual_url } = data;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      default: return '😐';
    }
  };

  const speakers = Object.entries(analysis.speakers);
  const totalSentiments = analysis.sentimentBreakdown.positive + 
                         analysis.sentimentBreakdown.negative + 
                         analysis.sentimentBreakdown.neutral;

  return (
    <div className="space-y-8">
      {/* AI Visual */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          🎨 AI-Generated Summary
        </h3>
        <div className="flex justify-center">
          {ai_visual_url ? (
            <img 
              src={ai_visual_url} 
              alt="AI-generated interview analysis visual"
              className="max-w-full h-auto rounded-lg shadow-md"
            />
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 text-center max-w-md">
              <div className="text-6xl mb-4">🎨</div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">AI Visual Summary</h4>
              <p className="text-gray-600 text-sm">
                A visual representation of the interview analysis showcasing key themes, 
                sentiment patterns, and speaking dynamics.
              </p>
              <div className="mt-4 text-xs text-gray-500">
                Visual generation in progress...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(Math.round(analysis.duration / 1000))}
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Words</p>
              <p className="text-2xl font-bold text-gray-900">
                {analysis.totalWords.toLocaleString()}
              </p>
            </div>
            <div className="text-3xl">💬</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(analysis.confidence)}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Sentiment</p>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(analysis.overallSentiment)}`}>
                {getSentimentEmoji(analysis.overallSentiment)} {analysis.overallSentiment}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Speaker Analysis */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          👥 Speaker Analysis
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Speaker Stats */}
          <div className="space-y-4">
            {speakers.map(([speakerId, speakerData], index) => {
              const wpm = speakerData.wordCount / (speakerData.totalDuration / 60000);
              const percentage = speakerData.wordCount / analysis.totalWords;
              
              return (
                <div key={speakerId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      {index === 0 ? '👨‍💼 Interviewer' : '👩‍💻 Candidate'} (Speaker {speakerId})
                    </h4>
                    <span className="text-sm text-gray-500">
                      {formatPercentage(percentage)} of conversation
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Words</p>
                      <p className="font-semibold">{speakerData.wordCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-semibold">
                        {formatDuration(Math.round(speakerData.totalDuration / 1000))}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Speaking Rate</p>
                      <p className="font-semibold">{Math.round(wpm)} WPM</p>
                    </div>
                  </div>
                  
                  {/* Speaking time visualization */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-green-500'}`}
                        style={{ width: `${percentage * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Speaker Balance Chart */}
          <div className="flex flex-col items-center justify-center">
            <h4 className="font-semibold text-gray-900 mb-4">Conversation Balance</h4>
            <div className="relative w-48 h-48">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${analysis.speakerBalance * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPercentage(analysis.speakerBalance)}
                  </div>
                  <div className="text-sm text-gray-600">Balanced</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mt-2">
              {analysis.speakerBalance > 0.8 ? 'Well balanced conversation' :
               analysis.speakerBalance > 0.6 ? 'Moderately balanced' :
               'Could be more balanced'}
            </p>
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            😊 Sentiment Breakdown
          </h3>
          
          <div className="space-y-4">
            {[
              { label: 'Positive', count: analysis.sentimentBreakdown.positive, color: 'bg-green-500', emoji: '😊' },
              { label: 'Neutral', count: analysis.sentimentBreakdown.neutral, color: 'bg-gray-500', emoji: '😐' },
              { label: 'Negative', count: analysis.sentimentBreakdown.negative, color: 'bg-red-500', emoji: '😟' }
            ].map((sentiment) => {
              const percentage = totalSentiments > 0 ? sentiment.count / totalSentiments : 0;
              return (
                <div key={sentiment.label} className="flex items-center space-x-3">
                  <span className="text-xl">{sentiment.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{sentiment.label}</span>
                      <span>{sentiment.count} segments ({formatPercentage(percentage)})</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${sentiment.color}`}
                        style={{ width: `${percentage * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            🔍 Key Topics
          </h3>
          
          <div className="space-y-2">
            {analysis.keyPhrases.length > 0 ? (
              analysis.keyPhrases.map((phrase, index) => (
                <div
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2 mb-2"
                >
                  {phrase}
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No key phrases detected</p>
            )}
          </div>
          
          {analysis.keyPhrases.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 These topics were mentioned most frequently throughout the interview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interview Insights */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          🔮 Interview Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">✅ Strengths</h4>
              <ul className="text-sm text-green-700 space-y-1">
                {analysis.confidence > 0.9 && <li>• High transcription confidence indicates clear speech</li>}
                {analysis.speakerBalance > 0.7 && <li>• Well-balanced conversation engagement</li>}
                {analysis.overallSentiment === 'positive' && <li>• Overall positive tone throughout interview</li>}
                {speakers.some(([_, data]) => data.wordCount / (data.totalDuration / 60000) > 120) && 
                  <li>• Good speaking pace and articulation</li>}
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">💡 Opportunities</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {analysis.speakerBalance < 0.5 && <li>• Consider more balanced conversation participation</li>}
                {analysis.overallSentiment === 'negative' && <li>• Work on maintaining positive tone</li>}
                {speakers.some(([_, data]) => data.wordCount / (data.totalDuration / 60000) < 80) && 
                  <li>• Could benefit from slightly faster speaking pace</li>}
                {analysis.keyPhrases.length < 3 && <li>• Consider discussing more diverse topics</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 