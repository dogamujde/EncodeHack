import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.ASSEMBLYAI_API_KEY!;

async function twoSpeakerTranscribe(inputFilePath?: string) {
  // Determine file path dynamically
  let filePath: string;
  
  if (inputFilePath) {
    filePath = inputFilePath;
  } else {
    const files = fs.readdirSync('.').filter(file => file.endsWith('.mp3'));
    
    if (files.length === 0) {
      console.error("❌ No MP3 files found in current directory");
      console.log("💡 Usage: npx ts-node twoSpeakerTranscribe.ts [filename.mp3]");
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
      console.log("   npx ts-node twoSpeakerTranscribe.ts \"filename.mp3\"");
      return;
    }
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }
  
  console.log(`🚀 Starting 2-SPEAKER transcription for: ${path.basename(filePath)}`);
  console.log(`📁 File size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
  
  try {
    // Step 1: Upload audio
    console.log("📤 Uploading audio file...");
    const file = fs.createReadStream(filePath);
    const uploadResponse = await axios.post("https://api.assemblyai.com/v2/upload", file, {
      headers: { authorization: apiKey }
    });
    const audioUrl = uploadResponse.data.upload_url;
    console.log("✅ Audio uploaded successfully");

    // Step 2: Request transcription optimized for 2 speakers
    console.log("🎯 Requesting transcription optimized for exactly 2 speakers...");
    const transcriptResponse = await axios.post("https://api.assemblyai.com/v2/transcript", {
      audio_url: audioUrl,
      
      // Optimized settings for 2 speakers
      speaker_labels: true,           // Enable speaker identification
      speakers_expected: 2,           // Exactly 2 speakers
      language_code: "en",            // English
      punctuate: true,                // Add punctuation
      format_text: true,              // Format text properly
      
      // Enhanced features for better analysis
      auto_highlights: true,          // Detect key phrases
      sentiment_analysis: true,       // Analyze sentiment
      entity_detection: true,         // Detect named entities
      
      // Audio processing optimizations
      boost_param: "high",           // Boost audio quality
      redact_pii: false,             // Keep all content
      filter_profanity: false,       // Keep all content
      
      // Additional speaker optimization
      multichannel: false,           // Single channel audio
      dual_channel: false,           // Not dual channel
      
    }, {
      headers: { authorization: apiKey }
    });
    
    const transcriptId = transcriptResponse.data.id;
    console.log(`📋 Transcription job created: ${transcriptId}`);

    // Step 3: Poll for completion
    console.log("⏳ Processing 2-speaker transcription...");
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      const statusResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: apiKey }
      });

      const status = statusResponse.data.status;
      
      if (status === "completed") {
        console.log("✅ 2-speaker transcription completed successfully!");
        
        // Save the 2-speaker transcript
        fs.writeFileSync("two_speaker_transcript.json", JSON.stringify(statusResponse.data, null, 2));
        console.log("💾 2-speaker transcript saved to two_speaker_transcript.json");
        
        // Quick analysis
        const data = statusResponse.data;
        const words = data.words || [];
        const speakers = [...new Set(words.map((w: any) => w.speaker))];
        
        console.log("\n📊 2-SPEAKER TRANSCRIPTION SUMMARY:");
        console.log("=" .repeat(45));
        console.log(`🎤 Detected speakers: ${speakers.length} (${speakers.join(', ')})`);
        console.log(`📝 Total words: ${words.length}`);
        console.log(`⏱️  Duration: ${((data.audio_duration || 0) / 1000).toFixed(1)}s`);
        console.log(`✅ Confidence: ${((data.confidence || 0) * 100).toFixed(1)}%`);
        
        // Quick speaker breakdown
        const speakerStats: Record<string, number> = {};
        words.forEach((word: any) => {
          speakerStats[word.speaker] = (speakerStats[word.speaker] || 0) + 1;
        });
        
        console.log("\n👥 SPEAKER WORD COUNT:");
        Object.entries(speakerStats).forEach(([speaker, count]) => {
          const percentage = ((count as number) / words.length * 100).toFixed(1);
          console.log(`   Speaker ${speaker}: ${count} words (${percentage}%)`);
        });
        
        if (speakers.length === 2) {
          console.log("\n✅ Perfect! Detected exactly 2 speakers as expected.");
        } else if (speakers.length > 2) {
          console.log(`\n⚠️  Warning: Detected ${speakers.length} speakers instead of 2. May need adjustment.`);
        } else {
          console.log(`\n⚠️  Warning: Only detected ${speakers.length} speaker. Audio might be mono-speaker.`);
        }
        
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
    console.error("❌ Error during 2-speaker transcription:", error.response?.data || error.message);
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputFile = args.length > 0 ? args[0] : undefined;
  
  twoSpeakerTranscribe(inputFile).catch(console.error);
}

export { twoSpeakerTranscribe }; 