import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'authorization': process.env.ASSEMBLYAI_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        expires_in: 3600, // 1 hour
      }),
    })

    if (!response.ok) {
      throw new Error(`AssemblyAI API error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      token: data.token,
      expires_in: data.expires_in 
    })
  } catch (error) {
    console.error('Error getting AssemblyAI token:', error)
    return NextResponse.json(
      { error: 'Failed to get realtime token' },
      { status: 500 }
    )
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