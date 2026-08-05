import React, { useState } from 'react';
import { Plus, RefreshCw, TrendingUp, Eye, MessageSquare, Award, Crown, Sparkles, BarChart3, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import PropertyTable from '../components/dashboard/PropertyTable';
import StatCard from '../components/dashboard/StatCard';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useToast } from '../components/common/ToastContext';
import { ROUTES, getEditPropertyPath, getSellerPropertyDetailsPath } from '../constants/routes';
import { useSellerDashboard } from '../hooks/useSellerDashboard';
import { propertyApi } from '../services/propertyApi';
import { getPropertyMediaUrl } from '../utils/propertyMedia';

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-28 rounded-2xl border border-slate-200/80 bg-white" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-36 rounded-2xl border border-slate-200/80 bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-28 rounded-2xl border border-slate-200/80 bg-white" />
        ))}
      </div>
      <div className="h-72 rounded-2xl border border-slate-200/80 bg-white" />
      <div className="h-96 rounded-2xl border border-slate-200/80 bg-white" />
    </div>
  );
}

const formatPrice = (value) => {
  const val = Number(value || 0);
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
};

function TopPerformingCard({ property, rank }) {
  const rankConfig = {
    1: { badge: 'bg-gradient-to-r from-amber-400 to-yellow-500', icon: Crown, label: '#1 Top Property', text: 'text-amber-700' },
    2: { badge: 'bg-gradient-to-r from-slate-300 to-slate-400', icon: Award, label: '#2 Runner Up', text: 'text-slate-600' },
    3: { badge: 'bg-gradient-to-r from-amber-600 to-orange-500', icon: Award, label: '#3 Best Performer', text: 'text-amber-800' },
  }[rank] || { badge: 'bg-slate-100', icon: TrendingUp, label: `#${rank}`, text: 'text-slate-600' };

  const RankIcon = rankConfig.icon;
  const coverImage = property.images?.find((img) => img.is_cover)?.url || property.images?.[0]?.url;
  const score = property.investment_score;

  return (
    <div className="group relative flex gap-4 p-4 bg-white rounded-xl border border-slate-200/80 hover:border-blue-200 hover:shadow-md transition-all duration-200">
      {/* Rank Badge */}
      <div className={`absolute -top-2 -left-2 w-7 h-7 rounded-full ${rankConfig.badge} flex items-center justify-center shadow-md`}>
        <RankIcon className="w-3.5 h-3.5 text-white" />
      </div>

      {/* Thumbnail */}
      {coverImage ? (
        <img
          src={getPropertyMediaUrl(coverImage)}
          alt={property.title}
          className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200 flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-7 h-7 text-blue-400" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
          {property.title || 'Property'}
        </p>
        <p className="text-xs text-slate-400 truncate">{property.locality || property.city || 'Ahmedabad'}</p>

        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            {property.view_count || 0} Views
          </span>
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            {property.inquiry_count || 0} Inquiries
          </span>
          {score != null && (
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              {score}/100
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">{formatPrice(property.price)}</span>
          <div className="flex items-center gap-1.5">
            <Link
              to={getSellerPropertyDetailsPath(property.id)}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              View
            </Link>
            <span className="text-slate-200">|</span>
            <Link
              to={getEditPropertyPath(property.id)}
              className="text-[10px] font-bold text-slate-500 hover:underline"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HighlightStatCard({ title, property, icon: Icon, colorClass }) {
  if (!property) return null;
  const coverImage = property.images?.find((img) => img.is_cover)?.url || property.images?.[0]?.url;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-2">
      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${colorClass}`}>
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      <div className="flex items-center gap-3">
        {coverImage ? (
          <img
            src={getPropertyMediaUrl(coverImage)}
            alt={property.title}
            className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{property.title || 'Property'}</p>
          <p className="text-xs text-slate-400 truncate">{property.locality || property.city}</p>
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { data, loading, error, refetch } = useSellerDashboard();
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    setDeleting(true);
    try {
      const response = await propertyApi.deleteProperty(propertyToDelete.id);
      if (!response?.success) throw new Error(response?.message || 'Unable to delete this property.');
      showSuccess(`Property "${propertyToDelete.title}" deleted successfully.`);
      setPropertyToDelete(null);
      refetch();
    } catch (requestError) {
      showError(requestError.response?.data?.message || requestError.message || 'Unable to delete this property.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-card-soft">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <RefreshCw className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Unable to load your dashboard</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const stats = data?.stats || {};
  const topProperties = data?.top_performing_properties || [];
  const mostViewed = data?.most_viewed_property;
  const mostEnquiries = data?.most_enquiries_property;
  const highestScore = data?.highest_investment_score_property;

  const statCardsData = [
    { id: 'total', title: 'Total Properties', value: stats.total_properties || 0, description: 'All your listings', iconName: 'Building2' },
    { id: 'active', title: 'Active Listings', value: stats.active_listings || 0, description: 'Currently visible to buyers', iconName: 'Home' },
    { id: 'sold', title: 'Sold', value: stats.sold_properties || 0, description: 'Listings marked as sold', iconName: 'CheckCircle2' },
    { id: 'assets', title: 'Assets Value', value: `${formatPrice(stats.total_assets || 0)}`, description: 'Combined value', iconName: 'WalletCards' },
  ];

  const quickActionsData = [
    {
      id: 'add',
      title: 'Add New Property',
      description: 'List a new property with AI valuation engine',
      to: ROUTES.ADD_PROPERTY,
      iconName: 'Plus',
      accentColor: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'manage',
      title: 'Manage Listings',
      description: 'View, edit, search and filter your portfolio',
      to: ROUTES.MANAGE_PROPERTIES,
      iconName: 'Building2',
      accentColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      id: 'analytics',
      title: 'Portfolio Analytics',
      description: 'View market trends, price benchmarks & insights',
      to: ROUTES.ANALYTICS,
      iconName: 'BarChart3',
      accentColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            Seller Dashboard <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Monitor your property portfolio and manage listings in real time.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.ADD_PROPERTY)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>

      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCardsData.map((stat) => (
          <StatCard key={stat.id} data={stat} />
        ))}
      </div>

      {/* 2. Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {quickActionsData.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </div>

      {/* 3. Recent Properties (maximum 5) */}
      <PropertyTable properties={(data?.recent_properties || []).slice(0, 5)} onDelete={setPropertyToDelete} />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(propertyToDelete)}
        title="Delete Property"
        message={`Are you sure you want to delete "${propertyToDelete?.title}"? This will remove the listing from your dashboard.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => !deleting && setPropertyToDelete(null)}
      />
    </div>
  );
}
