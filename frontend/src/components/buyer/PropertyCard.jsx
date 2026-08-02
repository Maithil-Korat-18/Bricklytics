import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Square, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { buyerApi } from '../../services/buyerApi';
import { useToast } from '../../components/common/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { getPropertyDetailsPath } from '../../constants/routes';

export default function PropertyCard({ property, isFavoriteInitial = false, onFavoriteToggle }) {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    setIsFavorite(isFavoriteInitial);
  }, [isFavoriteInitial]);

  const coverImage = property.images?.find((img) => img.is_cover)?.url ||
    property.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80';

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showError('Please log in to save properties to your wishlist.');
      return;
    }

    setFavLoading(true);
    try {
      const res = await buyerApi.toggleWishlist(property.id);
      setIsFavorite(res.data?.in_wishlist);
      showSuccess(res.message);
      if (onFavoriteToggle) onFavoriteToggle(property.id, res.data?.in_wishlist);
    } catch (err) {
      showError('Failed to update wishlist.');
    } finally {
      setFavLoading(false);
    }
  };

  // Calculate simulated AI price & appreciation if not present
  const aiPrice = property.ai_predicted_price || property.price * 1.04;
  const appreciationRate = property.appreciation_rate || '7.8%';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card-soft hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Image Container */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <img
          src={coverImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
            {property.property_type || 'Apartment'}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
            {property.listing_type || 'For Sale'}
          </span>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={favLoading}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-sm ${
            isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-slate-600 hover:bg-white hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Location tag on image */}
        <div className="absolute bottom-3 left-3 text-white text-xs font-semibold flex items-center space-x-1 drop-shadow-md">
          <MapPin className="w-3.5 h-3.5 text-blue-400" />
          <span>{property.locality || property.address || 'Ahmedabad'}, {property.city || 'Gujarat'}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {property.title}
          </h3>

          {/* Pricing Row */}
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Asking Price</div>
              <div className="text-xl font-extrabold text-slate-900">
                {formatCurrency(property.price)}
              </div>
            </div>

            {/* AI Suggested Price */}
            <div className="text-right">
              <div className="text-xs text-blue-600 font-semibold flex items-center justify-end space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>AI Valuation</span>
              </div>
              <div className="text-sm font-bold text-blue-700">
                {formatCurrency(aiPrice)}
              </div>
            </div>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-slate-600 text-xs font-medium">
          <div className="flex items-center space-x-1.5">
            <Bed className="w-4 h-4 text-slate-400" />
            <span>{property.bhk || 2} BHK</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Bath className="w-4 h-4 text-slate-400" />
            <span>{property.bathrooms || 2} Baths</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Square className="w-4 h-4 text-slate-400" />
            <span>{property.area_sqft || 1200} sqft</span>
          </div>
        </div>

        {/* Appreciation & Action Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{appreciationRate} 3Yr Return</span>
          </div>

          <Link
            to={getPropertyDetailsPath(property.id)}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-transform"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
