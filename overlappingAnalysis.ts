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

interface Overlap {
  type: 'overlap' | 'interruption' | 'quick_succession';
  speaker1: string;
  speaker2: string;
  startTime: number;
  endTime: number;
  duration: number;
  speaker1Text: string;
  speaker2Text: string;
  overlapPercentage: number;
}

interface Gap {
  type: 'silence' | 'pause';
  startTime: number;
  endTime: number;
  duration: number;
  beforeSpeaker: string;
  afterSpeaker: string;
}

interface SpeakingPattern {
  speaker: string;
  totalSpeakingTime: number;
  averageUtteranceLength: number;
  longestUtterance: number;
  shortestUtterance: number;
  utteranceCount: number;
  interruptionsGiven: number;
  interruptionsReceived: number;
  averagePauseBefore: number;
  speakingTurns: number;
}

interface OverlapAnalysis {
  totalDuration: number;
  overlaps: Overlap[];
  gaps: Gap[];
  speakingPatterns: Record<string, SpeakingPattern>;
  conversationFlow: {
    totalOverlapTime: number;
    totalSilenceTime: number;
    overlapPercentage: number;
    silencePercentage: number;
    speakingEfficiency: number;
    turnTakingSmooth: number;
  };
  insights: string[];
}

function analyzeOverlappingTimestamps(transcriptFile: string): OverlapAnalysis {
  console.log(`🔍 Analyzing overlapping timestamps in: ${transcriptFile}`);
  
  if (!fs.existsSync(transcriptFile)) {
    throw new Error(`Transcript file not found: ${transcriptFile}`);
  }

  const transcript = JSON.parse(fs.readFileSync(transcriptFile, "utf-8"));
  const utterances: Utterance[] = transcript.utterances || [];
  const words: Word[] = transcript.words || [];
  
  if (utterances.length === 0 || words.length === 0) {
    throw new Error("No utterances or words found in transcript");
  }

  console.log(`📊 Processing ${utterances.length} utterances and ${words.length} words`);

  const overlaps: Overlap[] = [];
  const gaps: Gap[] = [];
  const speakers = [...new Set(utterances.map(u => u.speaker))];
  
  // Sort utterances by start time
  const sortedUtterances = [...utterances].sort((a, b) => a.start - b.start);
  const totalDuration = Math.max(...utterances.map(u => u.end));

  console.log(`🎤 Detected speakers: ${speakers.join(', ')}`);
  console.log(`⏱️  Total duration: ${(totalDuration / 1000).toFixed(1)}s`);

  // Analyze overlaps between consecutive utterances
  for (let i = 0; i < sortedUtterances.length - 1; i++) {
    const current = sortedUtterances[i];
    const next = sortedUtterances[i + 1];
    
    // Check for overlap
    if (current.end > next.start) {
      const overlapStart = next.start;
      const overlapEnd = Math.min(current.end, next.end);
      const overlapDuration = overlapEnd - overlapStart;
      
      // Calculate overlap percentage relative to shorter utterance
      const currentDuration = current.end - current.start;
      const nextDuration = next.end - next.start;
      const shorterDuration = Math.min(currentDuration, nextDuration);
      const overlapPercentage = (overlapDuration / shorterDuration) * 100;
      
      // Classify overlap type
      let overlapType: 'overlap' | 'interruption' | 'quick_succession' = 'overlap';
      if (overlapPercentage > 50) {
        overlapType = 'interruption';
      } else if (overlapDuration < 200) { // Less than 200ms
        overlapType = 'quick_succession';
      }
      
      overlaps.push({
        type: overlapType,
        speaker1: current.speaker,
        speaker2: next.speaker,
        startTime: overlapStart,
        endTime: overlapEnd,
        duration: overlapDuration,
        speaker1Text: current.text.slice(-50), // Last 50 chars
        speaker2Text: next.text.slice(0, 50),   // First 50 chars
        overlapPercentage
      });
    }
    // Check for gaps (silence)
    else if (next.start > current.end) {
      const gapDuration = next.start - current.end;
      
      gaps.push({
        type: gapDuration > 1000 ? 'silence' : 'pause', // > 1 second = silence
        startTime: current.end,
        endTime: next.start,
        duration: gapDuration,
        beforeSpeaker: current.speaker,
        afterSpeaker: next.speaker
      });
    }
  }

  // Calculate speaking patterns for each speaker
  const speakingPatterns: Record<string, SpeakingPattern> = {};
  
  for (const speaker of speakers) {
    const speakerUtterances = utterances.filter(u => u.speaker === speaker);
    const speakerWords = words.filter(w => w.speaker === speaker);
    
    const totalSpeakingTime = speakerUtterances.reduce((sum, u) => sum + (u.end - u.start), 0);
    const utteranceLengths = speakerUtterances.map(u => u.end - u.start);
    
    // Count interruptions given and received
    const interruptionsGiven = overlaps.filter(o => 
      o.speaker2 === speaker && o.type === 'interruption'
    ).length;
    
    const interruptionsReceived = overlaps.filter(o => 
      o.speaker1 === speaker && o.type === 'interruption'
    ).length;
    
    // Calculate average pause before speaking
    const speakerTurns = sortedUtterances.filter(u => u.speaker === speaker);
    let totalPauseBefore = 0;
    let pauseCount = 0;
    
    for (let i = 1; i < sortedUtterances.length; i++) {
      if (sortedUtterances[i].speaker === speaker) {
        const prevUtterance = sortedUtterances[i - 1];
        if (prevUtterance.speaker !== speaker) {
          const pause = sortedUtterances[i].start - prevUtterance.end;
          if (pause > 0) {
            totalPauseBefore += pause;
            pauseCount++;
          }
        }
      }
    }
    
    speakingPatterns[speaker] = {
      speaker,
      totalSpeakingTime,
      averageUtteranceLength: utteranceLengths.reduce((a, b) => a + b, 0) / utteranceLengths.length,
      longestUtterance: Math.max(...utteranceLengths),
      shortestUtterance: Math.min(...utteranceLengths),
      utteranceCount: speakerUtterances.length,
      interruptionsGiven,
      interruptionsReceived,
      averagePauseBefore: pauseCount > 0 ? totalPauseBefore / pauseCount : 0,
      speakingTurns: speakerTurns.length
    };
  }

  // Calculate conversation flow metrics
  const totalOverlapTime = overlaps.reduce((sum, o) => sum + o.duration, 0);
  const totalSilenceTime = gaps.filter(g => g.type === 'silence').reduce((sum, g) => sum + g.duration, 0);
  const totalSpeakingTime = Object.values(speakingPatterns).reduce((sum, p) => sum + p.totalSpeakingTime, 0);
  
  const overlapPercentage = (totalOverlapTime / totalDuration) * 100;
  const silencePercentage = (totalSilenceTime / totalDuration) * 100;
  const speakingEfficiency = (totalSpeakingTime / totalDuration) * 100;
  
  // Calculate turn-taking smoothness (fewer gaps = smoother)
  const shortPauses = gaps.filter(g => g.type === 'pause' && g.duration < 500).length;
  const totalTurns = gaps.length + overlaps.length;
  const turnTakingSmooth = totalTurns > 0 ? (shortPauses / totalTurns) * 100 : 100;

  // Generate insights
  const insights: string[] = [];
  
  if (overlaps.length > 0) {
    const interruptions = overlaps.filter(o => o.type === 'interruption').length;
    insights.push(`Found ${overlaps.length} overlapping moments, ${interruptions} were interruptions`);
    
    if (interruptions > utterances.length * 0.1) {
      insights.push("High interruption rate - may indicate competitive or heated discussion");
    }
  }
  
  if (gaps.length > 0) {
    const longSilences = gaps.filter(g => g.type === 'silence').length;
    insights.push(`${gaps.length} conversation gaps detected, ${longSilences} were significant silences`);
    
    if (longSilences > utterances.length * 0.05) {
      insights.push("Frequent long silences - may indicate hesitation or thoughtful pauses");
    }
  }
  
  if (speakingEfficiency < 70) {
    insights.push("Low speaking efficiency - significant time spent in silence or overlap");
  } else if (speakingEfficiency > 90) {
    insights.push("High speaking efficiency - very active conversation with minimal dead time");
  }
  
  if (turnTakingSmooth > 80) {
    insights.push("Smooth turn-taking - speakers transition naturally");
  } else if (turnTakingSmooth < 50) {
    insights.push("Choppy turn-taking - frequent awkward pauses or rushed transitions");
  }
  
  // Speaker-specific insights
  for (const [speaker, pattern] of Object.entries(speakingPatterns)) {
    if (pattern.interruptionsGiven > pattern.interruptionsReceived * 2) {
      insights.push(`Speaker ${speaker} tends to interrupt others frequently`);
    }
    if (pattern.averagePauseBefore > 1000) {
      insights.push(`Speaker ${speaker} takes longer pauses before speaking (thoughtful)`);
    }
    if (pattern.averageUtteranceLength > 10000) {
      insights.push(`Speaker ${speaker} gives long responses (detailed/dominant)`);
    }
  }

  return {
    totalDuration,
    overlaps,
    gaps,
    speakingPatterns,
    conversationFlow: {
      totalOverlapTime,
      totalSilenceTime,
      overlapPercentage,
      silencePercentage,
      speakingEfficiency,
      turnTakingSmooth
    },
    insights
  };
}

