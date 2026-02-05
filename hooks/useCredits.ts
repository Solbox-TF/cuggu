'use client';

import { useState, useEffect, useCallback } from 'react';

interface CreditsState {
  credits: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * AI 크레딧 조회 훅
 *
 * @returns { credits, isLoading, error, refetch }
 */
export function useCredits() {
  const [state, setState] = useState<CreditsState>({
    credits: null,
    isLoading: true,
    error: null,
  });

  const fetchCredits = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/user/credits');

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();

      if (data.success) {
        setState({ credits: data.credits, isLoading: false, error: null });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setState({
        credits: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    ...state,
    refetch: fetchCredits,
  };
}
