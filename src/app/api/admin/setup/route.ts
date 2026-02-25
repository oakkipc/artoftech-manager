import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Secret key to allow initial setup (should be changed after first use)
const SETUP_KEY = process.env.SETUP_KEY || 'aot-manager-setup-2026'

const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: Request) {
  try {
    const { email, password, name, setupKey } = await request.json()

    // Verify setup key
    if (setupKey !== SETUP_KEY) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 403 }
      )
    }

    const supabase = getAdminClient()
    const hashedPassword = Buffer.from(password).toString('base64')

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      // Update existing user to SUPERADMIN
      const { data, error } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword, 
          role: 'SUPERADMIN',
          name: name 
        })
        .eq('email', email)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'User upgraded to SUPERADMIN',
        user: data 
      })
    }

    // Create new SUPERADMIN user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password: hashedPassword,
        role: 'SUPERADMIN',
        avatar: null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'SUPERADMIN created',
      user: { id: data.id, email: data.email, role: data.role }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Setup failed' },
      { status: 500 }
    )
  }
}
