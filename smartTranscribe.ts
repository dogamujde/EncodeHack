import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { autoCleanup, cleanFilesForAudio, standardizeTranscriptName, getAnalysisFileName } from "./cleanupTranscripts";

dotenv.config();

const apiKey = process.env.ASSEMBLYAI_API_KEY!;

async function smartTranscribe(inputFilePath?: string, speakers: number = 2) {
  // Determine file path dynamically first
  let filePath: string;
  
  if (inputFilePath) {
    filePath = inputFilePath;
  } else {
    const files = fs.readdirSync('.').filter(file => file.endsWith('.mp3'));
    
    if (files.length === 0) {
      console.error("❌ No MP3 files found in current directory");
      console.log("💡 Usage: npx ts-node smartTranscribe.ts [filename.mp3] [speakers]");
      return;
    } else if (files.length === 1) {
      filePath = files[0];
      console.log(`🎯 Auto-detected MP3 file: ${filePath}`);
    } else {
      console.log("🎵 Multiple MP3 files found:");
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      console.log("💡 Please specify which file to transcribe:");
      console.log("   npx ts-node smartTranscribe.ts \"filename.mp3\" [speakers]");
      return;
    }
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  // Clean files for this specific audio (removes old transcripts/analysis)
  console.log("🧹 Cleaning old files for this audio...");
  cleanFilesForAudio(filePath);
  console.log("");

  // Generate standardized file names
  const transcriptFileName = standardizeTranscriptName(filePath, 'two_speaker');
  const analysisFileName = getAnalysisFileName(filePath, 'two_speaker');
  
  console.log(`🚀 Smart transcription for: ${path.basename(filePath)}`);
  console.log(`📁 File size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`👥 Expected speakers: ${speakers}`);
  console.log(`📄 Will save as: ${transcriptFileName}`);
  console.log(`📊 Analysis will save as: ${analysisFileName}`);
  
  // Check if transcript already exists
  if (fs.existsSync(transcriptFileName)) {
    console.log(`⚠️  Transcript already exists: ${transcriptFileName}`);
    console.log("🔄 Overwriting existing transcript...");
  }
  
  try {
    // Step 1: Upload audio
    console.log("\n📤 Uploading audio file...");
    const file = fs.createReadStream(filePath);
    const uploadResponse = await axios.post("https://api.assemblyai.com/v2/upload", file, {
      headers: { authorization: apiKey }
    });
    const audioUrl = uploadResponse.data.upload_url;
    console.log("✅ Audio uploaded successfully");

    // Step 2: Request optimized transcription
    console.log(`🎯 Requesting transcription optimized for ${speakers} speakers...`);
    const transcriptResponse = await axios.post("https://api.assemblyai.com/v2/transcript", {
      audio_url: audioUrl,
      
      // Optimized settings
      speaker_labels: true,           
      speakers_expected: speakers,    
      language_code: "en",            
      punctuate: true,                
      format_text: true,              
      
      // Enhanced features (English only)
      auto_highlights: true,          
      sentiment_analysis: true,       
      entity_detection: true,         
      
      // Audio optimizations
      boost_param: "high",           
      redact_pii: false,             
      filter_profanity: false,       
      
    }, {
      headers: { authorization: apiKey }
    });
    
    const transcriptId = transcriptResponse.data.id;
    console.log(`📋 Transcription job created: ${transcriptId}`);

    // Step 3: Poll for completion
    console.log("⏳ Processing transcription...");
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      const statusResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: apiKey }
      });

      const status = statusResponse.data.status;
      
      if (status === "completed") {
        console.log("✅ Transcription completed successfully!");
        
        // Save with standardized name
        fs.writeFileSync(transcriptFileName, JSON.stringify(statusResponse.data, null, 2));
        console.log(`💾 Transcript saved: ${transcriptFileName}`);
        
        // Quick analysis
        const data = statusResponse.data;
        const words = data.words || [];
        const detectedSpeakers = [...new Set(words.map((w: any) => w.speaker))];
        
        console.log("\n📊 TRANSCRIPTION SUMMARY:");
        console.log("=" .repeat(45));
        console.log(`🎤 Expected speakers: ${speakers}`);
        console.log(`🎤 Detected speakers: ${detectedSpeakers.length} (${detectedSpeakers.join(', ')})`);
        console.log(`📝 Total words: ${words.length}`);
        console.log(`⏱️  Duration: ${((data.audio_duration || 0) / 1000).toFixed(1)}s`);
        console.log(`✅ Confidence: ${((data.confidence || 0) * 100).toFixed(1)}%`);
        
        // Speaker breakdown
        if (detectedSpeakers.length > 0) {
          console.log("\n👥 SPEAKER DISTRIBUTION:");
          const speakerStats: Record<string, number> = {};
          words.forEach((word: any) => {
            speakerStats[word.speaker] = (speakerStats[word.speaker] || 0) + 1;
          });
          
          Object.entries(speakerStats).forEach(([speaker, count]) => {
            const percentage = ((count as number) / words.length * 100).toFixed(1);
            console.log(`   Speaker ${speaker}: ${count} words (${percentage}%)`);
          });
        }
        
        // Validation
        if (detectedSpeakers.length === speakers) {
          console.log(`\n✅ Perfect! Detected exactly ${speakers} speakers as expected.`);
        } else if (detectedSpeakers.length > speakers) {
          console.log(`\n⚠️  Detected ${detectedSpeakers.length} speakers instead of ${speakers}. May need adjustment.`);
        } else {
          console.log(`\n⚠️  Only detected ${detectedSpeakers.length} speaker(s). Audio might have fewer speakers.`);
        }
        
        // Run immediate analysis
        console.log(`\n🔍 Running automatic analysis...`);
        await runAnalysis(transcriptFileName, analysisFileName, speakers);
        
        break;
        
      } else if (status === "error") {
        console.error("❌ Transcription failed:", statusResponse.data.error);
        break;
        
      } else {
        console.log(`⏳ Status: ${status}... (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.error("❌ Transcription timed out");
    }
    
  } catch (error: any) {
    console.error("❌ Error during transcription:", error.response?.data || error.message);
  }
}

async function runAnalysis(transcriptFile: string, analysisFile: string, expectedSpeakers: number) {
  try {
    const transcript = JSON.parse(fs.readFileSync(transcriptFile, "utf-8"));
    const words = transcript.words || [];
    
    if (words.length === 0) {
      console.log("❌ No word data found for analysis");
      return;
    }

    // Quick speaker analysis
    const speakers = [...new Set(words.map((w: any) => w.speaker))];
    const speakerStats: Record<string, {
      words: number;
      segments: number;
      firstWord: number;
      lastWord: number;
    }> = {};

    let currentSpeaker = "";
    for (const word of words) {
      if (!speakerStats[word.speaker]) {
        speakerStats[word.speaker] = {
          words: 0,
          segments: 0,
          firstWord: word.start,
          lastWord: word.end
        };
      }
      
      speakerStats[word.speaker].words++;
      speakerStats[word.speaker].lastWord = word.end;
      
      if (word.speaker !== currentSpeaker) {
        speakerStats[word.speaker].segments++;
        currentSpeaker = word.speaker;
      }
    }

    // Create analysis
    const analysis = {
      metadata: {
        transcriptFile,
        analysisDate: new Date().toISOString(),
        expectedSpeakers,
        detectedSpeakers: speakers.length
      },
      speakers: {},
      summary: {
        totalWords: words.length,
        totalSpeakers: speakers.length,
        speakerBalance: 0,
        confidence: transcript.confidence || 0
      }
    };

    // Fill speaker details
    for (const [speaker, stats] of Object.entries(speakerStats)) {
      const duration = (stats.lastWord - stats.firstWord) / 1000;
      const wpm = stats.words / (duration / 60);
      
      (analysis.speakers as any)[speaker] = {
        words: stats.words,
        segments: stats.segments,
        duration: duration,
        wpm: wpm,
        percentage: (stats.words / words.length) * 100
      };
    }

    // Calculate balance
    const wordCounts = Object.values(speakerStats).map(s => s.words);
    const maxWords = Math.max(...wordCounts);
    const minWords = Math.min(...wordCounts);
    analysis.summary.speakerBalance = minWords / maxWords;

    // Save analysis
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
    console.log(`📊 Analysis saved: ${analysisFile}`);
    
    // Display quick results
    console.log(`✅ Analysis complete: ${speakers.length} speakers, ${words.length} words, ${(analysis.summary.speakerBalance * 100).toFixed(1)}% balance`);
    
  } catch (error) {
    console.error("❌ Analysis error:", error);
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputFile = args.length > 0 ? args[0] : undefined;
  const speakers = args.length > 1 ? parseInt(args[1]) : 2;
  
  if (speakers < 1 || speakers > 10) {
    console.error("❌ Speaker count must be between 1 and 10");
    process.exit(1);
  }
  
  smartTranscribe(inputFile, speakers).catch(console.error);
}

export { smartTranscribe }; 