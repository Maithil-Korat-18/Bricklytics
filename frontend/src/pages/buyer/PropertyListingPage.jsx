import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, List, SlidersHorizontal, ArrowLeft, ArrowRight, Building2 } from 'lucide-react';
import PropertyCard from '../../components/buyer/PropertyCard';
import PropertyFilters from '../../components/buyer/PropertyFilters';
import { buyerApi } from '../../services/buyerApi';

export default function PropertyListingPage() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [properties, setProperties] = useState([]);
  const [favoritePropertyIds, setFavoritePropertyIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 1,
  });

  const [filterParams, setFilterParams] = useState({
    search: '',
    property_type: '',
    bhk: '',
    min_price: '',
    max_price: '',
    locality: '',
    sort_by: '-created_at',
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filterParams,
        page: pagination.page,
        page_size: pagination.pageSize,
      };

      const res = await buyerApi.getProperties(params);
      if (res.success && res.data) {
        setProperties(res.data.results || []);
        setPagination((prev) => ({
          ...prev,
          totalCount: res.data.count || 0,
          totalPages: res.data.total_pages || 1,
        }));
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  }, [filterParams, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    async function loadWishlist() {
      try {
        const res = await buyerApi.getWishlist();
        if (res.success && res.data) {
          setFavoritePropertyIds(new Set(res.data.map((item) => item.property_id)));
        }
      } catch (err) {
        console.error('Error loading wishlist:', err);
      }
    }

    loadWishlist();
  }, []);

  const handleFavoriteToggle = (propertyId, isFavorite) => {
    setFavoritePropertyIds((previousIds) => {
      const nextIds = new Set(previousIds);
      if (isFavorite) {
        nextIds.add(propertyId);
      } else {
        nextIds.delete(propertyId);
      }
      return nextIds;
    });
  };

  const handleFilterChange = (newFilters) => {
    setFilterParams((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = (resetValues) => {
    setFilterParams(resetValues);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Explore Real Estate Properties
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified listings in Ahmedabad with high-precision AI valuations & appreciation forecasts.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Component */}
      <PropertyFilters
        filters={filterParams}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Properties Display Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
        <span>Showing {properties.length} of {pagination.totalCount} properties</span>
      </div>

      {/* Property Cards Grid / List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No properties found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or resetting filters to see available listings.
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {properties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              isFavoriteInitial={favoritePropertyIds.has(prop.id)}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-700 px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
