import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET: All providers with hosts and domains nested
export async function GET() {
    try {
        const supabase = getAdminClient()

        const { data: providers } = await supabase
            .from('providers')
            .select('*')
            .order('name')

        const { data: hosts } = await supabase
            .from('hosts')
            .select('*')
            .order('name')

        const { data: domains } = await supabase
            .from('domains')
            .select('*')
            .order('name')

        // Nest: domains → hosts → providers
        const hostsWithDomains = (hosts || []).map(h => ({
            ...h,
            domains: (domains || []).filter(d => d.host_id === h.id)
        }))

        const providersWithHosts = (providers || []).map(p => ({
            ...p,
            hosts: hostsWithDomains.filter(h => h.provider_id === p.id)
        }))

        // Dashboard stats
        const now = new Date()
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        const allDomains = domains || []
        const allHosts = hosts || []

        const stats = {
            totalProviders: (providers || []).length,
            totalHosts: allHosts.length,
            totalDomains: allDomains.length,
            expiringDomains: allDomains.filter(d => d.expiry_date && new Date(d.expiry_date) <= in30Days && new Date(d.expiry_date) >= now).length,
            expiredDomains: allDomains.filter(d => d.expiry_date && new Date(d.expiry_date) < now).length,
            expiringHosts: allHosts.filter(h => h.expiry_date && new Date(h.expiry_date) <= in30Days && new Date(h.expiry_date) >= now).length,
            expiredHosts: allHosts.filter(h => h.expiry_date && new Date(h.expiry_date) < now).length,
        }

        return NextResponse.json({ providers: providersWithHosts, stats })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Create provider
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const supabase = getAdminClient()

        const { data, error } = await supabase
            .from('providers')
            .insert({ name: body.name, website: body.website || null, notes: body.notes || null })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ provider: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Delete provider
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    try {
        const supabase = getAdminClient()
        const { error } = await supabase.from('providers').delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ message: 'Deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
