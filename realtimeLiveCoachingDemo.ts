import { RealtimeMicrophoneTranscriber } from './realtimeMicrophoneNode';
import { analyzeTranscriptSentiment } from './sentimentAnalysis';
import { analyzeQuestionRatio } from './questionRatioAnalysis';
import { analyzeOverlappingTimestamps } from './overlappingAnalysis';

interface CoachingFeedback {
    type: 'sentiment' | 'question' | 'pace' | 'confidence' | 'engagement';
    level: 'positive' | 'neutral' | 'warning' | 'critical';
    message: string;
    suggestion?: string;
    timestamp: Date;
}

interface LiveCoachingSession {
    sessionId: string;
    startTime: Date;
    endTime?: Date;
    transcriber: RealtimeMicrophoneTranscriber;
    feedbacks: CoachingFeedback[];
    analytics: {
        totalWords: number;
        averageConfidence: number;
        sentimentScore: number;
        questionRatio: number;
        speakingPace: number; // words per minute
    };
}

class LiveCoachingSystem {
    private session: LiveCoachingSession | null = null;
    private feedbackInterval: NodeJS.Timeout | null = null;
    private readonly FEEDBACK_INTERVAL_MS = 10000; // 10 seconds
    
    constructor(private apiKey: string) {}
    
    async startCoachingSession(sessionType: 'interview' | 'presentation' | 'sales' | 'general' = 'general'): Promise<string> {
        if (this.session) {
            throw new Error('A coaching session is already active. Stop the current session first.');
        }
        
        const sessionId = `coaching_${sessionType}_${Date.now()}`;
        console.log(`🎯 Starting Live Coaching Session: ${sessionId}`);
        console.log(`📝 Session Type: ${sessionType.toUpperCase()}`);
        console.log('='.repeat(50));
        
        // Initialize transcriber
        const transcriber = new RealtimeMicrophoneTranscriber(this.apiKey);
        
        // Create session
        this.session = {
            sessionId,
            startTime: new Date(),
            transcriber,
            feedbacks: [],
            analytics: {
                totalWords: 0,
                averageConfidence: 0,
                sentimentScore: 0,
                questionRatio: 0,
                speakingPace: 0
            }
        };
        
        try {
            // Connect and start recording
            await transcriber.connectWebSocket();
            await transcriber.startRecording();
            
            console.log('✅ Coaching session started successfully!');
            console.log('🎤 Microphone is active - Start speaking');
            console.log('🤖 AI Coach is listening and will provide feedback every 10 seconds');
            console.log('\n💡 Tips based on session type:');
            
            switch (sessionType) {
                case 'interview':
                    console.log('  • Speak clearly and confidently');
                    console.log('  • Answer questions thoroughly but concisely');
                    console.log('  • Maintain positive tone and enthusiasm');
                    break;
                case 'presentation':
                    console.log('  • Vary your speaking pace for emphasis');
                    console.log('  • Use pauses effectively');
                    console.log('  • Engage your audience with questions');
                    break;
                case 'sales':
                    console.log('  • Ask open-ended questions');
                    console.log('  • Listen actively to responses');
                    console.log('  • Build rapport and trust');
                    break;
                default:
                    console.log('  • Speak naturally and confidently');
                    console.log('  • Maintain good pacing');
                    console.log('  • Express yourself clearly');
            }
            
            console.log('\n🔄 Real-time feedback will appear below...\n');
            
            // Start periodic feedback analysis
            this.startFeedbackLoop();
            
            return sessionId;
            
        } catch (error) {
            this.session = null;
            throw error;
        }
    }
    
    private startFeedbackLoop(): void {
        this.feedbackInterval = setInterval(() => {
            this.analyzeAndProvideFeedback();
        }, this.FEEDBACK_INTERVAL_MS);
    }
    
