import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as bcrypt from 'bcryptjs'

import { rateLimit } from '@/lib/rate-limit'

// Admin client for server-side operations
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'

    // Rate Limit by IP (prevent automated spam registrations)
    // 3 registrations per 6 hours (21600 seconds)
    const ipLimit = await rateLimit(`register:ip:${ip}`, 3, 21600)
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: 'มีการถลองสมัครสมาชิกมากเกินไปจาก IP นี้ กรุณาลองใหม่ในภายหลัง' },
        { status: 429 }
      )
    }


    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้งานแล้ว' },
        { status: 400 }
      )
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Insert new user with PENDING status
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password: hashedPassword,
        role: 'PENDING',
        avatar: null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'สมัครสำเร็จ! กรุณารอการอนุมัติจากผู้ดูแลระบบ',
      user: { id: data.id, email: data.email, role: data.role }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
