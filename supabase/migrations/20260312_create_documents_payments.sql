-- ============================================================
-- Documents, Document Items, Payments
-- ============================================================

-- doc number counters
CREATE TABLE IF NOT EXISTS doc_counters (
  doc_type TEXT PRIMARY KEY,
  year     INT  NOT NULL,
  last_seq INT  NOT NULL DEFAULT 0
);

ALTER TABLE doc_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all doc_counters" ON doc_counters FOR ALL USING (true);

-- function: auto-generate doc number (QT-2026-0001 etc.)
CREATE OR REPLACE FUNCTION next_doc_number(p_type TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix       TEXT;
  current_year INT;
  seq          INT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INT;
  prefix := CASE p_type
    WHEN 'QUOTATION'   THEN 'QT'
    WHEN 'INVOICE'     THEN 'INV'
    WHEN 'RECEIPT'     THEN 'RCP'
    WHEN 'TAX_INVOICE' THEN 'TAX'
    ELSE 'DOC'
  END;

  INSERT INTO doc_counters(doc_type, year, last_seq)
  VALUES (p_type, current_year, 1)
  ON CONFLICT (doc_type) DO UPDATE
    SET last_seq = CASE
          WHEN doc_counters.year < current_year THEN 1
          ELSE doc_counters.last_seq + 1
        END,
        year = current_year
  RETURNING last_seq INTO seq;

  RETURN prefix || '-' || current_year || '-' || LPAD(seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- documents (master)
CREATE TABLE IF NOT EXISTS documents (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_number  TEXT    NOT NULL UNIQUE,
  doc_type    TEXT    NOT NULL CHECK (doc_type IN ('QUOTATION','INVOICE','RECEIPT','TAX_INVOICE')),
  status      TEXT    NOT NULL DEFAULT 'DRAFT'
              CHECK (status IN ('DRAFT','SENT','APPROVED','REJECTED','PAID','PARTIAL','CANCELLED')),
  client_id   UUID    REFERENCES clients(id)   ON DELETE SET NULL,
  project_id  UUID    REFERENCES projects(id)  ON DELETE SET NULL,
  issue_date  DATE    NOT NULL DEFAULT CURRENT_DATE,
  due_date    DATE,
  subtotal    DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount    DECIMAL(15,2) NOT NULL DEFAULT 0,
  vat_rate    DECIMAL(5,2)  NOT NULL DEFAULT 7,
  vat_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
  total       DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  ref_doc_id  UUID    REFERENCES documents(id) ON DELETE SET NULL,
  created_by  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_client   ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_project  ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type     ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_status   ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_date     ON documents(issue_date);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all documents" ON documents FOR ALL USING (true);

-- trigger: updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_documents_updated_at();

-- document_items (line items)
CREATE TABLE IF NOT EXISTS document_items (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID    NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  description TEXT    NOT NULL,
  quantity    DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit        TEXT    NOT NULL DEFAULT 'งาน',
  unit_price  DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount      DECIMAL(15,2) NOT NULL DEFAULT 0,
  sort_order  INT     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_document_items_doc ON document_items(document_id);

ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all document_items" ON document_items FOR ALL USING (true);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    UUID    REFERENCES documents(id)  ON DELETE SET NULL,
  client_id      UUID    REFERENCES clients(id)    ON DELETE SET NULL,
  project_id     UUID    REFERENCES projects(id)   ON DELETE SET NULL,
  amount         DECIMAL(15,2) NOT NULL,
  payment_date   DATE    NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT    NOT NULL DEFAULT 'TRANSFER'
                 CHECK (payment_method IN ('TRANSFER','CASH','CHEQUE','CREDIT_CARD','OTHER')),
  reference      TEXT,
  notes          TEXT,
  created_by     UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_document ON payments(document_id);
CREATE INDEX IF NOT EXISTS idx_payments_client   ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_date     ON payments(payment_date);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all payments" ON payments FOR ALL USING (true);
