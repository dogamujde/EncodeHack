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
  expressionThresholds?: Partial<{ [key: string]: number }>;
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
  // Note: 'Confused' is a derived expression, but we can add a placeholder
  // if needed, or handle it purely in logic. For now, let's rely on the logic.
};

const ALL_EXPRESSIONS = [
  'Angry', 'Curious', 'Surprised', 'Focused', 'Fear', 'Joy',
  'Disgust', 'Happy', 'Sad', 'Thinking', 'Confused'
];

const initialAnalysisState: ExpressionAnalysis = {
  dominantExpression: 'Neutral',
  activeExpressions: [],
  expressions: Object.fromEntries(ALL_EXPRESSIONS.map(e => [e, 0])),
};

const defaultThresholds: { [key: string]: number } = {
  'Curious': 0.3, 'Angry': 0.4, 'Surprised': 0.5,
  'Focused': 0.3, 'Happy': 0.4, 'Sad': 0.3,
  'Fear': 0.4, 'Thinking': 0.3, 'Confused': 0.3
};

export const useFaceExpressions = ({ 
  videoRef, 
  canvasRef, 
  expressionThresholds: customThresholds 
}: UseFaceExpressionsProps) => {
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [analysis, setAnalysis] = useState<ExpressionAnalysis>(initialAnalysisState);
  const animationFrameId = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const smoothedScoresRef = useRef<{ [key:string]: number }>({ ...initialAnalysisState.expressions });

  const expressionThresholds = { ...defaultThresholds, ...customThresholds };

  const analyzeBlendshapes = (blendshapes: Classifications[]) => {
    // 1. Get raw scores
    const rawScores: { [key: string]: number } = { ...initialAnalysisState.expressions };
    if (blendshapes && blendshapes.length > 0) {
      const categories = blendshapes[0].categories;
      for (const category of categories) {
        const expression = blendshapeToExpression[category.categoryName];
        if (expression) {
          rawScores[expression] = Math.max(rawScores[expression], category.score);
        }
      }
    }

    // 2. Smooth base expressions
    const smoothingFactor = 0.2;
    const currentSmoothed = smoothedScoresRef.current;
    const newSmoothedScores: { [key: string]: number } = {};
    for (const key in rawScores) {
      if (key === 'Confused') continue;
      newSmoothedScores[key] = (currentSmoothed[key] * (1 - smoothingFactor)) + (rawScores[key] * smoothingFactor);
    }
    
    // 3. Derive and smooth 'Confused' score
    const potentialConfusedScore = (newSmoothedScores['Angry'] + newSmoothedScores['Thinking']) / 2;
    if (potentialConfusedScore > currentSmoothed['Confused']) {
      newSmoothedScores['Confused'] = potentialConfusedScore;
    } else {
      newSmoothedScores['Confused'] = currentSmoothed['Confused'] * (1 - smoothingFactor);
    }
    smoothedScoresRef.current = newSmoothedScores;

    // 4. Determine active and dominant expressions from sorted, smoothed scores
    const sortedExpressions = Object.entries(newSmoothedScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

    let activeExpressions = sortedExpressions
      .filter(([expression, score]) => score > (expressionThresholds[expression] || 0))
      .map(([expression]) => expression);

    let dominantExpression = activeExpressions.length > 0 ? activeExpressions[0] : 'Neutral';

    // Special Rule: If 'Confused' is dominant, suppress related expressions
    if (dominantExpression === 'Confused') {
      activeExpressions = activeExpressions.filter(
        exp => exp !== 'Angry' && exp !== 'Thinking' && exp !== 'Focused'
      );
      // Ensure 'Confused' remains if it was filtered out (in case its score is lower than a suppressed one)
      if (!activeExpressions.includes('Confused')) {
        activeExpressions.unshift('Confused');
      }
    }
    
    // 5. Set final state for UI
    setAnalysis({
      dominantExpression,
      activeExpressions: activeExpressions,
      expressions: newSmoothedScores,
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

      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const container = canvas.parentElement;
      if (container) {
        const containerAspectRatio = container.clientWidth / container.clientHeight;
        let scale = 1;
        if (containerAspectRatio > videoAspectRatio) {
          scale = container.clientWidth / video.videoWidth;
        } else {
          scale = container.clientHeight / video.videoHeight;
        }
        canvas.style.transform = `scaleX(-1) scale(${scale})`;
      } else {
        canvas.style.transform = 'scaleX(-1)';
      }

      const startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
      const canvasCtx = canvas.getContext("2d");

      if (canvasCtx) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        // Flip the context horizontally to counteract the CSS mirroring
        canvasCtx.scale(-1, 1);
        canvasCtx.translate(-canvas.width, 0);

        const drawingUtils = new DrawingUtils(canvasCtx);
        if (results.faceLandmarks) {
          // Drawing is disabled to hide the mesh
          // for (const landmarks of results.faceLandmarks) {
          //   drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
          //   drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030" });
          //   drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#FF3030" });
          //   drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30" });
          //   drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#30FF30" });
          //   drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0" });
          //   drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0" });
          //   drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#FF3030" });
          //   drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#30FF30" });
          // }
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
  }, [videoRef, canvasRef, expressionThresholds]);

  return analysis;
}; 