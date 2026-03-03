-- Add frequency column to project_budgets
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'ONCE';

-- Update existing records to have a default value
UPDATE project_budgets SET frequency = 'ONCE' WHERE frequency IS NULL;

-- Add client_id if missing (it should have been added by the previous migration, but just in case)
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
