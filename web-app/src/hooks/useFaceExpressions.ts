'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

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
const MOUTH_CORNER_LEFT = 61;
const MOUTH_CORNER_RIGHT = 291;

interface UseFaceExpressionsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const useFaceExpressions = ({ videoRef, canvasRef }: UseFaceExpressionsProps) => {
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [blendShapes, setBlendShapes] = useState<any[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const createFaceLandmarker = async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
      faceLandmarkerRef.current = faceLandmarker;
    };

    const predictWebcam = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !faceLandmarkerRef.current) {
        animationFrameId.current = requestAnimationFrame(predictWebcam);
        return;
      }

      if (video.currentTime === lastVideoTimeRef.current) {
        animationFrameId.current = requestAnimationFrame(predictWebcam);
        return;
      }
      lastVideoTimeRef.current = video.currentTime;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
      const canvasCtx = canvas.getContext("2d");

      if (canvasCtx) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        const drawingUtils = new DrawingUtils(canvasCtx);
        if (results.faceLandmarks) {
          for (const landmarks of results.faceLandmarks) {
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#FF3030" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#30FF30" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#FF3030" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#30FF30" });
          }
        }
        canvasCtx.restore();
      }

      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        setBlendShapes(results.faceBlendshapes[0].categories);
      }
      
      animationFrameId.current = requestAnimationFrame(predictWebcam);
    };

    const initialize = async () => {
      await createFaceLandmarker();
      video.addEventListener("loadeddata", () => {
        animationFrameId.current = requestAnimationFrame(predictWebcam);
      });
    };
    
    initialize();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      faceLandmarkerRef.current?.close();
    };
  }, [videoRef, canvasRef]);

  return blendShapes;
}; 