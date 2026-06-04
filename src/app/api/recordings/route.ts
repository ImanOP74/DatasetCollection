import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('recordings')
      .select(`
        *,
        participant:participants (
          participant_code,
          name,
          accent,
          native_language,
          environment,
          device_type
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recordings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Server error in GET /api/recordings:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
