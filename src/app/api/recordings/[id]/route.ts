import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing recording ID' }, { status: 400 });
    }

    // 1. Fetch recording metadata to get the audio URL
    const { data: recording, error: fetchError } = await supabase
      .from('recordings')
      .select('audio_url')
      .eq('id', id)
      .single();

    if (fetchError || !recording) {
      console.error('Recording not found for deletion:', fetchError);
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // 2. Delete file from Vercel Blob
    try {
      await del(recording.audio_url);
    } catch (blobErr) {
      console.error('Failed to delete file from Vercel Blob:', blobErr);
      // We will proceed to delete from DB even if Vercel Blob fails, to keep DB clean
    }

    // 3. Delete row from Supabase
    const { error: deleteError } = await supabase
      .from('recordings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete recording from DB:', deleteError);
      return NextResponse.json({ error: 'Failed to delete recording from database' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Recording deleted successfully' });
  } catch (err: any) {
    console.error('Server error in DELETE /api/recordings/[id]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
