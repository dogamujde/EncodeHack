'use client';

import React, { useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

interface DailyCallProps {
  onTranscript?: (transcript: string) => void;
  onFeedback?: (feedback: string[]) => void;
  mediaStream: MediaStream;
}

export const DailyCall: React.FC<DailyCallProps> = ({ 
  onTranscript,
  onFeedback,
  mediaStream
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callObjectRef = useRef<any>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    const container = containerRef.current;
    if (!container) {
      return;
    }

    // This effect runs only once on mount
    const callObject = DailyIframe.createFrame(container, {
      showLeaveButton: true,
      iframeStyle: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        border: '0',
      },
    });
    callObjectRef.current = callObject;

    const handleEvent = (event: any) => {
      switch (event.action) {
        case 'track-started':
          break;
        case 'error':
          console.error('Daily call error:', event);
          break;
        default:
          break;
      }
    };

    callObject
      .on('joined-meeting', handleEvent)
      .on('participant-joined', handleEvent)
      .on('participant-left', handleEvent)
      .on('track-started', handleEvent)
      .on('error', handleEvent);

    const roomURL = 'https://meetingbot.daily.co/coaching-room';
    
    // Join the room with devices off, then we will enable them with our custom stream.
    callObject.join({ 
      url: roomURL,
      startVideoOff: true,
      startAudioOff: true,
    })
      .catch(err => console.error("[DailyCall] Failed to join Daily room:", err));
      
    // Once we've joined, immediately set the input devices to our custom stream
    callObject.once('joined-meeting', () => {
      callObject.setInputDevicesAsync({
        videoSource: mediaStream.getVideoTracks()[0],
        audioSource: mediaStream.getAudioTracks()[0],
      }).catch(err => console.error("[DailyCall] setInputDevicesAsync failed:", err));
    });

    return () => {
      // This cleanup runs only once on unmount
      callObjectRef.current?.destroy();
      callObjectRef.current = null;
      isInitialized.current = false;
    };
  }, [mediaStream]);

  return <div ref={containerRef} className="w-full h-full relative" />;
};