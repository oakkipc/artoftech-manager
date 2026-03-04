-- Add update policy for project_notes
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to update project notes" ON public.project_notes
        FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
