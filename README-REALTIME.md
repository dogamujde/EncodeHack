# 🎤 Real-time Reflectly Transcription

This project now includes real-time microphone transcription capabilities with real-time feedback and analysis. You can capture audio from your microphone, send it to AssemblyAI for real-time transcription, and receive instant coaching feedback.

## Features
-   **Real-time Transcription**: Captures audio from your microphone and transcribes it in real-time.
-   **Speaker Diarization**: Identifies different speakers in the audio stream.
-   **Sentiment Analysis**: Analyzes the sentiment of the transcribed text.
-   **Real-time Feedback**: Provides instant feedback on your speaking performance.
-   **Token-based Authentication**: Uses temporary tokens for secure connection to AssemblyAI.

### Real-time Feedback Analysis
The system analyzes your speech and provides feedback on:
-   **Pacing**: Are you speaking too fast or too slow?
-   **Filler Words**: Are you using too many filler words like "um" or "uh"?
-   **Sentiment**: What is the overall sentiment of your speech?

## Demos
-   **Basic Real-time Demo**: `realtimeDemo.ts`
-   **Microphone Demo**: `realtimeMicrophone.ts` and `realtimeMicrophone.html`
-   **Real-time Feedback System**: Complete coaching platform with feedback loops

## How to Run

### Prerequisites
-   Node.js (v18 or higher)
-   An AssemblyAI account and API key

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/dogamujde/EncodeHack.git
    cd EncodeHack
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Demos

#### Basic Real-time Demo
This demo transcribes a local audio file in real-time.
```bash
npx tsx realtimeDemo.ts
```

#### Real-time Feedback System
This is the full real-time feedback system with advanced analysis.

1.  **Run the real-time feedback demo**:
    ```bash
    npx tsx realtimeLiveCoachingDemo.ts
    ```
2.  This will start a session and provide real-time feedback on your speech.

### Browser-based Demo
The `realtimeMicrophone.html` file provides a browser-based demo that you can open directly.
1.  Open `realtimeMicrophone.html` in your web browser.
2.  Enter your AssemblyAI API key.
3.  Click "Connect" and then "Start Recording".

### Real-time Feedback Analysis
The `realtimeLiveCoachingDemo.ts` script provides detailed analysis of your speech, including pacing, filler words, and sentiment. This analysis is printed to the console in real-time.

## 🌟 Features

### Real-time Transcription
- **WebSocket Connection**: Direct connection to AssemblyAI's real-time transcription API
- **Microphone Input**: Capture audio from your microphone in real-time
- **PCM Audio Processing**: Convert audio to 16-bit PCM format for optimal transcription
- **Live Feedback**: Get partial and final transcripts as you speak

### Live Coaching Analysis
- **Sentiment Analysis**: Real-time analysis of your tone and emotional expression
- **Question Ratio**: Track how often you ask questions (great for interviews/presentations)
- **Speaking Pace**: Monitor your words per minute for optimal delivery
- **Speech Clarity**: Get confidence scores for your articulation
- **Session Analytics**: Comprehensive statistics and insights

### Multiple Environments
- **Browser Version**: HTML page with Web Audio API integration
- **Node.js Version**: TypeScript implementation with microphone library
- **Live Coaching System**: Complete coaching platform with feedback loops

## 🚀 Quick Start

### Prerequisites

