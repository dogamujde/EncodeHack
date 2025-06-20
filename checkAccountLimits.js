// AssemblyAI Account Limits Checker
// Run this in browser console on realtimeMicrophone.html

async function checkAccountLimits() {
    console.log('🔍 Checking AssemblyAI Account Limits');
    console.log('====================================');
    
    const apiKey = document.getElementById('apiKey')?.value?.trim();
    if (!apiKey) {
        console.error('❌ Please enter your API key in the input field first');
        return;
    }
    
    console.log('🔑 API Key:', apiKey.substring(0, 8) + '...');
    
    // Test 1: Check if we can create a basic transcription job
    console.log('\n📝 Testing basic transcription capability...');
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
                audio_end_at: 3000 // Only 3 seconds to minimize credit usage
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Basic transcription works');
            console.log('📊 Job created:', data.id);
            console.log('📊 Status:', data.status);
        } else {
            console.error('❌ Basic transcription failed:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            
            if (response.status === 402) {
                console.error('💳 PAYMENT REQUIRED - No credits or billing issue');
                return;
            } else if (response.status === 401) {
                console.error('🔐 UNAUTHORIZED - Invalid API key');
                return;
            }
        }
    } catch (error) {
        console.error('❌ Basic test failed:', error);
        return;
    }
    
    // Test 2: Try real-time connection with detailed logging
    console.log('\n🔌 Testing real-time streaming connection...');
    
    return new Promise((resolve) => {
        const wsUrl = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000';
        console.log('🌐 Connecting to:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        let startTime = Date.now();
        
        // Timeout after 15 seconds
        const timeout = setTimeout(() => {
            console.error('⏰ Connection timeout after 15 seconds');
            ws.close();
            resolve(false);
        }, 15000);
        
        ws.onopen = () => {
            const connectTime = Date.now() - startTime;
            console.log(`✅ WebSocket connected in ${connectTime}ms`);
            
            // Send authentication
            console.log('🔐 Sending authentication...');
            ws.send(JSON.stringify({
                authorization: apiKey
            }));
            
            // Wait for response
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    console.log('⏰ Still waiting for auth response...');
                    ws.close();
                    resolve(false);
                }
            }, 10000);
        };
        
        ws.onmessage = (event) => {
            clearTimeout(timeout);
            try {
                const message = JSON.parse(event.data);
                console.log('📨 Received message:', message);
                
                switch (message.message_type) {
                    case 'SessionBegins':
                        console.log('🎬 ✅ REAL-TIME SESSION STARTED!');
                        console.log('✅ Your account DOES support real-time transcription');
                        console.log('🎤 The issue might be temporary or browser-related');
                        
                        // Send a test audio chunk to verify full functionality
                        console.log('🧪 Sending test audio data...');
                        const testAudio = new ArrayBuffer(1024);
                        ws.send(testAudio);
                        
                        setTimeout(() => {
                            ws.close();
                            resolve(true);
                        }, 2000);
                        break;
                        
                    case 'PartialTranscript':
                    case 'FinalTranscript':
                        console.log('📝 Received transcript:', message.text);
                        break;
                        
                    default:
                        if (message.error) {
                            console.error('❌ AssemblyAI error:', message.error);
                            ws.close();
                            resolve(false);
                        } else {
                            console.log('📨 Other message:', message);
                        }
                }
            } catch (error) {
                console.error('❌ Error parsing message:', error);
            }
        };
        
        ws.onerror = (error) => {
            clearTimeout(timeout);
            console.error('❌ WebSocket error:', error);
            resolve(false);
        };
        
        ws.onclose = (event) => {
            clearTimeout(timeout);
            const closeTime = Date.now() - startTime;
            console.log(`🔌 WebSocket closed after ${closeTime}ms`);
            console.log(`📊 Close code: ${event.code}`);
            console.log(`📊 Close reason: "${event.reason}"`);
            
            // Detailed error analysis
            switch (event.code) {
                case 1000:
                    console.log('✅ Normal closure');
                    break;
                case 1006:
                    console.error('❌ ABNORMAL CLOSURE - Connection lost unexpectedly');
                    console.error('   This might indicate:');
                    console.error('   • Network connectivity issues');
                    console.error('   • Server-side rejection');
                    console.error('   • Firewall blocking WebSocket');
                    break;
                case 4001:
                    console.error('❌ UNAUTHORIZED (4001)');
                    console.error('   • Invalid API key');
                    console.error('   • API key doesn\'t have required permissions');
                    break;
                case 4002:
                    console.error('❌ PAYMENT REQUIRED (4002)');
                    console.error('   • Account has billing issues');
                    console.error('   • Insufficient credits');
                    break;
                case 4003:
                    console.error('❌ FORBIDDEN (4003)');
                    console.error('   • Real-time feature not available on your plan');
                    console.error('   • Account limitations exceeded');
                    console.error('   • Geographic restrictions');
                    break;
                case 4008:
                    console.error('❌ RATE LIMITED (4008)');
                    console.error('   • Too many concurrent connections');
                    console.error('   • Exceeded 5 streams per minute limit');
                    break;
                default:
                    console.error(`❌ Unknown close code: ${event.code}`);
                    if (event.reason) {
                        console.error(`   Reason: ${event.reason}`);
                    }
            }
            
            resolve(event.code === 1000);
        };
    });
}

