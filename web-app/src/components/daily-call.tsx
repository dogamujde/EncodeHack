'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import DailyIframe from '@daily-co/daily-js';

interface DailyCallProps {
  onTranscript?: (transcript: string) => void;
  onFeedback?: (feedback: string[]) => void;
  mediaStream: MediaStream;
  onJoinedMeeting?: () => void;
  onAudioTrackStarted?: (track: MediaStreamTrack) => void;
  onParticipantUpdated?: (event: any) => void;
}

export interface DailyCallHandle {
  toggleCamera: () => void;
  toggleMic: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

export const DailyCall = forwardRef<DailyCallHandle, DailyCallProps>(({ 
  onTranscript,
  onFeedback,
  mediaStream,
  onJoinedMeeting,
  onAudioTrackStarted,
  onParticipantUpdated
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callObjectRef = useRef<any>(null);

  // Store callbacks in refs to prevent useEffect from re-running
  const onJoinedMeetingRef = useRef(onJoinedMeeting);
  const onParticipantUpdatedRef = useRef(onParticipantUpdated);

  useEffect(() => {
    onJoinedMeetingRef.current = onJoinedMeeting;
    onParticipantUpdatedRef.current = onParticipantUpdated;
  });
  
  useImperativeHandle(ref, () => ({
    toggleCamera: () => {
      if (callObjectRef.current) {
        const currentVideoState = callObjectRef.current.localVideo();
        callObjectRef.current.setLocalVideo(!currentVideoState);
      }
    },
    toggleMic: () => {
      if (callObjectRef.current) {
        const currentAudioState = callObjectRef.current.localAudio();
        callObjectRef.current.setLocalAudio(!currentAudioState);
      }
    },
    startRecording: () => {
      if (callObjectRef.current) {
        callObjectRef.current.startRecording({ mode: 'local' });
      }
    },
    stopRecording: () => {
      if (callObjectRef.current) {
        callObjectRef.current.stopRecording();
      }
    }
  }));

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
        case 'participant-updated':
          if (event.participant.local) {
            onParticipantUpdatedRef.current?.(event);
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
      .on('joined-meeting', () => {
        console.log('[DailyCall] Successfully joined meeting. Setting input devices.');
        onJoinedMeetingRef.current?.();
        callObject.setInputDevicesAsync({
          videoSource: mediaStream.getVideoTracks()[0],
          audioSource: mediaStream.getAudioTracks()[0],
        })
        .then(() => {
          console.log('[DailyCall] setInputDevicesAsync successful.');
          // Set initial device states after joining
          callObject.setLocalVideo(true);
          callObject.setLocalAudio(true);
        })
        .catch(err => console.error("[DailyCall] setInputDevicesAsync failed:", err));
      })
      .on('participant-updated', handleEvent)
      .on('error', handleEvent)
      .on('recording-started', () => console.log('[DailyCall] Recording started.'))
      .on('recording-stopped', () => console.log('[DailyCall] Recording stopped.'))
      .on('recording-error', (event) => console.error('[DailyCall] Recording error:', event));

    const roomURL = 'https://meetingbot.daily.co/coaching-room';
    
    callObject.join({ 
      url: roomURL,
      properties: {
        enable_recording: 'local'
      }
    })
      .catch(err => console.error("[DailyCall] Failed to join Daily room:", err));
      
    return () => {
      callObjectRef.current?.destroy();
      callObjectRef.current = null;
    };
  }, [mediaStream]);

  return <div ref={containerRef} className="w-full h-full relative" />;
});

DailyCall.displayName = 'DailyCall';