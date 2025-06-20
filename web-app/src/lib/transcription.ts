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
  // Demo mode - if no API key is provided, simulate the upload
  if (!apiKey) {
    console.log('🚀 Running in DEMO mode - no AssemblyAI API key provided');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    return `demo://mock-upload-url-${Date.now()}`;
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
  // Demo mode - if no API key is provided, simulate the transcription
  if (!apiKey) {
    console.log('🚀 Creating DEMO transcription request');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return `demo_transcript_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  // Demo mode - if no API key is provided, simulate the status check
  if (!apiKey || transcriptId.startsWith('demo_transcript_')) {
    console.log('🚀 Checking DEMO transcription status');
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    
    // Generate mock transcription result
    const mockResult: TranscriptionResult = {
      id: transcriptId,
      status: "completed",
      text: "Hello, welcome to this interview. Thank you for taking the time to speak with us today. Could you start by telling us a little bit about yourself and your background? That's a great question. I have been working in software development for about five years now. I started my career as a junior developer at a startup where I learned the fundamentals of web development. Over the years, I've worked on various projects involving React, Node.js, and database design. I'm particularly passionate about creating user-friendly applications and solving complex problems through code. That sounds excellent. What motivated you to apply for this particular role? Well, I've been following your company for a while now, and I'm really impressed by your innovative approach to technology. The job description mentions working on scalable applications, which is exactly the kind of challenge I'm looking for in my next role. I believe my experience with microservices and cloud technologies would be a great fit for your team.",
      confidence: 0.92,
      audio_duration: 180.5,
      words: [
        { text: "Hello,", start: 0.5, end: 1.0, confidence: 0.95, speaker: "A" },
        { text: "welcome", start: 1.1, end: 1.6, confidence: 0.93, speaker: "A" },
        { text: "to", start: 1.7, end: 1.9, confidence: 0.98, speaker: "A" },
        { text: "this", start: 2.0, end: 2.3, confidence: 0.96, speaker: "A" },
        { text: "interview.", start: 2.4, end: 3.2, confidence: 0.94, speaker: "A" },
        { text: "Thank", start: 3.5, end: 3.9, confidence: 0.97, speaker: "A" },
        { text: "you", start: 4.0, end: 4.2, confidence: 0.99, speaker: "A" },
        { text: "for", start: 4.3, end: 4.5, confidence: 0.98, speaker: "A" },
        { text: "taking", start: 4.6, end: 5.0, confidence: 0.95, speaker: "A" },
        { text: "the", start: 5.1, end: 5.3, confidence: 0.97, speaker: "A" },
        { text: "time", start: 5.4, end: 5.7, confidence: 0.96, speaker: "A" },
        { text: "to", start: 5.8, end: 6.0, confidence: 0.98, speaker: "A" },
        { text: "speak", start: 6.1, end: 6.5, confidence: 0.94, speaker: "A" },
        { text: "with", start: 6.6, end: 6.9, confidence: 0.96, speaker: "A" },
        { text: "us", start: 7.0, end: 7.2, confidence: 0.97, speaker: "A" },
        { text: "today.", start: 7.3, end: 7.8, confidence: 0.95, speaker: "A" },
        // Candidate response
        { text: "That's", start: 30.0, end: 30.4, confidence: 0.93, speaker: "B" },
        { text: "a", start: 30.5, end: 30.6, confidence: 0.99, speaker: "B" },
        { text: "great", start: 30.7, end: 31.1, confidence: 0.96, speaker: "B" },
        { text: "question.", start: 31.2, end: 31.8, confidence: 0.94, speaker: "B" },
        { text: "I", start: 32.0, end: 32.1, confidence: 0.98, speaker: "B" },
        { text: "have", start: 32.2, end: 32.5, confidence: 0.97, speaker: "B" },
        { text: "been", start: 32.6, end: 32.9, confidence: 0.96, speaker: "B" },
        { text: "working", start: 33.0, end: 33.5, confidence: 0.95, speaker: "B" },
        { text: "in", start: 33.6, end: 33.8, confidence: 0.98, speaker: "B" },
        { text: "software", start: 33.9, end: 34.5, confidence: 0.94, speaker: "B" },
        { text: "development", start: 34.6, end: 35.4, confidence: 0.93, speaker: "B" },
        { text: "for", start: 35.5, end: 35.7, confidence: 0.97, speaker: "B" },
        { text: "about", start: 35.8, end: 36.2, confidence: 0.96, speaker: "B" },
        { text: "five", start: 36.3, end: 36.6, confidence: 0.95, speaker: "B" },
        { text: "years", start: 36.7, end: 37.1, confidence: 0.94, speaker: "B" },
        { text: "now.", start: 37.2, end: 37.5, confidence: 0.96, speaker: "B" }
      ],
      auto_highlights_result: {
        results: [
          { text: "software development", rank: 0.95, count: 3, timestamps: [{ start: 33.9, end: 35.4 }] },
          { text: "web development", rank: 0.88, count: 2, timestamps: [{ start: 65.2, end: 66.8 }] },
          { text: "React and Node.js", rank: 0.82, count: 1, timestamps: [{ start: 85.3, end: 87.1 }] },
          { text: "user-friendly applications", rank: 0.79, count: 1, timestamps: [{ start: 110.5, end: 112.8 }] },
          { text: "scalable applications", rank: 0.76, count: 1, timestamps: [{ start: 150.2, end: 152.0 }] }
        ]
      },
      sentiment_analysis_results: [
        { text: "Thank you for taking the time", start: 3.5, end: 7.0, sentiment: "POSITIVE", confidence: 0.89 },
        { text: "That's a great question", start: 30.0, end: 31.8, sentiment: "POSITIVE", confidence: 0.92 },
        { text: "I'm really impressed", start: 140.0, end: 142.0, sentiment: "POSITIVE", confidence: 0.88 },
        { text: "exactly the kind of challenge I'm looking for", start: 155.0, end: 158.5, sentiment: "POSITIVE", confidence: 0.91 }
      ],
      entities: [
        { text: "React", entity_type: "technology", start: 85.3, end: 85.8 },
        { text: "Node.js", entity_type: "technology", start: 86.2, end: 87.1 },
        { text: "five years", entity_type: "duration", start: 36.3, end: 37.1 }
      ]
    };
    
    return mockResult;
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