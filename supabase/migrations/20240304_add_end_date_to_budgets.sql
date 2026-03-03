-- Add end_date to project_budgets
ALTER TABLE project_budgets ADD COLUMN IF NOT EXISTS end_date date;

-- Add index
CREATE INDEX IF NOT EXISTS idx_project_budgets_end_date ON project_budgets(end_date);
