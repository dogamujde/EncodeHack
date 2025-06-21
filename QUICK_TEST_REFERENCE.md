# Quick Test Reference Card 🚀

## Immediate Actions to Test Features

### 1. 🎙️ Start Basic Test
```
1. Go to: http://localhost:3002/live-meeting
2. Allow microphone + camera permissions
3. Start speaking normally
4. ✅ See transcription in bottom-left panel
```

### 2. ⚡ Test Speed Feedback
```
Speak this VERY FAST (like an auctioneer):
"This is a test of speaking very quickly to trigger the speed feedback system that we implemented for real-time coaching during meetings"

✅ Should see yellow warning: "You're speaking too fast, slow down a bit!"
```

### 3. 🔊 Test Volume Feedback  
```
Whisper very quietly for 10+ seconds:
"Testing low volume feedback system"

✅ Should see red warning: "Speak a bit louder, your volume is low."
```

### 4. 📊 Test UI Elements
```
✅ Top-right: Status indicator (Monitoring → Coaching Active → Recent)
✅ Top-right: "Show History" button → feedback history panel
✅ Feedback overlay: Manual dismiss with ✕ button
✅ Blue professional theme throughout
```

### 5. 🔍 Console Debugging
```
F12 → Console → Look for:
✅ "🎤 Connected to AssemblyAI"
✅ "💡 Speed feedback triggered - WPM: X"
✅ "💡 Volume feedback triggered - Average volume: X"
```

---

## 🎯 30-Second Success Test

1. **Navigate**: `localhost:3002/live-meeting`
2. **Speak fast**: Trigger speed warning
3. **Speak quiet**: Trigger volume warning  
4. **Check history**: Click "Show History" button
5. **Verify status**: Watch status indicator change

**All working? You've successfully implemented live coaching! 🎉** 