import { getRealtimeToken } from './utils/getRealtimeToken.js';
import WebSocket from 'ws';

const API_KEY = '48d9e34327bb4f9f89442606b3439aa0';

async function testTokenConnection() {
    console.log('🎯 Testing Token-based Real-time Connection');
    console.log('============================================');
    
    try {
        // Step 1: Get token
        console.log('📝 Getting temporary token...');
        const token = await getRealtimeToken(API_KEY);
        console.log('✅ Token received successfully');
        
        // Step 2: Test WebSocket connection
        console.log('🔌 Testing WebSocket connection with token...');
        await testWebSocketConnection(token);
        
        console.log('\n🎉 SUCCESS! Token-based authentication is working!');
        console.log('✅ Real-time transcription is now functional');
        console.log('📝 You can now use the updated files:');
        console.log('   • realtimeMicrophone.html (browser version)');
        console.log('   • realtimeMicrophoneNode.ts (Node.js version)');
        console.log('   • realtimeLiveCoachingDemo.ts (live coaching)');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

function testWebSocketConnection(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`;
        const ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected successfully');
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Received:', message.message_type);
                
                if (message.message_type === 'SessionBegins') {
                    console.log('🎬 Session started successfully');
                    console.log('📊 Session ID:', message.session_id);
                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                } else if (message.error) {
                    clearTimeout(timeout);
                    ws.close();
                    reject(new Error(message.error));
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        });
        
        ws.on('close', (code) => {
            console.log(`🔌 Connection closed: ${code}`);
            clearTimeout(timeout);
            if (code !== 1000) {
                reject(new Error(`Connection closed with code ${code}`));
            }
        });
        
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            clearTimeout(timeout);
            reject(error);
        });
    });
}

// Run the test
testTokenConnection(); 