function displayOverlapAnalysis(analysis: OverlapAnalysis): void {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 OVERLAPPING TIMESTAMP ANALYSIS");
  console.log("=".repeat(60));
  
  // Overall metrics
  console.log(`\n📊 CONVERSATION FLOW METRICS:`);
  console.log(`   ⏱️  Total Duration: ${(analysis.totalDuration / 1000).toFixed(1)}s`);
  console.log(`   🗣️  Speaking Efficiency: ${analysis.conversationFlow.speakingEfficiency.toFixed(1)}%`);
  console.log(`   🔄 Turn-taking Smoothness: ${analysis.conversationFlow.turnTakingSmooth.toFixed(1)}%`);
  console.log(`   ⚡ Overlap Time: ${(analysis.conversationFlow.totalOverlapTime / 1000).toFixed(1)}s (${analysis.conversationFlow.overlapPercentage.toFixed(1)}%)`);
  console.log(`   🤫 Silence Time: ${(analysis.conversationFlow.totalSilenceTime / 1000).toFixed(1)}s (${analysis.conversationFlow.silencePercentage.toFixed(1)}%)`);

  // Overlaps
  if (analysis.overlaps.length > 0) {
    console.log(`\n🔄 OVERLAPPING MOMENTS (${analysis.overlaps.length}):`);
    
    const byType = {
      interruption: analysis.overlaps.filter(o => o.type === 'interruption'),
      overlap: analysis.overlaps.filter(o => o.type === 'overlap'),
      quick_succession: analysis.overlaps.filter(o => o.type === 'quick_succession')
    };
    
    console.log(`   🚨 Interruptions: ${byType.interruption.length}`);
    console.log(`   🔄 Overlaps: ${byType.overlap.length}`);
    console.log(`   ⚡ Quick Succession: ${byType.quick_succession.length}`);
    
    // Show top 5 most significant overlaps
    const significantOverlaps = analysis.overlaps
      .filter(o => o.type === 'interruption' || o.duration > 500)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    if (significantOverlaps.length > 0) {
      console.log(`\n   📋 Most Significant Overlaps:`);
      significantOverlaps.forEach((overlap, i) => {
        const timeStr = `${(overlap.startTime / 1000).toFixed(1)}s`;
        const durationStr = `${(overlap.duration / 1000).toFixed(1)}s`;
        console.log(`   ${i + 1}. ${overlap.type.toUpperCase()} at ${timeStr} (${durationStr})`);
        console.log(`      ${overlap.speaker1}: "${overlap.speaker1Text}..."`);
        console.log(`      ${overlap.speaker2}: "${overlap.speaker2Text}..."`);
      });
    }
  }

  // Gaps
  if (analysis.gaps.length > 0) {
    console.log(`\n🤫 CONVERSATION GAPS (${analysis.gaps.length}):`);
    
    const silences = analysis.gaps.filter(g => g.type === 'silence');
    const pauses = analysis.gaps.filter(g => g.type === 'pause');
    
    console.log(`   🔇 Long Silences: ${silences.length}`);
    console.log(`   ⏸️  Short Pauses: ${pauses.length}`);
    
    if (silences.length > 0) {
      const avgSilence = silences.reduce((sum, s) => sum + s.duration, 0) / silences.length;
      const longestSilence = Math.max(...silences.map(s => s.duration));
      console.log(`   📊 Average Silence: ${(avgSilence / 1000).toFixed(1)}s`);
      console.log(`   📊 Longest Silence: ${(longestSilence / 1000).toFixed(1)}s`);
    }
  }

  // Speaking patterns
  console.log(`\n👥 SPEAKER PATTERNS:`);
  Object.values(analysis.speakingPatterns).forEach(pattern => {
    console.log(`\n   🎤 Speaker ${pattern.speaker}:`);
    console.log(`      ⏱️  Total Speaking: ${(pattern.totalSpeakingTime / 1000).toFixed(1)}s`);
    console.log(`      📝 Utterances: ${pattern.utteranceCount} (avg: ${(pattern.averageUtteranceLength / 1000).toFixed(1)}s)`);
    console.log(`      🔄 Speaking Turns: ${pattern.speakingTurns}`);
    console.log(`      ⚡ Interruptions Given: ${pattern.interruptionsGiven}`);
    console.log(`      🛑 Interruptions Received: ${pattern.interruptionsReceived}`);
    console.log(`      ⏸️  Avg Pause Before Speaking: ${(pattern.averagePauseBefore / 1000).toFixed(1)}s`);
  });

  // Insights
  if (analysis.insights.length > 0) {
    console.log(`\n💡 KEY INSIGHTS:`);
    analysis.insights.forEach((insight, i) => {
      console.log(`   ${i + 1}. ${insight}`);
    });
  }
}

