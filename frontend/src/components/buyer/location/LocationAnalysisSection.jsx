import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { getNearbyPlacesForProperty } from './nearbyPlacesService';
import NeighborhoodMap from './NeighborhoodMap';

export default function LocationAnalysisSection({ property }) {
  // Parse & filter POIs within 3.5 km radius
  const places = useMemo(() => {
    return getNearbyPlacesForProperty(property);
  }, [property]);

  if (!property) return null;

  return (
    <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card-soft space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Location Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {property.address || property.locality}, {property.city || 'Ahmedabad'}, Gujarat
          </p>
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          Hover over markers to view facility details & travel distance
        </div>
      </div>

      {/* Hero Full-Width Interactive Map */}
      <div className="w-full">
        <NeighborhoodMap property={property} places={places} />
      </div>
    </section>
  );
}
