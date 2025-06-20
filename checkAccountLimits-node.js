// Node.js v18+ has native fetch
const WebSocket = require('ws');

const API_KEY = '48d9e34327bb4f9f89442606b3439aa0';

async function runFullCheck() {
    console.log('🔧 ACCOUNT LIMITS CHECKER (Node.js)');
    console.log('====================================');
    
    console.log('🔑 API Key:', API_KEY.substring(0, 8) + '...' + API_KEY.slice(-4));
    console.log('📅 Test Date:', new Date().toISOString());
    
    // Test 1: Basic API health
    console.log('\n📡 Test 1: Basic API Health');
    console.log('----------------------------');
    await testBasicAPI();
    
    // Test 2: Account info
    console.log('\n👤 Test 2: Account Information');
    console.log('-------------------------------');
    await testAccountInfo();
    
    // Test 3: Real-time capabilities
    console.log('\n🔌 Test 3: Real-time Capabilities');
    console.log('----------------------------------');
    await testRealtimeCapabilities();
    
    // Test 4: Different auth formats
    console.log('\n🔐 Test 4: Different Auth Formats');
    console.log('----------------------------------');
    await testDifferentAuthFormats();
    
    console.log('\n📋 SUMMARY');
    console.log('===========');
    console.log('Based on the tests above:');
    console.log('• If basic API works but real-time fails = Account limitation');
    console.log('• If all tests fail = API key issue');
    console.log('• If some auth formats work = Protocol issue');
    console.log('\n💡 RECOMMENDATION:');
    console.log('Contact AssemblyAI support at support@assemblyai.com');
    console.log('Include this test output in your support request.');
}

async function testBasicAPI() {
    try {
        const response = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'authorization': API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                audio_url: 'https://storage.googleapis.com/aai-docs-samples/nbc.mp3',
                audio_start_from: 0,
                audio_end_at: 500
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS: Basic API works');
            console.log('📝 Job ID:', data.id);
            console.log('📊 Status:', data.status);
        } else {
            console.log('❌ FAILED: Basic API');
            console.log('📊 Status:', response.status);
            console.log('📊 Error:', await response.text());
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
    }
}

async function testAccountInfo() {
    try {
        // Try to get account info (this endpoint might not exist, but worth trying)
        const response = await fetch('https://api.assemblyai.com/v2/user', {
            headers: {
                'authorization': API_KEY
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS: Account info retrieved');
            console.log('📊 Data:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ FAILED: Account info');
            console.log('📊 Status:', response.status);
            
            // Try alternative endpoint
            const altResponse = await fetch('https://api.assemblyai.com/v2/account', {
                headers: {
                    'authorization': API_KEY
                }
            });
            
            if (altResponse.ok) {
                const altData = await altResponse.json();
                console.log('✅ SUCCESS: Alternative account endpoint');
                console.log('📊 Data:', JSON.stringify(altData, null, 2));
            } else {
                console.log('❌ FAILED: Alternative account endpoint');
                console.log('📊 Status:', altResponse.status);
            }
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
    }
}

async function testRealtimeCapabilities() {
    const tests = [
        { name: 'Standard Real-time', url: 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000' },
        { name: 'No Sample Rate', url: 'wss://api.assemblyai.com/v2/realtime/ws' },
        { name: 'Different Sample Rate', url: 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=8000' }
    ];
    
    for (const test of tests) {
        console.log(`\n🔌 Testing: ${test.name}`);
        await testSingleRealtimeConnection(test.url);
    }
}

async function testSingleRealtimeConnection(url) {
    return new Promise((resolve) => {
        const ws = new WebSocket(url);
        let resolved = false;
        
        const timeout = setTimeout(() => {
            if (!resolved) {
                console.log('⏰ TIMEOUT: Connection took too long');
                ws.close();
                resolved = true;
                resolve();
            }
        }, 5000);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected');
            ws.send(JSON.stringify({ authorization: API_KEY }));
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Response:', message);
                
                if (message.message_type === 'SessionBegins') {
                    console.log('🎬 ✅ SUCCESS: Real-time session started!');
                } else if (message.error) {
                    console.log('❌ ERROR:', message.error);
                }
                
                if (!resolved) {
                    clearTimeout(timeout);
                    ws.close();
                    resolved = true;
                    resolve();
                }
            } catch (error) {
                console.log('❌ Parse error:', error.message);
            }
        });
        
        ws.on('close', (code) => {
            console.log(`🔌 Closed: ${code}`);
            if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                resolve();
            }
        });
        
        ws.on('error', (error) => {
            console.log('❌ WebSocket error:', error.message);
            if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                resolve();
            }
        });
    });
}

async function testDifferentAuthFormats() {
    const authFormats = [
        { name: 'Standard', auth: { authorization: API_KEY } },
        { name: 'Token field', auth: { token: API_KEY } },
        { name: 'API Key field', auth: { api_key: API_KEY } },
        { name: 'Bearer format', auth: { authorization: `Bearer ${API_KEY}` } }
    ];
    
    for (const format of authFormats) {
        console.log(`\n🔐 Testing auth format: ${format.name}`);
        await testAuthFormat(format.auth);
    }
}

async function testAuthFormat(authData) {
    return new Promise((resolve) => {
        const ws = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000');
        let resolved = false;
        
        const timeout = setTimeout(() => {
            if (!resolved) {
                console.log('⏰ TIMEOUT');
                ws.close();
                resolved = true;
                resolve();
            }
        }, 3000);
        
        ws.on('open', () => {
            console.log('📤 Sending auth:', JSON.stringify(authData));
            ws.send(JSON.stringify(authData));
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                if (message.message_type === 'SessionBegins') {
                    console.log('✅ SUCCESS: This auth format works!');
                } else if (message.error) {
                    console.log('❌ ERROR:', message.error);
                } else {
                    console.log('📨 Response:', message);
                }
                
                if (!resolved) {
                    clearTimeout(timeout);
                    ws.close();
                    resolved = true;
                    resolve();
                }
            } catch (error) {
                console.log('❌ Parse error:', error.message);
            }
        });
        
        ws.on('close', (code) => {
            if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                resolve();
            }
        });
        
        ws.on('error', (error) => {
            if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                resolve();
            }
        });
    });
}

// Run the full check
runFullCheck().catch(console.error); 