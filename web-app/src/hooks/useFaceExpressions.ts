'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver, DrawingUtils, Classifications } from "@mediapipe/tasks-vision";

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

// --- Type Definitions ---
interface ExpressionAnalysis {
  dominantExpression: string;
  activeExpressions: string[];
  expressions: { [key: string]: number };
}

interface UseFaceExpressionsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// --- Mappings ---
// Based on ARKit to FACS Cheat Sheet
const blendshapeToExpression: { [key: string]: string } = {
  browInnerUp: 'Curious',
  browDownLeft: 'Angry',
  browDownRight: 'Angry',
  browOuterUpLeft: 'Surprised',
  browOuterUpRight: 'Surprised',
  eyeSquintLeft: 'Focused',
  eyeSquintRight: 'Focused',
  eyeWideLeft: 'Fear',
  eyeWideRight: 'Fear',
  cheekSquintLeft: 'Joy',
  cheekSquintRight: 'Joy',
  noseSneerLeft: 'Disgust',
  noseSneerRight: 'Disgust',
  jawOpen: 'Surprised',
  mouthSmileLeft: 'Happy',
  mouthSmileRight: 'Happy',
  mouthFrownLeft: 'Sad',
  mouthFrownRight: 'Sad',
  mouthPressLeft: 'Thinking',
  mouthPressRight: 'Thinking',
};

export const useFaceExpressions = ({ videoRef, canvasRef }: UseFaceExpressionsProps) => {
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [analysis, setAnalysis] = useState<ExpressionAnalysis>({ dominantExpression: 'Neutral', activeExpressions: [], expressions: {} });
  const animationFrameId = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);

  const analyzeBlendshapes = (blendshapes: Classifications[]) => {
    if (!blendshapes || blendshapes.length === 0) {
      setAnalysis({ dominantExpression: 'Neutral', activeExpressions: [], expressions: {} });
      return;
    }

    const categories = blendshapes[0].categories;
    const expressionScores: { [key: string]: number } = {};
    
    // Aggregate scores for each expression by taking the max of left/right
    for (const category of categories) {
      const expression = blendshapeToExpression[category.categoryName];
      if (expression) {
        if (!expressionScores[expression]) {
          expressionScores[expression] = 0;
        }
        expressionScores[expression] = Math.max(expressionScores[expression], category.score);
      }
    }

    const activeExpressions = new Set<string>();
    const expressionThresholds: { [key: string]: number } = {
      'Curious': 0.3, 'Angry': 0.3, 'Surprised': 0.5,
      'Focused': 0.3, 'Happy': 0.4, 'Sad': 0.3,
      'Disgust': 0.4, 'Fear': 0.4, 'Joy': 0.4,
      'Thinking': 0.3
    };

    // Check for single expressions based on thresholds
    for (const [expression, score] of Object.entries(expressionScores)) {
        const threshold = (expressionThresholds as any)[expression];
        if (threshold && score > threshold) {
            activeExpressions.add(expression);
        }
    }

    // Check for combined expressions
    if (expressionScores['Angry'] > 0.25 && expressionScores['Curious'] > 0.25) {
        activeExpressions.add('Confused');
        activeExpressions.delete('Angry');
        activeExpressions.delete('Curious');
    }
    if (expressionScores['Happy'] > 0.6 && expressionScores['Joy'] > 0.4) {
        activeExpressions.add('Ecstatic');
        activeExpressions.delete('Happy');
        activeExpressions.delete('Joy');
    }

    // Determine a single "dominant" expression to display, can be refined
    const dominantExpression = activeExpressions.size > 0 ? Array.from(activeExpressions)[0] : 'Neutral';

    setAnalysis({
      dominantExpression,
      activeExpressions: Array.from(activeExpressions),
      expressions: expressionScores,
    });
  };

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

      if (results.faceBlendshapes) {
        analyzeBlendshapes(results.faceBlendshapes);
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

  return analysis;
}; 