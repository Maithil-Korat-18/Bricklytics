import React, { useState, useEffect } from 'react';
import {
  Plus, RefreshCw, TrendingUp, Eye, MessageSquare, Award, Crown, Sparkles,
  BarChart3, ArrowRight, Calendar, Clock, CheckCircle2, XCircle, Send,
  Phone, Mail, ShieldCheck, User
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { data, loading, error, refresh } = useSellerDashboard();
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Seller Requests State
  const [sellerRequests, setSellerRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySending, setReplySending] = useState(false);

  // Time Reschedule Modal State
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('11:00 AM');

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await propertyApi.getRequests();
      if (res.data) {
        setSellerRequests(res.data);
      }
    } catch (err) {
      console.warn('Could not load seller requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    setDeleting(true);
    try {
      await propertyApi.deleteProperty(propertyToDelete.id);
      showSuccess(`"${propertyToDelete.title}" deleted successfully.`);
      refresh();
    } catch (err) {
      showError('Failed to delete property. Please try again.');
    } finally {
      setDeleting(false);
      setPropertyToDelete(null);
    }
  };

  const handleAction = async (requestId, action, payload = {}) => {
    try {
      const res = await propertyApi.manageRequestAction(requestId, action, payload);
      showSuccess(res.message || 'Request updated.');
      loadRequests();
      if (activeRequest && activeRequest.id === requestId) {
        setActiveRequest(res.data);
      }
      setRescheduleModal(null);
    } catch (err) {
      showError('Failed to update request.');
    }
  };

  const handleSendReply = async () => {
    if (!activeRequest || !replyMessage.trim()) return;
    setReplySending(true);
    try {
      const res = await propertyApi.replyToRequest(activeRequest.id, replyMessage.trim());
      showSuccess('Reply sent to buyer!');
      loadRequests();
      setActiveRequest(res.data);
      setReplyMessage('');
    } catch (err) {
      showError('Failed to send reply.');
    } finally {
      setReplySending(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <p className="text-sm font-semibold text-red-600">{error}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>
      </div>
    );
  }

  const stats = data?.stats || {};

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

  const pendingRequestsCount = sellerRequests.filter((r) => r.status === 'pending' || r.status === 'New').length;

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
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>

      {/* ── Compact Meeting Requests Notification Banner ────────────────────────────── */}
      {requestsLoading ? (
        <div className="h-16 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
      ) : pendingRequestsCount > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border border-amber-200/80 text-amber-900 shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-3">
            <span className="text-xl">📢</span>
            <div>
              <p className="text-sm font-extrabold text-slate-900">
                You have {pendingRequestsCount} pending buyer meeting request{pendingRequestsCount > 1 ? 's' : ''}.
              </p>
              <p className="text-xs text-slate-600">Review requested date & time slots, accept or reject meetings in Seller Analytics.</p>
            </div>
          </div>
          <button
            onClick={() => navigate(ROUTES.ANALYTICS)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <span>Manage Meetings in Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-sm font-bold text-slate-800">
                All buyer meetings are up to date.
              </p>
              <p className="text-xs text-slate-500">Track portfolio performance and buyer activity anytime in Analytics.</p>
            </div>
          </div>
          <button
            onClick={() => navigate(ROUTES.ANALYTICS)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <span>View Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

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
