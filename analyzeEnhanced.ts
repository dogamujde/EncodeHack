import fs from "fs";

interface EnhancedTranscript {
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
}

async function analyzeEnhancedTranscript() {
  // Load enhanced transcript
  const transcript: EnhancedTranscript = JSON.parse(
    fs.readFileSync("./enhanced_transcript.json", "utf-8")
  );

  const words = transcript.words || [];
  
  if (words.length === 0) {
    console.log("❌ No word data found in enhanced transcript");
    return;
  }

  // Group by speakers
  const speakerMap: Record<string, {
    words: typeof words;
    totalDuration: number;
    wordCount: number;
    segments: number;
  }> = {};

  let currentSpeaker = "";
  let segmentCount = 0;

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
      data.totalDuration = lastWord.end - firstWord.start;
    }
  }

  // Display enhanced analysis
  console.log("\n🎤 ENHANCED SPEAKER ANALYSIS");
  console.log("=" .repeat(50));

  const speakerLabels: Record<string, string> = {
    'A': '👨‍💼 Interviewer',
    'B': '👩‍💻 Candidate', 
    'C': '👥 Third Person',
    'D': '🎭 Fourth Person'
  };

  for (const [speaker, data] of Object.entries(speakerMap)) {
    const label = speakerLabels[speaker] || `🎯 Speaker ${speaker}`;
    const duration = data.totalDuration / 1000; // Convert to seconds
    const wpm = data.wordCount / (duration / 60); // Words per minute
    
    console.log(`\n${label}:`);
    console.log(`   📊 Speaking time: ${duration.toFixed(1)}s`);
    console.log(`   📝 Words spoken: ${data.wordCount}`);
    console.log(`   🎯 Speaking rate: ${wpm.toFixed(1)} WPM`);
    console.log(`   🔗 Speech segments: ${data.segments}`);
    
    // Show sample text
    const sampleText = data.words.slice(0, 10).map(w => w.text).join(' ');
    console.log(`   💬 Sample: "${sampleText}..."`);
  }

  // Key Phrases Analysis
  if (transcript.auto_highlights_result?.results) {
    console.log("\n🔍 KEY PHRASES DETECTED:");
    console.log("=" .repeat(50));
    
    transcript.auto_highlights_result.results
      .slice(0, 10)
      .forEach((highlight, index) => {
        console.log(`${index + 1}. "${highlight.text}" (mentioned ${highlight.count} times)`);
      });
  }

  // Sentiment Analysis
  if (transcript.sentiment_analysis_results?.length) {
    console.log("\n😊 SENTIMENT ANALYSIS:");
    console.log("=" .repeat(50));
    
    const sentiments = transcript.sentiment_analysis_results;
    const positive = sentiments.filter(s => s.sentiment === 'POSITIVE').length;
    const negative = sentiments.filter(s => s.sentiment === 'NEGATIVE').length;
    const neutral = sentiments.filter(s => s.sentiment === 'NEUTRAL').length;
    
    console.log(`✅ Positive: ${positive} segments`);
    console.log(`❌ Negative: ${negative} segments`);
    console.log(`⚪ Neutral: ${neutral} segments`);
    
    // Show sentiment examples
    sentiments.slice(0, 3).forEach((sentiment, index) => {
      console.log(`${index + 1}. [${sentiment.sentiment}] "${sentiment.text}"`);
    });
  }

  // Entities Detection
  if (transcript.entities?.length) {
    console.log("\n🏷️ ENTITIES DETECTED:");
    console.log("=" .repeat(50));
    
    const entityTypes: Record<string, string[]> = {};
    
    transcript.entities.forEach(entity => {
      if (!entityTypes[entity.entity_type]) {
        entityTypes[entity.entity_type] = [];
      }
      entityTypes[entity.entity_type].push(entity.text);
    });
    
    for (const [type, entities] of Object.entries(entityTypes)) {
      const uniqueEntities = [...new Set(entities)];
      console.log(`📌 ${type}: ${uniqueEntities.join(', ')}`);
    }
  }

  // Conversation Flow
  console.log("\n💬 CONVERSATION TIMELINE:");
  console.log("=" .repeat(50));
  
  const segments: Array<{speaker: string, text: string, start: number}> = [];
  let currentSegmentSpeaker = "";
  let currentSegmentWords: typeof words = [];
  
  for (const word of words) {
    if (word.speaker !== currentSegmentSpeaker) {
      if (currentSegmentWords.length > 0) {
        segments.push({
          speaker: currentSegmentSpeaker,
          text: currentSegmentWords.map(w => w.text).join(' '),
          start: currentSegmentWords[0].start
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
    segments.push({
      speaker: currentSegmentSpeaker,
      text: currentSegmentWords.map(w => w.text).join(' '),
      start: currentSegmentWords[0].start
    });
  }
  
  segments.slice(0, 8).forEach((segment, index) => {
    const label = speakerLabels[segment.speaker] || `Speaker ${segment.speaker}`;
    const time = (segment.start / 1000).toFixed(1);
    const preview = segment.text.length > 80 ? segment.text.substring(0, 80) + "..." : segment.text;
    console.log(`[${time}s] ${label}: "${preview}"`);
  });

  console.log("\n💾 Full analysis complete!");
}

// Run if called directly
if (require.main === module) {
  analyzeEnhancedTranscript().catch(console.error);
}

export { analyzeEnhancedTranscript }; 