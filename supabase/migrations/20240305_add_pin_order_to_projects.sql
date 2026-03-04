-- Add pin_order column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS pin_order INTEGER DEFAULT 0;

-- Update existing pinned projects to have an initial order based on created_at
WITH ordered_pins AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM public.projects
  WHERE pinned = true
)
UPDATE public.projects p
SET pin_order = op.row_num
FROM ordered_pins op
WHERE p.id = op.id;
