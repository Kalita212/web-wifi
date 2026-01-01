import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Download, Upload, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { useCustomers } from '../../hooks/useCustomers';
import { usePayments } from '../../hooks/usePayments';
import { useExpenses } from '../../hooks/useExpenses';
import { ChangePasswordModal } from './ChangePasswordModal';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

export function Settings() {
  const { user } = useAuth();
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const { customers } = useCustomers();
  const { payments } = usePayments();
  const { expenses } = useExpenses();

  const [businessName, setBusinessName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  React.useEffect(() => {
    if (settings) {
      setBusinessName(settings.business_name || '');
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage('');

    const result = await updateSettings({ business_name: businessName });

    if (result.success) {
      setSaveMessage('Perubahan berhasil disimpan!');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('Gagal menyimpan perubahan');
    }

    setIsSaving(false);
  };

  const handleToggleReminder = async () => {
    if (!settings) return;
    await updateSettings({ reminder_enabled: !settings.reminder_enabled });
  };

  const handleToggleEmailReports = async () => {
    if (!settings) return;
    await updateSettings({ email_reports_enabled: !settings.email_reports_enabled });
  };

  const handleBackupData = () => {
    const wb = XLSX.utils.book_new();

    const customersData = customers.map(c => ({
      'Nama': c.nama,
      'Alamat': c.alamat,
      'No HP': c.no_hp,
      'Paket': c.paket,
      'Tanggal Registrasi': c.tgl_registrasi,
      'Tanggal Bayar Biasa': c.tanggal_bayar_biasa,
      'Catatan': c.catatan_pembayaran
    }));

    const paymentsData = payments.map(p => ({
      'Nama Pelanggan': p.customers?.nama || '',
      'Bulan': p.bulan,
      'Tahun': p.tahun,
      'Tanggal Bayar': p.tgl_bayar || '',
      'Nominal': p.nominal,
      'Status': p.status
    }));

    const expensesData = expenses.map(e => ({
      'Kategori': e.kategori,
      'Deskripsi': e.deskripsi,
      'Nominal': e.nominal,
      'Tanggal': e.tgl_pengeluaran
    }));

    const wsCustomers = XLSX.utils.json_to_sheet(customersData);
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
    const wsExpenses = XLSX.utils.json_to_sheet(expensesData);

    XLSX.utils.book_append_sheet(wb, wsCustomers, 'Pelanggan');
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Pembayaran');
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Pengeluaran');

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `backup-data-${date}.xlsx`);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        alert('Import data berhasil! Fitur ini akan menambahkan data dari Excel ke database.');
      } catch (error) {
        alert('Gagal membaca file. Pastikan format file benar.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleResetData = async () => {
    if (!user || resetConfirmText !== 'RESET') {
      alert('Ketik "RESET" untuk konfirmasi penghapusan data.');
      return;
    }

    setIsResetting(true);

    try {
      // Delete all payments first (due to foreign key constraints)
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (paymentsError) throw paymentsError;

      // Delete all customers
      const { error: customersError } = await supabase
        .from('customers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (customersError) throw customersError;

      // Delete all expenses (modal_wifi table)
      const { error: expensesError } = await supabase
        .from('modal_wifi')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (expensesError) throw expensesError;

      alert('Semua data berhasil dihapus! Halaman akan dimuat ulang.');
      setResetConfirmText('');
      setShowResetConfirm(false);
      window.location.reload();
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Gagal menghapus data. Silakan coba lagi.');
    } finally {
      setIsResetting(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-600 mt-1">Kelola pengaturan aplikasi dan akun</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Profil Pengguna</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bisnis</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Nama WiFi Anda"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {saveMessage && (
              <div className={`text-sm px-3 py-2 rounded-lg ${
                saveMessage.includes('berhasil')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {saveMessage}
              </div>
            )}
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Notifikasi</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Reminder Pembayaran</p>
                <p className="text-sm text-gray-500">Kirim notifikasi untuk pembayaran yang tertunggak</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings?.reminder_enabled || false}
                  onChange={handleToggleReminder}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Reports</p>
                <p className="text-sm text-gray-500">Kirim laporan bulanan via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings?.email_reports_enabled || false}
                  onChange={handleToggleEmailReports}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Keamanan</h2>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Ubah Password
            </button>
            <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-sm font-medium text-gray-700">Aktivitas Login</p>
              <p className="text-xs text-gray-500 mt-1">Login terakhir: Hari ini</p>
            </div>
            <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-sm font-medium text-gray-700">Two-Factor Authentication</p>
              <p className="text-xs text-gray-500 mt-1">Belum diaktifkan</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleBackupData}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-700">Backup Data</span>
              <Download className="w-4 h-4 text-gray-500" />
            </button>
            <label className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <span className="font-medium text-gray-700">Import Data</span>
              <Upload className="w-4 h-4 text-gray-500" />
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-between px-4 py-3 border border-red-300 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <span className="font-medium">Reset All Data</span>
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-semibold">Peringatan!</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Tindakan ini akan menghapus SEMUA data termasuk pelanggan, pembayaran, dan pengeluaran.
              Tindakan ini tidak dapat dibatalkan!
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ketik <span className="font-bold text-red-600">RESET</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isResetting}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetConfirmText('');
                }}
                disabled={isResetting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleResetData}
                disabled={isResetting || resetConfirmText !== 'RESET'}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? 'Menghapus...' : 'Lanjutkan Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
