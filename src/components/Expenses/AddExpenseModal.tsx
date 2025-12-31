import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useExpenses } from '../../hooks/useExpenses';
import { ExpenseCategory } from '../../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const { addExpense } = useExpenses();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    kategori: 'ISP' as ExpenseCategory,
    deskripsi: '',
    nominal: '',
    tgl_pengeluaran: new Date().toISOString().split('T')[0],
  });

  const categories: { value: ExpenseCategory; label: string }[] = [
    { value: 'ISP', label: 'ISP (Internet Service Provider)' },
    { value: 'listrik', label: 'Listrik' },
    { value: 'perangkat', label: 'Perangkat' },
    { value: 'perawatan', label: 'Perawatan' },
    { value: 'lain-lain', label: 'Lain-lain' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await addExpense({
      ...formData,
      nominal: parseFloat(formData.nominal),
    });
    
    if (result.success) {
      setFormData({
        kategori: 'ISP',
        deskripsi: '',
        nominal: '',
        tgl_pengeluaran: new Date().toISOString().split('T')[0],
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
          <h2 className="text-xl font-semibold text-gray-900">Tambah Pengeluaran</h2>
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
            <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-1">
              Kategori Pengeluaran
            </label>
            <select
              id="kategori"
              value={formData.kategori}
              onChange={(e) => setFormData({ ...formData, kategori: e.target.value as ExpenseCategory })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              id="deskripsi"
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Deskripsi detail pengeluaran"
            />
          </div>

          <div>
            <label htmlFor="nominal" className="block text-sm font-medium text-gray-700 mb-1">
              Nominal
            </label>
            <input
              id="nominal"
              type="number"
              value={formData.nominal}
              onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              required
              min="1"
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
            <label htmlFor="tgl_pengeluaran" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Pengeluaran
            </label>
            <input
              id="tgl_pengeluaran"
              type="date"
              value={formData.tgl_pengeluaran}
              onChange={(e) => setFormData({ ...formData, tgl_pengeluaran: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}