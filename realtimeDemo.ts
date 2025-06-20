import { RealtimeTranscriber } from './realtimeTranscription';
import fs from 'fs';

/**
 * Demo: Real-time Transcription Integration
 * 
 * This demonstrates how to use the RealtimeTranscriber class
 * in a real application for live coaching scenarios.
 */

class LiveCoachingSession {
  private transcriber: RealtimeTranscriber;
  private sessionStartTime: Date;
  private transcripts: Array<{
    timestamp: Date;
    type: 'partial' | 'final';
    text: string;
    confidence: number;
  }> = [];

  constructor() {
    this.sessionStartTime = new Date();
    this.transcriber = new RealtimeTranscriber();
    
    console.log("🎯 Live Coaching Session Started");
    console.log(`📅 Session Time: ${this.sessionStartTime.toISOString()}`);
  }

  /**
   * Simulate sending audio data to the transcriber
   * In a real application, this would come from microphone input
   */
  public simulateAudioInput(): void {
    console.log("\n🎤 Simulating audio input...");
    console.log("💡 In a real application, you would:");
    console.log("   1. Capture audio from microphone");
    console.log("   2. Convert to PCM 16-bit format at 16kHz");
    console.log("   3. Send audio chunks using transcriber.sendAudioData()");
    
    // Example of how you would send real audio data:
    // const audioChunk = captureAudioFromMicrophone();
    // this.transcriber.sendAudioData(audioChunk);
  }

  /**
   * Handle real-time transcription results
   */
  public handleTranscriptionResult(text: string, confidence: number, isFinal: boolean): void {
    const transcript = {
      timestamp: new Date(),
      type: isFinal ? 'final' as const : 'partial' as const,
      text,
      confidence
    };

    this.transcripts.push(transcript);

    if (isFinal) {
      console.log(`✅ [${transcript.timestamp.toLocaleTimeString()}] Final: "${text}" (${(confidence * 100).toFixed(1)}%)`);
      
      // Trigger real-time analysis
      this.analyzeTranscriptInRealTime(text, confidence);
    } else {
      console.log(`🔄 [${transcript.timestamp.toLocaleTimeString()}] Partial: "${text}"`);
    }
  }

  /**
   * Perform real-time analysis on transcribed text
   */
  private analyzeTranscriptInRealTime(text: string, confidence: number): void {
    // Quick sentiment analysis
    const sentiment = this.quickSentimentAnalysis(text);
    
    // Question detection
    const isQuestion = text.includes('?') || 
                      /^(what|where|when|who|why|how|do|does|did|will|would|can|could|should)/i.test(text);
    
    console.log(`   📊 Quick Analysis:`);
    console.log(`      😊 Sentiment: ${sentiment}`);
    console.log(`      ❓ Question: ${isQuestion ? 'Yes' : 'No'}`);
    console.log(`      💪 Confidence: ${(confidence * 100).toFixed(1)}%`);

    // Trigger coaching alerts if needed
    if (sentiment === 'negative' && confidence > 0.8) {
      console.log(`   ⚠️  COACHING ALERT: Negative sentiment detected`);
    }
    
    if (isQuestion && confidence > 0.9) {
      console.log(`   💡 COACHING TIP: Good questioning technique`);
    }
  }

  /**
   * Simple sentiment analysis for real-time feedback
   */
  private quickSentimentAnalysis(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'pleased', 'wonderful', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'angry', 'disappointed', 'frustrated'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Save session data for later analysis
   */
  public saveSession(): void {
    const sessionData = {
      sessionId: `session_${this.sessionStartTime.getTime()}`,
      startTime: this.sessionStartTime.toISOString(),
      endTime: new Date().toISOString(),
      duration: Date.now() - this.sessionStartTime.getTime(),
      transcripts: this.transcripts,
      summary: {
        totalTranscripts: this.transcripts.length,
        finalTranscripts: this.transcripts.filter(t => t.type === 'final').length,
        averageConfidence: this.transcripts.reduce((sum, t) => sum + t.confidence, 0) / this.transcripts.length
      }
    };

    const filename = `live_session_${sessionData.sessionId}.json`;
    fs.writeFileSync(filename, JSON.stringify(sessionData, null, 2));
    console.log(`💾 Session saved: ${filename}`);
  }

  /**
   * End the coaching session
   */
  public endSession(): void {
    console.log("\n🛑 Ending live coaching session...");
    this.saveSession();
    this.transcriber.close();
    console.log("✅ Session ended successfully");
  }
}

/**
 * Example usage for different coaching scenarios
 */
function demonstrateUsageScenarios(): void {
  console.log("🎭 REAL-TIME TRANSCRIPTION USAGE SCENARIOS");
  console.log("=" .repeat(50));

  console.log("\n📋 1. JOB INTERVIEW COACHING:");
  console.log("   - Real-time transcription of interview practice");
  console.log("   - Instant feedback on question quality");
  console.log("   - Sentiment analysis for confidence tracking");
  console.log("   - Speaking pace and clarity monitoring");

  console.log("\n📋 2. SALES TRAINING:");
  console.log("   - Live transcription of sales calls");
  console.log("   - Question ratio analysis in real-time");
  console.log("   - Objection handling detection");
  console.log("   - Customer sentiment monitoring");

  console.log("\n📋 3. PRESENTATION SKILLS:");
  console.log("   - Real-time speech transcription");
  console.log("   - Filler word detection (um, uh, like)");
  console.log("   - Speaking speed analysis");
  console.log("   - Audience engagement metrics");

  console.log("\n📋 4. LANGUAGE LEARNING:");
  console.log("   - Pronunciation accuracy feedback");
  console.log("   - Grammar correction suggestions");
  console.log("   - Vocabulary usage tracking");
  console.log("   - Fluency improvement metrics");
}

/**
 * Integration example with microphone input
 */
function showMicrophoneIntegration(): void {
  console.log("\n🎤 MICROPHONE INTEGRATION EXAMPLE:");
  console.log("=" .repeat(40));
  
  console.log(`
// Example: Integrating with Web Audio API (Browser)
const audioContext = new AudioContext();
const transcriber = new RealtimeTranscriber();

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (event) => {
      const audioData = event.inputBuffer.getChannelData(0);
      const int16Array = convertFloat32ToInt16(audioData);
      const buffer = Buffer.from(int16Array.buffer);
      
      transcriber.sendAudioData(buffer);
    };
    
    source.connect(processor);
    processor.connect(audioContext.destination);
  });

// Example: Integrating with Node.js audio capture
const recorder = require('node-record-lpcm16');
const transcriber = new RealtimeTranscriber();

const recording = recorder.record({
  sampleRate: 16000,
  channels: 1,
  audioType: 'wav'
});

recording.stream().on('data', (chunk) => {
  transcriber.sendAudioData(chunk);
});
  `);
}

// Main demo execution
function runDemo(): void {
  console.log("🚀 Real-time Transcription Demo");
  console.log("=" .repeat(50));
  
  // Show usage scenarios
  demonstrateUsageScenarios();
  
  // Show microphone integration
  showMicrophoneIntegration();
  
  console.log("\n💡 NEXT STEPS:");
  console.log("1. Add a paid AssemblyAI account for real-time features");
  console.log("2. Integrate with microphone input for live audio");
  console.log("3. Combine with existing analysis tools (sentiment, questions, etc.)");
  console.log("4. Build a real-time coaching dashboard");
  
  console.log("\n✅ Demo completed!");
}

// Run if called directly
if (require.main === module) {
  runDemo();
}

export { LiveCoachingSession }; 