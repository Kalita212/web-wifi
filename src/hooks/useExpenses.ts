import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('modal_wifi')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setExpenses(data || []);
      }
    } catch (err) {
      setError('Failed to fetch expenses');
    }
    
    setLoading(false);
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('modal_wifi')
        .insert([expense]);

      if (error) throw error;
      await fetchExpenses();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to add expense'
      };
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const { error } = await supabase
        .from('modal_wifi')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchExpenses();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update expense'
      };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('modal_wifi')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchExpenses();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete expense'
      };
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses
  };
}