export interface Customer {
  id: string;
  nama: string;
  alamat: string;
  no_hp: string;
  paket: string;
  tgl_registrasi: string;
  tanggal_bayar_biasa: number;
  catatan_pembayaran: string;
  created_at: string;
}

export interface Payment {
  id: string;
  pelanggan_id: string;
  bulan: number;
  tahun: number;
  tgl_bayar?: string;
  nominal: number;
  status: 'Lunas' | 'Belum Lunas' | 'Tunggakan' | 'Free';
  created_at: string;
  customers?: Customer;
}

export interface Expense {
  id: string;
  kategori: 'ISP' | 'listrik' | 'perangkat' | 'perawatan' | 'lain-lain';
  deskripsi: string;
  nominal: number;
  tgl_pengeluaran: string;
  created_at: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalFree: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  profit: number;
  payments: {
    lunas: number;
    pending: number;
    overdue: number;
    free: number;
  };
}

export type PaymentStatus = 'Lunas' | 'Belum Lunas' | 'Tunggakan' | 'Free';
export type ExpenseCategory = 'ISP' | 'listrik' | 'perangkat' | 'perawatan' | 'lain-lain';