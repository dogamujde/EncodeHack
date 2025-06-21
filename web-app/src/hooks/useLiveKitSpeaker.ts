import { useEffect, useRef, useState } from 'react'
import { Room, Participant, LocalParticipant } from 'livekit-client'

export function useLiveKitSpeaker() {
  const [activeName, setActiveName] = useState<string>('')
  const roomRef = useRef<Room | null>(null)

  useEffect(() => {
    const connect = async () => {
      try {
        const res = await fetch('/api/livekit-token', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ roomName: 'live-coach', participantName: 'coach' }),
        });
        const { token, url } = await res.json()
        const room = new Room()
        roomRef.current = room
        await room.connect(url, token)

        room.on('active-speaker-change', (speakers: Participant[]) => {
          if (speakers.length > 0) {
            const name = speakers[0].name || speakers[0].identity
            setActiveName(name)
          }
        })
      } catch (e) {
        console.error('LiveKit connect error', e)
      }
    }
    connect()
    return () => {
      roomRef.current?.disconnect()
    }
  }, [])

  return activeName
} 