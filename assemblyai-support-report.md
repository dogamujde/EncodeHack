# AssemblyAI Real-time Transcription Authorization Issue - Support Report

## Issue Summary
**Problem**: Real-time WebSocket transcription consistently returns "Not authorized" error despite valid API key that works perfectly for all other AssemblyAI services.

**API Key**: `48d9e34327bb4f9f89442606b3439aa0`
**Account Status**: Paid account with credits added
**Date**: June 20, 2025

## What Works ✅
- ✅ **Basic API**: File-based transcription works perfectly
- ✅ **File Upload**: Can upload and transcribe audio files successfully
- ✅ **Speaker Diarization**: Works on uploaded files
- ✅ **All Audio Intelligence features**: Sentiment analysis, etc. work
- ✅ **API Key Authentication**: Valid for all non-real-time endpoints

## What Doesn't Work ❌
- ❌ **Real-time WebSocket**: Returns "Not authorized" with error code 4001
- ❌ **All Auth Formats**: Tried standard, Bearer, token, api_key fields
- ❌ **All Sample Rates**: Tested 16000, 8000, and no sample rate parameter
- ❌ **Multiple Endpoints**: Tried different WebSocket URL variations

## Test Results

### Basic API Test (WORKING)
```bash
✅ SUCCESS: Basic API works
📝 Job ID: da512a62-5d93-4d76-a33c-1cac38e0de38
📊 Status: queued
```

### Real-time WebSocket Test (FAILING)
```bash
❌ Real-time error: Not authorized
🔌 Real-time closed: 4001
```

### Account Information
```bash
✅ SUCCESS: Alternative account endpoint
📊 Data: {} (empty but accessible)
```

## Detailed Test Output

### All Auth Format Tests Failed:
1. **Standard**: `{"authorization":"48d9e34327bb4f9f89442606b3439aa0"}` → "Not authorized"
2. **Token field**: `{"token":"48d9e34327bb4f9f89442606b3439aa0"}` → "Not authorized"  
3. **API Key field**: `{"api_key":"48d9e34327bb4f9f89442606b3439aa0"}` → "Not authorized"
4. **Bearer format**: `{"authorization":"Bearer 48d9e34327bb4f9f89442606b3439aa0"}` → "Not authorized"

### All WebSocket URLs Failed:
1. `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000` → 4001
2. `wss://api.assemblyai.com/v2/realtime/ws` → 4001  
3. `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=8000` → 4001

## Account Actions Taken
1. ✅ Generated new API key (current one: `48d9e34327bb4f9f89442606b3439aa0`)
2. ✅ Added credits/billing to account 
3. ✅ Confirmed API key works for file transcription
4. ✅ Successfully transcribed multi-speaker audio with 98.9% confidence

## Technical Details

### Working File Transcription Example
- **Audio**: "Job Interview _.mp3" (2 speakers, 381 words)
- **Job ID**: `96442b58-f7db-4581-bb22-dfc177b345a7`
- **Confidence**: 98.9%
- **Status**: Completed successfully

### Failed Real-time Connection
- **WebSocket URL**: `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000`
- **Auth Message**: `{"authorization":"48d9e34327bb4f9f89442606b3439aa0"}`
- **Response**: `{"error":"Not authorized"}`
- **Close Code**: 4001 (AuthFailed)

## Environment
- **Platform**: macOS 23.5.0
- **Node.js**: v23.10.0 (with native fetch)
- **WebSocket Library**: ws (Node.js)
- **Browser**: Also tested in Chrome with same results

## Code Samples

### Working Basic API Call
```javascript
const response = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
        'authorization': '48d9e34327bb4f9f89442606b3439aa0',
        'content-type': 'application/json'
    },
    body: JSON.stringify({
        audio_url: 'https://storage.googleapis.com/aai-docs-samples/nbc.mp3'
    })
});
// Returns 200 OK with valid job ID
```

### Failing Real-time WebSocket
```javascript
const ws = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000');
ws.onopen = () => {
    ws.send(JSON.stringify({
        authorization: '48d9e34327bb4f9f89442606b3439aa0'
    }));
};
ws.onmessage = (event) => {
    console.log(JSON.parse(event.data)); 
    // Returns: {"error":"Not authorized"}
};
// WebSocket closes with code 4001
```

## Research Findings
- Real-time transcription should be available on free tier (5 streams/minute limit)
- Error code 4001 specifically indicates "AuthFailed" 
- Same API key format works for all other endpoints
- Issue persists across different browsers, Node.js, and auth formats

## Hypothesis
This appears to be an account-level restriction where:
1. The API key is valid and has proper permissions for file-based transcription
2. Real-time transcription requires a separate permission/feature flag
3. Adding credits to account didn't automatically enable real-time access
4. There may be a manual approval process or account setting needed

## Request
Please investigate why real-time transcription is returning "Not authorized" for API key `48d9e34327bb4f9f89442606b3439aa0` when all other AssemblyAI features work perfectly with the same key.

**Specific questions:**
1. Does real-time transcription require separate account approval?
2. Is there a feature flag that needs to be enabled?
3. Are there additional steps beyond adding billing/credits?
4. Is this a known issue with recent account setups?

## Contact Information
- **Account API Key**: `48d9e34327bb4f9f89442606b3439aa0`
- **Test Date**: June 20, 2025
- **Priority**: High (blocking development of real-time features)

Thank you for your assistance in resolving this issue. 