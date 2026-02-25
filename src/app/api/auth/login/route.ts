import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as bcrypt from 'bcryptjs'

const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Find user by email only
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password, name, role, avatar')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('[Login] Supabase query error:', error)
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Attempt to verify with bcrypt
    let isMatch = false

    // Check if the stored password looks like a bcrypt hash (starts with $2)
    if (user.password && user.password.startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(password, user.password)
      } catch (e) {
        console.error('[Login] bcrypt compare error:', e)
      }
    }

    // Fallback for auto-migration: check if it's the old Base64 format
    if (!isMatch) {
      const oldHashedPassword = Buffer.from(password).toString('base64')
      if (user.password === oldHashedPassword) {
        // Match found with old format! Auto-migrate to bcrypt now
        try {
          const newHashedPassword = await bcrypt.hash(password, 10)

          await supabase
            .from('users')
            .update({ password: newHashedPassword })
            .eq('id', user.id)
        } catch (e) {
          console.error('[Login] bcrypt hash migration error:', e)
        }

        isMatch = true
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Check if user is approved
    if (user.role === 'PENDING') {
      return NextResponse.json(
        { error: 'บัญชีของคุณยังไม่ได้รับการอนุมัติ กรุณารอการติดต่อจากผู้ดูแลระบบ' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    })
  } catch (error) {
    console.error('[Login] Unhandled error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
