import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export async function GET() {
  try {
    const token = await assemblyai.realtime.createTemporaryToken({ expires_in: 3600 });
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error creating AssemblyAI token:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expires_in: 3600 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AssemblyAI API error: ${response.status} - ${errorText}`);
      throw new Error(`AssemblyAI API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ token: data.token });

  } catch (error) {
    console.error('Failed to get AssemblyAI token:', error);
    return NextResponse.json(
      { error: 'Failed to get token' },
      { status: 500 }
    );
  }
} 