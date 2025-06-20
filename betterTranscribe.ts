import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.ASSEMBLYAI_API_KEY!;

async function enhancedTranscribe(inputFilePath?: string) {
  // Determine file path dynamically
  let filePath: string;
  
  if (inputFilePath) {
    // Use provided file path
    filePath = inputFilePath;
  } else {
    // Auto-detect MP3 files in current directory
    const files = fs.readdirSync('.').filter(file => file.endsWith('.mp3'));
    
    if (files.length === 0) {
      console.error("❌ No MP3 files found in current directory");
      console.log("💡 Usage: npx ts-node betterTranscribe.ts [filename.mp3]");
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
      console.log("   npx ts-node betterTranscribe.ts \"filename.mp3\"");
      return;
    }
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }
  
  console.log(`🚀 Starting enhanced transcription for: ${path.basename(filePath)}`);
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

    // Step 2: Request enhanced transcription
    console.log("🎯 Requesting transcription with enhanced speaker detection...");
    const transcriptResponse = await axios.post("https://api.assemblyai.com/v2/transcript", {
      audio_url: audioUrl,
      // Enhanced speaker detection settings (English - supports all features)
      speaker_labels: true,           // Enable speaker identification
      speakers_expected: 3,           // Try detecting up to 3 speakers
      language_code: "en",            // English (supports more features)
      punctuate: true,                // Add punctuation
      format_text: true,              // Format text properly
      
      // Additional enhancement options (available in English)
      auto_highlights: true,          // Detect key phrases
      sentiment_analysis: true,       // Analyze sentiment
      entity_detection: true,         // Detect named entities
      
      // Audio processing enhancements
      boost_param: "high",           // Boost audio quality
      redact_pii: false,             // Don't redact personally identifiable info
      filter_profanity: false,       // Keep all content
      
    }, {
      headers: { authorization: apiKey }
    });
    
    const transcriptId = transcriptResponse.data.id;
    console.log(`📋 Transcription job created: ${transcriptId}`);

    // Step 3: Poll for completion with progress
    console.log("⏳ Processing transcription...");
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (attempts < maxAttempts) {
      const statusResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: apiKey }
      });

      const status = statusResponse.data.status;
      
      if (status === "completed") {
        console.log("✅ Transcription completed successfully!");
        
        // Save the enhanced transcript
        fs.writeFileSync("enhanced_transcript.json", JSON.stringify(statusResponse.data, null, 2));
        console.log("💾 Enhanced transcript saved to enhanced_transcript.json");
        
        // Display quick summary
        const data = statusResponse.data;
        console.log("\n📊 TRANSCRIPTION SUMMARY:");
        console.log("=" .repeat(40));
        console.log(`🎤 Detected speakers: ${data.speakers_expected || 'Auto-detected'}`);
        console.log(`📝 Total words: ${data.words?.length || 0}`);
        console.log(`⏱️  Duration: ${((data.audio_duration || 0) / 1000).toFixed(1)}s`);
        console.log(`✅ Confidence: ${((data.confidence || 0) * 100).toFixed(1)}%`);
        
        if (data.auto_highlights_result?.results?.length > 0) {
          console.log(`🔍 Key phrases detected: ${data.auto_highlights_result.results.length}`);
        }
        
        if (data.sentiment_analysis_results?.length > 0) {
          console.log(`😊 Sentiment analysis: Available`);
        }
        
        break;
        
      } else if (status === "error") {
        console.error("❌ Transcription failed:", statusResponse.data.error);
        break;
        
      } else {
        // Show progress
        const progress = statusResponse.data.status;
        console.log(`⏳ Status: ${progress}... (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
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

// Run if called directly
if (require.main === module) {
  // Get filename from command line arguments
  const args = process.argv.slice(2);
  const inputFile = args.length > 0 ? args[0] : undefined;
  
  enhancedTranscribe(inputFile).catch(console.error);
}

export { enhancedTranscribe }; 