    private async analyzeAndProvideFeedback(): Promise<void> {
        if (!this.session) return;
        
        const transcripts = this.session.transcriber.getFinalTranscripts();
        if (transcripts.length === 0) {
            console.log('⏳ Waiting for speech to analyze...');
            return;
        }
        
        // Get recent transcripts (last 30 seconds worth)
        const recentTime = Date.now() - 30000;
        const recentTranscripts = transcripts.filter(t => 
            t.timestamp.getTime() > recentTime
        );
        
        if (recentTranscripts.length === 0) {
            console.log('🔇 No recent speech detected - continue speaking for feedback');
            return;
        }
        
        console.log('\n🤖 AI Coach Analysis:');
        console.log('-'.repeat(30));
        
        try {
            // Combine recent transcript text
            const combinedText = recentTranscripts.map(t => t.text).join(' ');
            const wordCount = combinedText.split(/\s+/).length;
            
            // Update analytics
            this.updateSessionAnalytics(recentTranscripts, combinedText);
            
            // Perform various analyses
            await this.analyzeSentiment(combinedText);
            await this.analyzeQuestions(combinedText);
            await this.analyzePacing(recentTranscripts);
            await this.analyzeConfidence(recentTranscripts);
            
            // Show current session stats
            this.displaySessionStats();
            
            console.log('-'.repeat(30));
            console.log('💬 Continue speaking for more feedback...\n');
            
        } catch (error) {
            console.error('❌ Analysis error:', error);
        }
    }
    
    private updateSessionAnalytics(transcripts: any[], text: string): void {
        if (!this.session) return;
        
        const words = text.split(/\s+/).length;
        const avgConfidence = transcripts.reduce((sum, t) => sum + t.confidence, 0) / transcripts.length;
        const sessionDuration = (Date.now() - this.session.startTime.getTime()) / 1000 / 60; // minutes
        
        this.session.analytics.totalWords += words;
        this.session.analytics.averageConfidence = avgConfidence;
        this.session.analytics.speakingPace = this.session.analytics.totalWords / Math.max(sessionDuration, 0.1);
    }
    
    private async analyzeSentiment(text: string): Promise<void> {
        if (!this.session) return;
        
        // Create temporary transcript file for analysis
        const tempTranscript = {
            transcript: [{ text, speaker: 'Speaker' }]
        };
        
        // Use our existing sentiment analysis
        const fs = await import('fs/promises');
        const tempFile = `temp_sentiment_${Date.now()}.json`;
        await fs.writeFile(tempFile, JSON.stringify(tempTranscript, null, 2));
        
        try {
            const sentimentResult = await analyzeTranscriptSentiment(tempFile);
            const overallSentiment = sentimentResult.overall_sentiment;
            
            this.session.analytics.sentimentScore = overallSentiment.positive_percentage;
            
            let feedback: CoachingFeedback;
            
            if (overallSentiment.positive_percentage > 70) {
                feedback = {
                    type: 'sentiment',
                    level: 'positive',
                    message: `🌟 Excellent positive tone! (${overallSentiment.positive_percentage.toFixed(1)}% positive)`,
                    suggestion: 'Keep up this enthusiastic energy!',
                    timestamp: new Date()
                };
            } else if (overallSentiment.positive_percentage < 30) {
                feedback = {
                    type: 'sentiment',
                    level: 'warning',
                    message: `⚠️ Tone could be more positive (${overallSentiment.positive_percentage.toFixed(1)}% positive)`,
                    suggestion: 'Try using more positive language and enthusiastic expressions',
                    timestamp: new Date()
                };
            } else {
                feedback = {
                    type: 'sentiment',
                    level: 'neutral',
                    message: `😊 Balanced tone (${overallSentiment.positive_percentage.toFixed(1)}% positive)`,
                    suggestion: 'Consider adding more enthusiasm for key points',
                    timestamp: new Date()
                };
            }
            
            this.session.feedbacks.push(feedback);
            console.log(`${this.getFeedbackIcon(feedback.level)} ${feedback.message}`);
            if (feedback.suggestion) {
                console.log(`   💡 ${feedback.suggestion}`);
            }
            
        } finally {
            // Clean up temp file
            await fs.unlink(tempFile).catch(() => {});
        }
    }
    
    private async analyzeQuestions(text: string): Promise<void> {
        if (!this.session) return;
        
        // Simple question detection
        const questionMarkers = ['?', 'what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should', 'do', 'did', 'does', 'is', 'are', 'was', 'were'];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const questions = sentences.filter(sentence => 
            sentence.includes('?') || 
            questionMarkers.some(marker => 
                sentence.toLowerCase().trim().startsWith(marker + ' ')
            )
        );
        
        const questionRatio = questions.length / Math.max(sentences.length, 1) * 100;
        this.session.analytics.questionRatio = questionRatio;
        
        let feedback: CoachingFeedback;
        
        if (questionRatio > 30) {
            feedback = {
                type: 'question',
                level: 'positive',
                message: `❓ Great use of questions! (${questionRatio.toFixed(1)}% question ratio)`,
                suggestion: 'Questions help engage your audience effectively',
                timestamp: new Date()
            };
        } else if (questionRatio < 10) {
            feedback = {
                type: 'question',
                level: 'warning',
                message: `🤔 Consider asking more questions (${questionRatio.toFixed(1)}% question ratio)`,
                suggestion: 'Questions can help engage your audience and gather feedback',
                timestamp: new Date()
            };
        } else {
            feedback = {
                type: 'question',
                level: 'neutral',
                message: `❓ Moderate question usage (${questionRatio.toFixed(1)}% question ratio)`,
                timestamp: new Date()
            };
        }
        
        this.session.feedbacks.push(feedback);
        console.log(`${this.getFeedbackIcon(feedback.level)} ${feedback.message}`);
        if (feedback.suggestion) {
            console.log(`   💡 ${feedback.suggestion}`);
        }
    }
    
