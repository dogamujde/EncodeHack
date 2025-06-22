# vibeHack Integration with Reflectly

This document explains how to use the vibeHack AI monitoring system integrated into your Reflectly project.

## What is vibeHack?

vibeHack is an AI agent monitoring and learning system that:

- **🔍 Monitors Cursor AI interactions** - Tracks every AI suggestion and response automatically
- **🤖 Analyzes code quality** - Uses GPT-4o-mini to detect issues in real-time
- **📚 Learns from failures** - Automatically generates .cursorrules from failed suggestions
- **📊 Provides observability** - Uses Opik for comprehensive tracing and monitoring
- **🔄 Auto-detects changes** - Watches filesystem for AI-generated code modifications

## Quick Setup

1. **Run the setup script:**
   ```bash
   chmod +x setup-vibehack.sh
   ./setup-vibehack.sh
   ```

2. **Add your API keys to `vibeHack/.env`:**
   ```bash
   OPENAI_API_KEY=your-openai-api-key-here
   OPIK_API_KEY=your-opik-api-key-here
   ```

3. **Start Reflectly with AI monitoring:**
   ```bash
   npm run dev
   ```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Reflectly with AI monitoring enabled |
| `npm run monitor:start` | Start AI monitoring system separately |
| `npm run monitor:test` | Test the monitoring system |
| `npm run monitor:stats` | Get current monitoring statistics |
| `npm run setup:vibe-monitor` | Install Python dependencies |

## How It Works

### Automatic Monitoring
The vibeHack system automatically:
1. **Detects file changes** made by Cursor AI
2. **Logs each AI suggestion** with context and code
3. **Analyzes code quality** using GPT-4o-mini
4. **Generates cursor rules** from failed suggestions
5. **Tracks success/failure rates** over time

### Integration with Reflectly
The integration provides:
- **Transcript analysis monitoring** - Track AI suggestions for improving transcription
- **Speaker analysis enhancements** - Monitor AI-generated speaker detection improvements
- **Real-time feedback** - Get immediate analysis of AI-generated code
- **Learning from mistakes** - Automatically improve Cursor rules based on failures

## Usage Examples

### Basic AI Monitoring
```typescript
import { AIMonitorIntegration } from './src/aiMonitor';

const aiMonitor = new AIMonitorIntegration({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  opikApiKey: process.env.OPIK_API_KEY!
});

// Log an AI suggestion
const suggestionId = await aiMonitor.logAISuggestion(
  'Improve speaker detection',
  'AI suggested adding sentiment analysis',
  'const sentiment = analyzeSentiment(transcript);',
  'Enhancing analyzeTwoSpeakers.ts'
);

// Mark as successful or failed
await aiMonitor.markSuggestionSuccessful(suggestionId);
// or
await aiMonitor.markSuggestionFailed(suggestionId, 'TypeError: undefined', 'RuntimeError');
```

### Enhanced Transcription with AI Monitoring
```typescript
import { TranscriptionWithAIMonitoring } from './src/transcriptionWithAI';

const transcriptionAI = new TranscriptionWithAIMonitoring();

// Analyze transcript with AI monitoring
const analysis = await transcriptionAI.analyzeTranscriptWithAIMonitoring(
  './two_speaker_transcript.json'
);

// Get AI monitoring statistics
const stats = await transcriptionAI.getAIStats();
console.log('Success rate:', stats?.successRate);
```

## Monitoring Dashboard

The system provides real-time statistics:
- **Total suggestions** tracked
- **Success/failure rates**
- **Most common failure patterns**
- **Generated cursor rules**
- **Code quality trends**

## Generated Cursor Rules

Failed AI suggestions automatically generate new `.cursorrules` entries like:

```markdown
# Rule Generated from Failed Suggestion - 2025-01-27 10:30:00
# Original Query: Improve transcript analysis...
# Error: TypeError: Cannot read property 'words' of undefined...

## Always check for transcript.words existence before processing
- Before accessing transcript.words, always verify it exists
- Add proper null/undefined checks for transcript data
- Use optional chaining: transcript.words?.length

### Example:
```typescript
// ❌ Wrong
const words = transcript.words;

// ✅ Correct  
const words = transcript.words || [];
if (words.length === 0) {
  throw new Error('No word data found');
}
```

## Benefits

### For Development
- **Faster debugging** - Immediate feedback on AI suggestions
- **Better code quality** - Automatic detection of issues
- **Learning system** - Continuously improving cursor rules
- **Observability** - Complete visibility into AI interactions

### For Reflectly Project
- **Enhanced transcription** - AI-monitored speaker analysis
- **Quality assurance** - Automatic testing of AI-generated improvements
- **Pattern recognition** - Learn from successful/failed approaches
- **Continuous improvement** - Self-updating development guidelines

## Troubleshooting

### Common Issues

1. **Python dependencies not found**
   ```bash
   cd vibeHack
   pip3 install -r requirements.txt
   ```

2. **API keys not configured**
   - Check `vibeHack/.env` file exists
   - Verify API keys are valid
   - Ensure no trailing spaces in .env values

3. **Monitoring not starting**
   ```bash
   npm run monitor:test
   ```

4. **Permission issues on macOS/Linux**
   ```bash
   chmod +x setup-vibehack.sh
   ```

### Logs and Debugging
- Monitor logs appear in console with `🤖 AI Monitor:` prefix
- Failed suggestions are logged with detailed error information
- Check `vibeHack/.cursorrules` for generated rules
- Use `npm run monitor:stats` for current statistics

## Advanced Usage

### Custom Analysis Integration
You can integrate vibeHack monitoring into any part of your Reflectly workflow:

```typescript
// In your existing transcription functions
const suggestionId = await aiMonitor.logAISuggestion(
  'Process interview transcript',
  'AI analyzing speaker patterns and sentiment',
  codeSnippet,
  `File: ${transcriptPath}`
);

try {
  const result = await yourAnalysisFunction();
  await aiMonitor.markSuggestionSuccessful(suggestionId);
} catch (error) {
  await aiMonitor.markSuggestionFailed(suggestionId, error.message);
}
```

### Pattern Analysis
```typescript
// Analyze failure patterns to improve cursor rules
const patterns = await aiMonitor.analyzeFailurePatterns();
console.log('Common failure patterns:', patterns);
```

## Contributing

To extend the vibeHack integration:
1. Add new monitoring points in your TypeScript code
2. Enhance the `AIMonitorIntegration` class for new features
3. Update Python scripts in `vibeHack/` for advanced analysis
4. Contribute improvements back to the vibeHack project

## Support

For issues with:
- **Integration**: Check this README and troubleshooting section
- **vibeHack core**: Check the `vibeHack/README.md` file
- **Reflectly features**: See main project README

## License

This integration maintains the same license as both the Reflectly project and vibeHack system. 