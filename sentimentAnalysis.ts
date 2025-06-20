import fs from "fs";
import path from "path";

interface Word {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: string;
}

interface Utterance {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: string;
  words: Word[];
}

interface SentimentResult {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number;
  timestamp?: number;
}

interface SentimentSegment {
  text: string;
  speaker: string;
  startTime: number;
  endTime: number;
  duration: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number;
  emotionalWords: string[];
  intensity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface SentimentTrend {
  timePoint: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number;
  cumulativeScore: number;
}

interface SpeakerSentiment {
  speaker: string;
  totalUtterances: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  averageConfidence: number;
  overallTone: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  emotionalRange: number;
  mostPositiveSegment?: SentimentSegment;
  mostNegativeSegment?: SentimentSegment;
}

interface SentimentAnalysis {
  totalDuration: number;
  segments: SentimentSegment[];
  trends: SentimentTrend[];
  speakerSentiments: Record<string, SpeakerSentiment>;
  conversationFlow: {
    overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    sentimentShifts: number;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
    emotionalVolatility: number;
    mostPositiveMoment: SentimentSegment | null;
    mostNegativeMoment: SentimentSegment | null;
  };
  insights: string[];
}

// Simple sentiment analysis using keyword-based approach
function analyzeSentiment(text: string): SentimentResult {
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'perfect',
    'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'excited', 'thrilled',
    'success', 'successful', 'achievement', 'accomplish', 'win', 'victory', 'triumph',
    'beautiful', 'brilliant', 'outstanding', 'remarkable', 'impressive', 'superb',
    'positive', 'optimistic', 'confident', 'proud', 'grateful', 'thankful', 'appreciate',
    'yes', 'absolutely', 'definitely', 'certainly', 'sure', 'agree', 'right', 'correct'
  ];

  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike', 'disgusting',
    'sad', 'angry', 'frustrated', 'annoyed', 'disappointed', 'upset', 'worried', 'anxious',
    'fail', 'failure', 'mistake', 'error', 'wrong', 'problem', 'issue', 'trouble',
    'difficult', 'hard', 'challenging', 'struggle', 'stress', 'pressure', 'burden',
    'negative', 'pessimistic', 'doubt', 'uncertain', 'confused', 'lost', 'helpless',
    'no', 'never', 'nothing', 'nobody', 'nowhere', 'disagree', 'refuse', 'reject'
  ];

  const intensifiers = [
    'very', 'extremely', 'incredibly', 'really', 'quite', 'pretty', 'rather',
    'absolutely', 'completely', 'totally', 'entirely', 'highly', 'deeply'
  ];

  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;
  let intensifierMultiplier = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^\w]/g, ''); // Remove punctuation
    
    // Check for intensifiers
    if (intensifiers.includes(word)) {
      intensifierMultiplier = 1.5;
      continue;
    }

    // Check sentiment words
    if (positiveWords.includes(word)) {
      positiveScore += 1 * intensifierMultiplier;
    } else if (negativeWords.includes(word)) {
      negativeScore += 1 * intensifierMultiplier;
    }

    // Reset intensifier after applying
    intensifierMultiplier = 1;
  }

  // Calculate overall sentiment
  const totalScore = positiveScore + negativeScore;
  const sentimentScore = totalScore > 0 ? (positiveScore - negativeScore) / totalScore : 0;
  
  let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  let confidence: number;

  if (sentimentScore > 0.2) {
    sentiment = 'POSITIVE';
    confidence = Math.min(0.9, 0.5 + Math.abs(sentimentScore));
  } else if (sentimentScore < -0.2) {
    sentiment = 'NEGATIVE';
    confidence = Math.min(0.9, 0.5 + Math.abs(sentimentScore));
  } else {
    sentiment = 'NEUTRAL';
    confidence = Math.max(0.3, 0.8 - Math.abs(sentimentScore));
  }

  return { sentiment, confidence };
}

function extractEmotionalWords(text: string): string[] {
  const emotionalWords = [
    // Positive emotions
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'perfect',
    'love', 'like', 'enjoy', 'happy', 'pleased', 'excited', 'thrilled', 'confident', 'proud',
    // Negative emotions
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'frustrated',
    'disappointed', 'upset', 'worried', 'anxious', 'stressed', 'difficult', 'problem'
  ];

  const words = text.toLowerCase().split(/\s+/);
  return words
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => emotionalWords.includes(word));
}

