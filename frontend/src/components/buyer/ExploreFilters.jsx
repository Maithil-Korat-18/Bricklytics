import React from 'react';
import { SlidersHorizontal, MapPin, Sparkles } from 'lucide-react';

export default function ExploreFilters({ filters, onFilterChange, onReset, totalCount }) {
  const handleChange = (name, value) => {
    onFilterChange({ ...filters, [name]: value });
  };

  const localities = [
    { label: 'All Localities', value: '' },
    { label: 'South Bopal', value: 'South Bopal' },
    { label: 'Satellite', value: 'Satellite' },
    { label: 'Science City', value: 'Science City' },
    { label: 'Prahlad Nagar', value: 'Prahlad Nagar' },
    { label: 'Bodakdev', value: 'Bodakdev' },
    { label: 'Sola', value: 'Sola' },
    { label: 'Gota', value: 'Gota' },
    { label: 'Thaltej', value: 'Thaltej' },
    { label: 'SG Highway', value: 'SG Highway' },
  ];

  const propertyTypes = [
    { label: 'Apartment', value: 'apartment' },
    { label: 'Villa', value: 'villa' },
  ];

  const bhkOptions = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5+', value: '5' },
  ];

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 bg-white border-r border-slate-200/80 overflow-y-auto p-5 space-y-6 font-sans">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight">
          <SlidersHorizontal className="w-5 h-5 text-blue-600" />
          <span>Advanced Filters</span>
        </div>
        <button
          onClick={onReset}
          type="button"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Location Search Input + Locality Dropdown */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Location
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Search cities, neighborhoods..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>
        {/* Quick Locality Select */}
        <select
          value={filters.locality || ''}
          onChange={(e) => handleChange('locality', e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 mt-1"
        >
          {localities.map((loc) => (
            <option key={loc.value} value={loc.value}>
              {loc.label}
            </option>
          ))}
        </select>
      </div>

      {/* Budget Range */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Budget Range
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">₹</span>
            <input
              type="text"
              value={filters.min_price ? (filters.min_price / 100000).toFixed(0) + 'L' : ''}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                handleChange('min_price', val ? parseFloat(val) * 100000 : '');
              }}
              placeholder="Min Lakhs"
              className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
          <span className="text-slate-400 font-bold text-xs">-</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">₹</span>
            <input
              type="text"
              value={filters.max_price ? (filters.max_price / 100000).toFixed(0) + 'L' : ''}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                handleChange('max_price', val ? parseFloat(val) * 100000 : '');
              }}
              placeholder="Max Lakhs"
              className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Property Type (Only Apartment and Villa) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Property Type
        </label>
        <div className="flex items-center gap-2">
          {propertyTypes.map((pt) => {
            const active = (filters.property_type || '') === pt.value;
            return (
              <button
                key={pt.value}
                type="button"
                onClick={() => handleChange('property_type', active ? '' : pt.value)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* BHK */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          BHK
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {bhkOptions.map((bhk) => {
            const active = (filters.bhk || '') === bhk.value;
            return (
              <button
                key={bhk.value}
                type="button"
                onClick={() => handleChange('bhk', active ? '' : bhk.value)}
                className={`py-2 rounded-xl text-xs font-semibold transition-all text-center border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {bhk.label}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* AI Predictive Filters Card */}
      <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 space-y-4">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>AI Predictive Filters</span>
        </div>

        {/* Min Investment Score Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Min Investment Score</span>
            <span className="font-bold text-blue-600">
              {filters.min_investment_score ? `${filters.min_investment_score}+` : '60+'}
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="95"
            step="5"
            value={filters.min_investment_score || 60}
            onChange={(e) => handleChange('min_investment_score', e.target.value === '60' ? '' : e.target.value)}
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* Apply Filters Button */}
      <button
        type="button"
        onClick={() => onFilterChange(filters)}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
      >
        Apply Filters
      </button>
    </aside>
  );
}
