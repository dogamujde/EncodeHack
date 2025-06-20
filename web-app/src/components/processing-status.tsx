'use client';

import { useState, useEffect } from 'react';

interface ProcessingStatusProps {
  interviewId: string;
  onComplete: (data: any) => void;
}

export function ProcessingStatus({ interviewId, onComplete }: ProcessingStatusProps) {
  const [status, setStatus] = useState<string>('processing');
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/status/${interviewId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to check status');
        }

        setStatus(result.status);

        if (result.status === 'completed') {
          clearInterval(interval);
          clearInterval(timeInterval);
          onComplete(result);
        } else if (result.status === 'error') {
          clearInterval(interval);
          clearInterval(timeInterval);
          setError('Transcription failed. Please try again.');
        } else {
          // Update progress based on status
          if (result.status === 'queued') {
            setProgress(10);
          } else if (result.status === 'processing') {
            setProgress(Math.min(50 + (elapsedTime / 2), 90));
          }
        }
      } catch (err: any) {
        console.error('Status check error:', err);
        setError(err.message || 'Failed to check processing status');
        clearInterval(interval);
        clearInterval(timeInterval);
      }
    };

    // Check status every 5 seconds
    interval = setInterval(checkStatus, 5000);
    
    // Update elapsed time every second
    timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Initial check
    checkStatus();

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [interviewId, onComplete, elapsedTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'queued':
        return 'Your file is in the processing queue...';
      case 'processing':
        return 'Analyzing audio and extracting insights...';
      case 'completed':
        return 'Analysis complete!';
      case 'error':
        return 'Processing failed';
      default:
        return 'Processing your interview...';
    }
  };

  const getCurrentStep = () => {
    if (progress < 20) return 'Uploading audio file';
    if (progress < 40) return 'Starting transcription';
    if (progress < 70) return 'Detecting speakers';
    if (progress < 90) return 'Analyzing sentiment';
    return 'Generating AI visual';
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Processing Failed
            </h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔄</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Processing Your Interview
          </h2>
          <p className="text-gray-600">
            {getStatusMessage()}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{getCurrentStep()}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Processing Steps */}
        <div className="space-y-3 mb-8">
          {[
            { step: 'Audio Upload', done: progress > 10 },
            { step: 'Speech Recognition', done: progress > 30 },
            { step: 'Speaker Detection', done: progress > 50 },
            { step: 'Sentiment Analysis', done: progress > 70 },
            { step: 'AI Visual Generation', done: progress > 90 }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                item.done 
                  ? 'bg-green-500 text-white' 
                  : progress > (index + 1) * 20 - 10
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {item.done ? '✓' : index + 1}
              </div>
              <span className={item.done ? 'text-green-700' : 'text-gray-600'}>
                {item.step}
              </span>
            </div>
          ))}
        </div>

        {/* Time Elapsed */}
        <div className="text-center text-gray-500">
          <p>Processing time: {formatTime(elapsedTime)}</p>
          <p className="text-sm mt-1">
            Typical processing time: 2-5 minutes depending on file length
          </p>
        </div>

        {/* Fun Facts */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">💡 Did you know?</h3>
          <p className="text-sm text-gray-600">
            Our AI can detect subtle emotional patterns in speech that even trained humans might miss, 
            providing insights into confidence levels, engagement, and communication effectiveness.
          </p>
        </div>
      </div>
    </div>
  );
} 