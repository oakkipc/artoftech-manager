-- Add credit_term to clients and vendors
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS credit_term INTEGER DEFAULT 0;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS credit_term INTEGER DEFAULT 0;
