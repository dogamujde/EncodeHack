import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { roomName, participantName } = await req.json();

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
    return NextResponse.json({ error: 'LiveKit server environment variables not set' }, { status: 500 });
  }

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: participantName,
  });

  at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true });

  return NextResponse.json({ 
    token: at.toJwt(),
    url: process.env.LIVEKIT_URL
  });
} 