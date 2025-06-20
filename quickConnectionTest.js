// Quick AssemblyAI Connection Test
// Run this in your browser console on the realtimeMicrophone.html page

async function quickConnectionTest() {
    console.log('🔍 Quick AssemblyAI Connection Test');
    console.log('===================================');
    
    // Get API key from the input field
    const apiKeyInput = document.getElementById('apiKey');
    if (!apiKeyInput) {
        console.error('❌ Could not find API key input field');
        return;
    }
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        console.error('❌ Please enter your API key in the input field first');
        return;
    }
    
    console.log('✅ API key found:', apiKey.substring(0, 8) + '...');
    
    // Test 1: Regular API
    console.log('\n📡 Testing regular API...');
    try {
        const response = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                audio_url: 'https://storage.googleapis.com/aai-docs-samples/nbc.mp3'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API key is valid - Regular API works');
            console.log('📊 Response:', { id: data.id, status: data.status });
        } else {
            console.error('❌ API key invalid - Status:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return;
        }
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        return;
    }
    
    // Test 2: WebSocket real-time
    console.log('\n🔌 Testing WebSocket real-time connection...');
    
    return new Promise((resolve) => {
        const wsUrl = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000';
        const ws = new WebSocket(wsUrl);
        
        let connectionTimeout = setTimeout(() => {
            console.error('❌ WebSocket connection timeout');
            ws.close();
            resolve(false);
        }, 10000);
        
        ws.onopen = () => {
            console.log('✅ WebSocket connected successfully');
            clearTimeout(connectionTimeout);
            
            // Send authentication
            console.log('🔐 Sending authentication...');
            ws.send(JSON.stringify({
                authorization: apiKey
            }));
            
            // Set timeout for auth response
            setTimeout(() => {
                console.log('⏰ No response after 5 seconds, closing connection');
                ws.close();
                resolve(true);
            }, 5000);
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('📨 Received message:', message);
                
                switch (message.message_type) {
                    case 'SessionBegins':
                        console.log('🎬 ✅ REAL-TIME SESSION STARTED SUCCESSFULLY!');
                        console.log('✅ Your account supports real-time transcription');
                        console.log('🎤 You can now use the real-time features');
                        ws.close();
                        resolve(true);
                        break;
                        
                    default:
                        if (message.error) {
                            console.error('❌ AssemblyAI error:', message.error);
                            ws.close();
                            resolve(false);
                        }
                }
            } catch (error) {
                console.error('❌ Error parsing message:', error);
            }
        };
        
        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            clearTimeout(connectionTimeout);
            resolve(false);
        };
        
        ws.onclose = (event) => {
            console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
            clearTimeout(connectionTimeout);
            
            switch (event.code) {
                case 1000:
                    console.log('✅ Connection closed normally');
                    break;
                case 4003:
                    console.error('❌ PAID FEATURE REQUIRED');
                    console.error('   🚨 Real-time transcription requires a PAID AssemblyAI account');
                    console.error('   💳 Please upgrade your account at: https://www.assemblyai.com/pricing');
                    console.error('   📞 Current account appears to be on the free tier');
                    break;
                case 4001:
                    console.error('❌ UNAUTHORIZED - Invalid API key');
                    break;
                case 4002:
                    console.error('❌ PAYMENT REQUIRED - Account billing issue');
                    break;
                default:
                    console.error(`❌ Connection closed with code: ${event.code}`);
                    if (event.reason) {
                        console.error(`   Reason: ${event.reason}`);
                    }
            }
            
            resolve(event.code === 1000);
        };
    });
}

// Instructions for the user
console.log(`
🔧 HOW TO USE THIS TEST:
========================
1. Open realtimeMicrophone.html in your browser
2. Enter your AssemblyAI API key in the input field
3. Open browser console (F12 → Console tab)
4. Copy and paste this entire script into the console
5. Run: quickConnectionTest()

This will test your API key and tell you exactly why the connection fails.
`);

// Auto-run if we're already on the page
if (typeof document !== 'undefined' && document.getElementById('apiKey')) {
    console.log('🎯 Detected that you\'re on the real-time transcription page!');
    console.log('📝 Run quickConnectionTest() to test your connection');
} 