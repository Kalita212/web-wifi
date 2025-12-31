import React, { useState, useEffect } from 'react';
import { FileBarChart, Download, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

interface MonthlyReport {
  month: string;
  income: number;
  expenses: number;
  profit: number;
  customers: number;
  payments: {
    lunas: number;
    pending: number;
    overdue: number;
  };
}

export function Reports() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    fetchReports();
  }, [selectedYear]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const monthlyReports: MonthlyReport[] = [];

      for (let month = 1; month <= 12; month++) {
        // Get income for the month
        const { data: payments } = await supabase
          .from('payments')
          .select('status, nominal')
          .eq('bulan', month)
          .eq('tahun', selectedYear);

        const income = payments?.filter(p => p.status === 'Lunas').reduce((sum, p) => sum + p.nominal, 0) || 0;
        const lunas = payments?.filter(p => p.status === 'Lunas').length || 0;
        const pending = payments?.filter(p => p.status === 'Belum Lunas').length || 0;
        const overdue = payments?.filter(p => p.status === 'Tunggakan').length || 0;
        const free = payments?.filter(p => p.status === 'Free').length || 0;

        // Get expenses for the month
        const { data: expenses } = await supabase
          .from('modal_wifi')
          .select('nominal')
          .gte('tgl_pengeluaran', `${selectedYear}-${month.toString().padStart(2, '0')}-01`)
          .lt('tgl_pengeluaran', month === 12 
            ? `${selectedYear + 1}-01-01` 
            : `${selectedYear}-${(month + 1).toString().padStart(2, '0')}-01`);

        const monthlyExpenses = expenses?.reduce((sum, e) => sum + e.nominal, 0) || 0;

        // Get customer count (cumulative up to this month)
        const lastDayOfMonth = new Date(selectedYear, month, 0).getDate();
        const { count: customerCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .lte('tgl_registrasi', `${selectedYear}-${month.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`);

        monthlyReports.push({
          month: months[month - 1],
          income,
          expenses: monthlyExpenses,
          profit: income - monthlyExpenses,
          customers: customerCount || 0,
          payments: {
            lunas,
            pending,
            overdue,
            free,
          },
        });
      }

      setReports(monthlyReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    // Prepare data for Excel
    const excelData = reports.map((report, index) => ({
      'Bulan': report.month,
      'Pemasukan': report.income,
      'Pengeluaran': report.expenses,
      'Keuntungan': report.profit,
      'Total Pelanggan': report.customers,
      'Pembayaran Lunas': report.payments.lunas,
      'Pembayaran Pending': report.payments.pending,
      'Tunggakan': report.payments.overdue,
    }));

    // Add summary row
    excelData.push({
      'Bulan': 'TOTAL',
      'Pemasukan': totalIncome,
      'Pengeluaran': totalExpenses,
      'Keuntungan': totalProfit,
      'Total Pelanggan': '',
      'Pembayaran Lunas': '',
      'Pembayaran Pending': '',
      'Tunggakan': '',
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 12 }, // Bulan
      { wch: 15 }, // Pemasukan
      { wch: 15 }, // Pengeluaran
      { wch: 15 }, // Keuntungan
      { wch: 15 }, // Total Pelanggan
      { wch: 15 }, // Pembayaran Lunas
      { wch: 15 }, // Pembayaran Pending
      { wch: 12 }, // Tunggakan
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `Laporan ${selectedYear}`);

    // Download file
    XLSX.writeFile(wb, `Laporan_WiFi_${selectedYear}.xlsx`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const totalIncome = reports.reduce((sum, report) => sum + report.income, 0);
  const totalExpenses = reports.reduce((sum, report) => sum + report.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-600 mt-1">Analisis keuangan dan performa bisnis</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memuat...' : 'Refresh'}
          </button>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button 
            onClick={downloadExcel}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white p-6">
          <div className="flex items-center gap-4">
            <DollarSign className="w-8 h-8" />
            <div>
              <h3 className="text-lg font-medium">Total Pemasukan</h3>
              <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white p-6">
          <div className="flex items-center gap-4">
            <FileBarChart className="w-8 h-8" />
            <div>
              <h3 className="text-lg font-medium">Total Pengeluaran</h3>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-r ${totalProfit >= 0 ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600'} rounded-xl text-white p-6`}>
          <div className="flex items-center gap-4">
            <DollarSign className="w-8 h-8" />
            <div>
              <h3 className="text-lg font-medium">Total Keuntungan</h3>
              <p className="text-2xl font-bold">{formatCurrency(totalProfit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Laporan Bulanan {selectedYear}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bulan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pemasukan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengeluaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keuntungan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Bayar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr 
                  key={index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {report.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                    {formatCurrency(report.income)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                    {formatCurrency(report.expenses)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium ${report.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(report.profit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {report.customers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Lunas: {report.payments.lunas}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <span>Pending: {report.payments.pending}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>Tunggakan: {report.payments.overdue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>Free: {report.payments.free}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}