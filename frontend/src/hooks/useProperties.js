import { useState, useEffect, useCallback } from 'react';
import { propertyApi } from '../services/propertyApi';
import { useToast } from '../components/common/ToastContext';

export function useProperties(initialParams = {}) {
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const { showError } = useToast();

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await propertyApi.getProperties(params);
      if (res.success && res.data) {
        setProperties(res.data.results || []);
        setPagination({
          count: res.data.count || 0,
          page: res.data.page || 1,
          pageSize: res.data.page_size || 20,
          totalPages: res.data.total_pages || 1,
          hasNext: res.data.has_next || false,
          hasPrev: res.data.has_prev || false,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch properties';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [params, showError]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const updateFilters = useCallback((newFilters) => {
    setParams((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const changePage = useCallback((newPage) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  }, []);

  return {
    properties,
    pagination,
    loading,
    error,
    params,
    updateFilters,
    changePage,
    refetch: fetchProperties,
    setProperties,
  };
}
