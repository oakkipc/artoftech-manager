import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  try {
    const supabase = getAdminClient()
    
    let query = supabase
      .from('user_projects')
      .select(`
        id,
        role,
        user_id,
        project_id,
        users:user_id (id, name, email)
      `)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ userProjects: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, projectId, role } = await request.json()

    if (!userId || !projectId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
    }

    const supabase = getAdminClient()
    
    const { data, error } = await supabase
      .from('user_projects')
      .upsert({ 
        user_id: userId, 
        project_id: projectId, 
        role: role || 'VIEWER' 
      }, { onConflict: 'user_id,project_id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ userProject: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    const supabase = getAdminClient()
    
    const { error } = await supabase
      .from('user_projects')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
