import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      db: { schema: 'public' }
    })

    // Try direct SQL via the pg_net or pg extension
    // Use the Supabase connection string approach
    const dbUrl = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

    // Execute raw SQL via fetch to the Supabase SQL endpoint
    const res = await fetch(`${supabaseUrl}/pg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        query: `CREATE TABLE IF NOT EXISTS tasks (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
          title text NOT NULL,
          description text,
          status text DEFAULT 'TODO' NOT NULL,
          position integer DEFAULT 0 NOT NULL,
          assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
          created_at timestamptz DEFAULT now() NOT NULL
        );`
      })
    })

    if (res.ok) {
      return NextResponse.json({ message: 'Tasks table created successfully' })
    }

    // If the pg endpoint doesn't work, return the SQL for manual execution
    return NextResponse.json({
      message: 'Please create the tasks table in Supabase Dashboard → SQL Editor:',
      sql: `CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'TODO' NOT NULL,
  position integer DEFAULT 0 NOT NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS (optional)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON tasks FOR ALL USING (true);`
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
