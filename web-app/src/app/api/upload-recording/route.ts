import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a 'recordings' directory at the project root if it doesn't exist
    const recordingsDir = path.join(process.cwd(), '..', 'recordings');
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }
    
    const filename = (formData.get('file') as File).name || `recording-${Date.now()}.webm`;
    const filepath = path.join(recordingsDir, filename);
    fs.writeFileSync(filepath, buffer);

    return NextResponse.json({
      message: 'Recording uploaded and saved successfully.',
      filepath: `/recordings/${filename}`
    });
  } catch (error) {
    console.error('Error uploading recording:', error);
    return NextResponse.json({ error: 'Error uploading file.' }, { status: 500 });
  }
} 