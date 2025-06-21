'use client';

import React, { useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

interface DailyCallProps {
  onTranscript?: (transcript: string) => void;
  onFeedback?: (feedback: string[]) => void;
  mediaStream: MediaStream;
  onJoinedMeeting?: () => void;
  onAudioTrackStarted?: (track: MediaStreamTrack) => void;
}

export const DailyCall: React.FC<DailyCallProps> = ({ 
  onTranscript,
  onFeedback,
  mediaStream,
  onJoinedMeeting,
  onAudioTrackStarted
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callObjectRef = useRef<any>(null);

  // Store callbacks in refs to prevent useEffect from re-running
  const onJoinedMeetingRef = useRef(onJoinedMeeting);
  const onAudioTrackStartedRef = useRef(onAudioTrackStarted);

  useEffect(() => {
    onJoinedMeetingRef.current = onJoinedMeeting;
    onAudioTrackStartedRef.current = onAudioTrackStarted;
  });

  useEffect(() => {
    if (!mediaStream || callObjectRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

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
      console.log('[DailyCall] Received event:', event.action, event);
      switch (event.action) {
        case 'track-started':
          if (event.track.kind === 'audio' && onAudioTrackStartedRef.current) {
            console.log('[DailyCall] Audio track started, calling onAudioTrackStarted.');
            onAudioTrackStartedRef.current(event.track);
          } else if (event.track.kind === 'video') {
            console.log('[DailyCall] Video track started.');
          }
          break;
        case 'error':
          console.error('[DailyCall] Daily call error:', event);
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
      console.log('[DailyCall] Successfully joined meeting. Setting input devices.');
      if (onJoinedMeetingRef.current) {
        onJoinedMeetingRef.current();
      }
      callObject.setInputDevicesAsync({
        videoSource: mediaStream.getVideoTracks()[0],
        audioSource: mediaStream.getAudioTracks()[0],
      })
      .then(() => console.log('[DailyCall] setInputDevicesAsync successful.'))
      .catch(err => console.error("[DailyCall] setInputDevicesAsync failed:", err));
    });

    return () => {
      // This cleanup runs only once on unmount
      callObjectRef.current?.destroy();
      callObjectRef.current = null;
    };
  }, [mediaStream]);

  return <div ref={containerRef} className="w-full h-full relative" />;
};