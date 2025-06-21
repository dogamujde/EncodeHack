'use client';

import { useEffect, useRef, useState } from 'react';

// --- Landmark Constants for Expression Detection ---
const P1_LOWER_EYELID = 145;
const P1_UPPER_EYELID = 159;
const P2_LOWER_EYELID = 374;
const P2_UPPER_EYELID = 386;
const P1_LEFT_EYEBROW = 70;
const P1_RIGHT_EYEBROW = 300;
const P1_LEFT_EYE_TOP = 159;
const P1_RIGHT_EYE_TOP = 386;
const UPPER_LIP_CENTER = 13;
const LOWER_LIP_CENTER = 14;

interface UseFaceExpressionsProps {
  stream: MediaStream | null;
}

export const useFaceExpressions = ({ stream }: UseFaceExpressionsProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceMeshRef = useRef<any | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = (text: string) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setFeedback(text);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(''), 3000);
  };

  const getDistance = (p1: any, p2: any) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
  };

  useEffect(() => {
    if (!stream) {
      // Clean up if the stream is removed
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    let faceMesh: any;
    let localVideoEl: HTMLVideoElement;

    const onResults = (results: any) => {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        return;
      }
      const landmarks = results.multiFaceLandmarks[0];

      // Expression detection logic...
      const leftEyeVerticalDist = getDistance(landmarks[P1_UPPER_EYELID], landmarks[P1_LOWER_EYELID]);
      const rightEyeVerticalDist = getDistance(landmarks[P2_UPPER_EYELID], landmarks[P2_LOWER_EYELID]);
      if (leftEyeVerticalDist < 0.01 && rightEyeVerticalDist < 0.01) {
        showFeedback('Blink Detected');
      }

      const leftEyebrowDist = getDistance(landmarks[P1_LEFT_EYEBROW], landmarks[P1_LEFT_EYE_TOP]);
      const rightEyebrowDist = getDistance(landmarks[P1_RIGHT_EYEBROW], landmarks[P1_RIGHT_EYE_TOP]);
      if (leftEyebrowDist > 0.08 || rightEyebrowDist > 0.08) {
        showFeedback('Eyebrows Raised');
      }

      const lipDist = getDistance(landmarks[UPPER_LIP_CENTER], landmarks[LOWER_LIP_CENTER]);
      if (lipDist > 0.03) {
        showFeedback('Lip Movement Detected');
      }
    };

    const initialize = async () => {
      // Create a hidden video element to process the stream
      localVideoEl = document.createElement('video');
      localVideoEl.autoplay = true;
      localVideoEl.muted = true;
      localVideoEl.style.display = 'none';
      localVideoEl.srcObject = stream;
      videoRef.current = localVideoEl;
      document.body.appendChild(localVideoEl);

      const { FaceMesh } = await import('@mediapipe/face_mesh');
      faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;

      const processVideo = async () => {
        if (localVideoEl.readyState >= 3 && faceMeshRef.current) {
          await faceMeshRef.current.send({ image: localVideoEl });
        }
        if (faceMeshRef.current) { // Continue processing if mesh is still active
          requestAnimationFrame(processVideo);
        }
      };

      localVideoEl.onloadeddata = () => {
        requestAnimationFrame(processVideo);
      };
    };

    initialize();

    return () => {
      faceMesh?.close();
      faceMeshRef.current = null;
      if (localVideoEl) {
        document.body.removeChild(localVideoEl);
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [stream]);

  return feedback;
}; 