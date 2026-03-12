import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET /api/payments?clientId=&projectId=&documentId=
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')
    const documentId = searchParams.get('documentId')

    try {
        const supabase = getAdminClient()

        let query = supabase
            .from('payments')
            .select('*, documents(id,doc_number,doc_type,total), clients(id,name), projects(id,name)')
            .order('payment_date', { ascending: false })

        if (clientId) query = query.eq('client_id', clientId)
        if (projectId) query = query.eq('project_id', projectId)
        if (documentId) query = query.eq('document_id', documentId)

        const { data, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ payments: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST /api/payments  — record a payment + update document paid_amount & status
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { document_id, client_id, project_id, amount, payment_date, payment_method, reference, notes, userId } = body

        if (!amount || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: 'amount must be > 0' }, { status: 400 })
        }

        const supabase = getAdminClient()

        const { data: payment, error: payError } = await supabase
            .from('payments')
            .insert({
                document_id: document_id || null,
                client_id: client_id || null,
                project_id: project_id || null,
                amount: parseFloat(amount),
                payment_date: payment_date || new Date().toISOString().split('T')[0],
                payment_method: payment_method || 'TRANSFER',
                reference: reference || null,
                notes: notes || null,
                created_by: userId || null,
            })
            .select()
            .single()

        if (payError) return NextResponse.json({ error: payError.message }, { status: 500 })

        // update document paid_amount and status
        if (document_id) {
            // sum all payments for this document
            const { data: allPayments } = await supabase
                .from('payments')
                .select('amount')
                .eq('document_id', document_id)

            const totalPaid = (allPayments || []).reduce((s: number, p: any) => s + parseFloat(p.amount), 0)

            const { data: docData } = await supabase
                .from('documents')
                .select('total')
                .eq('id', document_id)
                .single()

            const docTotal = parseFloat(docData?.total || '0')
            const newStatus = totalPaid >= docTotal ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : undefined

            const updatePayload: any = { paid_amount: totalPaid }
            if (newStatus) updatePayload.status = newStatus

            await supabase.from('documents').update(updatePayload).eq('id', document_id)
        }

        return NextResponse.json({ payment })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE /api/payments?id=
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    try {
        const supabase = getAdminClient()

        // get payment to know document_id
        const { data: payment } = await supabase.from('payments').select('document_id, amount').eq('id', id).single()

        const { error } = await supabase.from('payments').delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // recalculate paid_amount on document
        if (payment?.document_id) {
            const { data: remaining } = await supabase
                .from('payments')
                .select('amount')
                .eq('document_id', payment.document_id)

            const totalPaid = (remaining || []).reduce((s: number, p: any) => s + parseFloat(p.amount), 0)
            const { data: docData } = await supabase.from('documents').select('total').eq('id', payment.document_id).single()
            const docTotal = parseFloat(docData?.total || '0')
            const newStatus = totalPaid >= docTotal ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'SENT'

            await supabase.from('documents').update({ paid_amount: totalPaid, status: newStatus }).eq('id', payment.document_id)
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
