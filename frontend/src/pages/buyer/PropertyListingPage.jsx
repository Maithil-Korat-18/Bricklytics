import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, ArrowLeft, ArrowRight, Building2, ArrowUpDown } from 'lucide-react';
import PropertyCard from '../../components/buyer/PropertyCard';
import ExploreFilters from '../../components/buyer/ExploreFilters';
import { buyerApi } from '../../services/buyerApi';

export default function PropertyListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [properties, setProperties] = useState([]);
  const [favoritePropertyIds, setFavoritePropertyIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 1,
  });

  const [filterParams, setFilterParams] = useState({
    search: searchParams.get('search') || '',
    property_type: searchParams.get('property_type') || '',
    bhk: searchParams.get('bhk') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    locality: searchParams.get('locality') || '',
    min_investment_score: searchParams.get('min_investment_score') || '',
    sort_by: searchParams.get('sort_by') || '-created_at',
  });

  // Sync URL search params when filter params change
  useEffect(() => {
    const urlLocality = searchParams.get('locality');
    const urlSearch = searchParams.get('search');
    
    if (urlLocality !== null && urlLocality !== filterParams.locality) {
      setFilterParams((prev) => ({ ...prev, locality: urlLocality }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    } else if (urlSearch !== null && urlSearch !== filterParams.search) {
      setFilterParams((prev) => ({ ...prev, search: urlSearch }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [searchParams]);

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
          totalPages: res.data.total_pages || Math.ceil((res.data.count || 0) / prev.pageSize) || 1,
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
    setFilterParams(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));

    // Update query params in URL
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    const resetValues = {
      search: '',
      property_type: '',
      bhk: '',
      min_price: '',
      max_price: '',
      locality: '',
      min_investment_score: '',
      sort_by: '-created_at',
    };
    setFilterParams(resetValues);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)] bg-background">
      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block">
        <ExploreFilters
          filters={filterParams}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          totalCount={pagination.totalCount}
        />
      </div>

      {/* Mobile Filter Toggle Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end lg:hidden">
          <div className="w-4/5 max-w-xs h-full bg-surface-container-lowest overflow-y-auto">
            <div className="p-3 border-b flex justify-between items-center bg-surface">
              <span className="font-bold text-sm text-on-surface">Filter Listings</span>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-xs font-bold text-secondary px-2 py-1"
              >
                Close ×
              </button>
            </div>
            <ExploreFilters
              filters={filterParams}
              onFilterChange={(nf) => {
                handleFilterChange(nf);
                setShowMobileFilters(false);
              }}
              onReset={() => {
                handleResetFilters();
                setShowMobileFilters(false);
              }}
              totalCount={pagination.totalCount}
            />
          </div>
        </div>
      )}

      {/* Results Main Canvas */}
      <main className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto space-y-6">
        {/* Top Header & Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <h1 className="font-display-md text-display-md font-bold text-on-surface tracking-tight">
              Explore Properties
            </h1>
            <p className="font-body-sm text-body-sm text-secondary mt-1">
              {filterParams.locality
                ? `Showing top properties in ${filterParams.locality}, Ahmedabad`
                : 'Browse verified real estate listings in Ahmedabad with high-precision AI valuations.'}
            </p>
          </div>

          {/* Action Toolbar: Mobile filter button, Sort By, View Mode */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-xs font-semibold text-on-surface flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>Filters</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/40">
              <ArrowUpDown className="w-3.5 h-3.5 text-secondary shrink-0" />
              <select
                value={filterParams.sort_by || '-created_at'}
                onChange={(e) => handleFilterChange({ ...filterParams, sort_by: e.target.value })}
                className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="-created_at">Newest First</option>
                <option value="-investment_score">Highest Investment Score</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-area_sqft">Area: Largest First</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-surface-container-lowest rounded-lg border border-outline-variant/40">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-primary text-on-primary shadow-xs' : 'text-secondary hover:text-on-surface'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-primary text-on-primary shadow-xs' : 'text-secondary hover:text-on-surface'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-secondary font-semibold">
          <span>Showing {properties.length} of {pagination.totalCount} properties</span>
          {filterParams.locality && (
            <button
              onClick={() => handleFilterChange({ ...filterParams, locality: '' })}
              className="text-primary hover:underline text-xs"
            >
              Clear locality filter ({filterParams.locality})
            </button>
          )}
        </div>

        {/* Property Cards Grid / List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 my-auto">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No properties found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              No active properties match your specified filters. Try expanding your search or resetting filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 pt-6">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="p-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-variant disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-on-surface px-3">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-variant disabled:opacity-40"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
