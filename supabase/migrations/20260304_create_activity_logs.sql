-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'PIN', 'REORDER'
    entity_type TEXT NOT NULL, -- e.g., 'PROJECT', 'TASK', 'BUDGET', 'LINK', 'NOTE'
    entity_id TEXT, -- ID of the affected item (can be UUID or string)
    details JSONB DEFAULT '{}'::jsonb, -- Store changes or context (e.g., { title: 'New Task', project: 'Portfolio' })
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
-- Allow anyone to insert (so the API can log actions)
-- but restrict reading to ADMIN/SUPERADMIN roles in the application logic
CREATE POLICY "Enable all for service role" ON public.activity_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs (entity_type, entity_id);
