import React, { useEffect, useState } from 'react';
import { Heart, Trash2, ArrowRight, Building2 } from 'lucide-react';
import PropertyCard from '../../components/buyer/PropertyCard';
import { buyerApi } from '../../services/buyerApi';
import { useToast } from '../../components/common/ToastContext';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function WishlistPage() {
  const { showSuccess, showError } = useToast();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await buyerApi.getWishlist();
      if (res.success && res.data) {
        setWishlistItems(res.data);
      }
    } catch (err) {
      showError('Failed to load wishlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (propertyId) => {
    try {
      await buyerApi.deleteWishlist(propertyId);
      setWishlistItems((prev) => prev.filter((item) => item.property_id !== propertyId));
      showSuccess('Property removed from wishlist.');
    } catch {
      showError('Failed to remove property.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-current" />
          <span>My Saved Wishlist</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track and compare your favorited properties in Ahmedabad.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Heart className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Your wishlist is empty</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Browse properties and click the heart icon to save listings to your wishlist.
          </p>
          <Link
            to={ROUTES.PROPERTIES}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
            <span>Browse Properties</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="relative">
              {item.property_details ? (
                <PropertyCard
                  property={item.property_details}
                  isFavoriteInitial={true}
                  onFavoriteToggle={() => handleRemove(item.property_id)}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
