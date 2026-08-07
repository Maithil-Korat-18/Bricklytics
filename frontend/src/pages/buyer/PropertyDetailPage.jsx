import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Square, Heart, Share2, Download, Phone, Mail,
  Calendar, Building, ShieldCheck, Check, ChevronRight, UserCheck,
  TrendingUp, Target, Award, Star, ArrowUpRight, Sparkles, SlidersHorizontal,
  Home, Train, ShoppingBag, School, Hospital, Banknote, Wifi, ChevronUp,
  ChevronDown, X, AlertCircle, Trophy, Zap
} from 'lucide-react';
import ImageGallery from '../../components/buyer/ImageGallery';
import PropertyCard from '../../components/buyer/PropertyCard';
import { buyerApi } from '../../services/buyerApi';
import { propertyApi } from '../../services/propertyApi';
import { useToast } from '../../components/common/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';
import { useWishlist } from '../../contexts/WishlistContext';
import { getPropertyId, isComparePropertySelected, toggleComparePropertyId } from '../../utils/compareSelection';
import { normalizeAmenities } from '../../utils/amenityNormalizer';
import LocationAnalysisSection from '../../components/buyer/location/LocationAnalysisSection';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const formatCurrency = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  return `₹${val.toLocaleString('en-IN')}`;
};

function PriceStatusBadge({ price, aiPrice }) {
  if (!price || !aiPrice) return null;
  const diff = ((price - aiPrice) / aiPrice) * 100;
  if (diff < -5) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
        <TrendingUp className="w-3.5 h-3.5" /> Underpriced – Great Deal
      </span>
    );
  }
  if (diff > 10) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
        <ChevronUp className="w-3.5 h-3.5" /> Slightly Overpriced
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
      <Check className="w-3.5 h-3.5" /> Fairly Priced
    </span>
  );
}

