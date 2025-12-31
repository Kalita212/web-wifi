import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

interface ChartData {
  month: string;
  pemasukan: number;
  pengeluaran: number;
}

export function IncomeExpenseChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      
      const chartData: ChartData[] = [];

      for (let month = 1; month <= 12; month++) {
        // Get income for the month
        const { data: payments } = await supabase
          .from('payments')
          .select('nominal')
          .eq('bulan', month)
          .eq('tahun', currentYear)
          .eq('status', 'Lunas');

        const income = payments?.reduce((sum, p) => sum + (p.nominal || 0), 0) || 0;

        // Get expenses for the month
        const { data: expenses } = await supabase
          .from('modal_wifi')
          .select('nominal')
          .gte('tgl_pengeluaran', `${currentYear}-${month.toString().padStart(2, '0')}-01`)
          .lt('tgl_pengeluaran', month === 12 
            ? `${currentYear + 1}-01-01` 
            : `${currentYear}-${(month + 1).toString().padStart(2, '0')}-01`);

        const expense = expenses?.reduce((sum, e) => sum + (e.nominal || 0), 0) || 0;

        chartData.push({
          month: months[month - 1],
          pemasukan: income,
          pengeluaran: expense,
        });
      }

      setData(chartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pemasukan vs Pengeluaran</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Memuat grafik...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pemasukan vs Pengeluaran</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              formatter={(value: number) => [
                new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                }).format(value),
              ]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="pemasukan" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              name="Pemasukan"
            />
            <Line 
              type="monotone" 
              dataKey="pengeluaran" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              name="Pengeluaran"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}