    private async analyzePacing(transcripts: any[]): Promise<void> {
        if (!this.session || transcripts.length < 2) return;
        
        const timeSpan = (transcripts[transcripts.length - 1].timestamp.getTime() - transcripts[0].timestamp.getTime()) / 1000 / 60; // minutes
        const words = transcripts.map(t => t.text).join(' ').split(/\s+/).length;
        const wordsPerMinute = words / Math.max(timeSpan, 0.1);
        
        let feedback: CoachingFeedback;
        
        if (wordsPerMinute > 180) {
            feedback = {
                type: 'pace',
                level: 'warning',
                message: `⚡ Speaking quite fast (${wordsPerMinute.toFixed(0)} WPM)`,
                suggestion: 'Try slowing down slightly for better clarity and emphasis',
                timestamp: new Date()
            };
        } else if (wordsPerMinute < 120) {
            feedback = {
                type: 'pace',
                level: 'warning',
                message: `🐌 Speaking quite slowly (${wordsPerMinute.toFixed(0)} WPM)`,
                suggestion: 'Consider picking up the pace slightly to maintain engagement',
                timestamp: new Date()
            };
        } else {
            feedback = {
                type: 'pace',
                level: 'positive',
                message: `⏱️ Good speaking pace (${wordsPerMinute.toFixed(0)} WPM)`,
                suggestion: 'Maintain this comfortable speaking speed',
                timestamp: new Date()
            };
        }
        
        this.session.feedbacks.push(feedback);
        console.log(`${this.getFeedbackIcon(feedback.level)} ${feedback.message}`);
        if (feedback.suggestion) {
            console.log(`   💡 ${feedback.suggestion}`);
        }
    }
    
    private async analyzeConfidence(transcripts: any[]): Promise<void> {
        if (!this.session) return;
        
        const avgConfidence = transcripts.reduce((sum, t) => sum + t.confidence, 0) / transcripts.length * 100;
        
        let feedback: CoachingFeedback;
        
        if (avgConfidence > 90) {
            feedback = {
                type: 'confidence',
                level: 'positive',
                message: `🎯 Excellent speech clarity! (${avgConfidence.toFixed(1)}% confidence)`,
                suggestion: 'Your speech is very clear and well-articulated',
                timestamp: new Date()
            };
        } else if (avgConfidence < 70) {
            feedback = {
                type: 'confidence',
                level: 'warning',
                message: `🎙️ Speech clarity could improve (${avgConfidence.toFixed(1)}% confidence)`,
                suggestion: 'Try speaking more clearly and distinctly',
                timestamp: new Date()
            };
        } else {
            feedback = {
                type: 'confidence',
                level: 'neutral',
                message: `🎙️ Good speech clarity (${avgConfidence.toFixed(1)}% confidence)`,
                timestamp: new Date()
            };
        }
        
        this.session.feedbacks.push(feedback);
        console.log(`${this.getFeedbackIcon(feedback.level)} ${feedback.message}`);
        if (feedback.suggestion) {
            console.log(`   💡 ${feedback.suggestion}`);
        }
    }
    
    private getFeedbackIcon(level: string): string {
        switch (level) {
            case 'positive': return '✅';
            case 'neutral': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'critical': return '❌';
            default: return '📊';
        }
    }
    
    private displaySessionStats(): void {
        if (!this.session) return;
        
        const duration = (Date.now() - this.session.startTime.getTime()) / 1000 / 60;
        
        console.log('\n📊 Session Statistics:');
        console.log(`   ⏱️ Duration: ${duration.toFixed(1)} minutes`);
        console.log(`   📝 Total words: ${this.session.analytics.totalWords}`);
        console.log(`   🎯 Avg confidence: ${(this.session.analytics.averageConfidence * 100).toFixed(1)}%`);
        console.log(`   😊 Sentiment: ${this.session.analytics.sentimentScore.toFixed(1)}% positive`);
        console.log(`   ❓ Question ratio: ${this.session.analytics.questionRatio.toFixed(1)}%`);
        console.log(`   ⚡ Speaking pace: ${this.session.analytics.speakingPace.toFixed(0)} WPM`);
    }
    
