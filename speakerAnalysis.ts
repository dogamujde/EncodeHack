import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: string;
}

interface SpeakerSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
  duration: number;
  wordCount: number;
  confidence: number;
}

interface SpeakerStats {
  totalDuration: number;
  totalWords: number;
  segments: number;
  averageConfidence: number;
  wpm: number;
  longestSegment: number;
  shortestSegment: number;
}

async function analyzeSpeakers() {
  // Load transcript
  const transcript = JSON.parse(fs.readFileSync("./transcript.json", "utf-8"));
  const words: TranscriptWord[] = transcript.words || [];

  if (words.length === 0) {
    console.log("❌ No word-level data found in transcript");
    return;
  }

  // Group words by speaker into segments
  const segments: SpeakerSegment[] = [];
  let currentSegment: TranscriptWord[] = [];
  let currentSpeaker = "";

  for (const word of words) {
    if (word.speaker !== currentSpeaker) {
      // Save previous segment
      if (currentSegment.length > 0) {
        const segment = createSegment(currentSegment, currentSpeaker);
        segments.push(segment);
      }
      // Start new segment
      currentSpeaker = word.speaker;
      currentSegment = [word];
    } else {
      currentSegment.push(word);
    }
  }

  // Don't forget the last segment
  if (currentSegment.length > 0) {
    const segment = createSegment(currentSegment, currentSpeaker);
    segments.push(segment);
  }

  // Calculate speaker statistics
  const speakerStats: Record<string, SpeakerStats> = {};
  const speakerLabels: Record<string, string> = {
    'A': 'Interviewer',
    'B': 'Interviewee', 
    'C': 'Third Person',
    'D': 'Fourth Person'
  };

  for (const segment of segments) {
    if (!speakerStats[segment.speaker]) {
      speakerStats[segment.speaker] = {
        totalDuration: 0,
        totalWords: 0,
        segments: 0,
        averageConfidence: 0,
        wpm: 0,
        longestSegment: 0,
        shortestSegment: Infinity
      };
    }

    const stats = speakerStats[segment.speaker];
    stats.totalDuration += segment.duration;
    stats.totalWords += segment.wordCount;
    stats.segments += 1;
    stats.averageConfidence += segment.confidence;
    stats.longestSegment = Math.max(stats.longestSegment, segment.duration);
    stats.shortestSegment = Math.min(stats.shortestSegment, segment.duration);
  }

  // Finalize calculations
  for (const [speaker, stats] of Object.entries(speakerStats)) {
    stats.wpm = stats.totalWords / (stats.totalDuration / 60000); // Convert ms to minutes
    stats.averageConfidence = stats.averageConfidence / stats.segments;
  }

  // Display results
  console.log("\n🎤 SPEAKER DIFFERENTIATION ANALYSIS");
  console.log("=" .repeat(50));

  for (const [speaker, stats] of Object.entries(speakerStats)) {
    const label = speakerLabels[speaker] || `Speaker ${speaker}`;
    const percentage = (stats.totalDuration / getTotalDuration(segments)) * 100;
    
    console.log(`\n👤 ${label} (${speaker}):`);
    console.log(`   📊 Talk time: ${(stats.totalDuration / 1000).toFixed(1)}s (${percentage.toFixed(1)}%)`);
    console.log(`   📝 Words spoken: ${stats.totalWords}`);
    console.log(`   🎯 Speaking rate: ${stats.wpm.toFixed(1)} WPM`);
    console.log(`   🔗 Number of segments: ${stats.segments}`);
    console.log(`   ✅ Avg confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    console.log(`   ⏱️  Longest segment: ${(stats.longestSegment / 1000).toFixed(1)}s`);
    console.log(`   ⚡ Shortest segment: ${(stats.shortestSegment / 1000).toFixed(1)}s`);
  }

  // Show conversation flow
  console.log("\n💬 CONVERSATION FLOW:");
  console.log("=" .repeat(50));
  
  for (let i = 0; i < Math.min(10, segments.length); i++) {
    const segment = segments[i];
    const label = speakerLabels[segment.speaker] || `Speaker ${segment.speaker}`;
    const time = (segment.start / 1000).toFixed(1);
    const preview = segment.text.length > 60 ? segment.text.substring(0, 60) + "..." : segment.text;
    
    console.log(`[${time}s] ${label}: "${preview}"`);
  }

  if (segments.length > 10) {
    console.log(`... and ${segments.length - 10} more segments`);
  }

  // Save detailed analysis
  const analysis = {
    totalSpeakers: Object.keys(speakerStats).length,
    totalDuration: getTotalDuration(segments),
    speakerStats,
    segments: segments.slice(0, 20), // Save first 20 segments
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync("speaker_analysis.json", JSON.stringify(analysis, null, 2));
  console.log("\n💾 Detailed analysis saved to speaker_analysis.json");
}

function createSegment(words: TranscriptWord[], speaker: string): SpeakerSegment {
  const text = words.map(w => w.text).join(" ");
  const start = words[0].start;
  const end = words[words.length - 1].end;
  const duration = end - start;
  const wordCount = words.length;
  const confidence = words.reduce((sum, w) => sum + w.confidence, 0) / words.length;

  return {
    speaker,
    text,
    start,
    end,
    duration,
    wordCount,
    confidence
  };
}

function getTotalDuration(segments: SpeakerSegment[]): number {
  if (segments.length === 0) return 0;
  const start = Math.min(...segments.map(s => s.start));
  const end = Math.max(...segments.map(s => s.end));
  return end - start;
}

// Run if called directly
if (require.main === module) {
  analyzeSpeakers().catch(console.error);
}

export { analyzeSpeakers }; 