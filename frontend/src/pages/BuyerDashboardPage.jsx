import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { buyerApi } from '../services/buyerApi';
import { useAuth } from '../contexts/AuthContext';
import PropertyCard from '../components/buyer/PropertyCard';
import StatCard from '../components/dashboard/StatCard';
import TrendingLocations from '../components/buyer/TrendingLocations';
import { ROUTES } from '../constants/routes';
import { useWishlist } from '../contexts/WishlistContext';
import {
  Sparkles, TrendingUp, Trophy, Star, Zap, ArrowRight,
  SlidersHorizontal, Award, Target,
} from 'lucide-react';

import { getPropertyCoverImage } from '../utils/propertyMedia';

const formatCurrency = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
};

function RankedPropertyRow({ property, rank }) {
  const rankBadge =
    rank === 1
      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 shadow-md ring-2 ring-amber-300'
      : rank === 2
      ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-white shadow'
      : 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow';

  const RankIcon = rank === 1 ? Trophy : rank <= 3 ? Award : Star;

  const coverImage = getPropertyCoverImage(property);
  const score = property.investment_score ?? property.ai_fair_price;
  const appreciation = Number(property.appreciation_3yr || 0).toFixed(1);

  const ratingConfig = {
    Excellent: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Good: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    Cautious: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  }[property.investment_rating] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };

  return (
    <Link
      to={`${ROUTES.PROPERTIES}/${property.id}`}
      className="group flex items-center gap-4 p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-blue-200 hover:shadow-md transition-all duration-200"
    >
      {/* Rank Badge */}
      <div className={`w-8 h-8 rounded-full ${rankBadge} flex items-center justify-center shrink-0`}>
        <RankIcon className="w-4 h-4" />
      </div>

      {/* Thumbnail */}
      {coverImage ? (
        <img
          src={coverImage}
          alt={property.title}
          className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-blue-400" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
          {property.title}
        </p>
        <p className="text-xs text-slate-400 truncate">{property.locality || 'Ahmedabad'}</p>

        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-900">{formatCurrency(property.price)}</span>
          {property.investment_rating && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ratingConfig.bg} ${ratingConfig.text} ${ratingConfig.border}`}>
              {property.investment_rating}
            </span>
          )}
        </div>
      </div>

      {/* Score & Appreciation */}
      <div className="text-right shrink-0 space-y-1">
        <div className="flex items-center justify-end gap-1">
          <span className="text-xs font-black text-emerald-700">⭐ {property.investment_score || 85}</span>
          <span className="text-[10px] text-slate-400 font-bold">/ 100</span>
        </div>
        {appreciation > 0 && (
          <div className="flex items-center gap-1 justify-end">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600">+{appreciation}% 3yr</span>
          </div>
        )}
      </div>

      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
    </Link>
  );
}

function TopPropertiesSortTab({ label, value, active, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
  );
}

export default function BuyerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favoriteIds, loading: wishlistLoading } = useWishlist();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topProperties, setTopProperties] = useState([]);
  const [topLoading, setTopLoading] = useState(true);
  const [sortBy, setSortBy] = useState('-investment_score');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Ahmedabad');

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

  useEffect(() => {
    async function loadTopProperties() {
      setTopLoading(true);
      try {
        const res = await buyerApi.getTopProperties(6, sortBy);
        if (res.success && res.data) {
          setTopProperties(res.data);
        }
      } catch (err) {
        console.error('Failed to load top properties:', err);
      } finally {
        setTopLoading(false);
      }
    }
    loadTopProperties();
  }, [sortBy]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedLocation && selectedLocation !== 'Ahmedabad') {
      params.set('locality', selectedLocation);
    }
    navigate(`${ROUTES.PROPERTIES}?${params.toString()}`);
  };

  const stats = dashboardData?.stats || {};

  const statCardsData = [
    {
      id: 1,
      title: 'Properties Available',
      value: (stats.total_market_properties ?? 0).toLocaleString('en-IN'),
      trendText: '+12%',
      trendSubtext: 'this month',
      trendIcon: 'trending_up',
      icon: 'home_work',
      iconBg: 'bg-secondary-container/50',
      iconColor: 'text-secondary',
    },
    {
      id: 2,
      isAiInsight: true,
      title: 'AI Recs',
      value: stats.ai_recommendations_count ?? 0,
      subtitle: 'High-conviction matches',
      icon: 'psychology',
    },
    {
      id: 3,
      title: 'Wishlist',
      value: wishlistLoading ? (stats.wishlist_count ?? 0) : favoriteIds.size,
      subtitle: 'Saved properties',
      icon: 'favorite',
      iconBg: 'bg-error-container/30',
      iconColor: 'text-error',
    },
    {
      id: 4,
      title: 'Compared',
      value: stats.compared_count ?? 0,
      subtitle: 'Active analysis',
      icon: 'compare_arrows',
      iconBg: 'bg-surface-container-high',
      iconColor: 'text-secondary',
    },
  ];

  const recommendedProperties = dashboardData?.recommended_properties || [];
  const trendingLocations = dashboardData?.trending_locations || [];

  const SORT_TABS = [
    { label: 'Highest Score', value: '-investment_score', icon: Trophy },
    { label: 'Best Appreciation', value: '-appreciation_3yr', icon: TrendingUp },
    { label: 'Lowest Price', value: 'price', icon: Target },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <header className="mb-lg flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">
            Good Morning, {user?.first_name || 'Alexander'}
          </h1>
          <p className="font-body-lg text-body-lg text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
            Find your next smart investment with AI.
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-ambient p-2 mb-xl flex flex-col md:flex-row gap-2">
        <div className="flex-1 flex items-center bg-surface-container-low rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
          <span className="material-symbols-outlined text-secondary mr-2">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-on-surface font-body-md placeholder:text-outline py-2"
            placeholder="Search properties, builders, or landmarks..."
            type="text"
          />
        </div>
        <div className="md:w-64 flex items-center bg-surface-container-low rounded-lg px-4 py-2 border-l-0 md:border-l border-outline-variant/30">
          <span className="material-symbols-outlined text-secondary mr-2">location_on</span>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-on-surface font-body-md py-2 appearance-none cursor-pointer"
          >
            <option value="Ahmedabad">Ahmedabad, GJ</option>
            <option value="South Bopal">South Bopal</option>
            <option value="Satellite">Satellite</option>
            <option value="Science City">Science City</option>
            <option value="Prahlad Nagar">Prahlad Nagar</option>
            <option value="Bodakdev">Bodakdev</option>
            <option value="Thaltej">Thaltej</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
        >
          Analyze Market
        </button>
      </form>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-lg mb-xl">
        {statCardsData.map((card) => (
          <StatCard key={card.id} data={card} />
        ))}
      </div>

      {/* Bento Grid Layout for Main Content and Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-lg">

        {/* Main Content: AI Recommended Properties */}
        <section className="xl:col-span-2">
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              AI Recommended Properties
              <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
            </h2>
            <Link to={ROUTES.PROPERTIES} className="font-label-md text-label-md text-primary hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-80 bg-surface-container-low rounded-xl animate-pulse border border-outline-variant/20" />
              ))}
            </div>
          ) : recommendedProperties.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2">home_work</span>
              <p className="font-body-md text-secondary">No active properties available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {recommendedProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} isFavoriteInitial={favoriteIds.has(String(prop.id))} />
              ))}
            </div>
          )}
        </section>

        {/* Sidebar / Secondary Content */}
        <aside className="xl:col-span-1 flex flex-col gap-lg">
          <TrendingLocations locations={trendingLocations} />
        </aside>
      </div>
    </div>
  );
}
