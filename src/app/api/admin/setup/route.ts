import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Use the Supabase SQL query endpoint directly
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    })

    // Try to create the table by inserting a test and catching the error
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Check if tasks table exists by trying to query it
    const { error: checkError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1)

    if (checkError && checkError.message.includes('does not exist')) {
      return NextResponse.json({
        message: 'Tasks table does not exist. Please run this SQL in Supabase Dashboard SQL Editor:',
        sql: `CREATE TABLE IF NOT EXISTS tasks (
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
    }

    return NextResponse.json({ message: 'Tasks table already exists!', exists: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
