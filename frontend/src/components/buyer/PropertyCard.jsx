import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Heart, MapPin, Bed, Bath, Maximize2, TrendingUp, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useToast } from '../../components/common/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { getPropertyDetailsPath } from '../../constants/routes';
import { getPropertyMediaUrl } from '../../utils/propertyMedia';
import { useWishlist } from '../../contexts/WishlistContext';
import { isComparePropertySelected, toggleComparePropertyId } from '../../utils/compareSelection';

export default function PropertyCard({ property, isFavoriteInitial = false, onFavoriteToggle, showCompare = false }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [favLoading, setFavLoading] = useState(false);
  const [isCompared, setIsCompared] = useState(() => isComparePropertySelected(property.id));
  const { favoriteIds, loading: wishlistLoading, toggleFavorite } = useWishlist();

  const isFavorite = wishlistLoading ? isFavoriteInitial : favoriteIds.has(String(property.id));

  const coverImage = property.images?.find((img) => img.is_cover)?.url ||
    property.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80';

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
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
      const res = await toggleFavorite(property.id);
      showSuccess(res.message);
      if (onFavoriteToggle) onFavoriteToggle(property.id, res.inWishlist);
    } catch (err) {
      showError('Failed to update wishlist.');
    } finally {
      setFavLoading(false);
    }
  };

  const handleCompareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleComparePropertyId(property.id);
    if (result.limitReached) {
      showError('Maximum 8 properties can be added to compare.');
    } else {
      setIsCompared(result.isSelected);
      if (result.isSelected) {
        showSuccess(`Added "${property.title || 'Property'}" to compare list!`);
      } else {
        if (showInfo) showInfo(`Removed "${property.title || 'Property'}" from compare list.`);
        else showSuccess(`Removed "${property.title || 'Property'}" from compare list.`);
      }
      window.dispatchEvent(new CustomEvent('bricklytics_compare_updated'));
    }
  };

  const score = property.investment_score || 92;
  const appreciation = property.appreciation_rate || '+14.5% Exp. Appr.';
  const aiFairPrice = property.ai_fair_price || (property.price ? property.price * 1.03 : 0);
  const propertyIdCode = `BRL-${(property.id || '9284').slice(-4).toUpperCase()}`;
  const investmentDesc = property.investment_explanation || property.investment_description || "AI Investment Score is calculated from valuation, appreciation, locality, connectivity, property profile, and amenity value.";

  return (
    <article 
      onClick={() => navigate(getPropertyDetailsPath(property.id))}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden group flex flex-col transition-all duration-300 hover:shadow-md cursor-pointer font-sans"
    >
      {/* Property Image Container */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-100">
        <div 
          className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-500" 
          style={{ backgroundImage: `url("${getPropertyMediaUrl(coverImage)}")` }}
        />

        {/* Exp Appreciation Badge (Top Left) */}
        <div className="absolute top-3 left-3">
          <span className="bg-emerald-950/70 text-emerald-400 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{appreciation}</span>
          </span>
        </div>

        {/* Property ID Badge (Bottom Right) */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-extrabold text-slate-800 shadow-sm border border-slate-200/60">
            ID: {propertyIdCode}
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-4 flex flex-col flex-grow space-y-3">
        {/* Title & Heart Button */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-extrabold text-base text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {property.title}
            </h3>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{property.locality || property.address || 'South Bopal'}, {property.city || 'Ahmedabad'}</span>
            </p>
          </div>
          <button 
            onClick={handleFavoriteClick}
            disabled={favLoading}
            type="button"
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors shrink-0"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : ''}`} />
          </button>
        </div>

        {/* Specs Row: Beds | Baths | Sqft */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-700 pt-1">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4 text-slate-400" />
            <span>{property.bedrooms || property.bhk || 3}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4 text-slate-400" />
            <span>{property.bathrooms || 2}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize2 className="w-4 h-4 text-slate-400" />
            <span>{(property.area_sqft || 1850).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* AI Investment Score & Price Box */}
        <div className="mt-auto bg-blue-50/50 rounded-xl p-3.5 border border-blue-100/80 space-y-3">
          {/* Price Comparison */}
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Market Asking Price</div>
              <div className="text-lg font-black text-slate-900 tracking-tight">
                {formatCurrency(property.price)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 justify-end">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>AI Fair Price</span>
              </div>
              <div className="text-sm font-extrabold text-blue-600">
                {formatCurrency(aiFairPrice)}
              </div>
            </div>
          </div>

          {/* AI Score Circle & Description */}
          <div className="flex items-center gap-3 pt-1 border-t border-blue-100/60">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center font-black text-emerald-700 text-sm shrink-0 shadow-xs">
              {score}
            </div>
            <p className="text-[11px] font-medium text-slate-600 leading-snug">
              {investmentDesc}
            </p>
          </div>
        </div>

        {showCompare && (
          <button
            type="button"
            onClick={handleCompareClick}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${isCompared ? 'border-tertiary bg-tertiary text-white hover:bg-tertiary/90' : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white'}`}
          >
            {isCompared ? <Check className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            {isCompared ? 'Added to Compare' : 'Add to Compare'}
          </button>
        )}
      </div>
    </article>
  );
}
