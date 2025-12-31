/*
  # Add Free status to payments

  1. Changes
    - Update payments table status constraint to include 'Free' option
    - Free status payments will not be counted in financial calculations

  2. Security
    - No changes to existing RLS policies
*/

-- Add 'Free' to the allowed status values
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status = ANY (ARRAY['Lunas'::text, 'Belum Lunas'::text, 'Tunggakan'::text, 'Free'::text]));
