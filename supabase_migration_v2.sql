-- ============================================================
-- SWAMI KRUPA ROADLINES — Supabase Migration v2
-- CLIENT-CENTRIC ACCOUNTING SYSTEM
-- Run this in: Supabase Dashboard → SQL Editor
-- SAFE: Only adds new columns/tables. Nothing is deleted.
-- ============================================================

-- ============================================================
-- 1. ENHANCE CUSTOMERS TABLE
-- ============================================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pan TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternate_phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '30 days';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opening_balance NUMERIC DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opening_balance_type TEXT DEFAULT 'debit';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================
-- 2. ENHANCE INVOICES TABLE
-- ============================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'classic';

-- ============================================================
-- 3. ENHANCE CONSIGNMENT NOTES TABLE
-- ============================================================
ALTER TABLE consignment_notes ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- ============================================================
-- 4. CREATE PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  invoice_id TEXT,           -- optional: link to specific invoice
  payment_date TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT DEFAULT 'BANK_TRANSFER',  -- BANK_TRANSFER | UPI | CHEQUE | CASH | OTHER
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

-- ============================================================
-- 5. CREATE LEDGER TRANSACTIONS TABLE (Auto-generated — SINGLE SOURCE OF TRUTH)
-- ============================================================
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  invoice_id TEXT,           -- links to invoice if INVOICE type
  payment_id TEXT,           -- links to payment if PAYMENT type
  transaction_date TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- INVOICE | PAYMENT | OPENING_BALANCE | CREDIT_NOTE | DEBIT_NOTE | ADJUSTMENT
  reference_number TEXT,
  description TEXT,
  debit NUMERIC DEFAULT 0,   -- money owed to us (invoice)
  credit NUMERIC DEFAULT 0,  -- money received from customer (payment)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

-- ============================================================
-- 6. CREATE AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT,          -- CUSTOMER | INVOICE | PAYMENT | LR | TRIP_SLIP
  entity_id TEXT,
  action TEXT,               -- CREATED | UPDATED | DELETED | CANCELLED
  old_data JSONB,
  new_data JSONB,
  performed_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SUCCESS
-- ============================================================
-- After running this migration:
-- 1. Deploy the updated frontend code
-- 2. Test by creating a customer and invoice
-- ============================================================
