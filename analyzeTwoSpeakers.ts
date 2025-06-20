import fs from "fs";

interface TwoSpeakerTranscript {
  words: Array<{
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
    }>;
  };
  sentiment_analysis_results?: Array<{
    text: string;
    sentiment: string;
    confidence: number;
  }>;
}

async function analyzeTwoSpeakers() {
  // Load the corrected 2-speaker transcript
  const transcript: TwoSpeakerTranscript = JSON.parse(
    fs.readFileSync("./two_speaker_transcript.json", "utf-8")
  );

  const words = transcript.words || [];
  
  if (words.length === 0) {
    console.log("❌ No word data found in 2-speaker transcript");
    return;
  }

  // Analyze speakers A and B
  const speakerA = words.filter(w => w.speaker === 'A');
  const speakerB = words.filter(w => w.speaker === 'B');

  // Calculate speaking times
  const speakerADuration = speakerA.length > 0 ? 
    (speakerA[speakerA.length - 1].end - speakerA[0].start) / 1000 : 0;
  const speakerBDuration = speakerB.length > 0 ? 
    (speakerB[speakerB.length - 1].end - speakerB[0].start) / 1000 : 0;

  // Calculate speaking rates
  const speakerAWPM = speakerA.length / (speakerADuration / 60);
  const speakerBWPM = speakerB.length / (speakerBDuration / 60);

  // Count segments (speaker changes)
  let segments = 0;
  let currentSpeaker = "";
  const speakerSegments: Record<string, number> = { A: 0, B: 0 };

  for (const word of words) {
    if (word.speaker !== currentSpeaker) {
      segments++;
      speakerSegments[word.speaker]++;
      currentSpeaker = word.speaker;
    }
  }

  console.log("\n👥 TWO-SPEAKER ANALYSIS");
  console.log("=" .repeat(50));
  
  console.log(`\n🗣️  SPEAKER A (${speakerA.length > speakerB.length ? 'INTERVIEWER' : 'CANDIDATE'}):`);
  console.log(`   📊 Speaking time: ${speakerADuration.toFixed(1)}s`);
  console.log(`   📝 Words spoken: ${speakerA.length}`);
  console.log(`   🎯 Speaking rate: ${speakerAWPM.toFixed(1)} WPM`);
  console.log(`   🔗 Speech segments: ${speakerSegments.A}`);
  console.log(`   📈 Talk percentage: ${(speakerA.length / words.length * 100).toFixed(1)}%`);
  
  console.log(`\n🗣️  SPEAKER B (${speakerB.length > speakerA.length ? 'INTERVIEWER' : 'CANDIDATE'}):`);
  console.log(`   📊 Speaking time: ${speakerBDuration.toFixed(1)}s`);
  console.log(`   📝 Words spoken: ${speakerB.length}`);
  console.log(`   🎯 Speaking rate: ${speakerBWPM.toFixed(1)} WPM`);
  console.log(`   🔗 Speech segments: ${speakerSegments.B}`);
  console.log(`   📈 Talk percentage: ${(speakerB.length / words.length * 100).toFixed(1)}%`);

  // Conversation dynamics
  console.log(`\n💬 CONVERSATION DYNAMICS:`);
  console.log(`   🔄 Total speaker changes: ${segments}`);
  console.log(`   ⚖️  Balance: ${Math.abs(speakerA.length - speakerB.length) < 20 ? 'Well-balanced' : 'Unbalanced'}`);
  console.log(`   🎭 Interaction style: ${segments > 20 ? 'High interaction' : segments > 10 ? 'Moderate interaction' : 'Low interaction'}`);

  // Create conversation flow
  const conversationFlow: Array<{speaker: string, text: string, start: number, duration: number}> = [];
  let currentSegmentSpeaker = "";
  let currentSegmentWords: typeof words = [];
  
  for (const word of words) {
    if (word.speaker !== currentSegmentSpeaker) {
      if (currentSegmentWords.length > 0) {
        const text = currentSegmentWords.map(w => w.text).join(' ');
        const start = currentSegmentWords[0].start;
        const end = currentSegmentWords[currentSegmentWords.length - 1].end;
        conversationFlow.push({
          speaker: currentSegmentSpeaker,
          text,
          start,
          duration: (end - start) / 1000
        });
      }
      currentSegmentSpeaker = word.speaker;
      currentSegmentWords = [word];
    } else {
      currentSegmentWords.push(word);
    }
  }
  
  // Don't forget the last segment
  if (currentSegmentWords.length > 0) {
    const text = currentSegmentWords.map(w => w.text).join(' ');
    const start = currentSegmentWords[0].start;
    const end = currentSegmentWords[currentSegmentWords.length - 1].end;
    conversationFlow.push({
      speaker: currentSegmentSpeaker,
      text,
      start,
      duration: (end - start) / 1000
    });
  }

  // Show conversation timeline
  console.log("\n🎬 CONVERSATION TIMELINE:");
  console.log("=" .repeat(50));
  
  conversationFlow.slice(0, 10).forEach((segment, index) => {
    const speakerLabel = segment.speaker === 'A' ? 
      (speakerA.length > speakerB.length ? '👨‍💼 Interviewer' : '👩‍💻 Candidate') :
      (speakerB.length > speakerA.length ? '👨‍💼 Interviewer' : '👩‍💻 Candidate');
    
    const time = (segment.start / 1000).toFixed(1);
    const duration = segment.duration.toFixed(1);
    const preview = segment.text.length > 70 ? segment.text.substring(0, 70) + "..." : segment.text;
    
    console.log(`[${time}s] ${speakerLabel} (${duration}s): "${preview}"`);
  });

  if (conversationFlow.length > 10) {
    console.log(`... and ${conversationFlow.length - 10} more segments`);
  }

  // Key phrases analysis
  if (transcript.auto_highlights_result?.results) {
    console.log("\n🔍 KEY INTERVIEW TOPICS:");
    console.log("=" .repeat(50));
    
    transcript.auto_highlights_result.results
      .slice(0, 8)
      .forEach((highlight, index) => {
        console.log(`${index + 1}. "${highlight.text}" (mentioned ${highlight.count} times)`);
      });
  }

  // Interview quality assessment
  const totalDuration = (conversationFlow[conversationFlow.length - 1]?.start || 0) / 1000;
  const avgWordsPerSegment = words.length / conversationFlow.length;
  
  console.log("\n📊 INTERVIEW QUALITY ASSESSMENT:");
  console.log("=" .repeat(50));
  console.log(`⏱️  Total duration: ${totalDuration.toFixed(1)} seconds`);
  console.log(`💬 Average segment length: ${avgWordsPerSegment.toFixed(1)} words`);
  console.log(`🎯 Overall engagement: ${segments > 15 ? 'High' : segments > 8 ? 'Medium' : 'Low'}`);
  console.log(`⚖️  Speaker balance: ${Math.abs(speakerA.length - speakerB.length) / words.length < 0.2 ? 'Excellent' : 'Needs improvement'}`);

  // Save detailed analysis
  const analysis = {
    speakers: {
      A: {
        words: speakerA.length,
        duration: speakerADuration,  
        wpm: speakerAWPM,
        segments: speakerSegments.A,
        percentage: speakerA.length / words.length * 100
      },
      B: {
        words: speakerB.length,
        duration: speakerBDuration,
        wpm: speakerBWPM, 
        segments: speakerSegments.B,
        percentage: speakerB.length / words.length * 100
      }
    },
    conversation: {
      totalSegments: segments,
      totalWords: words.length,
      totalDuration: totalDuration,
      balance: Math.abs(speakerA.length - speakerB.length) / words.length
    },
    timeline: conversationFlow.slice(0, 15), // First 15 segments
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync("two_speaker_analysis.json", JSON.stringify(analysis, null, 2));
  console.log("\n💾 Complete 2-speaker analysis saved to two_speaker_analysis.json");
}

// Run if called directly
if (require.main === module) {
  analyzeTwoSpeakers().catch(console.error);
}

export { analyzeTwoSpeakers }; 