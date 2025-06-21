import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  const recordingsDir = path.join(process.cwd(), '..', 'recordings');
  const filePath = path.join(recordingsDir, filename);

  try {
    const stats = fs.statSync(filePath);
    const stream = fs.createReadStream(filePath);

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Type': 'video/webm',
        'Content-Length': stats.size.toString(),
      },
    });
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error);
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }
} 