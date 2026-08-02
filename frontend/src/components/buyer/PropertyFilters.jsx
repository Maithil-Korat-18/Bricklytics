import React, { useState } from 'react';
import { Search, Filter, RotateCcw, ChevronDown } from 'lucide-react';

export default function PropertyFilters({ filters, onFilterChange, onReset }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...localFilters, [name]: value };
    setLocalFilters(updated);
    onFilterChange(updated);
  };

  const handleReset = () => {
    const resetValues = {
      search: '',
      property_type: '',
      bhk: '',
      min_price: '',
      max_price: '',
      locality: '',
      sort_by: '-created_at',
    };
    setLocalFilters(resetValues);
    onReset(resetValues);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
      {/* Search Input Header */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          name="search"
          value={localFilters.search || ''}
          onChange={handleChange}
          placeholder="Search by title, location, or builder name..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        />
      </div>

      {/* Filter Select Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Property Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Property Type</label>
          <select
            name="property_type"
            value={localFilters.property_type || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="house">House</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
            <option value="studio">Studio</option>
          </select>
        </div>

        {/* BHK */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">BHK Configuration</label>
          <select
            name="bhk"
            value={localFilters.bhk || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="">Any BHK</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
            <option value="5">5+ BHK</option>
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Min Price (₹)</label>
          <select
            name="min_price"
            value={localFilters.min_price || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="">No Min</option>
            <option value="2500000">₹25 Lakhs</option>
            <option value="5000000">₹50 Lakhs</option>
            <option value="7500000">₹75 Lakhs</option>
            <option value="10000000">₹1 Crore</option>
            <option value="20000000">₹2 Crores</option>
          </select>
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Max Price (₹)</label>
          <select
            name="max_price"
            value={localFilters.max_price || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="">No Max</option>
            <option value="5000000">₹50 Lakhs</option>
            <option value="10000000">₹1 Crore</option>
            <option value="20000000">₹2 Crores</option>
            <option value="50000000">₹5 Crores</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Sort By</label>
          <select
            name="sort_by"
            value={localFilters.sort_by || '-created_at'}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="-created_at">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-area_sqft">Area: Largest First</option>
          </select>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleReset}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}
