import React, { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
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
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    pelanggan_id: '',
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    tgl_bayar: '',
    nominal: '',
    status: 'Belum Lunas' as 'Lunas' | 'Belum Lunas' | 'Tunggakan' | 'Free',
  });

  const selectedCustomerObjects = useMemo(() => {
    return customers.filter(c => selectedCustomers.has(c.id));
  }, [customers, selectedCustomers]);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handleCustomerSelect = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (selectedCustomers.size > 0) {
        const customersToAdd = selectedCustomerObjects;

        for (const customer of customersToAdd) {
          const nominal = customer.nominal || 0;

          const result = await addPayment({
            pelanggan_id: customer.id,
            bulan: formData.bulan,
            tahun: formData.tahun,
            tgl_bayar: formData.tgl_bayar || undefined,
            nominal: nominal,
            status: formData.status,
          });

          if (!result.success) {
            setError(`Gagal menambah pembayaran untuk ${customer.nama}`);
            setLoading(false);
            return;
          }
        }

        setFormData({
          pelanggan_id: '',
          bulan: new Date().getMonth() + 1,
          tahun: new Date().getFullYear(),
          tgl_bayar: '',
          nominal: '',
          status: 'Belum Lunas',
        });
        setSelectedCustomers(new Set());
        onClose();
      } else if (formData.pelanggan_id) {
        const customer = customers.find(c => c.id === formData.pelanggan_id);
        const nominal = customer ? (customer.nominal || parseFloat(formData.nominal)) : parseFloat(formData.nominal);

        const result = await addPayment({
          ...formData,
          nominal: nominal,
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }

    setLoading(false);
  };

  const getCustomerNominal = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.nominal || 0 : 0;
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
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Pilih Pelanggan
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700 transition-colors"
              >
                {selectedCustomers.size === customers.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            </div>

            {selectedCustomers.size > 0 ? (
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-blue-50">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {selectedCustomers.size} pelanggan dipilih:
                </p>
                {selectedCustomerObjects.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                    <span className="text-sm text-gray-700">{customer.nama}</span>
                    <span className="text-xs font-medium text-gray-500">
                      Rp {(customer.nominal || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <select
                value={formData.pelanggan_id}
                onChange={(e) => {
                  setFormData({ ...formData, pelanggan_id: e.target.value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih pelanggan atau gunakan "Pilih Semua"</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.nama} - {customer.no_hp} ({customer.paket})
                  </option>
                ))}
              </select>
            )}

            {selectedCustomers.size === 0 && (
              <div className="mt-2">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                  onClick={() => {
                    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach((checkbox: any) => {
                      handleCustomerSelect(checkbox.value);
                    });
                  }}
                >
                  Atau pilih per pelanggan
                </button>
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {customers.map((customer) => (
                    <label key={customer.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        value={customer.id}
                        checked={selectedCustomers.has(customer.id)}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex-1">{customer.nama}</span>
                      <span className="text-xs text-gray-500">
                        {customer.nominal ? `Rp ${customer.nominal.toLocaleString('id-ID')}` : 'Nominal Tidak Terdaftar'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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

          {selectedCustomers.size === 0 && (
            <div>
              <label htmlFor="nominal" className="block text-sm font-medium text-gray-700 mb-1">
                Nominal Pembayaran
                {formData.pelanggan_id && getCustomerNominal(formData.pelanggan_id) > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Otomatis: Rp {getCustomerNominal(formData.pelanggan_id).toLocaleString('id-ID')})
                  </span>
                )}
              </label>
              <input
                id="nominal"
                type="number"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                min="0"
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder={formData.pelanggan_id ? `Rp ${getCustomerNominal(formData.pelanggan_id).toLocaleString('id-ID')}` : '125852'}
                disabled={selectedCustomers.size > 0}
              />
              {selectedCustomers.size === 0 && formData.pelanggan_id && getCustomerNominal(formData.pelanggan_id) > 0 && !formData.nominal && (
                <p className="text-xs text-gray-600 mt-1">
                  Nominal akan otomatis diisi berdasarkan paket pelanggan
                </p>
              )}
            </div>
          )}

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
              disabled={loading || (selectedCustomers.size === 0 && !formData.pelanggan_id)}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : `Simpan${selectedCustomers.size > 0 ? ` (${selectedCustomers.size} Pelanggan)` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}