import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Fetch total participants count
    const { count: contributorsCount, error: cError } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });

    // 2. Fetch total recordings count
    const { count: recordingsCount, error: rError } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true });

    if (cError || rError) {
      console.error('Error fetching public stats:', cError, rError);
      // Return fallbacks
      return NextResponse.json({ contributors: 15, recordings: 150 });
    }

    return NextResponse.json({
      contributors: contributorsCount || 0,
      recordings: recordingsCount || 0
    });
  } catch (err: any) {
    console.error('Stats handler error:', err);
    return NextResponse.json({ contributors: 15, recordings: 150 });
  }
}