function InvestmentRatingBadge({ rating }) {
  const config = {
    Excellent: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Trophy },
    Good: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Star },
    Moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Target },
    Cautious: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle },
  }[rating] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: Award };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} ${config.text} text-xs font-bold border ${config.border}`}>
      <Icon className="w-3.5 h-3.5" /> {rating || 'Good'} Investment
    </span>
  );
}

function ScoreRing({ score }) {
  const maxScore = 100;
  const val = Math.min(maxScore, Math.max(0, score || 0));
  const color = val >= 90 ? '#10b981' : val >= 80 ? '#3b82f6' : val >= 70 ? '#6366f1' : val >= 60 ? '#f59e0b' : '#ef4444';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (val / maxScore) * circ;
  return (
    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} strokeWidth="6" stroke="#e2e8f0" fill="none" />
        <circle
          cx="36" cy="36" r={r} strokeWidth="6"
          stroke={color} fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="text-center relative z-10">
        <span className="text-xl font-black text-slate-900 leading-none block">{val}</span>
        <span className="text-[9px] font-bold text-slate-400 block mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

async function generateBrochurePDF(property) {
  // Dynamically import jsPDF to avoid SSR issues
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;

  // ── Header gradient band ──────────────────────────────────────────────────
  doc.setFillColor(0, 88, 190);
  doc.rect(0, 0, W, 50, 'F');
  doc.setFillColor(0, 55, 120);
  doc.rect(0, 38, W, 12, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BRICKLYTICS', 15, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Real Estate Intelligence', 15, 24);

  // Property type tag
  doc.setFillColor(255, 255, 255, 0.15);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const tag = (property.property_type || 'APARTMENT').toUpperCase() + '  •  FOR SALE';
  doc.text(tag, W - 15, 14, { align: 'right' });

  // Property title
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const title = doc.splitTextToSize(property.title || 'Property Listing', W - 30);
  doc.text(title, 15, 34);

  // ── Pricing strip ─────────────────────────────────────────────────────────
  doc.setFillColor(245, 247, 255);
  doc.rect(0, 50, W, 30, 'F');
  doc.setDrawColor(220, 225, 255);
  doc.line(0, 50, W, 50);
  doc.line(0, 80, W, 80);

  const askingPrice = formatCurrency(property.price);
  const aiPrice = formatCurrency(property.predicted_price || property.ai_fair_price || property.price);

  doc.setTextColor(30, 40, 70);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('ASKING PRICE', 15, 60);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 88, 190);
  doc.text(askingPrice, 15, 72);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 40, 70);
  doc.text('AI ESTIMATED VALUE', W / 2, 60);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(aiPrice, W / 2, 72);

  const investScore = property.investment_score ?? '—';
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 40, 70);
  doc.text('AI INVESTMENT SCORE', W - 15, 60, { align: 'right' });
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 88, 190);
  doc.text(`${investScore}/100`, W - 15, 72, { align: 'right' });

  // ── Location ──────────────────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 80, W, 12, 'F');
  doc.setTextColor(80, 95, 120);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`📍  ${property.address || ''}, ${property.locality || ''}, ${property.city || 'Ahmedabad'}, Gujarat`, 15, 88);

  // ── Key specs grid ────────────────────────────────────────────────────────
  doc.setFillColor(250, 251, 255);
  doc.rect(0, 94, W, 38, 'F');
  doc.setDrawColor(220, 225, 240);
  doc.rect(0, 94, W, 38);

  const specs = [
    ['BHK', `${property.bhk || 2} BHK`],
    ['Bedrooms', property.bedrooms || property.bhk || 2],
    ['Bathrooms', property.bathrooms || 2],
    ['Area', `${(property.area_sqft || 0).toLocaleString('en-IN')} sqft`],
    ['Rate/sqft', `₹${(property.rate_per_sqft || 0).toLocaleString('en-IN')}`],
    ['Furnishing', property.furnishing || 'Semi-Furnished'],
    ['Parking', property.parking || 'Yes'],
    ['Possession', property.possession_status || 'Ready'],
  ];

  const colW = W / 4;
  specs.forEach(([label, value], i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 15 + col * colW;
    const y = 106 + row * 16;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 130, 150);
    doc.text(label.toUpperCase(), x, y - 4);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 35, 60);
    doc.text(String(value), x, y + 2);
  });

  // ── Investment Analysis ───────────────────────────────────────────────────
  let y = 140;
  doc.setFillColor(0, 88, 190);
  doc.rect(0, y, W, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('  INVESTMENT ANALYSIS', 15, y + 5.5);
  y += 14;

  // Investment rating box
  const rating = property.investment_rating || 'Good';
  const appr1 = (property.appreciation_1yr || 0).toFixed(1);
  const appr3 = (property.appreciation_3yr || 0).toFixed(1);
  const appr5 = (property.appreciation_5yr || 0).toFixed(1);
  const future3 = formatCurrency(property.future_price_3yr);
  const future5 = formatCurrency(property.future_price_5yr);

  doc.setFillColor(240, 248, 255);
  doc.roundedRect(12, y, W - 24, 48, 3, 3, 'F');
  doc.setDrawColor(200, 220, 255);
  doc.roundedRect(12, y, W - 24, 48, 3, 3, 'D');

  doc.setTextColor(0, 88, 190);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${rating} Investment Opportunity`, 20, y + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 65, 90);
  const explanation = doc.splitTextToSize(
    property.investment_explanation || `This property has an AI Investment Score of ${investScore}/100 based on price valuation, appreciation potential, connectivity, and locality quality.`,
    W - 45
  );
  doc.text(explanation, 20, y + 18);

  // Appreciation table
  const tableY = y + 30;
  const cols = [
    ['1-Year Return', `+${appr1}%`],
    ['3-Year Return', `+${appr3}%`],
    ['5-Year Return', `+${appr5}%`],
    ['Price in 3 Yrs', future3],
    ['Price in 5 Yrs', future5],
  ];
  cols.forEach(([lbl, val], i) => {
    const x = 20 + i * 38;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 130, 150);
    doc.text(lbl, x, tableY);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 130, 80);
    doc.text(val, x, tableY + 6);
  });

  y += 60;

  // ── Amenities ─────────────────────────────────────────────────────────────
  if (property.amenities && property.amenities.length > 0) {
    doc.setFillColor(0, 88, 190);
    doc.rect(0, y, W, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('  AMENITIES & FEATURES', 15, y + 5.5);
    y += 14;

    const amenityNames = normalizeAmenities(property.amenities);
    const cols4 = 4;
    const aCols = Math.ceil(amenityNames.length / cols4);
    amenityNames.forEach((name, i) => {
      const col = i % cols4;
      const row = Math.floor(i / cols4);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 55, 80);
      doc.text(`✓  ${name}`, 15 + col * 48, y + row * 7);
    });
    y += Math.ceil(amenityNames.length / cols4) * 7 + 10;
  }

  // ── Builder info ──────────────────────────────────────────────────────────
  if (property.builder_name || property.rera_number) {
    doc.setFillColor(0, 88, 190);
    doc.rect(0, y, W, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('  BUILDER & LEGAL DETAILS', 15, y + 5.5);
    y += 14;

    const builderDetails = [
      ['Builder', property.builder_name || '—'],
      ['Project', property.project_name || '—'],
      ['RERA No.', property.rera_number || '—'],
      ['Possession', property.possession_status || 'Ready'],
    ];
    builderDetails.forEach(([lbl, val], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 15 + col * 95;
      const ly = y + row * 12;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 130, 150);
      doc.text(lbl.toUpperCase(), x, ly);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 35, 60);
      doc.text(val, x, ly + 6);
    });
    y += 30;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, H - 22, W, 22, 'F');
  doc.setTextColor(180, 190, 210);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('BRICKLYTICS – AI-Powered Real Estate Intelligence | www.bricklytics.com', W / 2, H - 14, { align: 'center' });
  doc.setTextColor(100, 120, 160);
  doc.setFontSize(7);
  doc.text(
    'This brochure is generated using AI market analysis. All figures are estimates and do not constitute financial advice.',
    W / 2, H - 8, { align: 'center' }
  );

  doc.save(`Bricklytics_${(property.title || 'Property').replace(/\s+/g, '_')}.pdf`);
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();

  const [property, setProperty] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [altLoading, setAltLoading] = useState(false);
  const [isCompared, setIsCompared] = useState(() => isComparePropertySelected(id));
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const { favoriteIds, loading: wishlistLoading, toggleFavorite } = useWishlist();

  useEffect(() => {
    async function loadPropertyDetails() {
      setLoading(true);
      try {
        const res = await buyerApi.getPropertyById(id);
        if (res.success && res.data) {
          setProperty(res.data);
        }
      } catch (err) {
        showError('Failed to load property details.');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadPropertyDetails();
  }, [id, showError]);

  // Fetch better alternatives after property loads
  useEffect(() => {
    if (!property) return;
    async function loadAlternatives() {
      setAltLoading(true);
      try {
        const res = await buyerApi.getBetterAlternatives(id, 3);
        if (res.success && res.data) {
          setAlternatives(res.data);
        }
      } catch {
        // Silently ignore – alternatives are optional
      } finally {
        setAltLoading(false);
      }
    }
    loadAlternatives();
  }, [id, property]);

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      showError('Please log in to save properties to your wishlist.');
      return;
    }
    try {
      const res = await toggleFavorite(id);
      showSuccess(res.message);
    } catch {
      showError('Failed to update wishlist.');
    }
  };

  const handleCompare = async () => {
    const pid = getPropertyId(property);
    if (!pid) {
      showError('Invalid property ID.');
      return;
    }

    const result = await toggleComparePropertyId(pid);
    if (result.limitReached) {
      showError('You can add a maximum of 12 properties to your compare list.');
    } else if (!result.invalid) {
      setIsCompared(result.isSelected);
      if (result.isSelected) {
        showSuccess(`Added "${property.title || 'Property'}" to compare list!`);
      } else {
        showSuccess(`Removed "${property.title || 'Property'}" from compare list.`);
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: property?.title || 'Bricklytics Property', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess('Property URL copied to clipboard!');
    }
  };

  const handleDownloadBrochure = async () => {
    if (!property) return;
    setGeneratingPDF(true);
    try {
      await generateBrochurePDF(property);
      showSuccess('Brochure downloaded successfully!');
    } catch (err) {
      showError('Failed to generate brochure. Please try again.');
      console.error('PDF generation error:', err);
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 animate-pulse space-y-6">
        <div className="h-96 bg-white rounded-2xl border border-slate-200" />
        <div className="h-48 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Property Not Found</h2>
        <Link to={ROUTES.PROPERTIES} className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">
          Back to Listings
        </Link>
      </div>
    );
  }

  const aiPrice = property.predicted_price ?? property.ai_fair_price ?? property.price;
  const appreciation1Yr = Number(property.appreciation_1yr || 0).toFixed(1);
  const appreciation3Yr = Number(property.appreciation_3yr || 0).toFixed(1);
  const appreciation5Yr = Number(property.appreciation_5yr || 0).toFixed(1);
  const future3Yr = property.future_price_3yr;
  const future5Yr = property.future_price_5yr;
  const isFavorite = wishlistLoading ? false : favoriteIds.has(String(id));
  const investmentScore = property.investment_score ?? null;

  const nearbyIcons = { school: School, hospital: Hospital, metro: Train, mall: ShoppingBag, bank: Banknote, transport: Train };
  const getNearbyIcon = (place) => {
    const p = place.toLowerCase();
    if (p.includes('school') || p.includes('college')) return School;
    if (p.includes('hospital') || p.includes('clinic')) return Hospital;
    if (p.includes('metro') || p.includes('rail')) return Train;
    if (p.includes('mall') || p.includes('market')) return ShoppingBag;
    if (p.includes('bank') || p.includes('atm')) return Banknote;
    return MapPin;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 mb-1">
            <span>{property.property_type?.toUpperCase()}</span>
            <span>•</span>
            <span>FOR SALE</span>
            <span>•</span>
            <span className="text-slate-500">{property.locality || 'South Bopal'}, {property.city}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {property.title}
          </h1>
          <p className="text-sm text-slate-500 flex items-center space-x-1.5 mt-1">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{property.address}, {property.city}, Gujarat</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-2">
          <button
            onClick={handleFavoriteClick}
            className={`p-3 rounded-xl border transition-all flex items-center space-x-2 text-sm font-semibold ${isFavorite ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
          </button>

          <button onClick={handleShare} className="p-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all text-sm font-semibold flex items-center space-x-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={handleCompare}
            className={`p-3 rounded-xl border transition-all text-sm font-semibold flex items-center space-x-2 ${isCompared ? 'border-tertiary bg-tertiary text-white hover:bg-tertiary/90' : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white'}`}
          >
            {isCompared ? <Check className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            <span className="hidden sm:inline">{isCompared ? 'Added to Compare' : 'Add to Compare'}</span>
          </button>

          <button
            onClick={() => navigate(`${ROUTES.SCHEDULE_VISIT}?propertyId=${property.id}`, { state: { propertyId: property.id, propertyTitle: property.title } })}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center space-x-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          <ImageGallery images={property.images} />

          {/* Quick Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-card-soft">
            <div>
              <div className="text-xs text-slate-400 font-semibold">Bedrooms</div>
              <div className="text-lg font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                <Bed className="w-4 h-4 text-blue-600" />
                <span>{property.bhk || 2} BHK</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">Bathrooms</div>
              <div className="text-lg font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                <Bath className="w-4 h-4 text-blue-600" />
                <span>{property.bathrooms || 2} Baths</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">Area</div>
              <div className="text-lg font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                <Square className="w-4 h-4 text-blue-600" />
                <span>{property.area_sqft || 1200} sqft</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">Rate per Sqft</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">₹{property.rate_per_sqft || 4500}/sqft</div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-3">
            <h2 className="text-base font-bold text-slate-900">Property Description</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {property.description || 'Modern luxury residential property located in premier locality of Ahmedabad. Built with top specifications, optimal floor layout, ample natural lighting, and modern building amenities.'}
            </p>
          </div>

          {/* ── Property Value Analysis ────────────────────────────────────── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Property Value Analysis
            </h2>

            <div className="flex flex-wrap gap-2">
              <PriceStatusBadge price={property.price} aiPrice={aiPrice} />
              {property.investment_rating && <InvestmentRatingBadge rating={property.investment_rating} />}
              {Boolean(property.sample_house_ready || property.sample_flat_ready || property.is_sample_ready) && (
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Sample Flat Ready
                </span>
              )}
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">Current Asking Price</p>
                <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(property.price)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-semibold text-blue-600 mb-1">AI Estimated Value</p>
                <p className="text-2xl font-extrabold text-blue-700">{formatCurrency(aiPrice)}</p>
                <p className="text-[10px] text-blue-500 mt-0.5">Based on market data, location & property profile</p>
              </div>
            </div>

            {property.investment_explanation && (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100 leading-relaxed">
                {property.investment_explanation.replace('/95', '/100')}
              </p>
            )}
          </div>

          {/* ── Investment Analysis ────────────────────────────────────────── */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Investment Analysis
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {investmentScore !== null && <ScoreRing score={investmentScore} />}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">AI Investment Score: {investmentScore ?? '—'} / 100</span>
                  {property.investment_rating && <InvestmentRatingBadge rating={property.investment_rating} />}
                </div>

                {/* Score Reasons Breakdown */}
                {property.investment_reasons && property.investment_reasons.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {property.investment_reasons.map((reason, idx) => (
                      <div key={idx} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Number(appreciation3Yr) >= 4 && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                        Strong Locality Growth
                      </span>
                    )}
                    {property.investment_score >= 80 && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                        High Conviction Investment
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Future Price Estimates */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">Locality Appreciation Projection</h3>
                {property.appreciation_annual_rate && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    {property.appreciation_annual_rate}% Annual Growth
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">1-Year</div>
                  <div className="text-base font-extrabold text-emerald-700 mt-0.5">+{appreciation1Yr}%</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">{formatCurrency(property.future_price_1yr)}</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">3-Year</div>
                  <div className="text-base font-extrabold text-blue-700 mt-0.5">+{appreciation3Yr}%</div>
                  <div className="text-[10px] text-blue-600 mt-0.5">{formatCurrency(future3Yr)}</div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">5-Year</div>
                  <div className="text-base font-extrabold text-indigo-700 mt-0.5">+{appreciation5Yr}%</div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">{formatCurrency(future5Yr)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
            <h2 className="text-base font-bold text-slate-900">Amenities & Features</h2>
            {property.amenities && property.amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {normalizeAmenities(property.amenities).map((am, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{am}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['24/7 Security', 'Power Backup', 'Club House', 'Swimming Pool', 'Gymnasium', 'Covered Parking', 'Elevators', 'Children Play Area'].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Location Analysis (Interactive Neighborhood Intelligence) ─── */}
          <LocationAnalysisSection property={property} />

          {/* Builder & Legal */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
            <h2 className="text-base font-bold text-slate-900">Builder & Development Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Builder Name:</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{property.builder_name || 'Apex Developers'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Project Name:</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{property.project_name || 'Skyline Enclave'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">RERA Registration:</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{property.rera_number || 'PR/GJ/AHMEDABAD/2025/10492'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Possession Status:</span>
                <p className="font-bold text-emerald-600 text-sm mt-0.5">{property.possession_status || 'Ready to Move'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Col: Pricing + Contact ──────────────────────────────── */}
        <div className="space-y-6">
          {/* Price & AI Valuation Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-5">
            <div>
              <span className="text-xs text-slate-400 font-medium">Asking Price</span>
              <div className="text-3xl font-extrabold text-slate-900">{formatCurrency(property.price)}</div>
            </div>

            {/* Price status */}
            <div className="flex flex-wrap gap-2">
              <PriceStatusBadge price={property.price} aiPrice={aiPrice} />
            </div>

            {/* AI valuation card */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Estimated Value
                </span>
                {investmentScore !== null && (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Score: {investmentScore}/100
                  </span>
                )}
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(aiPrice)}</div>
              {property.investment_rating && (
                <InvestmentRatingBadge rating={property.investment_rating} />
              )}
            </div>

            {/* Appreciation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">3-Year Growth</div>
                <div className="text-base font-extrabold text-emerald-700 mt-0.5">+{appreciation3Yr}%</div>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">5-Year Growth</div>
                <div className="text-base font-extrabold text-indigo-700 mt-0.5">+{appreciation5Yr}%</div>
              </div>
            </div>

            {/* Download Brochure */}
            <button
              onClick={handleDownloadBrochure}
              disabled={generatingPDF}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{generatingPDF ? 'Generating PDF...' : 'Download Official Brochure (PDF)'}</span>
            </button>
          </div>

          {/* Seller Contact Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Seller Contact Details</span>
            </h3>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-base">
                {property.seller_name ? property.seller_name[0] : 'S'}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{property.seller_name || 'Rajesh Mehta'}</div>
                <div className="text-xs text-slate-400 font-medium">Verified Property Representative</div>
              </div>
            </div>
            <div className="space-y-2 pt-2 text-xs">
              <a href={`tel:${property.phone_number || '+91 98765 43210'}`} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors font-semibold text-slate-700">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>{property.phone_number || '+91 98765 43210'}</span>
              </a>
              <a href={`mailto:${property.email || 'seller@bricklytics.com'}`} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors font-semibold text-slate-700">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{property.email || 'seller@bricklytics.com'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Better Alternative Properties ─────────────────────────────────── */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Better Alternative Properties
          </h2>
          {alternatives.length > 0 && (
            <Link to={ROUTES.PROPERTIES} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {altLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : alternatives.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {alternatives.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Top Pick in its Category</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              This property is already one of the best options available in your selected preferences.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
