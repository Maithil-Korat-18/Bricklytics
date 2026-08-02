import React, { useState } from 'react';
import { Plus, RefreshCw, BarChart3, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import PropertyTable from '../components/dashboard/PropertyTable';
import StatCard from '../components/dashboard/StatCard';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useToast } from '../components/common/ToastContext';
import { ROUTES } from '../constants/routes';
import { useSellerDashboard } from '../hooks/useSellerDashboard';
import { propertyApi } from '../services/propertyApi';

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
      <div className="h-96 rounded-2xl border border-slate-200/80 bg-white" />
      <div className="h-96 rounded-2xl border border-slate-200/80 bg-white" />
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
  const statCardsData = [
    { id: 'total', title: 'Total Properties', value: stats.total_properties || 0, description: 'All your listings', iconName: 'Building2' },
    { id: 'active', title: 'Active Listings', value: stats.active_listings || 0, description: 'Currently visible to buyers', iconName: 'Home' },
    { id: 'sold', title: 'Sold', value: stats.sold_properties || 0, description: 'Listings marked as sold', iconName: 'CheckCircle2' },
    { id: 'assets', title: 'Assets Value', value: `₹${Number(stats.total_assets || 0).toLocaleString('en-IN')}`, description: 'Combined value', iconName: 'WalletCards' },
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

      {/* 4. Recent Activity Timeline */}
      <ActivityTimeline activities={(data?.recent_activity || []).slice(0, 5)} />

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
