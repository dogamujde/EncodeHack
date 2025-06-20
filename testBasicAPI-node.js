// Node.js v18+ has native fetch
const WebSocket = require('ws');

async function testBasicAPI() {
    console.log('🔍 Testing Basic AssemblyAI API Access');
    console.log('=====================================');
    
    const apiKey = '48d9e34327bb4f9f89442606b3439aa0'; // Your API key
    
    console.log('🔑 API Key format check:');
    console.log('   Length:', apiKey.length);
    console.log('   First 8 chars:', apiKey.substring(0, 8));
    console.log('   Last 4 chars:', '...' + apiKey.slice(-4));
    
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
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

async function testRealtimeWithWorkingKey(apiKey) {
    return new Promise((resolve) => {
        console.log('🔌 Testing real-time with confirmed working API key...');
        
        const ws = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000');
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected');
            console.log('🔐 Sending auth with working key...');
            
            ws.send(JSON.stringify({
                authorization: apiKey
            }));
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
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
        });
        
        ws.on('close', (code) => {
            console.log(`🔌 Real-time closed: ${code}`);
            resolve(false);
        });
        
        ws.on('error', (error) => {
            console.error('❌ Real-time WebSocket error:', error);
            resolve(false);
        });
        
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

// Run the test
testBasicAPI().catch(console.error); 