    async stopCoachingSession(): Promise<string | null> {
        if (!this.session) {
            console.log('❌ No active coaching session to stop');
            return null;
        }
        
        console.log('\n🛑 Stopping coaching session...');
        
        // Stop feedback loop
        if (this.feedbackInterval) {
            clearInterval(this.feedbackInterval);
            this.feedbackInterval = null;
        }
        
        // Stop recording and disconnect
        this.session.transcriber.stopRecording();
        
        // Wait for final transcripts
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.session.endTime = new Date();
        const sessionDuration = this.session.endTime.getTime() - this.session.startTime.getTime();
        
        // Generate final report
        const reportFile = await this.generateFinalReport();
        
        console.log('\n🎯 Coaching Session Completed!');
        console.log('='.repeat(40));
        console.log(`📊 Session ID: ${this.session.sessionId}`);
        console.log(`⏱️ Duration: ${(sessionDuration / 1000 / 60).toFixed(1)} minutes`);
        console.log(`📝 Total Feedbacks: ${this.session.feedbacks.length}`);
        console.log(`💾 Report saved: ${reportFile}`);
        
        // Show final analytics
        this.displaySessionStats();
        
        // Disconnect WebSocket
        this.session.transcriber.disconnectWebSocket();
        
        const sessionId = this.session.sessionId;
        this.session = null;
        
        return reportFile;
    }
    
    private async generateFinalReport(): Promise<string> {
        if (!this.session) throw new Error('No active session');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = `coaching_report_${timestamp}.json`;
        
        const report = {
            session: {
                id: this.session.sessionId,
                startTime: this.session.startTime,
                endTime: this.session.endTime || new Date(),
                duration: this.session.endTime ? 
                    this.session.endTime.getTime() - this.session.startTime.getTime() : 
                    Date.now() - this.session.startTime.getTime()
            },
            analytics: this.session.analytics,
            feedbacks: this.session.feedbacks,
            transcripts: this.session.transcriber.getTranscripts(),
            finalTranscripts: this.session.transcriber.getFinalTranscripts(),
            summary: {
                totalFeedbacks: this.session.feedbacks.length,
                feedbacksByType: this.session.feedbacks.reduce((acc, f) => {
                    acc[f.type] = (acc[f.type] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                feedbacksByLevel: this.session.feedbacks.reduce((acc, f) => {
                    acc[f.level] = (acc[f.level] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            }
        };
        
        const fs = await import('fs/promises');
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        return reportFile;
    }
    
    getSessionStatus() {
        if (!this.session) {
            return { active: false };
        }
        
        return {
            active: true,
            sessionId: this.session.sessionId,
            startTime: this.session.startTime,
            duration: Date.now() - this.session.startTime.getTime(),
            analytics: this.session.analytics,
            feedbackCount: this.session.feedbacks.length
        };
    }
}

// Demo function
async function runLiveCoachingDemo() {
    console.log('🎯 Live Coaching System Demo');
    console.log('============================');
    
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
        console.error('❌ Please set ASSEMBLYAI_API_KEY environment variable');
        process.exit(1);
    }
    
    const coachingSystem = new LiveCoachingSystem(apiKey);
    
    try {
        // Start coaching session
        const sessionId = await coachingSystem.startCoachingSession('interview');
        
        // Set up graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n\n🛑 Shutting down coaching session...');
            const reportFile = await coachingSystem.stopCoachingSession();
            console.log('\n👋 Live coaching demo completed!');
            if (reportFile) {
                console.log(`📄 Full report available in: ${reportFile}`);
            }
            process.exit(0);
        });
        
        // Keep running until interrupted
        console.log('\n🎙️ Coaching session is active. Press Ctrl+C to stop.');
        await new Promise(() => {}); // Keep alive
        
    } catch (error) {
        console.error('❌ Demo failed:', error);
        process.exit(1);
    }
}

// Export everything
export { LiveCoachingSystem, CoachingFeedback, LiveCoachingSession };

// Run demo if executed directly
if (require.main === module) {
    runLiveCoachingDemo().catch(console.error);
} 