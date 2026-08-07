import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  CalendarDays, 
  CheckCircle2, 
  Edit, 
  Eye, 
  MapPin, 
  MessageSquare, 
  RefreshCw,
  Sparkles,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Compass,
  Layers,
  Award
} from 'lucide-react';
import ContentContainer from '../../components/common/ContentContainer';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import Badge from '../../components/common/Badge';
import { useToast } from '../../components/common/ToastContext';
import { ROUTES, getEditPropertyPath, getPropertyDetailsPath } from '../../constants/routes';
import { propertyApi } from '../../services/propertyApi';
import { getPropertyMediaUrl } from '../../utils/propertyMedia';

// Converts a raw numeric price into Indian Cr / Lakh notation.
const formatPrice = (value) => {
  const num = Number(value || 0);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

const displayValue = (value) => value || '—';

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{value || 0}</p>
        </div>
        <div className={`rounded-xl p-3 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
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
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const loadProperty = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await propertyApi.getPropertyById(id);
      if (!response?.success || !response?.data) {
        throw new Error(response?.message || 'Unable to load property details.');
      }
      setProperty(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load property details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

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

  if (loading) {
    return (
      <ContentContainer>
        <div className="flex min-h-96 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </ContentContainer>
    );
  }

  if (error || !property) {
    return (
      <ContentContainer>
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card-soft">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Property Unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'This property could not be found.'}</p>
          <button
            onClick={() => navigate(ROUTES.MANAGE_PROPERTIES)}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer"
          >
            Back to Properties
          </button>
        </div>
      </ContentContainer>
    );
  }

  const imagesList = property?.images || [];
  const coverImage = property?.images?.find((image) => image.is_cover)?.url || property?.images?.[0]?.url;
  const activeImage = imagesList[activeImageIdx]?.url || coverImage;
  const performance = property.performance || {};

  // AI valuation metrics
  const predictedPrice = property.predicted_price || property.fair_market_value;
  const investmentScore = property.investment_score || 82;
  const ratingText = property.investment_rating || (investmentScore >= 80 ? 'Strong Buy' : investmentScore >= 60 ? 'Moderate Buy' : 'Neutral');

  const details = [
    ['Property Type', property.property_type],
    ['Listing Type', property.listing_type || 'Sell'],
    ['Asking Price', formatPrice(property.price)],
    ['Rate per SqFt', property.rate_per_sqft ? `₹${Number(property.rate_per_sqft).toLocaleString('en-IN')}/sqft` : null],
    ['Super Area', property.area_sqft ? `${Number(property.area_sqft).toLocaleString('en-IN')} sq ft` : null],
    ['BHK Layout', property.bhk ? `${property.bhk} BHK` : null],
    ['Bedrooms', property.bedrooms],
    ['Bathrooms', property.bathrooms],
    ['Possession Status', property.possession_status],
    ['Parking Availability', property.parking],
    ['Facing Direction', property.facing],
    ['Project / Builder', property.project_name || property.builder_name],
  ];

  return (
    <ContentContainer>
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to={ROUTES.MANAGE_PROPERTIES}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wider mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Manage Properties
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{property.title}</h1>
              <Badge status={property.status} />
              {property.rera_number && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> RERA Approved
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
              <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
              {[property.address, property.locality, property.city, property.state].filter(Boolean).join(', ')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            

            <Link
              to={getEditPropertyPath(property.id)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 shadow-xs transition"
            >
              <Edit className="h-4 w-4 text-blue-600" />
              Edit Property
            </Link>

            {property.status !== 'sold' && (
              <button
                type="button"
                onClick={() => setSoldModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 cursor-pointer transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark as Sold
              </button>
            )}
          </div>
        </div>

        {/* Main Grid: Gallery & Valuation Card */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Image Viewer */}
          <div className="space-y-3 lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-card-soft">
              {activeImage ? (
                <img
                  src={getPropertyMediaUrl(activeImage)}
                  alt={property.title}
                  className="h-[380px] sm:h-[420px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[380px] items-center justify-center text-slate-500">
                  <Building2 className="h-16 w-16" />
                </div>
              )}
              {imagesList.length > 0 && (
                <span className="absolute bottom-4 right-4 rounded-xl bg-slate-900/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white border border-white/20">
                  Image {activeImageIdx + 1} of {imagesList.length}
                </span>
              )}
            </div>

            {/* Thumbnails strip */}
            {imagesList.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {imagesList.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activeImageIdx === idx
                        ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getPropertyMediaUrl(img.url)}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Pricing & AI Valuation Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card-soft space-y-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Asking Price</p>
              <p className="mt-1.5 text-3xl font-extrabold text-blue-600">{formatPrice(property.price)}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500 capitalize">{property.property_type} • {property.bhk ? `${property.bhk} BHK` : ''} • {property.locality || 'Ahmedabad'}</p>

              {/* AI Valuation Box */}
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-900 to-blue-950 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> AI Market Intelligence
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-400/30">
                    {ratingText}
                  </span>
                </div>

                {predictedPrice && (
                  <div>
                    <span className="text-[11px] text-slate-300">AI Suggested Fair Market Value</span>
                    <p className="text-xl font-black text-amber-300">{formatPrice(predictedPrice)}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="block text-[10px] text-slate-400 font-bold">1-YR APP.</span>
                    <span className="text-xs font-extrabold text-emerald-400">+{property.appreciation_1yr || '6.8'}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="block text-[10px] text-slate-400 font-bold">3-YR APP.</span>
                    <span className="text-xs font-extrabold text-emerald-400">+{property.appreciation_3yr || '21.4'}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="block text-[10px] text-slate-400 font-bold">SCORE</span>
                    <span className="text-xs font-extrabold text-amber-300">{investmentScore}/95</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Property Overview</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-4">
                {property.description || 'No detailed property description provided.'}
              </p>
            </div>
          </div>
        </div>

        {/* Seller Performance Grid */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Buyer Engagement & Analytics
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Metric icon={Eye} label="Buyer Page Views" value={performance.views || property.views_count || 0} tone="bg-blue-50 text-blue-600" />
            <Metric icon={MessageSquare} label="Buyer Inquiries Received" value={performance.inquiries || property.inquiries_count || 0} tone="bg-amber-50 text-amber-600" />
            <Metric icon={CalendarDays} label="Booked Site Visits" value={performance.scheduled_visits || 0} tone="bg-emerald-50 text-emerald-600" />
          </div>
        </section>

        {/* Specifications & Amenities */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Detailed Specs Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card-soft lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-900 mb-5">Property Specifications</h2>
            <div className="grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2.5 text-xs sm:text-sm">
                  <span className="font-semibold text-slate-500">{label}</span>
                  <span className="text-right font-extrabold capitalize text-slate-800">{displayValue(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities Box */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card-soft">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Amenities & Features</h2>
            {property.amenities?.length ? (
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, idx) => {
                  const name = typeof amenity === 'object' ? amenity.name : amenity;
                  return (
                    <span
                      key={`${idx}-${name}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200/60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      {name}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No specific amenities listed.</p>
            )}
          </div>
        </section>

        {/* Mark Sold Modal */}
        <ConfirmationModal
          isOpen={soldModalOpen}
          title="Mark Property as Sold?"
          message={`This will mark "${property.title}" as sold and hide it from buyer search results.`}
          confirmText="Mark as Sold"
          confirmVariant="primary"
          loading={markingSold}
          onConfirm={markAsSold}
          onClose={() => !markingSold && setSoldModalOpen(false)}
        />
      </div>
    </ContentContainer>
  );
}