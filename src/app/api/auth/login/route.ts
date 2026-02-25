import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    const hashedPassword = Buffer.from(password).toString('base64')

    // Find user by email and password
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, avatar')
      .eq('email', email)
      .eq('password', hashedPassword)
      .single()

    if (error || !user) {
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

    // In production, create a proper session/JWT here
    // For now, return user data (simple auth)
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
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
