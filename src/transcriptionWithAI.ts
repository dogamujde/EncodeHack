import { AIMonitorIntegration } from './aiMonitor';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Enhanced transcription workflow with AI monitoring integration
 * This shows how to combine your existing transcription features with vibeHack monitoring
 */
export class TranscriptionWithAIMonitoring {
  private aiMonitor: AIMonitorIntegration | null = null;

  constructor() {
    this.initializeAIMonitoring();
  }

  private async initializeAIMonitoring() {
    const openaiKey = process.env.OPENAI_API_KEY;
    const opikKey = process.env.OPIK_API_KEY;

    if (openaiKey && opikKey) {
      this.aiMonitor = new AIMonitorIntegration({
        openaiApiKey: openaiKey,
        opikApiKey: opikKey,
        logLevel: 'INFO'
      });
    }
  }

  /**
   * Example: Enhanced speaker analysis with AI monitoring
   */
  async analyzeTranscriptWithAIMonitoring(transcriptPath: string) {
    console.log('🎤 Starting enhanced transcript analysis with AI monitoring...');
    
    try {
      // Log the AI suggestion for transcript analysis
      let suggestionId: number | null = null;
      
      if (this.aiMonitor) {
        suggestionId = await this.aiMonitor.logAISuggestion(
          'Analyze transcript for speaker insights',
          'AI will analyze transcript for speaker patterns, sentiment, and conversation flow',
          'await analyzeTranscriptWithAIMonitoring(transcriptPath)',
          `Processing: ${transcriptPath}`
        );
      }

      // Load and analyze transcript
      const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'));
      const analysis = await this.performEnhancedAnalysis(transcript);

      // If analysis was successful, mark the AI suggestion as successful
      if (this.aiMonitor && suggestionId !== null) {
        await this.aiMonitor.markSuggestionSuccessful(suggestionId);
      }

      return analysis;

    } catch (error) {
      console.error('❌ Transcript analysis failed:', error);
      
      // Mark the AI suggestion as failed with error details
      if (this.aiMonitor && suggestionId !== null) {
        await this.aiMonitor.markSuggestionFailed(
          suggestionId,
          error instanceof Error ? error.message : 'Unknown error',
          'TranscriptAnalysisError'
        );
      }
      
      throw error;
    }
  }

  /**
   * Example enhanced analysis that could be monitored by AI
   */
  private async performEnhancedAnalysis(transcript: any) {
    const words = transcript.words || [];
    
    if (words.length === 0) {
      throw new Error('No word data found in transcript');
    }

    // Simulate AI-enhanced analysis
    const speakers = [...new Set(words.map((w: any) => w.speaker))];
    const analysis = {
      speakerCount: speakers.length,
      totalWords: words.length,
      duration: this.calculateDuration(words),
      speakerAnalysis: this.analyzeSpeakers(words),
      sentimentAnalysis: this.analyzeSentiment(words),
      conversationFlow: this.analyzeConversationFlow(words),
      keyTopics: this.extractKeyTopics(words),
      timestamp: new Date().toISOString()
    };

    console.log('✅ Enhanced analysis completed:', {
      speakers: analysis.speakerCount,
      words: analysis.totalWords,
      duration: `${analysis.duration.toFixed(1)}s`
    });

    return analysis;
  }

  private calculateDuration(words: any[]): number {
    if (words.length === 0) return 0;
    return (words[words.length - 1].end - words[0].start) / 1000;
  }

  private analyzeSpeakers(words: any[]) {
    const speakers: Record<string, any> = {};
    
    for (const word of words) {
      if (!speakers[word.speaker]) {
        speakers[word.speaker] = {
          wordCount: 0,
          totalDuration: 0,
          segments: 0
        };
      }
      speakers[word.speaker].wordCount++;
    }

    return speakers;
  }

  private analyzeSentiment(words: any[]) {
    // Placeholder for sentiment analysis
    // In real implementation, this could use AI services
    return {
      overall: 'neutral',
      confidence: 0.75,
      emotional_patterns: ['professional', 'conversational']
    };
  }

  private analyzeConversationFlow(words: any[]) {
    // Analyze speaker transitions
    let transitions = 0;
    let currentSpeaker = '';
    
    for (const word of words) {
      if (word.speaker !== currentSpeaker) {
        transitions++;
        currentSpeaker = word.speaker;
      }
    }

    return {
      speakerTransitions: transitions,
      interactionLevel: transitions > 20 ? 'high' : transitions > 10 ? 'medium' : 'low'
    };
  }

  private extractKeyTopics(words: any[]) {
    // Placeholder for topic extraction
    // Could be enhanced with AI-powered topic modeling
    const text = words.map((w: any) => w.text).join(' ');
    const commonWords = this.findCommonWords(text);
    
    return {
      topWords: commonWords.slice(0, 10),
      estimatedTopics: ['interview', 'professional', 'experience']
    };
  }

  private findCommonWords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const wordCount: Record<string, number> = {};
    
    // Filter out common stop words
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);
    
    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .map(([word]) => word);
  }

  /**
   * Get AI monitoring statistics
   */
  async getAIStats() {
    if (this.aiMonitor) {
      return await this.aiMonitor.getMonitoringStats();
    }
    return null;
  }

  /**
   * Analyze AI failure patterns
   */
  async analyzeAIPatterns() {
    if (this.aiMonitor) {
      return await this.aiMonitor.analyzeFailurePatterns();
    }
    return 'AI monitoring not initialized';
  }
}

// Example usage function
export async function runTranscriptionWithAIExample() {
  console.log('🚀 Running transcription with AI monitoring example...');
  
  const transcriptionAI = new TranscriptionWithAIMonitoring();
  
  try {
    // Example with existing transcript
    const transcriptPath = './two_speaker_transcript.json';
    
    if (fs.existsSync(transcriptPath)) {
      const analysis = await transcriptionAI.analyzeTranscriptWithAIMonitoring(transcriptPath);
      console.log('📊 Analysis results:', {
        speakers: analysis.speakerCount,
        words: analysis.totalWords,
        duration: analysis.duration,
        sentiment: analysis.sentimentAnalysis.overall
      });
      
      // Get AI monitoring stats
      const aiStats = await transcriptionAI.getAIStats();
      if (aiStats) {
        console.log('🤖 AI Monitoring Stats:', aiStats);
      }
      
    } else {
      console.log('⚠️ No transcript file found at:', transcriptPath);
    }
    
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Export for use in other files
export default TranscriptionWithAIMonitoring; 