function getSentimentIntensity(confidence: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (confidence >= 0.7) return 'HIGH';
  if (confidence >= 0.5) return 'MEDIUM';
  return 'LOW';
}

function analyzeSentimentFlow(transcriptFile: string): SentimentAnalysis {
  console.log(`🎭 Analyzing sentiment flow in: ${transcriptFile}`);
  
  if (!fs.existsSync(transcriptFile)) {
    throw new Error(`Transcript file not found: ${transcriptFile}`);
  }

  const transcript = JSON.parse(fs.readFileSync(transcriptFile, "utf-8"));
  const utterances: Utterance[] = transcript.utterances || [];
  
  if (utterances.length === 0) {
    throw new Error("No utterances found in transcript");
  }

  console.log(`📊 Processing ${utterances.length} utterances for sentiment analysis`);

  const segments: SentimentSegment[] = [];
  const trends: SentimentTrend[] = [];
  const speakers = [...new Set(utterances.map(u => u.speaker))];
  
  const totalDuration = Math.max(...utterances.map(u => u.end));
  let cumulativeScore = 0;

  console.log(`🎤 Analyzing sentiment for speakers: ${speakers.join(', ')}`);
  console.log(`⏱️  Total duration: ${(totalDuration / 1000).toFixed(1)}s`);

  // Analyze each utterance for sentiment
  for (const utterance of utterances) {
    const sentimentResult = analyzeSentiment(utterance.text);
    const emotionalWords = extractEmotionalWords(utterance.text);
    const intensity = getSentimentIntensity(sentimentResult.confidence);
    
    // Convert sentiment to numeric score for cumulative tracking
    let sentimentScore = 0;
    if (sentimentResult.sentiment === 'POSITIVE') {
      sentimentScore = sentimentResult.confidence;
    } else if (sentimentResult.sentiment === 'NEGATIVE') {
      sentimentScore = -sentimentResult.confidence;
    }
    
    cumulativeScore += sentimentScore;

    const segment: SentimentSegment = {
      text: utterance.text,
      speaker: utterance.speaker,
      startTime: utterance.start,
      endTime: utterance.end,
      duration: utterance.end - utterance.start,
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence,
      emotionalWords,
      intensity
    };

    segments.push(segment);

    // Track sentiment trend
    trends.push({
      timePoint: utterance.start,
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence,
      cumulativeScore
    });
  }

  // Analyze speaker-specific sentiments
  const speakerSentiments: Record<string, SpeakerSentiment> = {};
  
  for (const speaker of speakers) {
    const speakerSegments = segments.filter(s => s.speaker === speaker);
    
    const positiveCount = speakerSegments.filter(s => s.sentiment === 'POSITIVE').length;
    const neutralCount = speakerSegments.filter(s => s.sentiment === 'NEUTRAL').length;
    const negativeCount = speakerSegments.filter(s => s.sentiment === 'NEGATIVE').length;
    
    const averageConfidence = speakerSegments.reduce((sum, s) => sum + s.confidence, 0) / speakerSegments.length;
    
    // Determine overall tone
    let overallTone: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      overallTone = 'POSITIVE';
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      overallTone = 'NEGATIVE';
    }
    
    // Calculate emotional range (variance in sentiment)
    const sentimentScores = speakerSegments.map(s => {
      if (s.sentiment === 'POSITIVE') return s.confidence;
      if (s.sentiment === 'NEGATIVE') return -s.confidence;
      return 0;
    });
    const meanScore = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
    const variance = sentimentScores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / sentimentScores.length;
    const emotionalRange = Math.sqrt(variance);
    
    // Find most positive and negative segments
    const positiveSegments = speakerSegments.filter(s => s.sentiment === 'POSITIVE');
    const negativeSegments = speakerSegments.filter(s => s.sentiment === 'NEGATIVE');
    
    const mostPositiveSegment = positiveSegments.length > 0 
      ? positiveSegments.reduce((max, current) => current.confidence > max.confidence ? current : max)
      : undefined;
      
    const mostNegativeSegment = negativeSegments.length > 0
      ? negativeSegments.reduce((max, current) => current.confidence > max.confidence ? current : max)
      : undefined;

    speakerSentiments[speaker] = {
      speaker,
      totalUtterances: speakerSegments.length,
      positiveCount,
      neutralCount,
      negativeCount,
      averageConfidence,
      overallTone,
      emotionalRange,
      mostPositiveSegment,
      mostNegativeSegment
    };
  }

  // Calculate conversation flow metrics
  const totalSegments = segments.length;
  const positiveSegments = segments.filter(s => s.sentiment === 'POSITIVE').length;
  const neutralSegments = segments.filter(s => s.sentiment === 'NEUTRAL').length;
  const negativeSegments = segments.filter(s => s.sentiment === 'NEGATIVE').length;
  
  const positivePercentage = (positiveSegments / totalSegments) * 100;
  const neutralPercentage = (neutralSegments / totalSegments) * 100;
  const negativePercentage = (negativeSegments / totalSegments) * 100;
  
  // Determine overall sentiment
  let overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
  if (positivePercentage > negativePercentage && positivePercentage > 40) {
    overallSentiment = 'POSITIVE';
  } else if (negativePercentage > positivePercentage && negativePercentage > 40) {
    overallSentiment = 'NEGATIVE';
  }
  
  // Count sentiment shifts
  let sentimentShifts = 0;
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].sentiment !== segments[i-1].sentiment) {
      sentimentShifts++;
    }
  }
  
  // Calculate emotional volatility
  const sentimentScores = trends.map(t => t.cumulativeScore);
  const maxScore = Math.max(...sentimentScores);
  const minScore = Math.min(...sentimentScores);
  const emotionalVolatility = maxScore - minScore;
  
  // Find most positive and negative moments
  const allPositiveSegments = segments.filter(s => s.sentiment === 'POSITIVE');
  const allNegativeSegments = segments.filter(s => s.sentiment === 'NEGATIVE');
  
  const mostPositiveMoment = allPositiveSegments.length > 0
    ? allPositiveSegments.reduce((max, current) => current.confidence > max.confidence ? current : max)
    : null;
    
  const mostNegativeMoment = allNegativeSegments.length > 0
    ? allNegativeSegments.reduce((max, current) => current.confidence > max.confidence ? current : max)
    : null;

  // Generate insights
  const insights: string[] = [];
  
  if (overallSentiment === 'POSITIVE') {
    insights.push(`Overall conversation tone is positive (${positivePercentage.toFixed(1)}% positive segments)`);
  } else if (overallSentiment === 'NEGATIVE') {
    insights.push(`Overall conversation tone is negative (${negativePercentage.toFixed(1)}% negative segments)`);
  } else {
    insights.push(`Conversation maintains neutral tone (${neutralPercentage.toFixed(1)}% neutral segments)`);
  }
  
  if (sentimentShifts > totalSegments * 0.3) {
    insights.push(`High emotional volatility - frequent sentiment changes (${sentimentShifts} shifts)`);
  } else if (sentimentShifts < totalSegments * 0.1) {
    insights.push(`Stable emotional tone - minimal sentiment fluctuation`);
  }
  
  // Speaker-specific insights
  for (const [speaker, sentiment] of Object.entries(speakerSentiments)) {
    if (sentiment.overallTone === 'POSITIVE' && sentiment.positiveCount > sentiment.totalUtterances * 0.6) {
      insights.push(`Speaker ${speaker} maintains consistently positive tone`);
    } else if (sentiment.overallTone === 'NEGATIVE' && sentiment.negativeCount > sentiment.totalUtterances * 0.6) {
      insights.push(`Speaker ${speaker} shows predominantly negative sentiment`);
    }
    
    if (sentiment.emotionalRange > 0.5) {
      insights.push(`Speaker ${speaker} shows high emotional range - varied expressions`);
    }
  }
  
  if (mostPositiveMoment && mostPositiveMoment.confidence > 0.8) {
    const timeStr = (mostPositiveMoment.startTime / 1000).toFixed(1);
    insights.push(`Peak positive moment at ${timeStr}s: "${mostPositiveMoment.text.slice(0, 50)}..."`);
  }
  
  if (mostNegativeMoment && mostNegativeMoment.confidence > 0.8) {
    const timeStr = (mostNegativeMoment.startTime / 1000).toFixed(1);
    insights.push(`Peak negative moment at ${timeStr}s: "${mostNegativeMoment.text.slice(0, 50)}..."`);
  }

  return {
    totalDuration,
    segments,
    trends,
    speakerSentiments,
    conversationFlow: {
      overallSentiment,
      sentimentShifts,
      positivePercentage,
      neutralPercentage,
      negativePercentage,
      emotionalVolatility,
      mostPositiveMoment,
      mostNegativeMoment
    },
    insights
  };
}

