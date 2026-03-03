-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger for vendors
CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add vendor_id to project_budgets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'project_budgets' AND column_name = 'vendor_id'
    ) THEN
        ALTER TABLE public.project_budgets 
        ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for vendor_id
CREATE INDEX IF NOT EXISTS idx_project_budgets_vendor_id ON public.project_budgets(vendor_id);