// Test multiple connections to check concurrency limits
async function testConcurrencyLimits() {
    console.log('\n🔄 Testing concurrency limits...');
    
    const apiKey = document.getElementById('apiKey')?.value?.trim();
    if (!apiKey) return;
    
    const promises = [];
    const maxConnections = 3; // Test with 3 concurrent connections
    
    for (let i = 0; i < maxConnections; i++) {
        const promise = new Promise((resolve) => {
            const ws = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000');
            
            ws.onopen = () => {
                console.log(`✅ Connection ${i + 1} opened`);
                ws.send(JSON.stringify({ authorization: apiKey }));
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.message_type === 'SessionBegins') {
                    console.log(`🎬 Connection ${i + 1} session started`);
                    setTimeout(() => ws.close(), 1000);
                }
            };
            
            ws.onclose = (event) => {
                console.log(`🔌 Connection ${i + 1} closed: ${event.code}`);
                resolve(event.code);
            };
            
            ws.onerror = () => {
                console.log(`❌ Connection ${i + 1} error`);
                resolve(-1);
            };
        });
        
        promises.push(promise);
        
        // Small delay between connections
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const results = await Promise.all(promises);
    console.log('📊 Concurrency test results:', results);
    
    const successful = results.filter(code => code === 1000).length;
    console.log(`✅ Successful connections: ${successful}/${maxConnections}`);
    
    if (successful < maxConnections) {
        console.log('⚠️ Some connections failed - you might be hitting concurrency limits');
    }
}

// Run comprehensive check
async function runFullCheck() {
    const success = await checkAccountLimits();
    
    if (success) {
        await testConcurrencyLimits();
        
        console.log('\n🎉 GOOD NEWS!');
        console.log('==============');
        console.log('✅ Your account supports real-time transcription');
        console.log('✅ The issue might be:');
        console.log('   • Temporary network issue');
        console.log('   • Browser-specific problem');
        console.log('   • Concurrent connection limit reached');
        console.log('\n💡 Try refreshing the page and connecting again');
        
    } else {
        console.log('\n📋 DIAGNOSIS COMPLETE');
        console.log('=====================');
        console.log('❌ Real-time transcription is not working');
        console.log('💡 Possible solutions:');
        console.log('   1. Check your account billing/credits');
        console.log('   2. Verify API key permissions');
        console.log('   3. Try again in a few minutes');
        console.log('   4. Contact AssemblyAI support');
    }
}

// Instructions
console.log(`
🔧 ACCOUNT LIMITS CHECKER
=========================
This will test your AssemblyAI account capabilities in detail.

📝 Instructions:
1. Make sure your API key is entered above
2. Run: runFullCheck()

This will tell you exactly what's working and what isn't.
`); 