function displaySentimentAnalysis(analysis: SentimentAnalysis): void {
  console.log("\n" + "=".repeat(60));
  console.log("🎭 SENTIMENT ANALYSIS");
  console.log("=".repeat(60));
  
  // Overall metrics
  console.log(`\n📊 CONVERSATION SENTIMENT OVERVIEW:`);
  console.log(`   ⏱️  Total Duration: ${(analysis.totalDuration / 1000).toFixed(1)}s`);
  console.log(`   🎭 Overall Tone: ${analysis.conversationFlow.overallSentiment}`);
  console.log(`   😊 Positive: ${analysis.conversationFlow.positivePercentage.toFixed(1)}%`);
  console.log(`   😐 Neutral: ${analysis.conversationFlow.neutralPercentage.toFixed(1)}%`);
  console.log(`   😞 Negative: ${analysis.conversationFlow.negativePercentage.toFixed(1)}%`);
  console.log(`   🔄 Sentiment Shifts: ${analysis.conversationFlow.sentimentShifts}`);
  console.log(`   📈 Emotional Volatility: ${analysis.conversationFlow.emotionalVolatility.toFixed(2)}`);

  // Most significant moments
  if (analysis.conversationFlow.mostPositiveMoment) {
    const moment = analysis.conversationFlow.mostPositiveMoment;
    console.log(`\n😊 MOST POSITIVE MOMENT:`);
    console.log(`   ⏱️  Time: ${(moment.startTime / 1000).toFixed(1)}s`);
    console.log(`   🎤 Speaker: ${moment.speaker}`);
    console.log(`   💪 Confidence: ${(moment.confidence * 100).toFixed(1)}%`);
    console.log(`   📝 Text: "${moment.text}"`);
    if (moment.emotionalWords.length > 0) {
      console.log(`   🔑 Emotional words: ${moment.emotionalWords.join(', ')}`);
    }
  }

  if (analysis.conversationFlow.mostNegativeMoment) {
    const moment = analysis.conversationFlow.mostNegativeMoment;
    console.log(`\n😞 MOST NEGATIVE MOMENT:`);
    console.log(`   ⏱️  Time: ${(moment.startTime / 1000).toFixed(1)}s`);
    console.log(`   🎤 Speaker: ${moment.speaker}`);
    console.log(`   💪 Confidence: ${(moment.confidence * 100).toFixed(1)}%`);
    console.log(`   📝 Text: "${moment.text}"`);
    if (moment.emotionalWords.length > 0) {
      console.log(`   🔑 Emotional words: ${moment.emotionalWords.join(', ')}`);
    }
  }

  // Sentiment timeline (show key moments)
  console.log(`\n⏱️  SENTIMENT TIMELINE:`);
  const significantSegments = analysis.segments
    .filter(s => s.sentiment !== 'NEUTRAL' && s.confidence > 0.6)
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, 10); // Show top 10 significant moments

  if (significantSegments.length > 0) {
    significantSegments.forEach((segment, i) => {
      const timeStr = `${(segment.startTime / 1000).toFixed(1)}s`;
      const emoji = segment.sentiment === 'POSITIVE' ? '😊' : '😞';
      const intensity = segment.intensity === 'HIGH' ? '🔥' : segment.intensity === 'MEDIUM' ? '⚡' : '💫';
      console.log(`   ${emoji} ${timeStr} [${segment.speaker}] ${intensity} ${segment.sentiment} (${(segment.confidence * 100).toFixed(0)}%)`);
      console.log(`      "${segment.text.slice(0, 80)}${segment.text.length > 80 ? '...' : ''}"`);
    });
  } else {
    console.log("   📊 No significant emotional moments detected (mostly neutral tone)");
  }

  // Speaker analysis
  console.log(`\n👥 SPEAKER SENTIMENT PATTERNS:`);
  Object.values(analysis.speakerSentiments).forEach(speaker => {
    console.log(`\n   🎤 Speaker ${speaker.speaker}:`);
    console.log(`      🎭 Overall Tone: ${speaker.overallTone}`);
    console.log(`      📊 Utterances: ${speaker.totalUtterances} total`);
    console.log(`      😊 Positive: ${speaker.positiveCount} (${((speaker.positiveCount / speaker.totalUtterances) * 100).toFixed(1)}%)`);
    console.log(`      😐 Neutral: ${speaker.neutralCount} (${((speaker.neutralCount / speaker.totalUtterances) * 100).toFixed(1)}%)`);
    console.log(`      😞 Negative: ${speaker.negativeCount} (${((speaker.negativeCount / speaker.totalUtterances) * 100).toFixed(1)}%)`);
    console.log(`      💪 Avg Confidence: ${(speaker.averageConfidence * 100).toFixed(1)}%`);
    console.log(`      📈 Emotional Range: ${speaker.emotionalRange.toFixed(2)}`);
    
    if (speaker.mostPositiveSegment) {
      const pos = speaker.mostPositiveSegment;
      console.log(`      😊 Most Positive: "${pos.text.slice(0, 50)}..." (${(pos.startTime / 1000).toFixed(1)}s)`);
    }
    
    if (speaker.mostNegativeSegment) {
      const neg = speaker.mostNegativeSegment;
      console.log(`      😞 Most Negative: "${neg.text.slice(0, 50)}..." (${(neg.startTime / 1000).toFixed(1)}s)`);
    }
  });

  // Insights
  if (analysis.insights.length > 0) {
    console.log(`\n💡 KEY INSIGHTS:`);
    analysis.insights.forEach((insight, i) => {
      console.log(`   ${i + 1}. ${insight}`);
    });
  }
}

