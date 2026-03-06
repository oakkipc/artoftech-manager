import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/logger'

const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET() {
  try {
    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, avatar, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, password, role, adminId } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 3. Insert user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        created_at: new Date().toISOString()
      })
      .select('id, name, email, role, created_at')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 4. Log Activity
    await logActivity({
      userId: adminId || null,
      action: 'CREATE',
      entityType: 'USER',
      entityId: newUser.id,
      details: { name: newUser.name, email: newUser.email, role: newUser.role }
    })

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error('[Admin Users POST] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
