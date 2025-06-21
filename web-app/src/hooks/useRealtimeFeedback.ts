"use client";

import { useState, useEffect } from 'react';

const FILLER_WORDS = [
  "um", "uh", "like", "you know", "so", "actually", "basically", "literally"
];

interface UseRealtimeFeedbackProps {
  transcript: string;
}

export const useRealtimeFeedback = ({ transcript }: UseRealtimeFeedbackProps) => {
  const [feedback, setFeedback] = useState<string[]>([]);

  useEffect(() => {
    if (!transcript) {
      return;
    }

    const words = transcript.toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1];

    if (FILLER_WORDS.includes(lastWord)) {
      const newFeedback = `Filler word detected: "${lastWord}"`;
      setFeedback(prev => {
        const updatedFeedback = [newFeedback, ...prev];
        // Keep the feedback list from growing too large
        if (updatedFeedback.length > 5) {
          updatedFeedback.pop();
        }
        return updatedFeedback;
      });
    }
  }, [transcript]);

  return feedback;
}; 