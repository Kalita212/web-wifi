import React, { useState, useEffect } from 'react';
import { Users, CreditCard, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { supabase } from '../../lib/supabase';
import { DashboardStats } from '../../types';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalFree: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    profit: 0,
    payments: {
      lunas: 0,
      pending: 0,
      overdue: 0,
      free: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Get customers count
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Get payments stats
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: payments } = await supabase
        .from('payments')
        .select('status, nominal')
        .eq('bulan', currentMonth)
        .eq('tahun', currentYear);

      // Calculate payment stats
      const totalPaid = payments?.filter(p => p.status === 'Lunas').length || 0;
      const totalPending = payments?.filter(p => p.status === 'Belum Lunas').length || 0;
      const totalOverdue = payments?.filter(p => p.status === 'Tunggakan').length || 0;
      const totalFree = payments?.filter(p => p.status === 'Free').length || 0;

      // Calculate monthly income
      const monthlyIncome = payments
        ?.filter(p => p.status === 'Lunas')
        .reduce((sum, p) => sum + (p.nominal || 0), 0) || 0;

      // Get expenses for current month
      const { data: expenses } = await supabase
        .from('modal_wifi')
        .select('nominal')
        .gte('tgl_pengeluaran', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('tgl_pengeluaran', currentMonth === 12 
          ? `${currentYear + 1}-01-01` 
          : `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      const monthlyExpenses = expenses?.reduce((sum, e) => sum + (e.nominal || 0), 0) || 0;
      const profit = monthlyIncome - monthlyExpenses;

      setStats({
        totalCustomers: totalCustomers || 0,
        totalPaid,
        totalPending,
        totalOverdue,
        totalFree,
        monthlyIncome,
        monthlyExpenses,
        profit,
        payments: {
          lunas: totalPaid,
          pending: totalPending,
          overdue: totalOverdue,
          free: totalFree,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Ringkasan bisnis WiFi Anda</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Pelanggan"
          value={stats.totalCustomers}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Pembayaran Lunas"
          value={stats.totalPaid}
          icon={CreditCard}
          color="green"
        />
        <StatsCard
          title="Belum Bayar"
          value={stats.totalPending}
          icon={CreditCard}
          color="yellow"
        />
        <StatsCard
          title="Tunggakan"
          value={stats.totalOverdue}
          icon={CreditCard}
          color="red"
        />
        <StatsCard
          title="Free"
          value={stats.totalFree}
          icon={CreditCard}
          color="purple"
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Pemasukan Bulan Ini"
          value={formatCurrency(stats.monthlyIncome)}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Pengeluaran Bulan Ini"
          value={formatCurrency(stats.monthlyExpenses)}
          icon={TrendingDown}
          color="red"
        />
        <StatsCard
          title="Keuntungan"
          value={formatCurrency(stats.profit)}
          icon={DollarSign}
          color={stats.profit >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeExpenseChart />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Pembayaran</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Lunas</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-green-500 rounded-full"
                    style={{ 
                      width: `${stats.totalPaid / (stats.totalPaid + stats.totalPending + stats.totalOverdue + stats.totalFree) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.totalPaid}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Belum Lunas</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-yellow-500 rounded-full"
                    style={{ 
                      width: `${stats.totalPending / (stats.totalPaid + stats.totalPending + stats.totalOverdue + stats.totalFree) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.totalPending}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Tunggakan</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-red-500 rounded-full"
                    style={{ 
                      width: `${stats.totalOverdue / (stats.totalPaid + stats.totalPending + stats.totalOverdue + stats.totalFree) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.totalOverdue}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Free</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-purple-500 rounded-full"
                    style={{ 
                      width: `${stats.totalFree / (stats.totalPaid + stats.totalPending + stats.totalOverdue + stats.totalFree) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.totalFree}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}