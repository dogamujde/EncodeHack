import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database types
export interface Interview {
  id: string;
  created_at: string;
  file_name: string;
  file_size: number;
  duration_seconds?: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  user_id: string;
}

export interface Transcript {
  id: string;
  interview_id: string;
  raw_transcript: any;
  processed_at: string;
  confidence_score: number;
  word_count: number;
  speaker_count: number;
}

export interface SpeakerAnalysis {
  id: string;
  transcript_id: string;
  speaker_id: string;
  word_count: number;
  speaking_duration: number;
  words_per_minute: number;
  sentiment_scores: any;
  key_phrases: any;
}

export interface AnalysisReport {
  id: string;
  transcript_id: string;
  report_type: string;
  report_data: any;
  ai_visual_url?: string;
  generated_at: string;
} 