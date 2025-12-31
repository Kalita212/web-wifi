import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Payment } from '../types';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        customers (
          id,
          nama,
          no_hp,
          paket
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setPayments(data || []);
    }
    
    setLoading(false);
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'created_at' | 'customers'>) => {
    const { error } = await supabase
      .from('payments')
      .insert([payment]);

    if (error) {
      return { 
        success: false, 
        error: error.message
      };
    }
    
    try {
      await fetchPayments();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to refresh payment list'
      };
    }
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { 
          success: false, 
          error: error.message
        };
      }
      
      await fetchPayments();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: 'Failed to update payment'
      };
    }
  };

  const deletePayment = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      await fetchPayments();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return {
    payments,
    loading,
    error,
    addPayment,
    updatePayment,
    deletePayment,
    refetch: fetchPayments
  };
}