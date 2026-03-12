-- Add withholding tax fields to documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS wht_rate   DECIMAL(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wht_amount DECIMAL(15,2) NOT NULL DEFAULT 0;
