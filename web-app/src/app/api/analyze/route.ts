import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the structure for a sentiment moment based on the roadmap
interface SentimentMoment {
  topic: string;
  snippet: string;
  momentType: 'positive' | 'negative' | 'neutral';
  timeRange: { start: string; end: string };
  sentimentChange: number;
  speaker: string;
}

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // Use gpt-4o-mini as specified in the project requirements
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert meeting analyst. Analyze the following transcript and identify key moments of positive, negative, and neutral sentiment. For each moment, provide the topic, a brief snippet, the sentiment type, a hypothetical time range, and the speaker. Format the output as a JSON array of objects.`,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Error analyzing transcript:', error);
    return NextResponse.json({ error: 'Failed to analyze transcript' }, { status: 500 });
  }
} 