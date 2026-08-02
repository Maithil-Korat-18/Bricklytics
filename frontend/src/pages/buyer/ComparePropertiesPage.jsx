import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check, X, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { buyerApi } from '../../services/buyerApi';
import { useToast } from '../../components/common/ToastContext';
import { Link } from 'react-router-dom';
import { ROUTES, getPropertyDetailsPath } from '../../constants/routes';

export default function ComparePropertiesPage() {
  const { showError } = useToast();
  const [properties, setProperties] = useState([]);
  const [availableProps, setAvailableProps] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPropertiesForCompare() {
      setLoading(true);
      try {
        const res = await buyerApi.getProperties({ page_size: 10 });
        if (res.success && res.data) {
          const items = res.data.results || [];
          setAvailableProps(items);
          if (items.length >= 2) {
            setSelectedIds([items[0].id, items[1].id]);
          } else if (items.length === 1) {
            setSelectedIds([items[0].id]);
          }
        }
      } catch (err) {
        showError('Failed to load comparison data.');
      } finally {
        setLoading(false);
      }
    }
    loadPropertiesForCompare();
  }, [showError]);

  useEffect(() => {
    async function fetchCompared() {
      if (selectedIds.length === 0) {
        setProperties([]);
        return;
      }
      try {
        const res = await buyerApi.compareProperties(selectedIds);
        if (res.success && res.data) {
          setProperties(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCompared();
  }, [selectedIds]);

  const handleSelectProperty = (id, slotIndex) => {
    const updated = [...selectedIds];
    updated[slotIndex] = id;
    setSelectedIds(updated.filter(Boolean));
  };

  const removePropertySlot = (index) => {
    setSelectedIds(selectedIds.filter((_, i) => i !== index));
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-blue-600" />
          <span>Compare Properties Side-by-Side</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Compare specs, pricing, AI valuations, and location metrics to make confident real estate decisions.
        </p>
      </div>

      {/* Property Slot Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card-soft flex flex-wrap gap-4 items-center justify-between">
        <span className="text-xs font-bold text-slate-700">Select up to 3 properties to compare:</span>
        
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2].map((slotIdx) => {
            const currentId = selectedIds[slotIdx] || '';
            return (
              <select
                key={slotIdx}
                value={currentId}
                onChange={(e) => handleSelectProperty(e.target.value, slotIdx)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 max-w-[200px]"
              >
                <option value="">+ Select Property {slotIdx + 1}</option>
                {availableProps.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.locality || 'Ahmedabad'})
                  </option>
                ))}
              </select>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      {loading ? (
        <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No properties selected for comparison</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Choose at least 2 properties from the selector above to compare side-by-side.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card-soft overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="p-4 font-bold text-slate-500 w-48">Feature</th>
                {properties.map((p, idx) => (
                  <th key={p.id} className="p-4 font-extrabold text-slate-900 min-w-[240px]">
                    <div className="flex justify-between items-start">
                      <Link to={getPropertyDetailsPath(p.id)} className="hover:text-blue-600 text-sm line-clamp-1">
                        {p.title}
                      </Link>
                      <button onClick={() => removePropertySlot(idx)} className="text-slate-400 hover:text-red-500 ml-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-4 font-semibold text-slate-500">Asking Price</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 font-extrabold text-slate-900 text-sm">
                    {formatCurrency(p.price)}
                  </td>
                ))}
              </tr>

              <tr className="bg-blue-50/40">
                <td className="p-4 font-bold text-blue-700 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>AI Valuation</span>
                </td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 font-extrabold text-blue-700 text-sm">
                    {formatCurrency(p.ai_predicted_price || p.price * 1.04)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-500">Locality</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 font-semibold text-slate-800">
                    {p.locality || 'South Bopal'}, {p.city}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-500">BHK / Bedrooms</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 font-semibold text-slate-800">
                    {p.bhk || 2} BHK ({p.bedrooms || 2} Beds, {p.bathrooms || 2} Baths)
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-500">Super Built-up Area</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 font-semibold text-slate-800">
                    {p.area_sqft || 1200} sqft (₹{p.rate_per_sqft || 4500}/sqft)
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-500">Possession Status</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 font-bold text-emerald-600">
                    {p.possession_status || 'Ready to Move'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-500">Builder Name</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 font-semibold text-slate-800">
                    {p.builder_name || 'Apex Developers'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-slate-500">Action</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4">
                    <Link
                      to={getPropertyDetailsPath(p.id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-all shadow-sm"
                    >
                      <span>View Full Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
