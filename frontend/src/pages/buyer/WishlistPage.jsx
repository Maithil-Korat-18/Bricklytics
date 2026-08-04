import React, { useEffect, useState } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
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
        const items = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setWishlistItems(items);
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
      setWishlistItems((prev) =>
        prev.filter((item) => item.property_id !== propertyId && item.property_details?.id !== propertyId)
      );
      showSuccess('Property removed from wishlist.');
    } catch (err) {
      showError('Failed to remove property from wishlist.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      <div>
        <h1 className="text-2xl font-extrabold text-[#131b2e] tracking-tight flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#ba1a1a] fill-current" />
          <span>My Saved Wishlist</span>
        </h1>
        <p className="text-sm text-[#727785] mt-1">
          Track and compare your favorited properties in Ahmedabad.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 bg-white rounded-2xl border border-[#e2e7ff] animate-pulse" />
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e7ff] p-12 text-center space-y-4 shadow-ambient">
          <Heart className="w-12 h-12 text-[#c2c6d6] mx-auto" />
          <h3 className="text-lg font-bold text-[#131b2e]">Your wishlist is empty</h3>
          <p className="text-sm text-[#727785] max-w-sm mx-auto">
            Browse properties and click the heart icon to save listings to your wishlist.
          </p>
          <Link
            to={ROUTES.PROPERTIES}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0058be] text-white font-bold text-sm hover:bg-[#004395] transition-all shadow-md"
          >
            <span>Browse Properties</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => {
            const prop = item.property_details || item;
            const pid = item.property_id || prop.id;
            return (
              <div key={item.id || pid} className="relative">
                <PropertyCard
                  property={prop}
                  isFavoriteInitial={true}
                  onFavoriteToggle={(toggledId) => handleRemove(toggledId || pid)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
