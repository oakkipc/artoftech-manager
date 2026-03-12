import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logActivity } from '@/lib/logger'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET /api/documents?type=&status=&clientId=&projectId=&id=
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')

    try {
        const supabase = getAdminClient()

        if (id) {
            const { data: doc, error } = await supabase
                .from('documents')
                .select('*, clients(id,name,address,company_tax_id,contact_person,email,phone), projects(id,name), document_items(*)')
                .eq('id', id)
                .order('sort_order', { referencedTable: 'document_items', ascending: true })
                .single()

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ document: doc })
        }

        let query = supabase
            .from('documents')
            .select('*, clients(id,name), projects(id,name)')
            .order('created_at', { ascending: false })

        if (type) query = query.eq('doc_type', type)
        if (status) query = query.eq('status', status)
        if (clientId) query = query.eq('client_id', clientId)
        if (projectId) query = query.eq('project_id', projectId)

        const { data, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ documents: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST /api/documents  — create new document
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { doc_type, client_id, project_id, issue_date, due_date, discount, vat_rate, notes, items, ref_doc_id, userId } = body

        if (!doc_type) return NextResponse.json({ error: 'doc_type is required' }, { status: 400 })

        const supabase = getAdminClient()

        // generate doc number via DB function
        const { data: numData, error: numError } = await supabase.rpc('next_doc_number', { p_type: doc_type })
        if (numError) return NextResponse.json({ error: numError.message }, { status: 500 })

        // calc totals
        const lineItems: any[] = items || []
        const subtotal = lineItems.reduce((s: number, i: any) => s + (parseFloat(i.unit_price) || 0) * (parseFloat(i.quantity) || 1), 0)
        const disc = parseFloat(discount) || 0
        const vatRatePct = parseFloat(vat_rate) ?? 7
        const vat_amount = ((subtotal - disc) * vatRatePct) / 100
        const total = subtotal - disc + vat_amount

        const { data: doc, error: docError } = await supabase
            .from('documents')
            .insert({
                doc_number: numData,
                doc_type,
                client_id: client_id || null,
                project_id: project_id || null,
                issue_date: issue_date || new Date().toISOString().split('T')[0],
                due_date: due_date || null,
                subtotal,
                discount: disc,
                vat_rate: vatRatePct,
                vat_amount,
                total,
                notes: notes || null,
                ref_doc_id: ref_doc_id || null,
                created_by: userId || null,
            })
            .select()
            .single()

        if (docError) return NextResponse.json({ error: docError.message }, { status: 500 })

        // insert line items
        if (lineItems.length > 0) {
            const itemRows = lineItems.map((item: any, idx: number) => ({
                document_id: doc.id,
                description: item.description || '',
                quantity: parseFloat(item.quantity) || 1,
                unit: item.unit || 'งาน',
                unit_price: parseFloat(item.unit_price) || 0,
                amount: (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 1),
                sort_order: idx,
            }))
            await supabase.from('document_items').insert(itemRows)
        }

        await logActivity({
            userId: userId || null,
            action: 'CREATE',
            entityType: 'PROJECT',
            entityId: doc.id,
            details: { doc_number: doc.doc_number, doc_type, total }
        })

        return NextResponse.json({ document: doc })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PATCH /api/documents  — update status / fields
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, status, paid_amount, notes, userId } = body

        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

        const supabase = getAdminClient()
        const updateData: any = {}
        if (status !== undefined) updateData.status = status
        if (paid_amount !== undefined) updateData.paid_amount = paid_amount
        if (notes !== undefined) updateData.notes = notes

        const { data, error } = await supabase
            .from('documents')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        await logActivity({
            userId: userId || null,
            action: 'UPDATE',
            entityType: 'PROJECT',
            entityId: id,
            details: { doc_number: data.doc_number, ...updateData }
        })

        return NextResponse.json({ document: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE /api/documents?id=
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    try {
        const supabase = getAdminClient()
        const { error } = await supabase.from('documents').delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
