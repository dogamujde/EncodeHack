import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadAudioFile, createTranscription } from '@/lib/transcription';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const speakers = parseInt(formData.get('speakers') as string) || 2;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create interview record in database
    const { data: interview, error: dbError } = await supabaseAdmin
      .from('interviews')
      .insert({
        file_name: audioFile.name,
        file_size: audioFile.size,
        status: 'processing'
      })
      .select()
      .single();

    if (dbError || !interview) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to create interview record' }, { status: 500 });
    }

    try {
      // Upload to AssemblyAI
      const audioUrl = await uploadAudioFile(buffer);
      
      // Start transcription
      const transcriptId = await createTranscription(audioUrl, speakers);

      // Update interview with transcript ID
      await supabaseAdmin
        .from('interviews')
        .update({ 
          status: 'processing'
        })
        .eq('id', interview.id);

      // Store initial transcript record
      const { data: transcript } = await supabaseAdmin
        .from('transcripts')
        .insert({
          interview_id: interview.id,
          raw_transcript: { id: transcriptId, status: 'processing' },
          confidence_score: 0,
          word_count: 0,
          speaker_count: speakers
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        interview_id: interview.id,
        transcript_id: transcript?.id,
        assembly_id: transcriptId
      });

    } catch (transcriptionError) {
      // Update interview status to error
      await supabaseAdmin
        .from('interviews')
        .update({ status: 'error' })
        .eq('id', interview.id);

      console.error('Transcription error:', transcriptionError);
      return NextResponse.json({ error: 'Failed to start transcription' }, { status: 500 });
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 