import { getRealtimeToken } from './utils/getRealtimeToken.js';
import WebSocket from 'ws';

const API_KEY = '48d9e34327bb4f9f89442606b3439aa0';

async function testRealtimeWithToken() {
    console.log('🔧 Testing Real-time with Token Authentication');
    console.log('===============================================');
    
    try {
        // Step 1: Get temporary token
        console.log('📝 Step 1: Getting temporary token...');
        const token = await getRealtimeToken(API_KEY);
        console.log('✅ Token received:', token.substring(0, 20) + '...');
        
        // Step 2: Connect with token in URL
        console.log('\n🔌 Step 2: Connecting with token in URL...');
        await testWebSocketWithToken(token);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function testWebSocketWithToken(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`;
        console.log('🔗 Connecting to:', wsUrl.replace(token, 'TOKEN_HIDDEN'));
        
        const ws = new WebSocket(wsUrl);
        
        let resolved = false;
        const timeout = setTimeout(() => {
            if (!resolved) {
                console.log('⏰ Connection timeout');
                ws.close();
                resolved = true;
                reject(new Error('Connection timeout'));
            }
        }, 10000);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected successfully!');
            console.log('🎯 No auth message needed - token in URL');
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Received message:', message);
                
                if (message.message_type === 'SessionBegins') {
                    console.log('🎬 ✅ SUCCESS! Real-time session started with token!');
                    console.log('📊 Session ID:', message.session_id);
                    console.log('📅 Expires at:', message.expires_at);
                    
                    if (!resolved) {
                        clearTimeout(timeout);
                        ws.close();
                        resolved = true;
                        resolve();
                    }
                } else if (message.error) {
                    console.error('❌ Real-time error:', message.error);
                    if (!resolved) {
                        clearTimeout(timeout);
                        ws.close();
                        resolved = true;
                        reject(new Error(message.error));
                    }
                }
            } catch (error) {
                console.error('❌ Error parsing message:', error);
            }
        });
        
        ws.on('close', (code) => {
            console.log(`🔌 WebSocket closed with code: ${code}`);
            if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                if (code === 1000) {
                    resolve(); // Normal closure
                } else {
                    reject(new Error(`WebSocket closed with code ${code}`));
                }
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                reject(error);
            }
        });
    });
}

// Run the test
testRealtimeWithToken().catch(console.error); 