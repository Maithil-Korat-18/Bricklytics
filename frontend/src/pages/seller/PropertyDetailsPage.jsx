import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, Edit, Eye, MapPin, MessageSquare, RefreshCw } from 'lucide-react';
import ContentContainer from '../../components/common/ContentContainer';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import Badge from '../../components/common/Badge';
import { useToast } from '../../components/common/ToastContext';
import { ROUTES, getEditPropertyPath } from '../../constants/routes';
import { propertyApi } from '../../services/propertyApi';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const displayValue = (value) => value || '—';

function Metric({ icon: Icon, label, value, tone }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-3 inline-flex rounded-xl p-2 ${tone}`}><Icon className="h-5 w-5" /></div><p className="text-2xl font-bold text-slate-900">{value || 0}</p><p className="mt-1 text-xs font-medium text-slate-500">{label}</p></div>;
}

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);

  const loadProperty = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await propertyApi.getPropertyById(id);
      if (!response?.success || !response?.data) throw new Error(response?.message || 'Unable to load property details.');
      setProperty(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load property details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProperty(); }, [loadProperty]);

  const markAsSold = async () => {
    if (!property) return;
    setMarkingSold(true);
    try {
      const response = await propertyApi.updatePropertyStatus(property.id, 'sold');
      if (!response?.success) throw new Error(response?.message || 'Unable to update property status.');
      setProperty((current) => ({ ...current, status: 'sold' }));
      setSoldModalOpen(false);
      showSuccess(`"${property.title}" is now marked as sold and hidden from buyers.`);
    } catch (requestError) {
      showError(requestError.response?.data?.message || requestError.message || 'Unable to update property status.');
    } finally {
      setMarkingSold(false);
    }
  };

  if (loading) return <ContentContainer><div className="flex min-h-96 items-center justify-center"><RefreshCw className="h-7 w-7 animate-spin text-blue-600" /></div></ContentContainer>;
  if (error || !property) return <ContentContainer><div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><Building2 className="mx-auto h-10 w-10 text-slate-300" /><h1 className="mt-4 text-lg font-bold text-slate-900">Property unavailable</h1><p className="mt-2 text-sm text-slate-500">{error || 'This property could not be found.'}</p><button onClick={() => navigate(ROUTES.MANAGE_PROPERTIES)} className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Back to properties</button></div></ContentContainer>;

  const coverImage = property.images?.find((image) => image.is_cover)?.url || property.images?.[0]?.url;
  const performance = property.performance || {};
  const details = [
    ['Type', property.property_type], ['Price', formatPrice(property.price)], ['Area', property.area_sqft ? `${Number(property.area_sqft).toLocaleString('en-IN')} sq ft` : null], ['BHK', property.bhk ? `${property.bhk} BHK` : null],
    ['Bedrooms', property.bedrooms], ['Bathrooms', property.bathrooms], ['Furnishing', property.furnishing], ['Possession', property.possession_status], ['Parking', property.parking], ['Facing', property.facing],
  ];

  return <ContentContainer>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><Link to={ROUTES.MANAGE_PROPERTIES} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-blue-600"><ArrowLeft className="h-4 w-4" />Manage properties</Link><div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold text-slate-900">{property.title}</h1><Badge status={property.status} /></div><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" />{[property.address, property.locality, property.city, property.state].filter(Boolean).join(', ')}</p></div>
      <div className="flex gap-2"><Link to={getEditPropertyPath(property.id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Edit className="h-4 w-4" />Edit</Link>{property.status !== 'sold' && <button onClick={() => setSoldModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" />Mark as Sold</button>}</div>
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 lg:col-span-2">{coverImage ? <img src={coverImage} alt={property.title} className="h-[360px] w-full object-cover" /> : <div className="flex h-[360px] items-center justify-center text-slate-400"><Building2 className="h-16 w-16" /></div>}</div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Property summary</p><p className="mt-3 text-3xl font-extrabold text-blue-600">{formatPrice(property.price)}</p><p className="mt-1 capitalize text-sm text-slate-500">{property.property_type}</p><p className="mt-5 border-t border-slate-100 pt-5 text-sm leading-relaxed text-slate-600">{property.description || 'No property description has been provided.'}</p></div>
    </div>

    <section className="mt-8"><h2 className="mb-4 text-lg font-bold text-slate-900">Performance</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Metric icon={Eye} label="Buyer views" value={performance.views} tone="bg-blue-50 text-blue-600" /><Metric icon={MessageSquare} label="Inquiries" value={performance.inquiries} tone="bg-amber-50 text-amber-600" /><Metric icon={CalendarDays} label="Open visit requests" value={performance.scheduled_visits} tone="bg-emerald-50 text-emerald-600" /></div></section>

    <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"><h2 className="text-lg font-bold text-slate-900">Property details</h2><div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-3 text-sm"><span className="text-slate-500">{label}</span><span className="text-right font-semibold capitalize text-slate-800">{displayValue(value)}</span></div>)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Amenities</h2>{property.amenities?.length ? <div className="mt-4 flex flex-wrap gap-2">{property.amenities.map((amenity) => <span key={`${amenity.category}-${amenity.name}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{amenity.name}</span>)}</div> : <p className="mt-4 text-sm text-slate-500">No amenities listed.</p>}</div></section>

    <ConfirmationModal isOpen={soldModalOpen} title="Mark property as sold?" message={`This will mark "${property.title}" as sold and remove it from all buyer-facing pages.`} confirmText="Mark as Sold" confirmVariant="primary" loading={markingSold} onConfirm={markAsSold} onClose={() => !markingSold && setSoldModalOpen(false)} />
  </ContentContainer>;
}
