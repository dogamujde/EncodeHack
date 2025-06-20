import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Database Types
export interface Meeting {
  id: string
  title: string
  participants: {
    id: string
    name: string
    role: 'interviewer' | 'candidate' | 'participant'
    avatar?: string
  }[]
  date: string
  duration_seconds: number | null
  status: 'uploading' | 'processing' | 'completed' | 'error'
  created_at: string
}

export interface Transcript {
  id: string
  meeting_id: string
  raw_transcript: Record<string, unknown>
  speaker_segments: SpeakerSegment[]
  confidence_score: number
  processed_at: string
}

export interface SpeakerSegment {
  speaker_id: string
  speaker_label: string
  text: string
  start_time: number
  end_time: number
  word_count: number
  confidence: number
}

export interface SentimentMoment {
  id: string
  transcript_id: string
  speaker_id: string
  topic: string
  snippet: string
  moment_type: 'positive' | 'negative'
  start_time: number
  end_time: number
  confidence_percentage: number
  sentiment_change_percentage: number
}

export interface CoachingMetrics {
  id: string
  transcript_id: string
  speaker_id: string
  question_ratio: number
  talking_speed: number // words per minute
  average_patience: number // seconds
  talk_ratio: number
  language_positivity: number
  voice_emotion: string
  calculated_at: string
}

// Database helper functions
export async function createMeeting(meeting: Omit<Meeting, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('meetings')
    .insert(meeting)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMeeting(id: string) {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getMeetingWithTranscript(id: string) {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      transcripts (
        *,
        sentiment_moments (*),
        coaching_metrics (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
} 