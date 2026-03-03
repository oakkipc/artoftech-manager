import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

export interface RateLimitResult {
    success: boolean
    remaining: number
    reset: number
}

/**
 * Fixed-window rate limiter using Supabase
 * @param key Unique key for the limit (e.g., login:ip:1.2.3.4)
 * @param limit Max points allowed in the window
 * @param windowSeconds Window duration in seconds
 */
export async function rateLimit(
    key: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const supabase = getAdminClient()
    const now = new Date()

    try {
        // 1. Get current state
        const { data: entry, error: fetchError } = await supabase
            .from('rate_limits')
            .select('points, expire_at')
            .eq('key', key)
            .maybeSingle()

        if (fetchError) throw fetchError

        // 2. Check if expired or missing
        const isExpired = entry && new Date(entry.expire_at) < now

        if (!entry || isExpired) {
            // New window
            const expireAt = new Date(now.getTime() + windowSeconds * 1000)
            const { data: newEntry, error: insertError } = await supabase
                .from('rate_limits')
                .upsert({
                    key,
                    points: 1,
                    expire_at: expireAt.toISOString()
                })
                .select()
                .single()

            if (insertError) throw insertError

            return {
                success: true,
                remaining: limit - 1,
                reset: Math.ceil(windowSeconds)
            }
        }

        // 3. Existing window
        const newPoints = entry.points + 1
        const resetTime = Math.ceil((new Date(entry.expire_at).getTime() - now.getTime()) / 1000)

        if (newPoints > limit) {
            return {
                success: false,
                remaining: 0,
                reset: resetTime > 0 ? resetTime : 0
            }
        }

        // Increment points
        const { error: updateError } = await supabase
            .from('rate_limits')
            .update({ points: newPoints })
            .eq('key', key)

        if (updateError) throw updateError

        return {
            success: true,
            remaining: limit - newPoints,
            reset: resetTime
        }
    } catch (err) {
        console.error('[RateLimit] Error:', err)
        // Fallback to allow if DB fails (fail-open for UX, or fail-closed for security)
        // Here we fail-open but log the error
        return { success: true, remaining: 1, reset: 0 }
    }
}
