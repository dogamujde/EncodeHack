# 🎤 How to Use Real-time Transcription

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Server
```bash
cd /Users/dogamujde/Documents/live-coach
node server.js
```

You should see:
```
🚀 Reflectly Server Started!
================================
📡 Server running at: http://localhost:3000
🎤 Real-time transcription ready!
```

### Step 2: Open in Browser
1. Open your web browser
2. Go to: **http://localhost:3000**
3. You'll see the real-time transcription interface

### Step 3: Use the App
1. **Enter API Key**: `48d9e34327bb4f9f89442606b3439aa0`
2. **Click "Connect to AssemblyAI"** (should work without CORS errors now)
3. **Click "Start Recording"** 
4. **Start speaking** - you'll see live transcription!

## 🔧 What This Fixes

**Before**: Direct browser → AssemblyAI = ❌ CORS Error
**After**: Browser → Local Server → AssemblyAI = ✅ Works!

The local server acts as a proxy to handle the CORS restrictions.

## 🎯 Features Available

- ✅ **Real-time Speech-to-Text**: Live transcription as you speak
- ✅ **Audio Visualization**: See your voice waveform
- ✅ **Confidence Scores**: See how accurate each transcript is
- ✅ **Session Analytics**: Track words, final vs partial transcripts
- ✅ **Beautiful UI**: Glassmorphism design with smooth animations

## 🛑 To Stop
Press `Ctrl+C` in the terminal where the server is running.

## 🚨 Troubleshooting

**Server won't start?**
```bash
# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9
node server.js
```

**Still getting CORS errors?**
- Make sure you're accessing `http://localhost:3000` (not opening the HTML file directly)
- Check that the server is running in the terminal

**No audio detected?**
- Allow microphone permissions when prompted
- Check your system audio settings
- Try speaking louder or closer to the microphone

---

**That's it! Your real-time transcription should now work perfectly! 🎉** 

## How to Run

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start the server**:
    ```bash
    npm run dev
    ```
    You should see the following output:
    ```
    🚀 Reflectly Server Started!
    ```
3.  **Open the web interface**:
    - Navigate to `http://localhost:3000` in your web browser. 