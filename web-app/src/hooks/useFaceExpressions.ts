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
  isReady: boolean;
  showMesh: boolean;
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
  isReady,
  showMesh,
  expressionThresholds: customThresholds,
}: UseFaceExpressionsProps) => {
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [analysis, setAnalysis] = useState<ExpressionAnalysis>(initialAnalysisState);
  const animationFrameId = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const isDetecting = useRef(false);
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

    // 6. Set final state for UI, only if it has changed
    setAnalysis(prevAnalysis => {
      const hasDominantChanged = prevAnalysis.dominantExpression !== dominantExpression;
      const haveActivesChanged =
        prevAnalysis.activeExpressions.length !== activeExpressionsArray.length ||
        prevAnalysis.activeExpressions.some((exp, i) => exp !== activeExpressionsArray[i]);
      
      // We also want to check if any of the scores have changed meaningfully
      const haveScoresChanged = Object.keys(newSmoothedScores).some(key => {
        const oldScore = (prevAnalysis.expressions as any)[key] || 0;
        const newScore = (newSmoothedScores as any)[key] || 0;
        return Math.abs(oldScore - newScore) > 0.0001; // Update if there's a small change
      });

      const shouldUpdate = hasDominantChanged || haveActivesChanged || haveScoresChanged;

      if (shouldUpdate) {
        return {
          dominantExpression,
          activeExpressions: activeExpressionsArray,
          expressions: newSmoothedScores,
        };
      }
      return prevAnalysis;
    });
  };

  useEffect(() => {
    if (!isReady) {
      return;
    }

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

    const predictWebcam = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (isDetecting.current || !video || !canvas || !faceLandmarkerRef.current) {
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
        
        let renderedWidth, renderedHeight;
        if (videoAspectRatio > containerAspectRatio) {
            renderedWidth = container.clientWidth;
            renderedHeight = renderedWidth / videoAspectRatio;
        } else {
            renderedHeight = container.clientHeight;
            renderedWidth = renderedHeight * videoAspectRatio;
        }

        const offsetX = (container.clientWidth - renderedWidth) / 2;
        const offsetY = (container.clientHeight - renderedHeight) / 2;

        canvas.style.width = `${renderedWidth}px`;
        canvas.style.height = `${renderedHeight}px`;
        canvas.style.left = `${offsetX}px`;
        canvas.style.top = `${offsetY}px`;
        canvas.style.transform = 'scaleX(-1)';
        canvas.classList.add('pointer-events-none');
      } else {
        canvas.style.transform = 'scaleX(-1)';
        canvas.classList.add('pointer-events-none');
      }

      isDetecting.current = true;
      const startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
      isDetecting.current = false;

      const canvasCtx = canvas.getContext("2d");

      if (canvasCtx) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const drawingUtils = new DrawingUtils(canvasCtx);
        if (showMesh && results.faceLandmarks) {
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
        analyzeBlendshapes(results.faceBlendshapes);
      }
      
      animationFrameId.current = requestAnimationFrame(predictWebcam);
    };

    const initialize = async () => {
      await createFaceLandmarker();

      const startPredictionLoop = () => {
        if (!animationFrameId.current) {
            animationFrameId.current = requestAnimationFrame(predictWebcam);
        }
      };

      // If the video's metadata is already loaded, start the loop.
      // Otherwise, wait for the 'loadeddata' event.
      if (video.readyState >= 1) { // HAVE_METADATA
        startPredictionLoop();
      } else {
        video.addEventListener("loadeddata", startPredictionLoop);
      }
    };
    
    initialize();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (faceLandmarkerRef.current && !isDetecting.current) {
          faceLandmarkerRef.current.close();
          faceLandmarkerRef.current = null;
      }
    };
  }, [isReady, showMesh, videoRef, canvasRef]);

  return analysis;
}; 