import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const participantId = formData.get('participantId') as string | null;
    const phrase = formData.get('phrase') as string | null;
    const durationStr = formData.get('duration') as string | null;

    if (!audioFile || !participantId || !phrase || !durationStr) {
      return NextResponse.json({ error: 'Missing required upload parameters' }, { status: 400 });
    }

    const duration = parseFloat(durationStr);
    if (isNaN(duration)) {
      return NextResponse.json({ error: 'Invalid duration value' }, { status: 400 });
    }

    // 1. Look up participant code for the file path structure
    const { data: participant, error: pError } = await supabase
      .from('participants')
      .select('participant_code')
      .eq('id', participantId)
      .single();

    if (pError || !participant) {
      console.error('Participant lookup failed:', pError);
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const participantCode = participant.participant_code;

    // 2. Determine file format extension
    const mimeType = audioFile.type || 'audio/webm';
    const extension = getExtensionFromMime(mimeType);

    // Clean up phrase for safe file naming (replace spaces/symbols with underscores)
    const cleanPhrase = phrase.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `participant_${participantCode}/${cleanPhrase}_${Date.now()}.${extension}`;

    // 3. Convert File to ArrayBuffer and upload to Vercel Blob
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Note: Vercel Blob uses process.env.BLOB_READ_WRITE_TOKEN automatically
    const blobResult = await put(filename, buffer, {
      access: 'public',
      contentType: mimeType,
    });

    // 4. Save metadata to Supabase
    const { data: recording, error: rError } = await supabase
      .from('recordings')
      .insert({
        participant_id: participantId,
        phrase,
        audio_url: blobResult.url,
        duration,
        file_format: extension,
      })
      .select()
      .single();

    if (rError) {
      console.error('Failed to insert recording metadata:', rError);
      return NextResponse.json({ error: 'Failed to save recording metadata' }, { status: 500 });
    }

    return NextResponse.json(recording);
  } catch (err: any) {
    console.error('Server error in /api/recordings/upload:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function getExtensionFromMime(mimeType: string): string {
  const mime = mimeType.toLowerCase();
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg') || mime.includes('opus')) return 'ogg';
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a';
  return 'webm'; // Fallback default
}
