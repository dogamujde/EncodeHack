// Test Basic AssemblyAI API Access
// Run this in browser console on realtimeMicrophone.html

async function testBasicAPI() {
    console.log('🔍 Testing Basic AssemblyAI API Access');
    console.log('=====================================');
    
    const apiKey = document.getElementById('apiKey')?.value?.trim();
    if (!apiKey) {
        console.error('❌ Please enter your API key first');
        return;
    }
    
    console.log('🔑 API Key format check:');
    console.log('   Length:', apiKey.length);
    console.log('   First 8 chars:', apiKey.substring(0, 8));
    console.log('   Last 4 chars:', '...' + apiKey.slice(-4));
    console.log('   Contains spaces:', apiKey.includes(' '));
    console.log('   Starts with sk-:', apiKey.startsWith('sk-'));
    
    // Test 1: Basic API call
    console.log('\n📡 Testing basic API call...');
    try {
        const response = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                audio_url: 'https://storage.googleapis.com/aai-docs-samples/nbc.mp3',
                audio_start_from: 0,
                audio_end_at: 1000 // Just 1 second
            })
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS! API key works for basic API');
            console.log('📝 Created job:', data.id);
            console.log('📊 Status:', data.status);
            
            // Now test real-time with confirmed working key
            console.log('\n🔌 Now testing real-time with confirmed working key...');
            await testRealtimeWithWorkingKey(apiKey);
            
        } else {
            const errorText = await response.text();
            console.error('❌ Basic API failed');
            console.error('📊 Status:', response.status);
            console.error('📊 Error:', errorText);
            
            switch (response.status) {
                case 401:
                    console.error('🚨 UNAUTHORIZED - Your API key is invalid');
                    console.error('💡 Solutions:');
                    console.error('   1. Go to https://www.assemblyai.com/app');
                    console.error('   2. Copy your API key exactly');
                    console.error('   3. Make sure it\'s the AssemblyAI key (not OpenAI/other)');
                    break;
                case 402:
                    console.error('🚨 PAYMENT REQUIRED - No credits or billing issue');
                    console.error('💡 Solutions:');
                    console.error('   1. Check your account credits');
                    console.error('   2. Add billing information');
                    break;
                case 403:
                    console.error('🚨 FORBIDDEN - API key lacks permissions');
                    break;
                default:
                    console.error('🚨 Unknown error - Status:', response.status);
            }
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
        console.error('💡 Check your internet connection');
    }
}

async function testRealtimeWithWorkingKey(apiKey) {
    return new Promise((resolve) => {
        console.log('🔌 Testing real-time with confirmed working API key...');
        
        const ws = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000');
        
        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            console.log('🔐 Sending auth with working key...');
            
            // Try different auth formats
            ws.send(JSON.stringify({
                authorization: apiKey
            }));
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('📨 Real-time response:', message);
                
                if (message.message_type === 'SessionBegins') {
                    console.log('🎬 ✅ REAL-TIME WORKS! Session started!');
                    ws.close();
                    resolve(true);
                } else if (message.error) {
                    console.error('❌ Real-time error:', message.error);
                    
                    if (message.error === 'Not authorized') {
                        console.error('🚨 REAL-TIME SPECIFIC ISSUE:');
                        console.error('   • Your API key works for basic API');
                        console.error('   • But real-time requires different permissions');
                        console.error('   • This might be an account limitation');
                        console.error('💡 Contact AssemblyAI support about real-time access');
                    }
                    
                    ws.close();
                    resolve(false);
                }
            } catch (error) {
                console.error('❌ Error parsing real-time message:', error);
            }
        };
        
        ws.onclose = (event) => {
            console.log(`🔌 Real-time closed: ${event.code}`);
            resolve(false);
        };
        
        ws.onerror = (error) => {
            console.error('❌ Real-time WebSocket error:', error);
            resolve(false);
        };
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                console.log('⏰ Real-time test timeout');
                ws.close();
                resolve(false);
            }
        }, 10000);
    });
}

// Instructions
console.log(`
🔧 BASIC API TEST
=================
This will test if your API key works at all, then test real-time specifically.

📝 Run: testBasicAPI()

This will tell you if the issue is:
1. Invalid API key (basic API fails)
2. Real-time specific limitation (basic API works, real-time fails)
`);

// Auto-run if we detect the page
if (typeof document !== 'undefined' && document.getElementById('apiKey')) {
    console.log('🎯 Ready to test! Run: testBasicAPI()');
} 