'use client'

interface CoachingDashboardProps {
  participant: {
    name: string
    avatar: string
  }
  metrics: {
    questionRatio: { value: number; suggested: string }
    talkingSpeed: { value: number; unit: string; suggested: string }
    averagePatience: { value: number; unit: string; suggested: string }
    talkRatio: { value: number; suggested: string }
    languagePositivity: { value: number; label: string; suggested: string }
    voiceEmotion: { value: number; label: string; suggested: string }
  }
  speakingPattern: number[]
  showTitle?: boolean
}

interface MetricCardProps {
  title: string
  value: string
  unit?: string
  label?: string
  suggested: string
  color: 'orange' | 'green'
}

function MetricCard({ title, value, unit, label, suggested, color }: MetricCardProps) {
  const colorClasses = {
    orange: 'text-orange-500',
    green: 'text-green-500'
  }

  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200">
      <div className="text-xs text-gray-500 mb-1 leading-tight">{title}</div>
      <div className={`text-lg font-semibold ${colorClasses[color]} mb-1`}>
        {value}
        {unit && <span className="text-xs ml-1">{unit}</span>}
      </div>
      {label && (
        <div className={`text-xs ${colorClasses[color]} mb-1`}>
          {label}
        </div>
      )}
      <div className="text-xs text-gray-400">
        Suggested: {suggested}
      </div>
    </div>
  )
}

export function CoachingDashboard({ 
  participant, 
  metrics, 
  speakingPattern,
  showTitle = true 
}: CoachingDashboardProps) {
  return (
    <div className="space-y-6">
      {showTitle && (
        <h2 className="text-lg font-semibold text-gray-900">Coaching</h2>
      )}
      
      {/* Participant Info */}
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
          <span className="text-white text-xs font-semibold">
            {participant.avatar}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {participant.name}
        </span>
      </div>

      {/* Speaking Pattern Visualization */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1">
          {speakingPattern.map((intensity, index) => (
            <div
              key={index}
              className="w-1 bg-purple-500 rounded-full"
              style={{ height: `${8 + intensity * 12}px` }}
            />
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            title="Question Ratio"
            value={`${metrics.questionRatio.value}%`}
            suggested={metrics.questionRatio.suggested}
            color="orange"
          />
          <MetricCard
            title="Talking Speed"
            value={`${metrics.talkingSpeed.value}`}
            unit={metrics.talkingSpeed.unit}
            suggested={metrics.talkingSpeed.suggested}
            color="orange"
          />
          <MetricCard
            title="Average Patience"
            value={`${metrics.averagePatience.value}`}
            unit={metrics.averagePatience.unit}
            suggested={metrics.averagePatience.suggested}
            color="orange"
          />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            title="Talk Ratio"
            value={`${metrics.talkRatio.value}%`}
            suggested={metrics.talkRatio.suggested}
            color="orange"
          />
          <MetricCard
            title="Language Positivity"
            value={`${metrics.languagePositivity.value}%`}
            label={metrics.languagePositivity.label}
            suggested={metrics.languagePositivity.suggested}
            color="orange"
          />
          <MetricCard
            title="Voice Emotion"
            value={`${metrics.voiceEmotion.value}%`}
            label={metrics.voiceEmotion.label}
            suggested={metrics.voiceEmotion.suggested}
            color="green"
          />
        </div>
      </div>
    </div>
  )
} 