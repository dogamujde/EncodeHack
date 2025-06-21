# Live Coach Testing Guide 🎯

## Overview
This guide will help you test all the live coaching features we implemented in your Teams-style pre-join screen with real-time feedback.

## 🚀 Quick Start

1. **Access the App**: Navigate to `http://localhost:3002/live-meeting`
2. **Grant Permissions**: Allow microphone and camera access when prompted
3. **Wait for Connection**: Look for the "Live Transcription" panel showing "Waiting for speech..."

## 🧪 Feature Testing Checklist

### ✅ 1. Real-time Transcription
**What to test**: AssemblyAI real-time speech-to-text
**How to test**:
- Start speaking normally
- Check the bottom-left "Live Transcription" panel
- You should see `[Partial]` text appearing as you speak
- Followed by `[Final]` text when you pause

**Expected behavior**:
- Green dot = Connected and working
- Red dot = Not connected
- Text updates in real-time

### ✅ 2. Speaking Speed Feedback
**What to test**: Automatic feedback when speaking too fast
**How to test**:
- Speak very quickly for 10-15 seconds (aim for 200+ words per minute)
- Try rapid-fire sentences like: "This is a test of speaking very quickly to trigger the speed feedback system that we implemented"

**Expected behavior**:
- Yellow warning overlay appears: "You're speaking too fast, slow down a bit!"
- ⚡ lightning icon shows
- Feedback auto-dismisses after 10 seconds
- Won't trigger again for 10 seconds (throttled)

### ✅ 3. Low Volume Feedback
**What to test**: Automatic feedback when speaking too quietly
**How to test**:
- Speak very quietly/whisper for several seconds
- Move further from microphone
- Speak at very low volume

**Expected behavior**:
- Red error overlay appears: "Speak a bit louder, your volume is low."
- 🔊 volume icon shows
- Feedback auto-dismisses after 10 seconds
- Won't trigger again for 10 seconds (throttled)

### ✅ 4. WebSocket Suggestion Handler
**What to test**: External coaching suggestions via WebSocket
**How to test**:
- Open browser developer console (F12)
- Run this test code:
```javascript
// Simulate receiving a coaching suggestion
const mockMessage = {
  data: JSON.stringify({
    suggestion: "Try to make more eye contact with the camera",
    type: "suggestion"
  })
};

// This would normally come from the WebSocket
// For testing, you can manually trigger it in the console
```

**Expected behavior**:
- Blue coaching overlay appears with suggestion
- 💡 lightbulb icon shows
- Feedback auto-dismisses after 10 seconds

### ✅ 5. Coaching Status Indicator
**What to test**: Visual status of coaching system
**How to test**:
- Look at top-right corner status indicator
- Trigger any feedback (speed/volume/suggestion)
- Watch status changes

**Expected behavior**:
- **Idle**: Gray dot, "Monitoring"
- **Active**: Blue pulsing dot, "Coaching Active" (during feedback)
- **Recent**: Yellow dot, "Recent Feedback" (after feedback dismissed)
- Returns to idle after 30 seconds

### ✅ 6. Feedback History Panel
**What to test**: Historical record of all coaching feedback
**How to test**:
- Click "Show History" button (top-right)
- Trigger multiple types of feedback
- Check history accumulates

**Expected behavior**:
- Panel shows last 10 feedback items
- Each item shows: icon, message, timestamp
- Color-coded by type (blue=suggestion, yellow=speed, red=volume)
- Counter shows total feedback count

### ✅ 7. Manual Feedback Dismissal
**What to test**: Ability to manually close feedback
**How to test**:
- Trigger any feedback
- Click the "✕" button on the overlay

**Expected behavior**:
- Feedback immediately disappears
- Status changes to "Recent"
- History is preserved

### ✅ 8. Professional Blue Theme
**What to test**: Visual design and styling
**How to test**:
- Check all overlays use blue color scheme
- Verify backdrop blur effects
- Test hover animations on buttons

**Expected behavior**:
- Blue primary color (#007bff)
- Light blue backgrounds (#e7f3ff)
- Smooth transitions and animations
- Professional, clean appearance

## 🔧 Advanced Testing

### Console Monitoring
Open browser console (F12) to see detailed logs:
- `🎤 Connected to AssemblyAI` - WebSocket connection
- `💡 Speed feedback triggered - WPM: X` - Speed analysis
- `💡 Volume feedback triggered - Average volume: X` - Volume analysis
- `💡 Suggestion received: X` - WebSocket suggestions

### Performance Testing
- **Multiple rapid triggers**: Try triggering feedback rapidly (should be throttled)
- **Long sessions**: Leave running for extended periods
- **Audio quality**: Test with different microphone distances/qualities

### Error Handling
- **No microphone**: Test without microphone access
- **Network issues**: Test with poor internet connection
- **Token expiry**: Test after 5 minutes (token expires)

## 🐛 Troubleshooting

### Common Issues
1. **No transcription**: Check microphone permissions
2. **No feedback**: Ensure you're speaking loud/fast enough to trigger thresholds
3. **WebSocket errors**: Check AssemblyAI API key in console
4. **LiveKit errors**: Check LiveKit configuration (this is expected for now)

### Debug Commands
```javascript
// Check if WebSocket is connected
console.log('WebSocket status:', ws.readyState);

// Manually trigger feedback for testing
handleSuggestion("Test feedback message", "suggestion");

// Check current volume levels
console.log('Current volume samples:', volumeSamples);

// Check speaking speed
console.log('Words per minute:', wpm);
```

## 📊 Success Criteria

You've successfully implemented all features if you can:
- ✅ See real-time transcription
- ✅ Trigger speed feedback by speaking fast
- ✅ Trigger volume feedback by speaking quietly  
- ✅ See status indicator changes
- ✅ View and dismiss feedback manually
- ✅ Access feedback history
- ✅ See professional blue-themed UI

## 🎉 Next Steps

Once testing is complete, you can:
1. Connect to real LiveKit rooms
2. Add more sophisticated coaching algorithms
3. Integrate with backend coaching AI
4. Add user preferences and settings
5. Implement coaching analytics and reporting

---

**Happy Testing! 🚀**

*All features are working in your localhost:3002 environment. The LiveKit room context error is expected since we're focusing on the coaching features first.* 