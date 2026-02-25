import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: Request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json()

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }

    // Verify current password with bcrypt
    let isMatch = false
    try {
      isMatch = await bcrypt.compare(currentPassword, user.password)
    } catch (e) {
      // bcrypt check failed, likely not a bcrypt hash
    }

    // Fallback for verification if still in Base64
    if (!isMatch) {
      const hashedCurrent = Buffer.from(currentPassword).toString('base64')
      if (user.password === hashedCurrent) {
        isMatch = true
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Update to new password with bcrypt
    const salt = await bcrypt.genSalt(10)
    const hashedNew = await bcrypt.hash(newPassword, salt)
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedNew })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' })
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
