import WebSocket from 'ws';
import * as mic from 'mic';
import { Transform } from 'stream';
import { getRealtimeToken } from './utils/getRealtimeToken.js';

interface TranscriptMessage {
    message_type: 'SessionBegins' | 'PartialTranscript' | 'FinalTranscript' | 'SessionTerminated';
    text?: string;
    confidence?: number;
    error?: string;
}

interface TranscriptResult {
    text: string;
    confidence: number;
    isFinal: boolean;
    timestamp: Date;
}

class RealtimeMicrophoneTranscriber {
    private ws: WebSocket | null = null;
    private micInstance: any = null;
    private micInputStream: any = null;
    private isRecording = false;
    private isConnected = false;
    private transcripts: TranscriptResult[] = [];
    private sessionStartTime: Date | null = null;
    
    // Audio settings
    private readonly sampleRate = 16000;
    private readonly channels = 1;
    private readonly bitwidth = 16;
    
    // Analytics
    private totalCount = 0;
    private finalCount = 0;
    private confidenceSum = 0;
    private confidenceCount = 0;
    
    constructor(private apiKey: string) {
        if (!this.apiKey) {
            throw new Error('AssemblyAI API key is required');
        }
    }
    
    async connectWebSocket(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            console.log('🔌 Getting temporary token...');
            
            try {
                const token = await getRealtimeToken(this.apiKey);
                console.log('✅ Token received');
                
                console.log('🔌 Connecting to AssemblyAI WebSocket...');
                const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${this.sampleRate}&token=${token}`;
                this.ws = new WebSocket(wsUrl);
                
                this.ws.on('open', () => {
                    console.log('✅ Connected to AssemblyAI WebSocket with token');
                    this.isConnected = true;
                    // No need to send auth message - token is in URL
                    resolve();
                });
            } catch (error) {
                console.error('❌ Failed to get token:', error);
                reject(error);
                return;
            }
            
            this.ws.on('message', (data: WebSocket.Data) => {
                try {
                    const message: TranscriptMessage = JSON.parse(data.toString());
                    this.handleTranscriptMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });
            
            this.ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                this.isConnected = false;
                reject(error);
            });
            
            this.ws.on('close', (code, reason) => {
                console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
                this.isConnected = false;
                
                if (code === 4003) {
                    console.error('❌ Paid feature required - Upgrade your AssemblyAI account');
                } else {
                    console.log('🔌 Connection closed');
                }
            });
        });
    }
    
    private handleTranscriptMessage(data: TranscriptMessage): void {
        switch (data.message_type) {
            case 'SessionBegins':
                console.log('🎬 Transcription session started');
                break;
                
            case 'PartialTranscript':
                if (data.text && data.text.trim()) {
                    this.addTranscript(data.text, data.confidence || 0, false);
                    console.log(`📝 Partial: ${data.text}`);
                }
                break;
                
            case 'FinalTranscript':
                if (data.text && data.text.trim()) {
                    this.addTranscript(data.text, data.confidence || 0, true);
                    console.log(`✅ Final: ${data.text} (${(data.confidence! * 100).toFixed(1)}%)`);
                }
                break;
                
            case 'SessionTerminated':
                console.log('🛑 Transcription session terminated');
                break;
                
            default:
                if (data.error) {
                    console.error('❌ AssemblyAI error:', data.error);
                }
        }
    }
    
    private addTranscript(text: string, confidence: number, isFinal: boolean): void {
        const transcript: TranscriptResult = {
            text,
            confidence,
            isFinal,
            timestamp: new Date()
        };
        
        this.transcripts.push(transcript);
        this.updateAnalytics(confidence, isFinal);
    }
    
    private updateAnalytics(confidence: number, isFinal: boolean): void {
        this.totalCount++;
        
        if (isFinal) {
            this.finalCount++;
        }
        
        this.confidenceSum += confidence;
        this.confidenceCount++;
        
        const avgConfidence = this.confidenceCount > 0 ? 
            (this.confidenceSum / this.confidenceCount * 100) : 0;
        
        if (this.totalCount % 10 === 0) { // Log stats every 10 transcripts
            console.log(`📊 Stats: ${this.totalCount} total, ${this.finalCount} final, ${avgConfidence.toFixed(1)}% avg confidence`);
        }
    }
    
    async startRecording(): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Not connected to AssemblyAI. Call connectWebSocket() first.');
        }
        
        console.log('🎤 Starting microphone recording...');
        
        try {
            // Initialize microphone
            this.micInstance = mic.default({
                rate: this.sampleRate,
                channels: this.channels,
                debug: false,
                exitOnSilence: 0,
                fileType: 'raw',
                encoding: 'signed-integer',
                bitwidth: this.bitwidth,
                device: 'default'
            });
            
            // Get the microphone input stream
            this.micInputStream = this.micInstance.getAudioStream();
            
            // Create a transform stream to process audio chunks
            const audioProcessor = new Transform({
                transform: (chunk: Buffer, encoding, callback) => {
                    // Convert Buffer to Int16Array for AssemblyAI
                    const int16Array = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.length / 2);
                    
                    // Send to AssemblyAI WebSocket
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(int16Array.buffer);
                    }
                    
                    callback();
                }
            });
            
            // Set up stream pipeline
            this.micInputStream.pipe(audioProcessor);
            
            // Handle microphone events
            this.micInputStream.on('data', (data: Buffer) => {
                // Audio data is being processed in the transform stream
                // This event fires for each chunk
            });
            
            this.micInputStream.on('error', (error: Error) => {
                console.error('❌ Microphone error:', error);
                this.stopRecording();
            });
            
            this.micInputStream.on('startComplete', () => {
                console.log('✅ Microphone started successfully');
            });
            
            this.micInputStream.on('stopComplete', () => {
                console.log('✅ Microphone stopped successfully');
            });
            
            this.micInputStream.on('pauseComplete', () => {
                console.log('⏸️ Microphone paused');
            });
            
            this.micInputStream.on('resumeComplete', () => {
                console.log('▶️ Microphone resumed');
            });
            
            this.micInputStream.on('silence', () => {
                console.log('🔇 Silence detected');
            });
            
            this.micInputStream.on('processExitComplete', () => {
                console.log('🏁 Microphone process exited');
            });
            
            // Start recording
            this.micInstance.start();
            this.isRecording = true;
            this.sessionStartTime = new Date();
            
            console.log('🔴 Recording started - Speak into your microphone');
            console.log('📊 Audio settings:', {
                sampleRate: this.sampleRate,
                channels: this.channels,
                bitwidth: this.bitwidth
            });
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            throw error;
        }
    }
    
    stopRecording(): void {
        console.log('🛑 Stopping recording...');
        
        this.isRecording = false;
        
        if (this.micInstance) {
            this.micInstance.stop();
            this.micInstance = null;
        }
        
        if (this.micInputStream) {
            this.micInputStream.destroy();
            this.micInputStream = null;
        }
        
        console.log('✅ Recording stopped');
    }
    
    disconnectWebSocket(): void {
        if (this.isRecording) {
            this.stopRecording();
        }
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.isConnected = false;
        console.log('🔌 Disconnected from AssemblyAI');
    }
    
    getTranscripts(): TranscriptResult[] {
        return [...this.transcripts];
    }
    
    getFinalTranscripts(): TranscriptResult[] {
        return this.transcripts.filter(t => t.isFinal);
    }
    
    getAnalytics() {
        const avgConfidence = this.confidenceCount > 0 ? 
            (this.confidenceSum / this.confidenceCount * 100) : 0;
        
        const sessionDuration = this.sessionStartTime ? 
            Date.now() - this.sessionStartTime.getTime() : 0;
        
        return {
            totalCount: this.totalCount,
            finalCount: this.finalCount,
            partialCount: this.totalCount - this.finalCount,
            avgConfidence: avgConfidence,
            sessionDuration: sessionDuration,
            sessionStartTime: this.sessionStartTime,
            isRecording: this.isRecording,
            isConnected: this.isConnected
        };
    }
    
    clearTranscripts(): void {
        this.transcripts = [];
        this.totalCount = 0;
        this.finalCount = 0;
        this.confidenceSum = 0;
        this.confidenceCount = 0;
        console.log('🗑️ Transcripts cleared');
    }
    
    async saveTranscriptsToFile(filename?: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputFile = filename || `realtime_transcripts_${timestamp}.json`;
        
        const data = {
            session: {
                startTime: this.sessionStartTime,
                endTime: new Date(),
                duration: this.sessionStartTime ? Date.now() - this.sessionStartTime.getTime() : 0,
                analytics: this.getAnalytics()
            },
            transcripts: this.transcripts,
            finalTranscripts: this.getFinalTranscripts()
        };
        
        const fs = await import('fs/promises');
        await fs.writeFile(outputFile, JSON.stringify(data, null, 2));
        
        console.log(`💾 Transcripts saved to: ${outputFile}`);
        return outputFile;
    }
}

// Demo function to test the realtime transcription
async function runRealtimeDemo() {
    console.log('🎤 Real-time Microphone Transcription Demo');
    console.log('==========================================');
    
    // Get API key from environment or prompt
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
        console.error('❌ Please set ASSEMBLYAI_API_KEY environment variable');
        process.exit(1);
    }
    
    const transcriber = new RealtimeMicrophoneTranscriber(apiKey);
    
    try {
        // Connect to AssemblyAI
        await transcriber.connectWebSocket();
        console.log('✅ Connected to AssemblyAI WebSocket');
        
        // Start recording
        await transcriber.startRecording();
        
        // Record for a specified duration or until interrupted
        console.log('\n🎙️ Recording for 30 seconds... Press Ctrl+C to stop early');
        console.log('💬 Start speaking now!\n');
        
        // Set up graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n\n🛑 Stopping recording...');
            transcriber.stopRecording();
            
            // Wait a moment for final transcripts
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show final analytics
            const analytics = transcriber.getAnalytics();
            console.log('\n📊 Final Analytics:');
            console.log('===================');
            console.log(`Total transcripts: ${analytics.totalCount}`);
            console.log(`Final transcripts: ${analytics.finalCount}`);
            console.log(`Partial transcripts: ${analytics.partialCount}`);
            console.log(`Average confidence: ${analytics.avgConfidence.toFixed(1)}%`);
            console.log(`Session duration: ${(analytics.sessionDuration / 1000).toFixed(1)}s`);
            
            // Save transcripts
            const filename = await transcriber.saveTranscriptsToFile();
            console.log(`\n💾 Transcripts saved to: ${filename}`);
            
            // Disconnect
            transcriber.disconnectWebSocket();
            console.log('\n👋 Demo completed successfully!');
            process.exit(0);
        });
        
        // Auto-stop after 30 seconds
        setTimeout(async () => {
            console.log('\n⏰ 30 seconds reached, stopping recording...');
            process.kill(process.pid, 'SIGINT');
        }, 30000);
        
        // Keep the process running
        await new Promise(() => {});
        
    } catch (error) {
        console.error('❌ Demo failed:', error);
        transcriber.disconnectWebSocket();
        process.exit(1);
    }
}

// Export the class and demo function
export { RealtimeMicrophoneTranscriber, runRealtimeDemo };

// Run demo if this file is executed directly
if (require.main === module) {
    runRealtimeDemo().catch(console.error);
} 