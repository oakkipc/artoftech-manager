-- Add rating and notes to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rating integer DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes text;

-- Add rating and notes to vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating integer DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS notes text;
