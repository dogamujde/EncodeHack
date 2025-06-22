'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { RealtimeTranscriber, SessionInformation } from 'assemblyai';

const ASSEMBLYAI_API_BASE_URL = "https://api.assemblyai.com/v2";

// Helper function to convert float32 to base64-encoded PCM16
const bufferToBase64 = (buffer: Float32Array) => {
  const pcm16 = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    // Clamp the sample to the [-1, 1] range
    let s = Math.max(-1, Math.min(1, buffer[i]));
    // Convert to 16-bit integer
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    pcm16[i] = s;
  }
  // Convert to base64
  return btoa(String.fromCharCode.apply(null, new Uint8Array(pcm16.buffer) as any));
};

export interface UseAssemblyAITranscriberOptions {
  onTranscript: (transcript: any) => void;
  onError?: (error: Error) => void;
  onClose?: (code: number, reason: string) => void;
}

export const useAssemblyAITranscriber = ({
  onTranscript,
  onError,
  onClose,
}: UseAssemblyAITranscriberOptions) => {
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false); // Ref to track ready state for callbacks

  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const [volume, setVolume] = useState(0);
  const [confidence, setConfidence] = useState(0.5);
  const [talkingSpeed, setTalkingSpeed] = useState(150);
  const [clarity, setClarity] = useState(0.5);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const lowConfidenceTimer = useRef<NodeJS.Timeout | null>(null);
  const lowClarityTimer = useRef<NodeJS.Timeout | null>(null);
  const talkingSpeedTimer = useRef<NodeJS.Timeout | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioDataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const smoothedClarityRef = useRef(0.5);
  const smoothedWpmRef = useRef(150);
  const wpmDecayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wordHistoryRef = useRef<{ start: number; end: number }[]>([]);

  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Update ref whenever state changes
  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  const clearTimer = (timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startWarningTimer = (
    timerRef: React.MutableRefObject<NodeJS.Timeout | null>,
    message: string
  ) => {
    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        setWarningMessage(message);
      }, 3000); // 3 seconds
    }
  };

  useEffect(() => {
    const lowConfidenceMessage = "Your confidence seems low. Try speaking up.";
    const lowClarityMessage = "Your speech seems unclear. Try to articulate more.";
    const slowSpeedMessage = "You are speaking a bit slow. Try to speed up slightly.";
    const fastSpeedMessage = "You are speaking a bit fast. Try to slow down.";

    // Confidence warning logic
    if (confidence > 0 && confidence < 0.3) {
      startWarningTimer(lowConfidenceTimer, lowConfidenceMessage);
    } else if (confidence >= 0.3) {
      clearTimer(lowConfidenceTimer);
      if (warningMessage === lowConfidenceMessage) setWarningMessage(null);
    }

    // Clarity warning logic
    if (clarity > 0 && clarity < 0.3) {
      startWarningTimer(lowClarityTimer, lowClarityMessage);
    } else if (clarity >= 0.3) {
      clearTimer(lowClarityTimer);
      if (warningMessage === lowClarityMessage) setWarningMessage(null);
    }

    // Talking speed warning logic
    if (talkingSpeed > 0 && talkingSpeed < 110) {
      startWarningTimer(talkingSpeedTimer, slowSpeedMessage);
    } else if (talkingSpeed > 190) {
      startWarningTimer(talkingSpeedTimer, fastSpeedMessage);
    } else if (talkingSpeed >= 110 && talkingSpeed <= 190) {
      // Only clear timer and message if speed is in the good range
      clearTimer(talkingSpeedTimer);
      if (warningMessage === slowSpeedMessage || warningMessage === fastSpeedMessage) {
        setWarningMessage(null);
      }
    }
    
    return () => {
      clearTimer(lowConfidenceTimer);
      clearTimer(lowClarityTimer);
      clearTimer(talkingSpeedTimer);
    };
  }, [confidence, clarity, talkingSpeed, warningMessage]);

  const transcriberRef = useRef<RealtimeTranscriber | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<AudioWorkletNode | null>(null);
  const isSettingUp = useRef(false);

  const setup = useCallback(async (mediaStream: MediaStream) => {
      if (transcriberRef.current || isSettingUp.current) {
          console.log("[AssemblyAI] Setup already in progress or completed.");
          return;
      }
      console.log("[AssemblyAI] Setup function called.");
      try {
        console.log("[AssemblyAI] Setting up transcriber...");
        console.log("[AssemblyAI] Fetching token from /api/assemblyai-token...");
        const response = await fetch("/api/assemblyai-token");
        console.log(`[AssemblyAI] Token response received. Status: ${response.status}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch AssemblyAI token. Status: ${response.status}`);
        }
        const data = await response.json();

        if (!data.token) {
          throw new Error("No token received from server");
        }
        
        const newTranscriber = new RealtimeTranscriber({ token: data.token });
        console.log("[AssemblyAI] Transcriber object created successfully. Attaching event listeners.");

        newTranscriber.on('open', (info) => {
          console.log('[AssemblyAI] Connection opened:', info);
          setIsConnected(true);
          setIsReady(true);
        });

        newTranscriber.on('transcript', (transcript) => {
          onTranscriptRef.current(transcript);

          if (wpmDecayTimerRef.current) {
            clearInterval(wpmDecayTimerRef.current);
            wpmDecayTimerRef.current = null;
          }

          // Update metrics based on transcript data, only if there's text
          if (transcript.text && transcript.text.trim() !== '') {
            if (transcript.message_type === 'PartialTranscript' || transcript.message_type === 'FinalTranscript') {
              const totalTextDuration = transcript.text.split(/\s+/).length * 100; // Assuming average word duration of 100ms
              const totalWordDuration = transcript.words.reduce((total, word) => total + (word.end - word.start), 0);
              const totalGapDuration = Math.max(0, totalWordDuration - totalTextDuration);
              const articulationScore = Math.min(1, totalGapDuration / (totalWordDuration * 0.4));

              const confidence = transcript.confidence ?? 0;
              const remappedConfidence = Math.pow(confidence, 0.5);
              
              // New clarity logic: Confidence baseline with penalties.
              const volumeModifier = 1 - Math.max(0, (0.4 - volume / 0.2) / 0.4) * 0.1;
              const articulationModifier = 1 - (1 - articulationScore) * 0.2;
              const rawClarity = remappedConfidence * volumeModifier * articulationModifier;
              
              const claritySmoothingUp = 0.1;
              const claritySmoothingDown = 0.3;
              const claritySmoothing = rawClarity < smoothedClarityRef.current ? claritySmoothingDown : claritySmoothingUp;

              smoothedClarityRef.current = (rawClarity * claritySmoothing) + (smoothedClarityRef.current * (1 - claritySmoothing));
              setClarity(smoothedClarityRef.current);

              if (transcript.words && transcript.words.length > 0) {
                const newWords = transcript.words.filter(newWord => 
                  !wordHistoryRef.current.some(existingWord => existingWord.start === newWord.start)
                );

                if (newWords.length > 0) {
                    wordHistoryRef.current.push(...newWords);
                }

                const now = newWords.length > 0 ? newWords[newWords.length - 1].end : (wordHistoryRef.current.length > 0 ? wordHistoryRef.current[wordHistoryRef.current.length - 1].end : 0);
                const fourSecondsAgo = now - 4000;
                wordHistoryRef.current = wordHistoryRef.current.filter(word => word.end > fourSecondsAgo);

                if (wordHistoryRef.current.length > 0) {
                    const windowDuration = (now - wordHistoryRef.current[0].start) / 1000;
                    if (windowDuration > 1) { // Only calculate if we have a meaningful window
                        const rawWpm = (wordHistoryRef.current.length / windowDuration) * 60;
                        const wpmSmoothing = 0.3;
                        smoothedWpmRef.current = (rawWpm * wpmSmoothing) + (smoothedWpmRef.current * (1 - wpmSmoothing));
                        setTalkingSpeed(smoothedWpmRef.current);
                    }
                }
              }

              const getSpeedScore = (wpm: number) => {
                  if (wpm < 110 || wpm > 190) return 0.2;
                  if (wpm >= 130 && wpm <= 170) return 1.0;
                  if (wpm < 130) return 0.2 + 0.8 * ((wpm - 110) / 20);
                  return 0.2 + 0.8 * ((190 - wpm) / 20);
              };
              const speedScore = getSpeedScore(smoothedWpmRef.current);
              const fillerWords = /\b(uh|um|er|ah|like|so|you know|basically|actually)\b/gi;
              const wordsInTranscript = transcript.text.split(/\s+/);
              const fillerCount = (transcript.text.match(fillerWords) || []).length;
              const fillerRatio = wordsInTranscript.length > 0 ? fillerCount / wordsInTranscript.length : 0;
              const fillerScore = Math.max(0, 1 - (fillerRatio * 4));
              const userConfidence = 
                  (volume / 0.2 * 0.5) +
                  (speedScore * 0.1) +
                  (fillerScore * 0.3) +
                  (confidence * 0.1);
              
              setConfidence(Math.min(1, userConfidence));
            }
          }

          if (transcript.message_type === 'FinalTranscript') {
            wpmDecayTimerRef.current = setInterval(() => {
              setTalkingSpeed(prev => {
                const newSpeed = prev * 0.9; // Decay by 10%
                if (newSpeed < 1) {
                  if (wpmDecayTimerRef.current) clearInterval(wpmDecayTimerRef.current);
                  wordHistoryRef.current = []; // Clear history on decay completion
                  return 0;
                }
                return newSpeed;
              });
            }, 150);
          }
        });

        newTranscriber.on('error', (error) => {
          console.error('AssemblyAI Error:', error);
          onErrorRef.current?.(error);
          stop(); 
        });

        newTranscriber.on('close', (code, reason) => {
          console.log('[AssemblyAI] Connection closed:', code, reason);
          setIsConnected(false);
          onCloseRef.current?.(code, reason);
        });

        console.log("[AssemblyAI] Event listeners attached. Connecting to AssemblyAI...");
        await newTranscriber.connect();
        console.log("[AssemblyAI] connect() method called.");

        transcriberRef.current = newTranscriber;

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        }
        
        microphoneStreamRef.current = mediaStream;
        const source = audioContextRef.current.createMediaStreamSource(microphoneStreamRef.current);
        
        await audioContextRef.current.audioWorklet.addModule('/audio-worklets/audio-processor.js');
        console.log("[AssemblyAI] AudioWorklet module added.");
        
        const processorNode = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
        processorNodeRef.current = processorNode;
        
        processorNode.port.onmessage = (event) => {
          if (transcriberRef.current && isReadyRef.current) {
            const float32Data = new Float32Array(event.data);
            
            // Convert Float32Array to Int16Array
            const pcm16Data = new Int16Array(float32Data.length);
            for (let i = 0; i < float32Data.length; i++) {
              let s = Math.max(-1, Math.min(1, float32Data[i]));
              s = s < 0 ? s * 0x8000 : s * 0x7FFF;
              pcm16Data[i] = s;
            }
            
            // Send the Int16Array's buffer
            transcriberRef.current.sendAudio(pcm16Data.buffer);
          }
        };
        
        source.connect(processorNode);
        processorNode.connect(audioContextRef.current.destination);

        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        audioDataArrayRef.current = new Uint8Array(bufferLength);
        
        source.connect(analyser);

        const analyseVolume = () => {
            if (analyserRef.current && audioDataArrayRef.current) {
                analyserRef.current.getByteTimeDomainData(audioDataArrayRef.current);
                let sumSquares = 0.0;
                for (const amplitude of audioDataArrayRef.current) {
                    const normalized = (amplitude / 128.0) - 1.0;
                    sumSquares += normalized * normalized;
                }
                const rms = Math.sqrt(sumSquares / audioDataArrayRef.current.length);
                setVolume(rms);
            }
            animationFrameIdRef.current = requestAnimationFrame(analyseVolume);
        };
        analyseVolume();
      } catch (err) {
        console.error("Error during AssemblyAI setup:", err);
        if (onErrorRef.current) onErrorRef.current(err as Error);
      } finally {
        isSettingUp.current = false;
      }
  }, []);

  const start = useCallback(() => {
    if (!isReady || isRecording) {
      return;
    }
    console.log('[AssemblyAI] Starting transcription...');
    if (audioContextRef.current && processorNodeRef.current && audioSourceRef.current) {
        audioSourceRef.current.connect(processorNodeRef.current);
        processorNodeRef.current.connect(audioContextRef.current.destination); // Required for some browsers
        setIsRecording(true);
    } else {
        console.error('[AssemblyAI] Audio processing components not ready.');
    }
  }, [isReady, isRecording]);

  const stop = useCallback(() => {
    if (!isRecording) {
      return;
    }
    console.log('[AssemblyAI] Stopping transcription...');
    if (audioSourceRef.current && processorNodeRef.current) {
        audioSourceRef.current.disconnect();
    }
    setIsRecording(false);
  }, [isRecording]);

  const onCloseWarning = () => {
    setWarningMessage(null);
    // Potentially add logic to suppress this specific warning for a while
  };

  useEffect(() => {
    return () => {
      transcriberRef.current?.close();
      audioContextRef.current?.close();
    };
  }, []);

  return {
    isReady,
    isRecording,
    setup,
    start,
    stop,
    confidence,
    talkingSpeed,
    clarity,
    warningMessage,
    onCloseWarning,
  };
}; 