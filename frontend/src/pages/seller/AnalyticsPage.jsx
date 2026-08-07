import React, { useEffect, useState, useMemo } from 'react';
import {
  Building2,
  Eye,
  MessageSquare,
  RefreshCw,
  Tag,
  Sparkles,
  Search,
  Check,
  X,
  Mail,
  ChevronLeft,
  ChevronRight,
  Building,
  Home,
  TrendingUp,
  BarChart3,
  Target,
  Star,
  AlertTriangle,
  Trophy,
  ArrowUpRight,
  Wallet,
  PieChart as PieChartIcon,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  ShieldCheck,
  User,
  Send,
} from 'lucide-react';
import { useToast } from '../../components/common/ToastContext';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import ContentContainer from '../../components/common/ContentContainer';
import PageHeader from '../../components/common/PageHeader';
import { propertyApi } from '../../services/propertyApi';
import { getPropertyMediaUrl } from '../../utils/propertyMedia';

const formatPrice = (value) => {
  const val = Number(value || 0);
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
  return `₹${val.toLocaleString('en-IN')}`;
};

const CHART_COLORS = ['#2170e4', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className="card-lvl1 p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#727785]">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-[#131b2e]">{value}</p>
          <p className="mt-1 text-xs text-[#505f76]">{detail}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* ─── Property Rank Row ───────────────────────────────────────────────────── */
function PropertyRankRow({ property, rank }) {
  const IconComp = ['villa', 'house'].includes(property.property_type) ? Home : Building;
  return (
    <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f2f3ff] transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${rank <= 3 ? 'bg-[#0058be] text-white' : 'bg-[#d8e2ff] text-[#0058be]'}`}>
          {rank}
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#d8e2ff] text-[#0058be] flex items-center justify-center shrink-0">
          <IconComp className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-[#0058be] truncate">{property.title || 'Untitled'}</h4>
          <p className="text-xs text-[#727785] truncate">{property.locality || 'Ahmedabad'}</p>
        </div>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <div className="flex items-center gap-2 justify-end text-xs text-[#505f76]">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{(property.view_count || 0).toLocaleString()}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{property.inquiry_count || 0}</span>
        </div>
        {property.investment_score != null && (
          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md ${property.investment_score >= 85 ? 'bg-emerald-100 text-emerald-700' : property.investment_score >= 75 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
            Score: {property.investment_score}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── AI Insight Card ─────────────────────────────────────────────────────── */
function InsightCard({ insight, icon: Icon, accentColor }) {
  if (!insight) return null;
  return (
    <div className="card-lvl1 p-4 space-y-2 hover:shadow-md transition-all">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accentColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#727785]">{insight.label}</p>
      </div>
      <h4 className="text-sm font-bold text-[#131b2e] truncate">{insight.title}</h4>
      <p className="text-xs text-[#505f76]">{insight.locality}</p>
      <div className="flex items-center gap-3 text-xs text-[#505f76]">
        {insight.investment_score != null && <span>Score: <strong className="text-[#131b2e]">{insight.investment_score}</strong></span>}
        {insight.appreciation_1yr != null && <span>Appr: <strong className="text-[#131b2e]">{Number(insight.appreciation_1yr).toFixed(1)}%</strong></span>}
        {insight.view_count > 0 && <span>Views: <strong className="text-[#131b2e]">{insight.view_count}</strong></span>}
      </div>
    </div>
  );
}

/* ─── Custom Recharts Tooltip ─────────────────────────────────────────────── */
const ChartTooltipStyle = { backgroundColor: '#ffffff', borderRadius: '8px', borderColor: '#e2e7ff', fontSize: '12px' };

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perfTab, setPerfTab] = useState('top');
  const itemsPerPage = 5;

  // Buyer Meeting Requests Management State
  const [sellerRequests, setSellerRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySending, setReplySending] = useState(false);

  // Time Reschedule Modal State
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('11:00 AM');

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await propertyApi.getRequests();
      if (res.data) {
        setSellerRequests(res.data);
      }
    } catch (err) {
      console.warn('Could not load meeting requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId, action, payload = {}) => {
    try {
      const res = await propertyApi.manageRequestAction(requestId, action, payload);
      showSuccess(res.message || 'Meeting request updated.');
      fetchRequests();
      if (activeRequest && activeRequest.id === requestId) {
        setActiveRequest(res.data);
      }
      setRescheduleModal(null);
    } catch (err) {
      showError('Failed to update meeting request.');
    }
  };

  const handleSendReply = async () => {
    if (!activeRequest || !replyMessage.trim()) return;
    setReplySending(true);
    try {
      const res = await propertyApi.replyToRequest(activeRequest.id, replyMessage.trim());
      showSuccess('Reply sent to buyer!');
      fetchRequests();
      setActiveRequest(res.data);
      setReplyMessage('');
    } catch (err) {
      showError('Failed to send reply.');
    } finally {
      setReplySending(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await propertyApi.getAnalytics();
      if (!response?.success || !response?.data) {
        throw new Error(response?.message || 'Unable to load portfolio analytics.');
      }
      setData(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  /* ── Performance tab data ───────────────────────────────────────────────── */
  const performanceProperties = useMemo(() => {
    if (!data) return [];
    switch (perfTab) {
      case 'top': return data.top_performing_properties || [];
      case 'lowest': return data.lowest_performing_properties || [];
      case 'recent_added': return data.recently_added_properties || [];
      case 'recent_updated': return data.recently_updated_properties || [];
      default: return [];
    }
  }, [data, perfTab]);

  /* ── Recent enquiries ───────────────────────────────────────────────────── */
  const recentEnquiriesList = useMemo(() => data?.recent_inquiries || [], [data]);

  const filteredEnquiries = useMemo(() => {
    if (!searchTerm.trim()) return recentEnquiriesList;
    const term = searchTerm.toLowerCase();
    return recentEnquiriesList.filter(
      (e) =>
        (e.name || '').toLowerCase().includes(term) ||
        (e.contact || '').toLowerCase().includes(term) ||
        (e.property || '').toLowerCase().includes(term) ||
        (e.locality || '').toLowerCase().includes(term)
    );
  }, [recentEnquiriesList, searchTerm]);

  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage) || 1;
  const paginatedEnquiries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEnquiries.slice(start, start + itemsPerPage);
  }, [filteredEnquiries, currentPage, itemsPerPage]);

  /* ── Portfolio ──────────────────────────────────────────────────────────── */
  const portfolio = useMemo(() => data?.portfolio || {}, [data]);

  return (
    <ContentContainer>
      <PageHeader
        title="Seller Analytics & Market Intelligence"
        description="Comprehensive real-time analysis of portfolio performance, buyer engagement, and demand signals."
      />

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6] p-4 text-sm text-[#93000a]">
          <span>{error}</span>
          <button
            onClick={fetchAnalytics}
            className="rounded-lg bg-[#ba1a1a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#93000a] transition"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-96 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[#0058be]" />
        </div>
      ) : data ? (
        <div className="space-y-8 animate-fadeIn">

          {/* ── SECTION 1: DASHBOARD OVERVIEW CARDS ──────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={Building2} label="Total Properties" value={data.total_properties || 0} detail="All portfolio listings" tone="bg-[#d8e2ff] text-[#0058be]" />
            <StatCard icon={Tag} label="Active Listings" value={data.active_listings || 0} detail="Currently live" tone="bg-emerald-100 text-emerald-700" />
            <StatCard icon={Eye} label="Total Views" value={(data.total_views || 0).toLocaleString('en-IN')} detail="All property page visits" tone="bg-amber-100 text-amber-700" />
            <StatCard icon={MessageSquare} label="Buyer Enquiries" value={(data.total_inquiries || 0).toLocaleString('en-IN')} detail="Visit & quote requests" tone="bg-[#f5fff6] text-[#006947]" />
            <StatCard icon={Sparkles} label="Avg AI Suggested Price" value={formatPrice(data.avg_predicted_price)} detail="AI fair market value" tone="bg-violet-100 text-violet-700" />
            <StatCard icon={Target} label="Avg Investment Score" value={data.avg_investment_score ? `${data.avg_investment_score}/100` : '—'} detail="AI investment rating" tone="bg-blue-100 text-blue-700" />
            <StatCard icon={TrendingUp} label="Avg Appreciation" value={data.avg_appreciation ? `${data.avg_appreciation}%` : '—'} detail="Expected annual growth" tone="bg-teal-100 text-teal-700" />
            <StatCard icon={Wallet} label="Portfolio Value" value={formatPrice(portfolio.current_value)} detail="Sum of AI suggested prices" tone="bg-indigo-100 text-indigo-700" />
            <StatCard icon={ArrowUpRight} label="Portfolio (3 Years)" value={formatPrice(portfolio.value_3yr)} detail={portfolio.growth_3yr_pct ? `+${portfolio.growth_3yr_pct}% growth` : ''} tone="bg-cyan-100 text-cyan-700" />
            <StatCard icon={ArrowUpRight} label="Portfolio (5 Years)" value={formatPrice(portfolio.value_5yr)} detail={portfolio.growth_5yr_pct ? `+${portfolio.growth_5yr_pct}% growth` : ''} tone="bg-sky-100 text-sky-700" />
          </div>

          {/* ── SECTION 2: PORTFOLIO ANALYSIS ────────────────────────────────── */}
          <div className="card-lvl1 p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">Portfolio Analysis</h3>
              <p className="text-xs text-[#727785]">Estimated growth and future portfolio value</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl bg-gradient-to-br from-[#0058be] to-[#2170e4] p-4 text-white">
                <p className="text-xs font-medium opacity-80">Current Value</p>
                <p className="mt-1 text-xl font-extrabold">{formatPrice(portfolio.current_value)}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white">
                <p className="text-xs font-medium opacity-80">3-Year Value</p>
                <p className="mt-1 text-xl font-extrabold">{formatPrice(portfolio.value_3yr)}</p>
                <p className="text-xs opacity-80 mt-0.5">+{portfolio.growth_3yr_pct || 0}% growth · Profit: {formatPrice(portfolio.profit_3yr)}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white">
                <p className="text-xs font-medium opacity-80">5-Year Value</p>
                <p className="mt-1 text-xl font-extrabold">{formatPrice(portfolio.value_5yr)}</p>
                <p className="text-xs opacity-80 mt-0.5">+{portfolio.growth_5yr_pct || 0}% growth · Profit: {formatPrice(portfolio.profit_5yr)}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white">
                <p className="text-xs font-medium opacity-80">Expected 5-Year Profit</p>
                <p className="mt-1 text-xl font-extrabold">{formatPrice(portfolio.profit_5yr)}</p>
                <p className="text-xs opacity-80 mt-0.5">Growth: +{portfolio.growth_5yr_pct || 0}%</p>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: PROPERTY PERFORMANCE ──────────────────────────────── */}
          <div className="card-lvl1 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#131b2e]">Property Performance</h3>
                <p className="text-xs text-[#727785]">Rankings by AI Score, Views, Enquiries & Appreciation</p>
              </div>
              <div className="flex gap-1 p-0.5 bg-[#f2f3ff] rounded-xl">
                {[
                  { key: 'top', label: 'Top' },
                  { key: 'lowest', label: 'Lowest' },
                  { key: 'recent_added', label: 'New' },
                  { key: 'recent_updated', label: 'Updated' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setPerfTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      perfTab === tab.key ? 'bg-[#0058be] text-white shadow-sm' : 'text-[#505f76] hover:bg-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              {performanceProperties.length > 0 ? (
                performanceProperties.map((prop, idx) => (
                  <PropertyRankRow key={prop.id || idx} property={prop} rank={idx + 1} />
                ))
              ) : (
                <p className="text-sm text-center text-[#727785] py-8">No properties to display.</p>
              )}
            </div>
          </div>

          {/* ── SECTION 4: PROPERTY DISTRIBUTION CHARTS ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property Type Distribution */}
            {(data.type_distribution?.length > 0) && (
              <div className="card-lvl1 p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#131b2e]">Property Type Distribution</h3>
                  <p className="text-xs text-[#727785]">Breakdown by property type</p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.type_distribution} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, count }) => `${type}: ${count}`}>
                        {data.type_distribution.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={ChartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* BHK Distribution */}
            {(data.bhk_distribution?.length > 0) && (
              <div className="card-lvl1 p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#131b2e]">Properties by BHK</h3>
                  <p className="text-xs text-[#727785]">Configuration distribution</p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.bhk_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="bhk" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#727785' }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#727785' }} />
                      <Tooltip cursor={{ fill: 'rgba(218, 226, 253, 0.4)' }} contentStyle={ChartTooltipStyle} />
                      <Bar dataKey="count" name="Properties" radius={[6, 6, 0, 0]} fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Locality Distribution */}
            {(data.locality_distribution?.length > 0) && (
              <div className="card-lvl1 p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#131b2e]">Properties by Locality</h3>
                  <p className="text-xs text-[#727785]">Top locations in your portfolio</p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.locality_distribution} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#727785' }} />
                      <YAxis type="category" dataKey="locality" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#727785' }} width={90} />
                      <Tooltip cursor={{ fill: 'rgba(218, 226, 253, 0.4)' }} contentStyle={ChartTooltipStyle} />
                      <Bar dataKey="count" name="Properties" radius={[0, 6, 6, 0]} fill="#2170e4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Investment Rating Distribution */}
            {(data.rating_distribution?.length > 0) && (
              <div className="card-lvl1 p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#131b2e]">Investment Rating</h3>
                  <p className="text-xs text-[#727785]">AI investment rating breakdown</p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.rating_distribution} dataKey="count" nameKey="rating" cx="50%" cy="50%" outerRadius={80} label={({ rating, count }) => `${rating}: ${count}`}>
                        {data.rating_distribution.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={ChartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Appreciation Category Distribution */}
            {(data.appreciation_distribution?.length > 0) && (
              <div className="card-lvl1 p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#131b2e]">Appreciation Categories</h3>
                  <p className="text-xs text-[#727785]">Expected annual growth tiers</p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.appreciation_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#727785' }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#727785' }} />
                      <Tooltip cursor={{ fill: 'rgba(218, 226, 253, 0.4)' }} contentStyle={ChartTooltipStyle} />
                      <Bar dataKey="count" name="Properties" radius={[6, 6, 0, 0]} fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 5: AI INSIGHTS ────────────────────────────────────────── */}
          {data.ai_insights && Object.values(data.ai_insights).some(v => v && (!Array.isArray(v) || v.length > 0)) && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#131b2e]">AI Insights</h3>
                <p className="text-xs text-[#727785]">Data-driven analysis from your portfolio</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InsightCard insight={data.ai_insights.highest_appreciating} icon={TrendingUp} accentColor="bg-emerald-100 text-emerald-700" />
                <InsightCard insight={data.ai_insights.best_investment} icon={Trophy} accentColor="bg-amber-100 text-amber-700" />
                <InsightCard insight={data.ai_insights.lowest_performing} icon={AlertTriangle} accentColor="bg-rose-100 text-rose-700" />
                <InsightCard insight={data.ai_insights.most_viewed} icon={Eye} accentColor="bg-blue-100 text-blue-700" />
                <InsightCard insight={data.ai_insights.highest_buyer_interest} icon={MessageSquare} accentColor="bg-violet-100 text-violet-700" />
                {(data.ai_insights.needing_improvement || []).filter(Boolean).map((item, idx) => (
                  <InsightCard key={idx} insight={item} icon={Star} accentColor="bg-orange-100 text-orange-700" />
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION 6: BUYER MEETING REQUESTS MANAGEMENT ───────────────────── */}
          <div className="card-lvl1 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#131b2e]">Buyer Scheduled Meeting Requests</h3>
                  {sellerRequests.filter((r) => r.status === 'pending' || r.status === 'New').length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs">
                      {sellerRequests.filter((r) => r.status === 'pending' || r.status === 'New').length} Pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#727785]">Review, confirm, reschedule, or manage buyer meeting requests for your properties</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchRequests}
                  className="px-3 py-1.5 rounded-xl border border-[#c2c6d6] bg-[#f2f3ff] hover:bg-[#d8e2ff] text-[#0058be] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${requestsLoading ? 'animate-spin' : ''}`} />
                  Refresh Meetings
                </button>
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#727785]" />
                  <input
                    type="text"
                    placeholder="Search buyers or properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#c2c6d6] bg-[#f2f3ff] text-xs font-medium text-[#131b2e] focus:bg-white focus:border-[#0058be] outline-none transition"
                  />
                </div>
              </div>
            </div>

            {requestsLoading ? (
              <div className="py-12 text-center text-xs text-[#727785] animate-pulse">Loading buyer meeting requests...</div>
            ) : sellerRequests.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#727785] border border-dashed border-[#c2c6d6] rounded-2xl">
                No meeting requests received from buyers yet.
              </div>
            ) : (
              <div className="space-y-4">
                {sellerRequests
                  .filter((req) => {
                    if (!searchTerm.trim()) return true;
                    const t = searchTerm.toLowerCase();
                    return (
                      (req.buyer_name || '').toLowerCase().includes(t) ||
                      (req.property_title || '').toLowerCase().includes(t) ||
                      (req.buyer_phone || '').toLowerCase().includes(t) ||
                      (req.buyer_email || '').toLowerCase().includes(t)
                    );
                  })
                  .map((req) => {
                    const isConfirmed = req.status === 'confirmed';
                    const isRejected = req.status === 'rejected';

                    return (
                      <div
                        key={req.id}
                        className="p-5 rounded-2xl border border-[#e2e7ff] bg-white hover:border-[#adc6ff] transition-all space-y-3 shadow-xs"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className="p-3 rounded-2xl bg-[#d8e2ff] text-[#0058be] shrink-0 mt-0.5">
                              <Calendar className="w-5 h-5" />
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#0058be] text-white">
                                  Meeting Request
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                                  isConfirmed ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : isRejected ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {req.status}
                                </span>
                              </div>

                              <h4 className="font-extrabold text-base text-[#131b2e] truncate">
                                {req.property_title}
                              </h4>

                              {/* Buyer Profile & Contact (Unlocked upon accept) */}
                              <div className="flex items-center flex-wrap gap-4 text-xs font-semibold text-[#505f76] pt-1">
                                <span className="flex items-center space-x-1.5 font-bold text-[#131b2e]">
                                  <User className="w-4 h-4 text-[#0058be]" />
                                  <span>Buyer: {req.buyer_name}</span>
                                </span>

                                {req.contact_unlocked ? (
                                  <>
                                    <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>{req.buyer_phone}</span>
                                    </span>
                                    <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>{req.buyer_email}</span>
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[11px] text-[#727785] italic flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#727785]" />
                                    Contact info unlocks when meeting is accepted
                                  </span>
                                )}
                              </div>

                              {/* Time Slot */}
                              <p className="text-xs font-bold text-[#0058be] flex items-center gap-1.5 pt-1">
                                <Clock className="w-4 h-4 text-[#0058be]" />
                                <span>Requested Slot: <strong>{req.preferred_date} at {req.preferred_time}</strong></span>
                              </p>

                              {/* Notes & Reply previews */}
                              {req.notes && (
                                <p className="text-xs text-[#424754] bg-[#f2f3ff] p-2.5 rounded-xl border border-[#e2e7ff] italic mt-1">
                                  "{req.notes}"
                                </p>
                              )}
                              {req.seller_reply && (
                                <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-medium">
                                  💬 Seller Reply: "{req.seller_reply}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Control Buttons */}
                          <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                            {!isConfirmed && (
                              <button
                                onClick={() => handleAction(req.id, 'accept')}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Accept Meeting</span>
                              </button>
                            )}

                            {!isRejected && (
                              <button
                                onClick={() => handleAction(req.id, 'reject')}
                                className="px-3.5 py-2 rounded-xl bg-[#f2f3ff] hover:bg-rose-50 text-[#505f76] hover:text-rose-600 font-bold text-xs border border-[#c2c6d6] transition cursor-pointer flex items-center space-x-1.5"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setRescheduleModal(req);
                                setSuggestedDate(req.preferred_date || '');
                                setSuggestedTime(req.preferred_time || '11:00 AM');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer flex items-center space-x-1.5"
                            >
                              <Clock className="w-4 h-4 text-indigo-600" />
                              <span>Suggest New Time</span>
                            </button>

                            <button
                              onClick={() => setActiveRequest(req)}
                              className="px-3.5 py-2 rounded-xl bg-[#0058be] hover:bg-[#004396] text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Thread / Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Suggest Time Modal */}
          {rescheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl border border-[#e2e7ff] shadow-2xl w-full max-w-md p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-extrabold text-[#131b2e]">Suggest Alternate Meeting Time</h3>
                  <p className="text-xs text-[#727785] mt-0.5">
                    Propose a new date & time slot to buyer for meeting regarding {rescheduleModal.property_title}.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-bold text-[#131b2e]">
                  <div>
                    <label className="block mb-1.5 text-[#505f76]">New Date</label>
                    <input
                      type="date"
                      value={suggestedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSuggestedDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c2c6d6] bg-[#f2f3ff]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-[#505f76]">New Time Slot</label>
                    <select
                      value={suggestedTime}
                      onChange={(e) => setSuggestedTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c2c6d6] bg-[#f2f3ff]"
                    >
                      <option value="11:00 AM">11:00 AM - Morning</option>
                      <option value="02:00 PM">02:00 PM - Afternoon</option>
                      <option value="05:00 PM">05:00 PM - Evening</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setRescheduleModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-[#c2c6d6] text-xs font-bold text-[#505f76] hover:bg-[#f2f3ff]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction(rescheduleModal.id, 'suggest_time', { suggested_date: suggestedDate, suggested_time: suggestedTime })}
                    className="px-4 py-2.5 rounded-xl bg-[#0058be] hover:bg-[#004396] text-white text-xs font-bold shadow-md"
                  >
                    Send Time Suggestion
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Seller Conversation Modal */}
          {activeRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl border border-[#e2e7ff] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-[#f2f3ff] flex items-center justify-between bg-[#f2f3ff]/50">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#0058be]">
                      Buyer Scheduled Meeting
                    </span>
                    <h3 className="text-lg font-black text-[#131b2e] mt-0.5">{activeRequest.property_title}</h3>
                    <p className="text-xs text-[#727785]">Buyer: {activeRequest.buyer_name}</p>
                  </div>
                  <button onClick={() => setActiveRequest(null)} className="p-2 rounded-full bg-[#f2f3ff] hover:bg-[#d8e2ff] text-[#505f76]">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Unlocked Contact Details */}
                <div className="p-4 bg-[#d8e2ff]/60 border-b border-[#adc6ff] flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className={`w-4 h-4 ${activeRequest.contact_unlocked ? 'text-emerald-600' : 'text-[#727785]'}`} />
                    <span className="font-bold text-[#131b2e]">Buyer Contact Info:</span>
                  </div>
                  {activeRequest.contact_unlocked ? (
                    <div className="flex items-center space-x-3 font-semibold text-[#131b2e]">
                      <span className="flex items-center space-x-1"><Phone className="w-3.5 h-3.5 text-[#0058be]" /><span>{activeRequest.buyer_phone}</span></span>
                      <span className="flex items-center space-x-1"><Mail className="w-3.5 h-3.5 text-[#0058be]" /><span>{activeRequest.buyer_email}</span></span>
                    </div>
                  ) : (
                    <span className="text-[#727785] italic">Unlocks upon accepting the meeting request.</span>
                  )}
                </div>

                {/* Thread */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#f2f3ff]/30">
                  {activeRequest.notes && (
                    <div className="p-3 bg-[#d8e2ff]/70 border border-[#adc6ff] rounded-xl text-xs space-y-1">
                      <span className="font-bold text-[#0058be]">Buyer Meeting Notes:</span>
                      <p className="text-[#131b2e] whitespace-pre-wrap">{activeRequest.notes}</p>
                    </div>
                  )}

                  {activeRequest.messages && activeRequest.messages.length > 0 ? (
                    activeRequest.messages.map((m, idx) => (
                      <div key={idx} className={`flex flex-col ${m.sender_role === 'seller' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs shadow-xs ${m.sender_role === 'seller' ? 'bg-[#0058be] text-white rounded-br-none' : 'bg-white border border-[#e2e7ff] text-[#131b2e] rounded-bl-none'}`}>
                          <p className="font-bold text-[10px] opacity-80 mb-0.5">{m.sender_name} ({m.sender_role})</p>
                          <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                        </div>
                      </div>
                    ))
                  ) : activeRequest.seller_reply ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-emerald-900">Your Reply:</span>
                      <p className="text-emerald-800">{activeRequest.seller_reply}</p>
                    </div>
                  ) : null}
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t border-[#f2f3ff] bg-white flex items-center space-x-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type reply to buyer..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#c2c6d6] bg-[#f2f3ff] text-xs font-medium text-[#131b2e] focus:outline-none focus:border-[#0058be]"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={replySending || !replyMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#0058be] hover:bg-[#004396] text-white font-bold text-xs transition disabled:opacity-50 flex items-center space-x-1"
                  >
                    {replySending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </ContentContainer>
  );
}
