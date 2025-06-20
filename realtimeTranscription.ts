import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.ASSEMBLYAI_API_KEY;

if (!apiKey) {
  console.error("❌ AssemblyAI API key not found in environment variables");
  console.log("💡 Please set ASSEMBLYAI_API_KEY in your .env file");
  process.exit(1);
}

interface RealtimeTranscript {
  message_type: 'PartialTranscript' | 'FinalTranscript' | 'SessionBegins' | 'SessionTerminated';
  text?: string;
  confidence?: number;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  created?: string;
  audio_start?: number;
  audio_end?: number;
}

class RealtimeTranscriber {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    this.connect();
  }

  private connect(): void {
    console.log("🔌 Connecting to AssemblyAI real-time transcription...");
    
    const wsUrl = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000';
    
    this.ws = new WebSocket(wsUrl, {
      headers: {
        'Authorization': apiKey!
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("✅ Connected to AssemblyAI real-time transcription!");
      console.log("🎤 WebSocket connection established successfully");
      console.log("📡 Ready to receive audio data for transcription");
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000; // Reset delay
      
      // Send initial configuration if needed
      this.sendConfiguration();
    };

    this.ws.onmessage = (event) => {
      try {
        const data: RealtimeTranscript = JSON.parse(event.data.toString());
        this.handleTranscriptMessage(data);
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
        console.log("📄 Raw message:", event.data.toString());
      }
    };

    this.ws.onerror = (error) => {
      console.error("❌ WebSocket error occurred:", error);
      console.log("🔧 Connection details:");
      console.log("   - URL: wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000");
      console.log("   - Auth: Using provided API key");
      console.log("   - State:", this.ws?.readyState);
    };

    this.ws.onclose = (event) => {
      console.log(`🔌 WebSocket connection closed`);
      console.log(`   - Code: ${event.code}`);
      console.log(`   - Reason: ${event.reason || 'No reason provided'}`);
      console.log(`   - Clean: ${event.wasClean}`);
      
      this.isConnected = false;
      
      // Attempt to reconnect if not a clean close
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log("❌ Max reconnection attempts reached. Please restart manually.");
      }
    };
  }

  private sendConfiguration(): void {
    if (!this.isConnected || !this.ws) return;

    // Send configuration for enhanced transcription
    const config = {
      sample_rate: 16000,
      word_boost: ["interview", "question", "answer", "experience", "skills"],
      encoding: "pcm_s16le"
    };

    console.log("⚙️  Sending transcription configuration...");
    // Note: Configuration is typically sent via URL parameters or initial setup
    // Real audio data would be sent as binary frames
  }

  private handleTranscriptMessage(data: RealtimeTranscript): void {
    switch (data.message_type) {
      case 'SessionBegins':
        console.log("🎬 Transcription session started");
        console.log(`   - Session ID: ${data.created || 'Unknown'}`);
        break;

      case 'PartialTranscript':
        if (data.text && data.text.trim()) {
          console.log(`🔄 Partial: "${data.text}" (confidence: ${(data.confidence || 0) * 100}%)`);
        }
        break;

      case 'FinalTranscript':
        if (data.text && data.text.trim()) {
          console.log(`✅ Final: "${data.text}" (confidence: ${(data.confidence || 0) * 100}%)`);
          
          if (data.words && data.words.length > 0) {
            console.log(`   📝 Words: ${data.words.length}`);
            console.log(`   ⏱️  Duration: ${data.audio_start}ms - ${data.audio_end}ms`);
          }
        }
        break;

      case 'SessionTerminated':
        console.log("🛑 Transcription session terminated");
        break;

      default:
        console.log("📨 Unknown message type:", data.message_type);
        console.log("📄 Data:", data);
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    
    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  public sendAudioData(audioBuffer: Buffer): void {
    if (!this.isConnected || !this.ws) {
      console.warn("⚠️  Cannot send audio data: WebSocket not connected");
      return;
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(audioBuffer);
    } else {
      console.warn("⚠️  Cannot send audio data: WebSocket not ready");
    }
  }

  public close(): void {
    console.log("🔌 Closing WebSocket connection...");
    
    if (this.ws) {
      this.ws.close(1000, "Client requested close");
      this.ws = null;
    }
    
    this.isConnected = false;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getReadyState(): number | undefined {
    return this.ws?.readyState;
  }
}

// Example usage and testing
function testRealtimeConnection(): void {
  console.log("🚀 Starting AssemblyAI Real-time Transcription Test");
  console.log("=" .repeat(50));
  
  const transcriber = new RealtimeTranscriber();
  
  // Keep the connection alive for testing
  console.log("⏱️  Keeping connection alive for 30 seconds...");
  console.log("💡 In a real application, you would send audio data using sendAudioData()");
  
  setTimeout(() => {
    console.log("\n⏰ Test duration completed. Closing connection...");
    transcriber.close();
    
    setTimeout(() => {
      console.log("✅ Real-time transcription test completed!");
      process.exit(0);
    }, 1000);
  }, 30000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log("\n🛑 Received interrupt signal. Closing connection...");
    transcriber.close();
    process.exit(0);
  });
}

// Run if called directly
if (require.main === module) {
  testRealtimeConnection();
}

export { RealtimeTranscriber, RealtimeTranscript }; 