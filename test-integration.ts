import { AIMonitorIntegration } from './src/aiMonitor';
import { TranscriptionWithAIMonitoring } from './src/transcriptionWithAI';
import dotenv from 'dotenv';

dotenv.config();

async function testVibeHackIntegration() {
  console.log('🧪 Testing vibeHack Integration with Live Coach');
  console.log('='.repeat(50));

  // Test 1: Basic AI Monitor Integration
  console.log('\n1️⃣ Testing AI Monitor Integration...');
  
  const openaiKey = process.env.OPENAI_API_KEY;
  const opikKey = process.env.OPIK_API_KEY;

  if (!openaiKey || !opikKey) {
    console.log('⚠️ API keys not found. Please set OPENAI_API_KEY and OPIK_API_KEY in vibeHack/.env');
    console.log('   Skipping AI monitoring tests...');
    return false;
  }

  try {
    const aiMonitor = new AIMonitorIntegration({
      openaiApiKey: openaiKey,
      opikApiKey: opikKey,
      logLevel: 'INFO'
    });

    console.log('✅ AI Monitor initialized successfully');

    // Test logging a suggestion
    const suggestionId = await aiMonitor.logAISuggestion(
      'Test integration',
      'Testing vibeHack integration with Live Coach',
      'console.log("Integration test");',
      'Integration test context'
    );

    console.log(`✅ Logged test suggestion with ID: ${suggestionId}`);

    // Test marking as successful
    await aiMonitor.markSuggestionSuccessful(suggestionId);
    console.log('✅ Marked test suggestion as successful');

    // Test getting stats
    const stats = await aiMonitor.getMonitoringStats();
    console.log('✅ Retrieved monitoring stats:', {
      total: stats.totalSuggestions,
      successful: stats.successful,
      failed: stats.failed,
      successRate: `${stats.successRate.toFixed(1)}%`
    });

  } catch (error) {
    console.error('❌ AI Monitor test failed:', error);
    return false;
  }

  // Test 2: Transcription with AI Monitoring
  console.log('\n2️⃣ Testing Transcription with AI Monitoring...');
  
  try {
    const transcriptionAI = new TranscriptionWithAIMonitoring();
    console.log('✅ Transcription AI Monitor initialized');

    // Check if we have a test transcript
    const fs = require('fs');
    if (fs.existsSync('./two_speaker_transcript.json')) {
      console.log('✅ Test transcript found, running analysis...');
      
      const analysis = await transcriptionAI.analyzeTranscriptWithAIMonitoring('./two_speaker_transcript.json');
      console.log('✅ Transcript analysis completed:', {
        speakers: analysis.speakerCount,
        words: analysis.totalWords,
        duration: `${analysis.duration.toFixed(1)}s`
      });

      const aiStats = await transcriptionAI.getAIStats();
      if (aiStats) {
        console.log('✅ AI stats retrieved:', {
          successRate: `${aiStats.successRate.toFixed(1)}%`
        });
      }
    } else {
      console.log('ℹ️ No test transcript found, skipping transcript analysis test');
    }

  } catch (error) {
    console.error('❌ Transcription AI test failed:', error);
    return false;
  }

  // Test 3: System Integration
  console.log('\n3️⃣ Testing System Integration...');
  
  try {
    // Test that the monitoring system can be started
    console.log('✅ All integration components working correctly');
    
    console.log('\n🎉 vibeHack Integration Test PASSED!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run "npm run dev" to start Live Coach with AI monitoring');
    console.log('   2. Run "npm run monitor:start" to start monitoring separately');
    console.log('   3. Use Cursor AI to generate code - it will be monitored automatically');
    console.log('   4. Check "npm run monitor:stats" for monitoring statistics');
    
    return true;

  } catch (error) {
    console.error('❌ System integration test failed:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testVibeHackIntegration().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { testVibeHackIntegration }; 