import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePayments } from '../../hooks/usePayments';
import { useCustomers } from '../../hooks/useCustomers';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPaymentModal({ isOpen, onClose }: AddPaymentModalProps) {
  const { addPayment } = usePayments();
  const { customers } = useCustomers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    pelanggan_id: '',
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    tgl_bayar: '',
    nominal: '',
    status: 'Belum Lunas' as 'Lunas' | 'Belum Lunas' | 'Tunggakan' | 'Free',
  });

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await addPayment({
      ...formData,
      nominal: parseFloat(formData.nominal),
      tgl_bayar: formData.tgl_bayar || undefined,
    });
    
    if (result.success) {
      setFormData({
        pelanggan_id: '',
        bulan: new Date().getMonth() + 1,
        tahun: new Date().getFullYear(),
        tgl_bayar: '',
        nominal: '',
        status: 'Belum Lunas',
      });
      onClose();
    } else {
      setError(result.error || 'Terjadi kesalahan');
    }
    
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tambah Pembayaran</h2>
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
            <label htmlFor="pelanggan" className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Pelanggan
            </label>
            <select
              id="pelanggan"
              value={formData.pelanggan_id}
              onChange={(e) => setFormData({ ...formData, pelanggan_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Pilih pelanggan</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.nama} - {customer.no_hp}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bulan" className="block text-sm font-medium text-gray-700 mb-1">
                Bulan
              </label>
              <select
                id="bulan"
                value={formData.bulan}
                onChange={(e) => setFormData({ ...formData, bulan: parseInt(e.target.value) })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tahun" className="block text-sm font-medium text-gray-700 mb-1">
                Tahun
              </label>
              <select
                id="tahun"
                value={formData.tahun}
                onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="nominal" className="block text-sm font-medium text-gray-700 mb-1">
              Nominal Pembayaran
            </label>
            <input
              id="nominal"
              type="number"
              value={formData.nominal}
              onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              required
              min="0"
             step="any"
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
             placeholder="125852"
             onInvalid={(e) => {
               const target = e.target as HTMLInputElement;
               if (parseFloat(target.value) < 1) {
                 target.setCustomValidity('Nominal harus lebih dari 0');
               } else {
                 target.setCustomValidity('');
               }
             }}
             onInput={(e) => {
               const target = e.target as HTMLInputElement;
               if (parseFloat(target.value) >= 1) {
                 target.setCustomValidity('');
               }
             }}
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status Pembayaran
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Belum Lunas">Belum Lunas</option>
              <option value="Lunas">Lunas</option>
              <option value="Tunggakan">Tunggakan</option>
              <option value="Free">Free</option>
            </select>
          </div>

          {formData.status === 'Lunas' && (
            <div>
              <label htmlFor="tgl_bayar" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Bayar
              </label>
              <input
                id="tgl_bayar"
                type="date"
                value={formData.tgl_bayar}
                onChange={(e) => setFormData({ ...formData, tgl_bayar: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

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
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}