const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static('.'));

// API endpoint to get realtime token
app.post('/api/realtime-token', async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }
        
        console.log('🔑 Getting token for API key:', apiKey.substring(0, 8) + '...');
        
        const response = await fetch("https://api.assemblyai.com/v2/realtime/token", {
            method: "POST",
            headers: {
                "authorization": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ expires_in: 300 })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ AssemblyAI error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `AssemblyAI error: ${response.status} ${response.statusText}`,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('✅ Token generated successfully');
        
        res.json({ token: data.token });
        
    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'realtimeMicrophone.html'));
});

app.listen(PORT, () => {
    console.log('🚀 Live Coach Server Started!');
    console.log('================================');
    console.log(`📡 Server running at: http://localhost:${PORT}`);
    console.log('🎤 Real-time transcription ready!');
    console.log('\n💡 Usage:');
    console.log('1. Open: http://localhost:3000');
    console.log('2. Enter your API key: 48d9e34327bb4f9f89442606b3439aa0');
    console.log('3. Click "Connect to AssemblyAI"');
    console.log('4. Start recording and speaking!');
    console.log('\n🛑 Press Ctrl+C to stop the server');
}); 