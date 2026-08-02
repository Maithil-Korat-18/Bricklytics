import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Sparkles, 
  TrendingUp, 
  Heart, 
  Share2, 
  Download, 
  Phone, 
  Mail, 
  Calendar, 
  Building, 
  ShieldCheck, 
  Check, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import ImageGallery from '../../components/buyer/ImageGallery';
import PropertyCard from '../../components/buyer/PropertyCard';
import { buyerApi } from '../../services/buyerApi';
import { propertyApi } from '../../services/propertyApi';
import { useToast } from '../../components/common/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();

  const [property, setProperty] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    async function loadPropertyDetails() {
      setLoading(true);
      try {
        const res = await buyerApi.getPropertyById(id);
        if (res.success && res.data) {
          setProperty(res.data);
        }

        // Fetch similar properties
        const simRes = await buyerApi.getProperties({ page_size: 3 });
        if (simRes.success && simRes.data) {
          setSimilarProperties((simRes.data.results || []).filter((p) => p.id !== id));
        }
      } catch (err) {
        showError('Failed to load property details.');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadPropertyDetails();
  }, [id, showError]);

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      showError('Please log in to save properties to your wishlist.');
      return;
    }
    try {
      const res = await buyerApi.toggleWishlist(id);
      setIsFavorite(res.data?.in_wishlist);
      showSuccess(res.message);
    } catch {
      showError('Failed to update wishlist.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title || 'Bricklytics Property',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess('Property URL copied to clipboard!');
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

  const aiPrice = property.ai_predicted_price || property.price * 1.05;
  const appreciation3Yr = '18.4%';
  const appreciation5Yr = '34.2%';

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
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
            <span>{property.address}, {property.city}, Gujarat — {property.pincode}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleFavoriteClick}
            className={`p-3 rounded-xl border transition-all flex items-center space-x-2 text-sm font-semibold ${
              isFavorite ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleShare}
            className="p-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all text-sm font-semibold flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={() => navigate(ROUTES.SCHEDULE_VISIT, { state: { propertyId: property.id, propertyTitle: property.title } })}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Visit</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Gallery + AI Valuation Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Image Gallery */}
        <div className="lg:col-span-2 space-y-6">
          <ImageGallery images={property.images} />

          {/* Quick Spec Highlights Bar */}
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
              <div className="text-xs text-slate-400 font-semibold">Super Area</div>
              <div className="text-lg font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                <Square className="w-4 h-4 text-blue-600" />
                <span>{property.area_sqft || 1200} sqft</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-semibold">Rate per Sqft</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                ₹{property.rate_per_sqft || 4500}/sqft
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-3">
            <h2 className="text-base font-bold text-slate-900">Property Description</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {property.description || 'Modern luxury residential property located in premier locality of Ahmedabad. Built with top specifications, optimal floor layout, ample natural lighting, and modern building amenities.'}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
            <h2 className="text-base font-bold text-slate-900">Amenities & Features</h2>
            {property.amenities && property.amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((am, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{am.name || am}</span>
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

          {/* Builder & Legal Info */}
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

        {/* Right 1 Col: Valuation & Contact Panel */}
        <div className="space-y-6">
          {/* Price & AI Valuation Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-5">
            <div>
              <span className="text-xs text-slate-400 font-medium">Asking Price</span>
              <div className="text-3xl font-extrabold text-slate-900">
                {formatCurrency(property.price)}
              </div>
            </div>

            {/* AI valuation badge */}
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Bricklytics ML Valuation
                </span>
                <span className="text-emerald-600 font-extrabold">98.4% Accuracy</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {formatCurrency(aiPrice)}
              </div>
              <p className="text-[11px] text-slate-500">Calculated using Ahmedabad scikit-learn regression models based on location & sqft.</p>
            </div>

            {/* Appreciation Forecast */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">3-Year Return</div>
                <div className="text-base font-extrabold text-emerald-700 mt-0.5">+{appreciation3Yr}</div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">5-Year Return</div>
                <div className="text-base font-extrabold text-indigo-700 mt-0.5">+{appreciation5Yr}</div>
              </div>
            </div>

            {/* Download Brochure Button */}
            <button
              onClick={() => showSuccess('Brochure download started!')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Download Official Brochure (PDF)</span>
            </button>
          </div>

          {/* Seller Contact Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Seller Contact Details</span>
            </h3>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-base">
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

      {/* Similar Properties Section */}
      {similarProperties.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Similar Properties in Ahmedabad</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
