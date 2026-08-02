import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Search, 
  Calendar, 
  Eye, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Clock, 
  Building2,
  PhoneCall,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { buyerApi } from '../services/buyerApi';
import { useAuth } from '../contexts/AuthContext';
import PropertyCard from '../components/buyer/PropertyCard';
import StatCard from '../components/dashboard/StatCard';
import { ROUTES, getPropertyDetailsPath } from '../constants/routes';

export default function BuyerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const res = await buyerApi.getDashboard();
        if (res.success && res.data) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error('Failed to load buyer dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const stats = dashboardData?.stats || {};

  const statCards = [
    {
      id: 1,
      title: 'SAVED WISHLIST',
      value: stats.wishlist_count || 0,
      trend: '+2 new',
      trendUp: true,
      iconName: 'Heart',
      description: 'Properties in your wishlist',
    },
    {
      id: 2,
      title: 'SAVED SEARCHES',
      value: stats.saved_searches_count || 0,
      trend: 'Active',
      trendUp: true,
      iconName: 'Search',
      description: 'Automated filter alerts',
    },
    {
      id: 3,
      title: 'SCHEDULED VISITS',
      value: stats.scheduled_visits_count || 0,
      trend: 'Upcoming',
      trendUp: true,
      iconName: 'CheckCircle2',
      description: 'Confirmed site visits',
    },
    {
      id: 4,
      title: 'AI MARKET VALUATIONS',
      value: stats.total_market_properties || 0,
      trend: '+3.4%',
      trendUp: true,
      iconName: 'Sparkles',
      description: 'Ahmedabad listings tracked',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back, {user?.first_name || 'Buyer'} <span className="animate-bounce inline-block">👋</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover AI-valuated real estate listings, manage your wishlist, and schedule site visits in Ahmedabad.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.PROPERTIES)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
            <Search className="w-4 h-4" />
            <span>Explore Properties</span>
          </button>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => (
          <StatCard key={stat.id} data={stat} />
        ))}
      </div>

      {/* Recommended Properties Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>AI Recommended Properties</span>
            </h2>
            <p className="text-xs text-slate-500">Matched to your price history and location interest in Ahmedabad</p>
          </div>
          <Link to={ROUTES.PROPERTIES} className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 bg-white rounded-2xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(dashboardData?.recommended_properties || []).slice(0, 4).map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to={ROUTES.PROPERTIES}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-card-soft hover:border-blue-300 hover:shadow-card-hover transition-all flex items-start space-x-4 group"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  Search Properties
                </h3>
                <p className="text-xs text-slate-500 mt-1">Filter properties by locality, BHK, price, and amenities.</p>
              </div>
            </Link>

            <Link
              to={ROUTES.WISHLIST}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-card-soft hover:border-blue-300 hover:shadow-card-hover transition-all flex items-start space-x-4 group"
            >
              <div className="p-3 rounded-xl bg-red-50 text-red-600 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  My Wishlist
                </h3>
                <p className="text-xs text-slate-500 mt-1">Access saved favorites and compare prices.</p>
              </div>
            </Link>

            <Link
              to={ROUTES.COMPARE}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-card-soft hover:border-blue-300 hover:shadow-card-hover transition-all flex items-start space-x-4 group"
            >
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  Compare Properties
                </h3>
                <p className="text-xs text-slate-500 mt-1">Compare up to 4 properties side-by-side.</p>
              </div>
            </Link>

            <Link
              to={ROUTES.SCHEDULE_VISIT}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-card-soft hover:border-blue-300 hover:shadow-card-hover transition-all flex items-start space-x-4 group"
            >
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  Schedule Site Visit
                </h3>
                <p className="text-xs text-slate-500 mt-1">Book in-person or virtual site walkthroughs.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
          <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
          <div className="space-y-4">
            {(dashboardData?.activities || []).map((act) => (
              <div key={act.id} className="flex items-start space-x-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">{act.title}</p>
                  <p className="text-slate-500 mt-0.5">{act.description}</p>
                  <span className="text-[10px] text-slate-400 font-medium">{act.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
