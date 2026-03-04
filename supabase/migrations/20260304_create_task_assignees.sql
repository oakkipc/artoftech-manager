-- Create task_assignees table for multi-assignee support
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(task_id, user_id)
);

-- Enable RLS
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (Assuming same as tasks/projects for simplicity, use admin/service role for API)
CREATE POLICY "Enable all for service role" ON public.task_assignees
    FOR ALL USING (true) WITH CHECK (true);

-- Migrate existing assigned_to data
INSERT INTO public.task_assignees (task_id, user_id)
SELECT id, assigned_to
FROM public.tasks
WHERE assigned_to IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING;

-- Note: We keep tasks.assigned_to for now to avoid breaking changes immediately, 
-- but all new logic will use task_assignees.
