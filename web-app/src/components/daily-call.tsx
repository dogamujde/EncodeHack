'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import DailyIframe from '@daily-co/daily-js';

interface DailyCallProps {
  onTranscript?: (transcript: string) => void;
  onFeedback?: (feedback: string[]) => void;
}

export const DailyCall: React.FC<DailyCallProps> = ({ onTranscript, onFeedback }) => {
  const callContainerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);

  const handleEvent = useCallback((event: any) => {
    // This is a placeholder for event handling logic
    console.log('Daily event:', event);
    switch (event.action) {
      case 'joined-meeting':
        console.log('Joined the meeting');
        break;
      case 'participant-joined':
        console.log('Participant joined:', event.participant);
        break;
      case 'participant-left':
        console.log('Participant left:', event.participant);
        break;
      case 'transcript-message':
        onTranscript?.(event.message);
        break;
      case 'app-message':
        if (event.fromId === 'coaching-ai' && onFeedback) {
          onFeedback(event.data.feedback);
        }
        break;
      default:
        break;
    }
  }, [onTranscript, onFeedback]);

  useEffect(() => {
    if (!callContainerRef.current) {
      console.log("Call container ref not available yet.");
      return;
    }

    // Ensure the container is empty before creating a new frame
    if (callContainerRef.current.childElementCount > 0) {
        console.log("Call frame already exists or container is not empty.");
        return;
    }

    const callFrame = DailyIframe.createFrame(callContainerRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        border: '0',
      },
    });

    callFrameRef.current = callFrame;

    const roomURL = 'https://meetingbot.daily.co/coaching-room';
    
    // As per the security note, the API key is not used on the client-side.
    // For private rooms, a meeting token should be fetched from a secure backend.
    // This example joins a public room.
    callFrame.join({ url: roomURL })
      .catch(err => console.error("Failed to join Daily room:", err));

    // --- Event Listeners ---
    callFrame.on('joined-meeting', handleEvent);
    callFrame.on('participant-joined', handleEvent);
    callFrame.on('participant-left', handleEvent);
    callFrame.on('error', (e) => console.error('Daily call error:', e));

    return () => {
      console.log("Cleaning up Daily call frame.");
      callFrame.destroy();
      callFrameRef.current = null;
    };
  }, [handleEvent]);

  return <div ref={callContainerRef} className="w-full h-full relative" />;
}; 