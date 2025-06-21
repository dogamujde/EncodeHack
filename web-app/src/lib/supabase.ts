import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oeynqaeyimqytnhuxhxl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9leW5xYWV5aW1xeXRuaHV4aHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTc0MTYsImV4cCI6MjA2NjA3MzQxNn0.qxSA7m0pwS-5-XuVnLvhUzmRv6_0GKTUfq36_rWrNP8'

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

// Auth helper functions
export const auth = {
  // Sign up new user
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // Sign in existing user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out user
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

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