// New file: provide coaching feedback based on latest transcript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json()
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
    }

    // TODO: Replace with real LLM call. For now, produce dummy feedback.
    let suggestion = ''
    const wordCount = transcript.split(/\s+/).length
    if (wordCount < 20) {
      suggestion = 'Try elaborating more on your point.'
    } else if (/\b(um|uh|like)\b/i.test(transcript)) {
      suggestion = 'Consider reducing filler words to sound more confident.'
    } else {
      suggestion = 'Great clarity so far! Keep it up.'
    }

    return NextResponse.json({ suggestion })
  } catch (err) {
    console.error('Feedback route error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
} 