function saveSentimentAnalysis(analysis: SentimentAnalysis, outputFile: string): void {
  const analysisData = {
    timestamp: new Date().toISOString(),
    analysis,
    summary: {
      totalSegments: analysis.segments.length,
      overallSentiment: analysis.conversationFlow.overallSentiment,
      sentimentDistribution: {
        positive: analysis.conversationFlow.positivePercentage,
        neutral: analysis.conversationFlow.neutralPercentage,
        negative: analysis.conversationFlow.negativePercentage
      },
      emotionalVolatility: analysis.conversationFlow.emotionalVolatility,
      keyInsights: analysis.insights
    }
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(analysisData, null, 2));
  console.log(`\n💾 Sentiment analysis saved to: ${outputFile}`);
}

async function runSentimentAnalysis(inputFile?: string) {
  try {
    // Find transcript file
    let transcriptFile: string;
    
    if (inputFile) {
      transcriptFile = inputFile;
    } else {
      const files = fs.readdirSync('.').filter(file => 
        file.endsWith('_transcript.json') || 
        file.includes('transcript') && file.endsWith('.json')
      );
      
      if (files.length === 0) {
        console.error("❌ No transcript files found");
        console.log("💡 Usage: npx ts-node sentimentAnalysis.ts [transcript.json]");
        return;
      } else if (files.length === 1) {
        transcriptFile = files[0];
        console.log(`🎯 Auto-detected transcript: ${transcriptFile}`);
      } else {
        console.log("📄 Multiple transcript files found:");
        files.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file}`);
        });
        console.log("💡 Please specify which file to analyze:");
        console.log("   npx ts-node sentimentAnalysis.ts \"filename.json\"");
        return;
      }
    }
    
    if (!fs.existsSync(transcriptFile)) {
      console.error(`❌ File not found: ${transcriptFile}`);
      return;
    }

    // Run analysis
    const analysis = analyzeSentimentFlow(transcriptFile);
    
    // Display results
    displaySentimentAnalysis(analysis);
    
    // Save results
    const baseName = path.basename(transcriptFile, '.json');
    const outputFile = `${baseName}_sentiment_analysis.json`;
    saveSentimentAnalysis(analysis, outputFile);
    
    console.log("\n✅ Sentiment analysis complete!");
    
  } catch (error: any) {
    console.error("❌ Error during sentiment analysis:", error.message);
  }
}

// Run if called directly
if (require.main === module) {
  const inputFile = process.argv[2];
  runSentimentAnalysis(inputFile);
}

export { 
  analyzeSentimentFlow, 
  displaySentimentAnalysis, 
  saveSentimentAnalysis,
  runSentimentAnalysis 
}; 