function saveOverlapAnalysis(analysis: OverlapAnalysis, outputFile: string): void {
  const analysisData = {
    timestamp: new Date().toISOString(),
    analysis,
    summary: {
      totalOverlaps: analysis.overlaps.length,
      totalGaps: analysis.gaps.length,
      speakerCount: Object.keys(analysis.speakingPatterns).length,
      conversationFlow: analysis.conversationFlow,
      keyInsights: analysis.insights
    }
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(analysisData, null, 2));
  console.log(`\n💾 Analysis saved to: ${outputFile}`);
}

async function runOverlapAnalysis(inputFile?: string) {
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
        console.log("💡 Usage: npx ts-node overlappingAnalysis.ts [transcript.json]");
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
        console.log("   npx ts-node overlappingAnalysis.ts \"filename.json\"");
        return;
      }
    }
    
    if (!fs.existsSync(transcriptFile)) {
      console.error(`❌ File not found: ${transcriptFile}`);
      return;
    }

    // Run analysis
    const analysis = analyzeOverlappingTimestamps(transcriptFile);
    
    // Display results
    displayOverlapAnalysis(analysis);
    
    // Save results
    const baseName = path.basename(transcriptFile, '.json');
    const outputFile = `${baseName}_overlap_analysis.json`;
    saveOverlapAnalysis(analysis, outputFile);
    
    console.log("\n✅ Overlap analysis complete!");
    
  } catch (error: any) {
    console.error("❌ Error during overlap analysis:", error.message);
  }
}

// Run if called directly
if (require.main === module) {
  const inputFile = process.argv[2];
  runOverlapAnalysis(inputFile);
}

export { 
  analyzeOverlappingTimestamps, 
  displayOverlapAnalysis, 
  saveOverlapAnalysis,
  runOverlapAnalysis 
}; 