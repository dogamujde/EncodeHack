'use client';

import { useState } from 'react';
import { AudioUploader } from '@/components/audio-uploader';
import { AnalysisDashboard } from '@/components/analysis-dashboard';
import { ProcessingStatus } from '@/components/processing-status';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleUploadSuccess = (id: string) => {
    setInterviewId(id);
    setCurrentStep('processing');
  };

  const handleProcessingComplete = (data: any) => {
    setAnalysisData(data);
    setCurrentStep('results');
  };

  const handleStartOver = () => {
    setCurrentStep('upload');
    setInterviewId(null);
    setAnalysisData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎤 Live Coach
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered interview analysis with speaker detection, sentiment analysis, and intelligent insights
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 'upload' && (
            <AudioUploader onSuccess={handleUploadSuccess} />
          )}

          {currentStep === 'processing' && interviewId && (
            <ProcessingStatus 
              interviewId={interviewId} 
              onComplete={handleProcessingComplete}
            />
          )}

          {currentStep === 'results' && analysisData && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Analysis Results
                </h2>
                <button
                  onClick={handleStartOver}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Analyze Another Interview
                </button>
              </div>
              
              <AnalysisDashboard data={analysisData} />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500">
          <p>Powered by AssemblyAI, Supabase, and ACI-VibeOps</p>
        </footer>
      </div>
    </div>
  );
}
