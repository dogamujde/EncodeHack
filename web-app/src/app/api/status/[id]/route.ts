import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTranscriptionStatus, analyzeTranscription } from '@/lib/transcription';
import { generateInterviewVisu, AnalysisData } from '@/lib/ai-visual';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const interviewId = resolvedParams.id;

    // Get interview and transcript from database
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('interviews')
      .select(`
        *,
        transcripts (*)
      `)
      .eq('id', interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const transcript = interview.transcripts[0];
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    const assemblyId = transcript.raw_transcript?.id;
    if (!assemblyId) {
      return NextResponse.json({ error: 'No transcription ID found' }, { status: 400 });
    }

    // Check status from AssemblyAI
    const status = await getTranscriptionStatus(assemblyId);

    if (status.status === 'completed' && interview.status !== 'completed') {
      // Process the completed transcription
      const analysis = analyzeTranscription(status);
      
      if (analysis) {
        // Generate AI visual
        const aiVisualData: AnalysisData = {
          duration: analysis.duration / 1000,
          speakerBalance: analysis.speakerBalance,
          overallSentiment: analysis.overallSentiment,
          keyPhrases: analysis.keyPhrases,
          speakerCount: Object.keys(analysis.speakers).length,
          confidence: analysis.confidence
        };

        const aiVisualUrl = await generateInterviewVisu(aiVisualData);

        // Update transcript with full data
        await supabaseAdmin
          .from('transcripts')
          .update({
            raw_transcript: status,
            confidence_score: status.confidence || 0,
            word_count: status.words?.length || 0,
            speaker_count: Object.keys(analysis.speakers).length
          })
          .eq('id', transcript.id);

        // Store speaker analysis
        for (const [speakerId, speakerData] of Object.entries(analysis.speakers)) {
          await supabaseAdmin
            .from('speaker_analysis')
            .insert({
              transcript_id: transcript.id,
              speaker_id: speakerId,
              word_count: speakerData.wordCount,
              speaking_duration: speakerData.totalDuration / 1000,
              words_per_minute: speakerData.wordCount / (speakerData.totalDuration / 60000),
              sentiment_scores: analysis.sentimentBreakdown,
              key_phrases: analysis.keyPhrases
            });
        }

        // Store analysis report
        await supabaseAdmin
          .from('analysis_reports')
          .insert({
            transcript_id: transcript.id,
            report_type: 'interview_analysis',
            report_data: analysis,
            ai_visual_url: aiVisualUrl
          });

        // Update interview status to completed
        await supabaseAdmin
          .from('interviews')
          .update({ 
            status: 'completed',
            duration_seconds: Math.round(analysis.duration / 1000)
          })
          .eq('id', interviewId);

        return NextResponse.json({
          status: 'completed',
          analysis,
          ai_visual_url: aiVisualUrl
        });
      }
    }

    return NextResponse.json({
      status: status.status,
      interview_status: interview.status
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
} 