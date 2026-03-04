-- Fix project_notes author_id foreign key
-- Drop existing table if it was created incorrectly
DROP TABLE IF EXISTS public.project_notes;

CREATE TABLE IF NOT EXISTS public.project_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    author_id UUID REFERENCES public.users(id)
);

-- Enable RLS
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to read project notes" ON public.project_notes
        FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to insert project notes" ON public.project_notes
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to delete their own project notes" ON public.project_notes
        FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
