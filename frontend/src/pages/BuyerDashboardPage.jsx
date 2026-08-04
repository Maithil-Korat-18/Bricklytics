import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { buyerApi } from '../services/buyerApi';
import { useAuth } from '../contexts/AuthContext';
import PropertyCard from '../components/buyer/PropertyCard';
import StatCard from '../components/dashboard/StatCard';
import TrendingLocations from '../components/buyer/TrendingLocations';
import { ROUTES } from '../constants/routes';

export default function BuyerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
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
      value: stats.total_market_properties ? stats.total_market_properties.toLocaleString('en-IN') : '1,245',
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
      value: stats.ai_recommendations_count || 24,
      subtitle: 'High-conviction matches',
      icon: 'psychology',
    },
    {
      id: 3,
      title: 'Wishlist',
      value: stats.wishlist_count || 8,
      subtitle: 'Saved properties',
      icon: 'favorite',
      iconBg: 'bg-error-container/30',
      iconColor: 'text-error',
    },
    {
      id: 4,
      title: 'Compared',
      value: stats.compared_count || 3,
      subtitle: 'Active analysis',
      icon: 'compare_arrows',
      iconBg: 'bg-surface-container-high',
      iconColor: 'text-secondary',
    },
  ];

  const recommendedProperties = dashboardData?.recommended_properties || [];
  const trendingLocations = dashboardData?.trending_locations || [];

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
                <PropertyCard key={prop.id} property={prop} />
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

