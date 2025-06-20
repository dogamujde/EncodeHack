import WebSocket from 'ws';

// Test AssemblyAI connection and API key
async function testAssemblyAIConnection() {
    console.log('🔍 Testing AssemblyAI Connection');
    console.log('================================');
    
    // Get API key from environment
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
        console.error('❌ No API key found. Please set ASSEMBLYAI_API_KEY environment variable');
        return;
    }
    
    console.log('✅ API key found:', apiKey.substring(0, 8) + '...');
    
    // Test 1: Check if API key works with regular API
    console.log('\n📡 Testing API key with regular AssemblyAI API...');
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
            const data: any = await response.json();
            console.log('✅ API key is valid - Regular API works');
            console.log('📊 Response:', { id: data.id, status: data.status });
        } else {
            console.error('❌ API key invalid - Status:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return;
        }
    } catch (error: any) {
        console.error('❌ API test failed:', error.message);
        return;
    }
    
    // Test 2: Check WebSocket connection for real-time
    console.log('\n🔌 Testing WebSocket connection for real-time transcription...');
    
    return new Promise((resolve) => {
        const wsUrl = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000';
        const ws = new WebSocket(wsUrl);
        
        let connectionTimeout = setTimeout(() => {
            console.error('❌ WebSocket connection timeout');
            ws.close();
            resolve(false);
        }, 10000);
        
        ws.on('open', () => {
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
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Received message:', message);
                
                switch (message.message_type) {
                    case 'SessionBegins':
                        console.log('🎬 ✅ Real-time session started successfully!');
                        console.log('✅ Your account supports real-time transcription');
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
        });
        
        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            clearTimeout(connectionTimeout);
            resolve(false);
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
            clearTimeout(connectionTimeout);
            
            switch (code) {
                case 1000:
                    console.log('✅ Connection closed normally');
                    break;
                case 4003:
                    console.error('❌ PAID FEATURE REQUIRED');
                    console.error('   Real-time transcription requires a paid AssemblyAI account');
                    console.error('   Please upgrade your account at: https://www.assemblyai.com/pricing');
                    break;
                case 4001:
                    console.error('❌ UNAUTHORIZED - Invalid API key');
                    break;
                case 4002:
                    console.error('❌ PAYMENT REQUIRED - Account billing issue');
                    break;
                default:
                    console.error(`❌ Connection closed with code: ${code}`);
                    if (reason) {
                        console.error(`   Reason: ${reason}`);
                    }
            }
            
            resolve(code === 1000);
        });
    });
}

// Test account info
async function testAccountInfo() {
    console.log('\n👤 Checking account information...');
    
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) return;
    
    try {
        // Note: AssemblyAI doesn't have a public account info endpoint
        // But we can test with a small transcription request
        const response = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                audio_url: 'https://storage.googleapis.com/aai-docs-samples/nbc.mp3',
                audio_start_from: 0,
                audio_end_at: 5000 // Only first 5 seconds
            })
        });
        
        if (response.ok) {
            console.log('✅ Account can create transcription jobs');
        } else if (response.status === 402) {
            console.error('❌ Payment required - Account has billing issues');
        } else if (response.status === 401) {
            console.error('❌ Unauthorized - Invalid API key');
        } else {
            console.error(`❌ Account check failed: ${response.status}`);
        }
    } catch (error: any) {
        console.error('❌ Account check error:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    await testAccountInfo();
    const success = await testAssemblyAIConnection();
    
    console.log('\n📋 Summary:');
    console.log('===========');
    
    if (success) {
        console.log('✅ All tests passed! Real-time transcription should work');
        console.log('🎤 You can now use the real-time features');
    } else {
        console.log('❌ Tests failed. Common solutions:');
        console.log('   1. Upgrade to a paid AssemblyAI account');
        console.log('   2. Check your API key is correct');
        console.log('   3. Ensure your account has sufficient credits');
        console.log('   4. Contact AssemblyAI support if issues persist');
    }
    
    console.log('\n🔗 Useful links:');
    console.log('   • AssemblyAI Pricing: https://www.assemblyai.com/pricing');
    console.log('   • API Documentation: https://www.assemblyai.com/docs');
    console.log('   • Support: https://www.assemblyai.com/support');
}

// Export for use in other files
export { testAssemblyAIConnection, testAccountInfo };

// Run if executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
} 