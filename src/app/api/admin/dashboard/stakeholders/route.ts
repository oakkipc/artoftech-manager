import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET() {
    try {
        const supabase = getAdminClient()

        // 1. Fetch all clients and vendors
        const [{ data: clients }, { data: vendors }] = await Promise.all([
            supabase.from('clients').select('id, name, rating'),
            supabase.from('vendors').select('id, name, rating, category')
        ])

        // 2. Fetch all budget transactions
        const { data: rawTransactions, error } = await supabase
            .from('project_budgets')
            .select('amount, type, client_id, vendor_id, date, frequency, end_date')

        if (error) throw error

        // Expand recurring transactions (for the current year by default if no range)
        const now = new Date()
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const endOfYear = new Date(now.getFullYear(), 11, 31)

        const transactions: any[] = []
            ; (rawTransactions || []).forEach(t => {
                if (t.frequency === 'ONCE') {
                    transactions.push(t)
                } else {
                    let current = new Date(t.date)
                    const tEnd = t.end_date ? new Date(t.end_date) : endOfYear
                    const limit = tEnd > endOfYear ? endOfYear : tEnd

                    while (current <= limit) {
                        transactions.push({ ...t, date: current.toISOString().split('T')[0] })
                        if (t.frequency === 'MONTHLY') current.setMonth(current.getMonth() + 1)
                        else if (t.frequency === 'YEARLY') current.setFullYear(current.getFullYear() + 1)
                        else break
                    }
                }
            })

        // 3. Process Client Stats
        const clientStats = (clients || []).map(client => {
            const clientTransactions = (transactions || []).filter(t => t.client_id === client.id)
            const revenue = clientTransactions
                .filter(t => t.type === 'INCOME')
                .reduce((sum, t) => sum + Number(t.amount), 0)

            return {
                id: client.id,
                name: client.name,
                rating: client.rating,
                revenue,
                transactionCount: clientTransactions.length
            }
        }).sort((a, b) => b.revenue - a.revenue)

        // 4. Process Vendor Stats
        const vendorStats = (vendors || []).map(vendor => {
            const vendorTransactions = (transactions || []).filter(t => t.vendor_id === vendor.id)
            const expense = vendorTransactions
                .filter(t => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + Number(t.amount), 0)

            return {
                id: vendor.id,
                name: vendor.name,
                rating: vendor.rating,
                category: vendor.category,
                expense,
                transactionCount: vendorTransactions.length
            }
        }).sort((a, b) => b.expense - a.expense)

        // 5. Overall Totals
        const totalRevenue = clientStats.reduce((sum, c) => sum + c.revenue, 0)
        const totalExpense = vendorStats.reduce((sum, v) => sum + v.expense, 0)

        // 6. Category Distribution (Vendors)
        const categoryStats = vendorStats.reduce((acc: Record<string, number>, v) => {
            const cat = v.category || 'Other'
            acc[cat] = (acc[cat] || 0) + v.expense
            return acc
        }, {})

        return NextResponse.json({
            summary: {
                totalRevenue,
                totalExpense,
                netProfit: totalRevenue - totalExpense,
                clientCount: clients?.length || 0,
                vendorCount: vendors?.length || 0
            },
            clientStats: clientStats.slice(0, 10), // Top 10
            vendorStats: vendorStats.slice(0, 10), // Top 10
            categoryStats: Object.entries(categoryStats).map(([name, value]) => ({ name, value }))
        })
    } catch (error) {
        console.error('Stakeholders Dashboard API Error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
