#!/bin/bash

echo "🚀 Setting up vibeHack integration for Reflectly"
echo "================================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 found"

# Install Python dependencies for vibeHack
echo "📦 Installing Python dependencies..."
cd vibeHack
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Create .env file from template if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp config.env.template .env
    echo "⚠️  Please edit vibeHack/.env with your actual API keys:"
    echo "   - OPENAI_API_KEY"
    echo "   - OPIK_API_KEY"
else
    echo "✅ .env file already exists"
fi

cd ..

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Node.js dependencies installed successfully"
else
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

# Test the vibeHack system
echo "🧪 Testing vibeHack monitoring system..."
npm run monitor:test

echo ""
echo "🎉 vibeHack integration setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit vibeHack/.env with your API keys"
echo "2. Run 'npm run dev' to start Reflectly with AI monitoring"
echo "3. Run 'npm run monitor:start' to start AI monitoring separately"
echo "4. Use 'npm run monitor:stats' to view monitoring statistics"
echo ""
echo "💡 Available commands:"
echo "   npm run dev              - Start Reflectly with AI monitoring"
echo "   npm run monitor:start    - Start AI monitoring system"
echo "   npm run monitor:test     - Test monitoring system"
echo "   npm run monitor:stats    - Get monitoring statistics"
echo "" 