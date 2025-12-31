/*
  # WiFi Business Management Schema

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `nama` (text, customer name)
      - `alamat` (text, address)
      - `no_hp` (text, phone number, unique)
      - `paket` (text, internet package)
      - `tgl_registrasi` (date, registration date)
      - `created_at` (timestamp)
    
    - `payments`
      - `id` (uuid, primary key) 
      - `pelanggan_id` (uuid, foreign key to customers)
      - `bulan` (integer, month 1-12)
      - `tahun` (integer, year)
      - `tgl_bayar` (date, payment date)
      - `nominal` (numeric, payment amount)
      - `status` (text, payment status)
      - `created_at` (timestamp)
    
    - `modal_wifi`
      - `id` (uuid, primary key)
      - `kategori` (text, expense category)
      - `deskripsi` (text, description)
      - `nominal` (numeric, expense amount)
      - `tgl_pengeluaran` (date, expense date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  alamat text NOT NULL,
  no_hp text UNIQUE NOT NULL,
  paket text NOT NULL,
  tgl_registrasi date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelanggan_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  bulan integer NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
  tahun integer NOT NULL,
  tgl_bayar date,
  nominal numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Belum Lunas' CHECK (status IN ('Lunas', 'Belum Lunas', 'Tunggakan')),
  created_at timestamptz DEFAULT now()
);

-- Create modal_wifi (expenses) table
CREATE TABLE IF NOT EXISTS modal_wifi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori text NOT NULL CHECK (kategori IN ('ISP', 'listrik', 'perangkat', 'perawatan', 'lain-lain')),
  deskripsi text NOT NULL,
  nominal numeric(12,2) NOT NULL DEFAULT 0,
  tgl_pengeluaran date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE modal_wifi ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Users can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for payments
CREATE POLICY "Users can read all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete payments"
  ON payments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for modal_wifi
CREATE POLICY "Users can read all modal_wifi"
  ON modal_wifi
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert modal_wifi"
  ON modal_wifi
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update modal_wifi"
  ON modal_wifi
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete modal_wifi"
  ON modal_wifi
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_pelanggan_id ON payments(pelanggan_id);
CREATE INDEX IF NOT EXISTS idx_payments_bulan_tahun ON payments(bulan, tahun);
CREATE INDEX IF NOT EXISTS idx_modal_wifi_kategori ON modal_wifi(kategori);
CREATE INDEX IF NOT EXISTS idx_modal_wifi_tgl_pengeluaran ON modal_wifi(tgl_pengeluaran);