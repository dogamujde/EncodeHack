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
  expressionThresholds?: Partial<Record<keyof typeof defaultThresholds, number>>;
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
  jawOpen: 'Surprised',
  mouthSmileLeft: 'Happy',
  mouthSmileRight: 'Happy',
  mouthPressLeft: 'Thinking',
  mouthPressRight: 'Thinking',
  // Note: 'Confused' is a derived expression, but we can add a placeholder
  // if needed, or handle it purely in logic. For now, let's rely on the logic.
};

const ALL_EXPRESSIONS = [
  'Angry', 'Curious', 'Surprised', 'Focused', 'Happy', 'Thinking', 'Confused'
];

const defaultThresholds = {
  Angry: 0.4,
  Curious: 0.3,
  Surprised: 0.5,
  Focused: 0.3,
  Happy: 0.4,
  Thinking: 0.3,
  Confused: 0.3,
};

const initialAnalysisState: ExpressionAnalysis = {
  dominantExpression: 'Neutral',
  activeExpressions: [],
  expressions: Object.fromEntries(ALL_EXPRESSIONS.map(e => [e, 0])),
};

export const useFaceExpressions = ({
  videoRef,
  canvasRef,
  expressionThresholds: customThresholds,
}: UseFaceExpressionsProps) => {
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [analysis, setAnalysis] = useState<ExpressionAnalysis>(initialAnalysisState);
  const animationFrameId = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const smoothedScoresRef = useRef<{ [key: string]: number }>({ ...initialAnalysisState.expressions });

  const analyzeBlendshapes = (blendshapes: Classifications[]) => {
    // 1. Get raw scores for this frame
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

    // 2. Apply smoothing to base expressions
    const smoothingFactor = 0.1;
    const currentSmoothed = smoothedScoresRef.current;
    const newSmoothedScores: { [key: string]: number } = {};
    for (const key in rawScores) {
      if (key === 'Confused') continue; // Skip 'Confused' for now
      newSmoothedScores[key] = (currentSmoothed[key] * (1 - smoothingFactor)) + (rawScores[key] * smoothingFactor);
    }

    // 3. Derive and smooth the 'Confused' score with a decay mechanism
    const potentialConfusedScore = (newSmoothedScores['Angry'] + newSmoothedScores['Thinking']) / 2;

    // Apply the same smoothing to the derived 'Confused' score
    newSmoothedScores['Confused'] = 
      (currentSmoothed['Confused'] * (1 - smoothingFactor)) + (potentialConfusedScore * smoothingFactor);
    
    smoothedScoresRef.current = newSmoothedScores;

    // 4. Determine active expressions based on smoothed scores
    const thresholds = { ...defaultThresholds, ...customThresholds };
    const activeExpressions = new Set<string>();

    for (const [expression, score] of Object.entries(newSmoothedScores)) {
      const threshold = (thresholds as any)[expression];
      if (threshold && score > threshold) {
        activeExpressions.add(expression);
      }
    }

    if (activeExpressions.has('Confused')) {
        activeExpressions.delete('Angry');
        activeExpressions.delete('Thinking');
        activeExpressions.delete('Focused');
    }

    // 5. Sort active expressions and determine dominant one
    const activeExpressionsArray = Array.from(activeExpressions).sort(
      (a, b) => newSmoothedScores[b] - newSmoothedScores[a]
    );

    const dominantExpression = activeExpressionsArray.length > 0 ? activeExpressionsArray[0] : 'Neutral';

    // 6. Set final state for UI
    setAnalysis({
      dominantExpression,
      activeExpressions: activeExpressionsArray,
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
  }, [videoRef, canvasRef]);

  return analysis;
}; 