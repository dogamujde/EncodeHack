// The getAccessToken function is now a standalone script that runs automatically
// This index.ts file can be used to import and run other functionality

import './getAccessToken'; // This will execute the getAccessToken function
import { AIMonitorIntegration } from './aiMonitor';
import dotenv from 'dotenv';
import express from 'express';
import { track_agent_suggestion } from './agent_learning_system';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Reflectly application with AI monitoring...');

const app = express();
const port = 3000;

// Initialize AI monitoring if API keys are available
async function initializeAIMonitoring() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const opikKey = process.env.OPIK_API_KEY;

  if (openaiKey && opikKey) {
    try {
      console.log('🤖 Initializing AI monitoring system...');
      
      const aiMonitor = new AIMonitorIntegration({
        openaiApiKey: openaiKey,
        opikApiKey: opikKey,
        logLevel: 'INFO'
      });

      // Test the monitoring system
      const testResult = await aiMonitor.testMonitoring();
      if (testResult) {
        console.log('✅ AI monitoring system test passed');
        
        // Start monitoring
        await aiMonitor.startMonitoring();
        
        // Log initial system startup
        await aiMonitor.logAISuggestion(
          'System startup',
          'Reflectly application started with AI monitoring enabled',
          '',
          'Application initialization'
        );

        // Get and display current stats
        const stats = await aiMonitor.getMonitoringStats();
        console.log('📊 AI Monitoring Stats:', {
          total: stats.totalSuggestions,
          successful: stats.successful,
          failed: stats.failed,
          successRate: `${stats.successRate.toFixed(1)}%`
        });

        return aiMonitor;
      } else {
        console.log('⚠️ AI monitoring test failed, continuing without monitoring');
      }
    } catch (error) {
      console.error('❌ Failed to initialize AI monitoring:', error);
    }
  } else {
    console.log('ℹ️ AI monitoring disabled - missing API keys (OPENAI_API_KEY, OPIK_API_KEY)');
    console.log('   Add these to your .env file to enable AI monitoring');
  }

  return null;
}

// Example of how to integrate AI monitoring with your transcription workflows
async function demonstrateAIIntegration() {
  const aiMonitor = await initializeAIMonitoring();
  
  if (aiMonitor) {
    console.log('\n🎯 AI monitoring is now active and will:');
    console.log('   - Track all Cursor AI suggestions automatically');
    console.log('   - Analyze code quality in real-time');
    console.log('   - Generate .cursorrules from failed suggestions');
    console.log('   - Provide observability through Opik');
    console.log('   - Learn from patterns to improve future suggestions');
    
    // Example: Log a hypothetical AI interaction
    try {
      const suggestionId = await aiMonitor.logAISuggestion(
        'Improve transcription analysis',
        'AI suggested adding sentiment analysis to speaker detection',
        'const sentiment = analyzeSentiment(transcript);',
        'Enhancing analyzeTwoSpeakers.ts functionality'
      );
      
      // Simulate marking it as successful after implementation
      setTimeout(async () => {
        await aiMonitor.markSuggestionSuccessful(suggestionId);
        console.log('🎉 Example AI suggestion marked as successful!');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to demonstrate AI integration:', error);
    }
  }
}

// Main application flow
async function main() {
  try {
    // Initialize AI monitoring
    await demonstrateAIIntegration();
    
    console.log('\n💡 Available commands:');
    console.log('   npm run monitor:start  - Start AI monitoring');
    console.log('   npm run monitor:test   - Test monitoring system');
    console.log('   npm run monitor:stats  - Get monitoring statistics');
    console.log('   npm run dev           - Run Reflectly in development');
    console.log('   npm run build         - Build the project');
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
  }
}

// Run the main function
main().catch(console.error); 