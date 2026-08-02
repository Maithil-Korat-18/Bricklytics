import React, { useEffect, useState } from 'react';
import { Search, Trash2, Bell, ArrowRight } from 'lucide-react';
import { buyerApi } from '../../services/buyerApi';
import { useToast } from '../../components/common/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function SavedSearchesPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSearches = async () => {
    setLoading(true);
    try {
      const res = await buyerApi.getSavedSearches();
      if (res.success && res.data) {
        setSearches(res.data);
      }
    } catch {
      showError('Failed to load saved searches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleDelete = async (id) => {
    try {
      await buyerApi.deleteSavedSearch(id);
      setSearches((prev) => prev.filter((s) => s.id !== id));
      showSuccess('Saved search alert removed.');
    } catch {
      showError('Failed to delete search.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-blue-600" />
          <span>Saved Search Alerts</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Receive real-time notifications when new matching properties are listed in Ahmedabad.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No saved searches yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            When you filter properties, save your filter preferences to get instant alerts.
          </p>
          <button
            onClick={() => navigate(ROUTES.PROPERTIES)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
            <span>Search Properties</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {searches.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {Object.entries(item.filters || {}).map(([key, val]) => (
                    val ? (
                      <span key={key} className="bg-slate-100 px-2.5 py-1 rounded-lg font-semibold text-slate-700 capitalize">
                        {key.replace('_', ' ')}: {String(val)}
                      </span>
                    ) : null
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(ROUTES.PROPERTIES)}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs transition-colors"
                >
                  Run Search
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
