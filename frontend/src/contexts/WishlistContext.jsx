import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buyerApi } from '../services/buyerApi';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated, role } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated || role !== 'buyer') {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await buyerApi.getWishlist();
      const items = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setFavoriteIds(new Set(items.map((item) => String(item.property_id || item.property_details?.id)).filter(Boolean)));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    refreshWishlist().catch((error) => console.error('Failed to load wishlist:', error));
  }, [refreshWishlist]);

  const toggleFavorite = useCallback(async (propertyId) => {
    const id = String(propertyId);
    const response = await buyerApi.toggleWishlist(id);
    const inWishlist = Boolean(response.data?.in_wishlist);

    setFavoriteIds((current) => {
      const next = new Set(current);
      if (inWishlist) next.add(id);
      else next.delete(id);
      return next;
    });

    return { ...response, inWishlist };
  }, []);

  const removeFavorite = useCallback(async (propertyId) => {
    const id = String(propertyId);
    const response = await buyerApi.deleteWishlist(id);
    setFavoriteIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    return response;
  }, []);

  const value = useMemo(() => ({
    favoriteIds,
    loading,
    refreshWishlist,
    toggleFavorite,
    removeFavorite,
  }), [favoriteIds, loading, refreshWishlist, toggleFavorite, removeFavorite]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}
