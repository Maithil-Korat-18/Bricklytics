import React, { useEffect, useState } from 'react';
import { BarChart3, Building2, Eye, MessageSquare, RefreshCw, Tag } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ContentContainer from '../../components/common/ContentContainer';
import PageHeader from '../../components/common/PageHeader';
import { propertyApi } from '../../services/propertyApi';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

function Stat({ icon: Icon, label, value, tone, detail }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><div className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div></div></div>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true); setError('');
    try {
      const response = await propertyApi.getAnalytics();
      if (!response?.success || !response?.data) throw new Error(response?.message || 'Unable to load analytics.');
      setData(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load analytics.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAnalytics(); }, []);
  const statusData = Object.entries(data?.status_counts || {}).filter(([, value]) => value > 0).map(([name, value]) => ({ name, value }));
  const typeData = Object.entries(data?.property_type_counts || {}).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  const topProperties = data?.most_viewed_properties || [];

  return <ContentContainer>
    <PageHeader title="Portfolio Analytics" description="See how your property portfolio is performing with real buyer engagement and listing data." />
    {error && <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{error}</span><button onClick={fetchAnalytics} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">Retry</button></div>}
    {loading ? <div className="flex min-h-96 items-center justify-center"><RefreshCw className="h-7 w-7 animate-spin text-blue-600" /></div> : <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={Building2} label="Total properties" value={data?.total_properties || 0} detail="All portfolio listings" tone="bg-blue-50 text-blue-600" /><Stat icon={Tag} label="Average price" value={formatPrice(data?.average_price)} detail="Across all listings" tone="bg-violet-50 text-violet-600" /><Stat icon={Eye} label="Buyer views" value={(data?.total_views || 0).toLocaleString('en-IN')} detail="Recorded property views" tone="bg-amber-50 text-amber-600" /><Stat icon={MessageSquare} label="Inquiries" value={data?.total_inquiries || 0} detail="Buyer visit requests" tone="bg-emerald-50 text-emerald-600" /></div>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"><div className="mb-5"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><BarChart3 className="h-5 w-5 text-blue-600" />Listings by type</h2><p className="mt-1 text-xs text-slate-500">Breakdown of your current portfolio.</p></div><div className="h-72">{typeData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={typeData}><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} /><Bar dataKey="value" name="Listings" radius={[8, 8, 0, 0]} fill="#2563eb" /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No property data available.</div>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Listing status</h2><p className="mt-1 text-xs text-slate-500">Your portfolio by status.</p><div className="h-64">{statusData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>{statusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No status data available.</div>}</div><div className="flex flex-wrap gap-3">{statusData.map((entry, index) => <span key={entry.name} className="inline-flex items-center gap-1.5 text-xs capitalize text-slate-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{entry.name}: {entry.value}</span>)}</div></section></div>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5"><h2 className="text-lg font-bold text-slate-900">Top performing properties</h2><p className="mt-1 text-xs text-slate-500">Ranked by buyer views, then inquiries.</p></div>{topProperties.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><tr><th className="pb-3">Property</th><th className="pb-3">Type</th><th className="pb-3">Price</th><th className="pb-3 text-right">Views</th><th className="pb-3 text-right">Inquiries</th></tr></thead><tbody className="divide-y divide-slate-100">{topProperties.map((property) => <tr key={property.id}><td className="py-4 font-semibold text-slate-800">{property.title}</td><td className="py-4 capitalize text-slate-600">{property.property_type}</td><td className="py-4 text-slate-600">{formatPrice(property.price)}</td><td className="py-4 text-right font-semibold text-blue-600">{property.view_count || 0}</td><td className="py-4 text-right font-semibold text-emerald-600">{property.inquiry_count || 0}</td></tr>)}</tbody></table></div> : <p className="py-10 text-center text-sm text-slate-400">No properties available yet.</p>}</section>
    </>}
  </ContentContainer>;
}
