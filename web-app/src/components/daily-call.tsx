'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import DailyIframe, { DailyCall as DailyCallType } from '@daily-co/daily-js';
import { useAssemblyAITranscriber } from '@/hooks/useAssemblyAITranscriber';
import { useRealtimeFeedback } from '@/hooks/useRealtimeFeedback';
import { Button } from './ui/button';

const ROOM_URL = "https://meetingbot.daily.co/coaching-room";

interface DailyCallProps {
  onTranscript: (transcript: string) => void;
  onFeedback: (feedback: string[]) => void;
}

export function DailyCall({ onTranscript, onFeedback }: DailyCallProps) {
  const callWrapperRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<DailyCallType | null>(null);
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { transcript, setup, start, stop } = useAssemblyAITranscriber();
  const { feedback } = useRealtimeFeedback({ transcript });

  // Pass transcript and feedback up to parent
  useEffect(() => { onTranscript(transcript); }, [transcript, onTranscript]);
  useEffect(() => { onFeedback(feedback); }, [feedback, onFeedback]);

  // Audio processing logic
  const handleAudio = useCallback((data: { audio_data: string }) => {
    start(data.audio_data);
  }, [start]);

  // Daily iframe and event setup
  useEffect(() => {
    if (!callWrapperRef.current) return;

    const frame = DailyIframe.createFrame(callWrapperRef.current, {
      iframeStyle: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: '0',
        left: '0',
        border: '0',
      },
    });
    callFrameRef.current = frame;
    frame.join({ url: ROOM_URL });

    let audioContext: AudioContext | null = null;
    let workletNode: AudioWorkletNode | null = null;

    const handleTrackStarted = async (event: any) => {
      if (isTranscribing && event.participant?.local && event.track.kind === 'audio') {
        audioContext = new AudioContext();
        const stream = new MediaStream([event.track.persistentTrack]);
        await audioContext.audioWorklet.addModule('/audio-worklets/audio-processor.js');
        workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
        workletNode.port.onmessage = (e) => handleAudio(e.data);
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(workletNode).connect(audioContext.destination);
      }
    };

    const startAudioProcessing = () => {
      if (callFrameRef.current) {
        const localParticipant = callFrameRef.current.participants().local;
        if (localParticipant.tracks.audio) {
          handleTrackStarted({ participant: localParticipant, track: localParticipant.tracks.audio });
        }
      }
      frame.on('track-started', handleTrackStarted);
    };

    const stopAudioProcessing = () => {
      frame.off('track-started', handleTrackStarted);
      workletNode?.port.close();
      workletNode = null;
      audioContext?.close();
      audioContext = null;
    };

    if (isTranscribing) {
      startAudioProcessing();
    } else {
      stopAudioProcessing();
    }

    return () => {
      stopAudioProcessing();
      callFrameRef.current?.destroy();
      callFrameRef.current = null;
    };
  }, [isTranscribing, handleAudio]);

  const toggleTranscription = () => {
    if (isTranscribing) {
      stop();
      setIsTranscribing(false);
    } else {
      setup().then(() => {
        setIsTranscribing(true);
      });
    }
  };

  return (
    <div ref={callWrapperRef} className="w-full h-full">
      <div className="absolute bottom-4 right-4 z-10">
        <Button onClick={toggleTranscription}>
          {isTranscribing ? 'Stop Transcription' : 'Start Transcription'}
        </Button>
      </div>
    </div>
  );
} 