/*
  # Add payment date tracking

  1. New Columns
    - Add `tanggal_bayar_biasa` to customers table to track usual payment date
    - Add `catatan_pembayaran` for payment notes

  2. Changes
    - Customers can now have a preferred payment date each month
    - Added notes field for payment-related information

  3. Security
    - Maintain existing RLS policies
*/

-- Add payment date tracking columns to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'tanggal_bayar_biasa'
  ) THEN
    ALTER TABLE customers ADD COLUMN tanggal_bayar_biasa integer DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'catatan_pembayaran'
  ) THEN
    ALTER TABLE customers ADD COLUMN catatan_pembayaran text DEFAULT '';
  END IF;
END $$;

-- Add constraint to ensure payment date is between 1-31
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'customers' AND constraint_name = 'customers_tanggal_bayar_biasa_check'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_tanggal_bayar_biasa_check 
    CHECK (tanggal_bayar_biasa >= 1 AND tanggal_bayar_biasa <= 31);
  END IF;
END $$;
