import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Customer } from '../types';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setCustomers(data || []);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError('Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
    try {
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          throw new Error('Nomor HP ini sudah terdaftar. Mohon gunakan nomor HP lain.');
        }
        throw supabaseError;
      }

      setCustomers(prev => [data, ...prev]);
      return { success: true, data, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal menambahkan pelanggan';
      setError(errorMessage);
      return { success: false, data: null, error: errorMessage };
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          throw new Error('Nomor HP ini sudah terdaftar. Mohon gunakan nomor HP lain.');
        }
        throw supabaseError;
      }

      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? data : customer
        )
      );
      return { success: true, data, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal mengupdate pelanggan';
      setError(errorMessage);
      return { success: false, data: null, error: errorMessage };
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      setError(null);
      
      const { error: supabaseError } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      setCustomers(prev => prev.filter(customer => customer.id !== id));
      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal menghapus pelanggan';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers
  };
}