import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';
import { Customer } from '../../types';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function EditCustomerModal({ isOpen, onClose, customer }: EditCustomerModalProps) {
  const { updateCustomer } = useCustomers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    no_hp: '',
    paket: '',
    tgl_registrasi: '',
    tanggal_bayar_biasa: 1,
    catatan_pembayaran: '',
  });

  const packages = [
    '10 Mbps - Rp 150.000',
    '20 Mbps - Rp 200.000',
    '30 Mbps - Rp 265.000',
    '50 Mbps - Rp 300.000',
    '100 Mbps - Rp 500.000',
  ];

  useEffect(() => {
    if (customer) {
      setFormData({
        nama: customer.nama,
        alamat: customer.alamat,
        no_hp: customer.no_hp,
        paket: customer.paket,
        tgl_registrasi: customer.tgl_registrasi,
        tanggal_bayar_biasa: customer.tanggal_bayar_biasa,
        catatan_pembayaran: customer.catatan_pembayaran,
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    
    setLoading(true);
    setError('');

    const result = await updateCustomer(customer.id, formData);
    
    if (result.success && !result.error) {
      onClose();
    } else {
      setError(result.error || 'Terjadi kesalahan');
    }
    
    setLoading(false);
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Pelanggan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              id="nama"
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <textarea
              id="alamat"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan alamat lengkap"
            />
          </div>

          <div>
            <label htmlFor="no_hp" className="block text-sm font-medium text-gray-700 mb-1">
              Nomor HP
            </label>
            <input
              id="no_hp"
              type="tel"
              value={formData.no_hp}
              onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="08123456789"
            />
          </div>

          <div>
            <label htmlFor="paket" className="block text-sm font-medium text-gray-700 mb-1">
              Paket Internet
            </label>
            <select
              id="paket"
              value={formData.paket}
              onChange={(e) => setFormData({ ...formData, paket: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Pilih paket internet</option>
              {packages.map((pkg) => (
                <option key={pkg} value={pkg}>
                  {pkg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tgl_registrasi" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Registrasi
            </label>
            <input
              id="tgl_registrasi"
              type="date"
              value={formData.tgl_registrasi}
              onChange={(e) => setFormData({ ...formData, tgl_registrasi: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="tanggal_bayar_biasa" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Bayar Biasa (setiap bulan)
            </label>
            <select
              id="tanggal_bayar_biasa"
              value={formData.tanggal_bayar_biasa}
              onChange={(e) => setFormData({ ...formData, tanggal_bayar_biasa: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Tanggal {day}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="catatan_pembayaran" className="block text-sm font-medium text-gray-700 mb-1">
              Catatan Pembayaran (opsional)
            </label>
            <textarea
              id="catatan_pembayaran"
              value={formData.catatan_pembayaran}
              onChange={(e) => setFormData({ ...formData, catatan_pembayaran: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Catatan khusus untuk pembayaran pelanggan ini"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}