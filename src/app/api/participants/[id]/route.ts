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
      return NextResponse.json({ error: 'Missing participant ID' }, { status: 400 });
    }

    // 1. Fetch all recordings for this participant to get their audio URLs
    const { data: recordings, error: fetchError } = await supabase
      .from('recordings')
      .select('audio_url')
      .eq('participant_id', id);

    if (fetchError) {
      console.error('Failed to fetch participant recordings for deletion:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch associated recordings' }, { status: 500 });
    }

    // 2. Delete all audio files from Vercel Blob in bulk if they exist
    if (recordings && recordings.length > 0) {
      const urls = recordings.map((r) => r.audio_url);
      try {
        await del(urls);
      } catch (blobErr) {
        console.error('Failed to delete files in bulk from Vercel Blob:', blobErr);
        // We will proceed to delete from DB to keep the system usable
      }
    }

    // 3. Delete the participant from Supabase (cascades to delete recordings rows in DB)
    const { error: deleteError } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete participant from Supabase:', deleteError);
      return NextResponse.json({ error: 'Failed to delete participant from database' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Participant and all associated recordings deleted successfully' });
  } catch (err: any) {
    console.error('Server error in DELETE /api/participants/[id]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