1. **AssemblyAI API Key**: Get your API key from [AssemblyAI](https://www.assemblyai.com/)
2. **Environment Setup**: Set your API key as an environment variable:
   ```bash
   export ASSEMBLYAI_API_KEY="your_api_key_here"
   ```

### Browser Version (HTML)

1. **Open the HTML file**:
   ```bash
   open realtimeMicrophone.html
   ```

2. **Enter your API key** in the configuration section

3. **Grant microphone permissions** when prompted

4. **Start transcribing**:
   - Click "Connect to AssemblyAI"
   - Click "Start Recording"
   - Start speaking!

### Node.js Version

1. **Install dependencies**:
   ```bash
   npm install ws mic
   ```

2. **Run the Node.js transcriber**:
   ```bash
   npx ts-node realtimeMicrophoneNode.ts
   ```

3. **Start speaking** - transcripts will appear in the console

### Live Coaching System

1. **Run the live coaching demo**:
   ```bash
   npx ts-node realtimeLiveCoachingDemo.ts
   ```

2. **Choose your session type** (interview, presentation, sales, general)

3. **Get real-time feedback** every 10 seconds while speaking

4. **Press Ctrl+C** to stop and generate a final report

## 📋 Available Scripts

### Basic Real-time Transcription
```bash
# Node.js version with microphone input
npx ts-node realtimeMicrophoneNode.ts

# Browser version
open realtimeMicrophone.html
```

### Live Coaching Analysis
```bash
# Full coaching system with real-time feedback
npx ts-node realtimeLiveCoachingDemo.ts

# Individual analysis tools (for recorded audio)
npx ts-node sentimentAnalysis.ts
npx ts-node questionRatioAnalysis.ts
npx ts-node overlappingAnalysis.ts
```

## 🎯 Coaching Session Types

### Interview Coaching
- **Focus**: Clear communication, positive tone, thorough answers
- **Metrics**: Confidence levels, sentiment analysis, question handling
- **Feedback**: Speaking pace, clarity, enthusiasm

### Presentation Coaching
- **Focus**: Audience engagement, pace variation, effective pauses
- **Metrics**: Question ratio, speaking pace, sentiment trends
- **Feedback**: Engagement techniques, delivery optimization

### Sales Coaching
- **Focus**: Question asking, active listening, rapport building
- **Metrics**: Question ratio, positive sentiment, interaction patterns
- **Feedback**: Conversation balance, persuasion techniques

### General Coaching
- **Focus**: Overall communication effectiveness
- **Metrics**: All-around analysis of speaking patterns
- **Feedback**: Comprehensive communication insights

## 📊 Real-time Analytics

### Live Metrics
- **Total Transcripts**: Count of partial + final transcripts
- **Final Transcripts**: Count of completed phrases
- **Average Confidence**: Speech recognition accuracy
- **Session Duration**: Real-time timer
- **Speaking Pace**: Words per minute calculation
- **Sentiment Score**: Positive/negative tone percentage
- **Question Ratio**: Percentage of questions in speech

### Coaching Feedback Types

1. **Sentiment Feedback**:
   - 🌟 Excellent positive tone (70%+ positive)
   - 😊 Balanced tone (30-70% positive)
   - ⚠️ Could be more positive (<30% positive)

2. **Question Feedback**:
   - ❓ Great use of questions (>30% question ratio)
   - 🤔 Consider asking more questions (<10% question ratio)
   - ❓ Moderate question usage (10-30% question ratio)

3. **Pace Feedback**:
   - ⚡ Speaking quite fast (>180 WPM)
   - 🐌 Speaking quite slowly (<120 WPM)
   - ⏱️ Good speaking pace (120-180 WPM)

4. **Confidence Feedback**:
   - 🎯 Excellent speech clarity (>90% confidence)
   - 🎙️ Good speech clarity (70-90% confidence)
   - 🎙️ Speech clarity could improve (<70% confidence)

## 🔧 Technical Implementation

### Audio Processing Pipeline

1. **Microphone Capture**:
   - Browser: `navigator.mediaDevices.getUserMedia()`
   - Node.js: `mic` library with system microphone access

2. **Audio Format Conversion**:
   - Sample Rate: 16kHz (optimal for AssemblyAI)
   - Channels: Mono (1 channel)
   - Format: 16-bit PCM
   - Chunk Size: 4096 samples

3. **WebSocket Communication**:
   - URL: `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000`
   - Authentication: API key in authorization header
   - Data: Raw PCM audio chunks sent as binary

4. **Real-time Analysis**:
   - Sentiment analysis using keyword-based detection
   - Question detection with linguistic markers
   - Pace calculation with time-windowed word counting
   - Confidence tracking from AssemblyAI responses

### File Structure

```
📁 Real-time Transcription Files
├── 🌐 realtimeMicrophone.html          # Browser version with Web Audio API
├── 🔧 realtimeMicrophoneNode.ts        # Node.js version with mic library
├── 🎯 realtimeLiveCoachingDemo.ts      # Complete coaching system
├── 📊 sentimentAnalysis.ts             # Sentiment analysis module
├── ❓ questionRatioAnalysis.ts         # Question detection module
├── ⏱️ overlappingAnalysis.ts           # Timing analysis module
└── 📋 README-REALTIME.md               # This documentation
```

## 🎨 Browser Features

### Modern UI Design
- **Glassmorphism**: Translucent cards with backdrop blur
- **Gradient Backgrounds**: Beautiful color transitions
- **Responsive Design**: Works on desktop and mobile
- **Real-time Visualizer**: Audio level bars that respond to your voice
- **Live Analytics**: Real-time statistics and confidence metrics

### Interactive Elements
- **Connection Status**: Visual indicators for WebSocket connection
- **Recording State**: Clear visual feedback when recording
- **Transcript Display**: Differentiated partial vs final transcripts
- **Audio Visualizer**: 50-bar audio level visualization
- **Analytics Cards**: Live updating statistics

## 🔒 Privacy & Security

### Data Handling
- **Local Storage**: API keys stored locally in browser
- **Secure Transmission**: All audio data sent over WSS (encrypted WebSocket)
- **No Persistence**: Audio data not stored on servers (real-time only)
- **Temporary Files**: Analysis creates temporary files that are auto-cleaned

### AssemblyAI Integration
- **Paid Feature**: Real-time transcription requires AssemblyAI paid account
- **High Accuracy**: Industry-leading speech recognition accuracy
- **Low Latency**: Near real-time transcription results
- **Reliable Service**: Enterprise-grade WebSocket infrastructure

## 🐛 Troubleshooting

### Common Issues

1. **"Paid feature required" error**:
   - Upgrade your AssemblyAI account to access real-time features
   - Free accounts only support file-based transcription

2. **Microphone access denied**:
   - Grant microphone permissions in your browser/system
   - Check browser security settings
   - Ensure HTTPS for browser version

3. **WebSocket connection fails**:
   - Verify your AssemblyAI API key is correct
   - Check your internet connection
   - Ensure firewall allows WebSocket connections

4. **Node.js microphone issues**:
   - Install system audio dependencies
   - Check microphone permissions in system settings
   - Try different audio devices

5. **Audio quality issues**:
   - Use a good quality microphone
   - Minimize background noise
   - Speak clearly and at consistent volume

### Browser Compatibility
- **Chrome**: Full support with Web Audio API
- **Firefox**: Full support with Web Audio API
- **Safari**: Supported with some limitations
- **Edge**: Full support with Web Audio API

### System Requirements
- **Node.js**: Version 16+ recommended
- **Operating System**: macOS, Windows, Linux
- **Microphone**: Any system microphone or headset
- **Internet**: Stable connection for WebSocket communication

## 📈 Performance Tips

### Optimal Audio Quality
- **Environment**: Quiet room with minimal echo
- **Microphone**: Use headset or dedicated microphone
- **Distance**: Speak 6-12 inches from microphone
- **Volume**: Consistent, moderate speaking volume

### Network Optimization
- **Stable Connection**: Use wired internet when possible
- **Bandwidth**: Ensure sufficient upload bandwidth
- **Latency**: Lower latency improves real-time experience

### System Performance
- **CPU Usage**: Real-time analysis is CPU intensive
- **Memory**: Keep other applications minimal during sessions
- **Audio Drivers**: Update audio drivers for best performance

## 🚀 Future Enhancements

### Planned Features
- **Multi-speaker Detection**: Separate analysis for different speakers
- **Custom Vocabulary**: Industry-specific terminology support
- **Advanced Analytics**: More sophisticated coaching metrics
- **Integration APIs**: Connect with other coaching platforms
- **Mobile Apps**: Native iOS/Android applications

### Extensibility
- **Plugin System**: Add custom analysis modules
- **Custom Feedback**: Define your own coaching criteria
- **Export Formats**: Multiple output formats for reports
- **Cloud Storage**: Save sessions to cloud providers

## 🤝 Contributing

We welcome contributions! Areas where you can help:
- **New Analysis Modules**: Add more coaching metrics
- **UI Improvements**: Enhance the browser interface
- **Platform Support**: Add support for new platforms
- **Documentation**: Improve guides and examples
- **Testing**: Add comprehensive test coverage

## 📄 License

This project is part of the live-coach system. Please refer to the main project license for usage terms.

---

🎤 **Happy Coaching!** Start your real-time transcription journey and improve your communication skills with AI-powered feedback! 