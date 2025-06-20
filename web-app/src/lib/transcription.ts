import axios from "axios";

const apiKey = process.env.ASSEMBLYAI_API_KEY;

export interface TranscriptionResult {
  id: string;
  status: string;
  audio_url?: string;
  text?: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker: string;
  }>;
  auto_highlights_result?: {
    results: Array<{
      text: string;
      rank: number;
      count: number;
      timestamps: Array<{ start: number; end: number }>;
    }>;
  };
  sentiment_analysis_results?: Array<{
    text: string;
    start: number;
    end: number;
    sentiment: string;
    confidence: number;
  }>;
  entities?: Array<{
    text: string;
    entity_type: string;
    start: number;
    end: number;
  }>;
  confidence?: number;
  audio_duration?: number;
}

export async function uploadAudioFile(audioBuffer: Buffer): Promise<string> {
  if (!apiKey) {
    throw new Error('AssemblyAI API key not configured. Please add ASSEMBLYAI_API_KEY to your environment variables.');
  }

  try {
    const uploadResponse = await axios.post("https://api.assemblyai.com/v2/upload", audioBuffer, {
      headers: { 
        authorization: apiKey,
        'content-type': 'application/octet-stream'
      }
    });
    return uploadResponse.data.upload_url;
  } catch (error: any) {
    console.error('Upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload audio file');
  }
}

export async function createTranscription(audioUrl: string, speakers: number = 2): Promise<string> {
  if (!apiKey) {
    throw new Error('AssemblyAI API key not configured. Please add ASSEMBLYAI_API_KEY to your environment variables.');
  }

  try {
    const transcriptResponse = await axios.post("https://api.assemblyai.com/v2/transcript", {
      audio_url: audioUrl,
      // Enhanced speaker detection settings
      speaker_labels: true,
      speakers_expected: speakers,
      language_code: "en",
      punctuate: true,
      format_text: true,
      
      // Additional enhancement options
      auto_highlights: true,
      sentiment_analysis: true,
      entity_detection: true,
      
      // Audio processing enhancements
      boost_param: "high",
      redact_pii: false,
      filter_profanity: false,
    }, {
      headers: { authorization: apiKey }
    });
    
    return transcriptResponse.data.id;
  } catch (error: any) {
    console.error('Transcription request error:', error.response?.data || error.message);
    throw new Error('Failed to create transcription');
  }
}

export async function getTranscriptionStatus(transcriptId: string): Promise<TranscriptionResult> {
  if (!apiKey) {
    throw new Error('AssemblyAI API key not configured. Please add ASSEMBLYAI_API_KEY to your environment variables.');
  }

  try {
    const statusResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { authorization: apiKey }
    });
    
    return statusResponse.data;
  } catch (error: any) {
    console.error('Status check error:', error.response?.data || error.message);
    throw new Error('Failed to get transcription status');
  }
}

export async function waitForTranscription(transcriptId: string, maxAttempts: number = 60): Promise<TranscriptionResult> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const result = await getTranscriptionStatus(transcriptId);
    
    if (result.status === "completed") {
      return result;
    } else if (result.status === "error") {
      throw new Error('Transcription failed');
    }
    
    // Wait 5 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }
  
  throw new Error('Transcription timed out');
}

export function analyzeTranscription(transcript: TranscriptionResult) {
  const words = transcript.words || [];
  
  if (words.length === 0) {
    return null;
  }

  // Group by speakers
  const speakerMap: Record<string, {
    words: typeof words;
    totalDuration: number;
    wordCount: number;
    segments: number;
  }> = {};

  let currentSpeaker = "";

  for (const word of words) {
    if (!speakerMap[word.speaker]) {
      speakerMap[word.speaker] = {
        words: [],
        totalDuration: 0,
        wordCount: 0,
        segments: 0
      };
    }

    speakerMap[word.speaker].words.push(word);
    speakerMap[word.speaker].wordCount++;
    
    if (word.speaker !== currentSpeaker) {
      speakerMap[word.speaker].segments++;
      currentSpeaker = word.speaker;
    }
  }

  // Calculate durations
  for (const [speaker, data] of Object.entries(speakerMap)) {
    if (data.words.length > 0) {
      const firstWord = data.words[0];
      const lastWord = data.words[data.words.length - 1];
      data.totalDuration = (lastWord.end - firstWord.start) * 1000; // Convert to milliseconds
    }
  }

  // Calculate speaker balance
  const speakers = Object.keys(speakerMap);
  const totalWords = words.length;
  let speakerBalance = 0;
  
  if (speakers.length === 2) {
    const [speakerA, speakerB] = speakers;
    const wordsA = speakerMap[speakerA].wordCount;
    const wordsB = speakerMap[speakerB].wordCount;
    speakerBalance = Math.min(wordsA, wordsB) / Math.max(wordsA, wordsB);
  }

  // Analyze sentiment
  const sentiments = transcript.sentiment_analysis_results || [];
  const positiveCount = sentiments.filter(s => s.sentiment === 'POSITIVE').length;
  const negativeCount = sentiments.filter(s => s.sentiment === 'NEGATIVE').length;
  const neutralCount = sentiments.filter(s => s.sentiment === 'NEUTRAL').length;
  
  let overallSentiment = 'neutral';
  if (positiveCount > negativeCount && positiveCount > neutralCount) {
    overallSentiment = 'positive';
  } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
    overallSentiment = 'negative';
  }

  // Extract key phrases
  const keyPhrases = transcript.auto_highlights_result?.results
    ?.slice(0, 5)
    .map(h => h.text) || [];

  return {
    speakers: speakerMap,
    speakerBalance,
    overallSentiment,
    keyPhrases,
    totalWords,
    duration: (transcript.audio_duration || 0) * 1000, // Convert to milliseconds
    confidence: transcript.confidence || 0,
    sentimentBreakdown: {
      positive: positiveCount,
      negative: negativeCount,
      neutral: neutralCount
    }
  };
} 