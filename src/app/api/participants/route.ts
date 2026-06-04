import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Retrieve all participants with their recordings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select(`
        *,
        recordings (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching participants:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Server error in GET /api/participants:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new participant with auto-generated code
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, environment, device_type, consent } = body;

    if (!name || !environment || !device_type || consent === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Query database to get total participant count to generate code
    const { count, error: countError } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting participants:', countError);
      return NextResponse.json({ error: 'Database query error during code generation' }, { status: 500 });
    }

    const nextCode = (count || 0) + 1;
    const participant_code = `P${String(nextCode).padStart(3, '0')}`;

    // Insert new participant
    const { data, error: insertError } = await supabase
      .from('participants')
      .insert({
        participant_code,
        name,
        environment,
        device_type,
        consent
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting participant:', insertError);
      return NextResponse.json({ 
        error: `Failed to save participant: ${insertError.message} (Code: ${insertError.code})` 
      }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Server error in POST /api/participants:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
