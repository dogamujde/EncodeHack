'use client';

import React, { useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

interface DailyCallProps {
  onLocalVideoTrack?: (track: MediaStreamTrack) => void;
}

export const DailyCall: React.FC<DailyCallProps> = ({ onLocalVideoTrack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callObjectRef = useRef<any>(null);

  // Use a ref to store the latest callback without re-triggering the effect
  const onLocalVideoTrackRef = useRef(onLocalVideoTrack);
  useEffect(() => {
    onLocalVideoTrackRef.current = onLocalVideoTrack;
  }, [onLocalVideoTrack]);

  useEffect(() => {
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
          if (event.participant?.local && event.track.kind === 'video') {
            onLocalVideoTrackRef.current?.(event.track.persistentTrack);
          }
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
    callObject.join({ url: roomURL })
      .catch(err => console.error("Failed to join Daily room:", err));

    return () => {
      // This cleanup runs only once on unmount
      callObjectRef.current?.destroy();
      callObjectRef.current = null;
    };
  }, []); // Empty dependency array ensures this runs only once

  return <div ref={containerRef} className="w-full h-full relative" />;
};