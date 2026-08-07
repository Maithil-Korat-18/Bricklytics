import { useCallback, useEffect, useState } from 'react';
import { propertyApi } from '../services/propertyApi';

export function useSellerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertyApi.getDashboard();
      if (!response?.success || !response?.data) {
        throw new Error(response?.message || 'Unable to load dashboard data.');
      }
      setData(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
