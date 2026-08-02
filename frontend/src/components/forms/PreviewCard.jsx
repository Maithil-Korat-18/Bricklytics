import React from 'react';
import { useWatch } from 'react-hook-form';
import { Building2, MapPin, Tag } from 'lucide-react';
import Badge from '../common/Badge';

export default function PreviewCard() {
  const title = useWatch({ name: 'title' });
  const propertyType = useWatch({ name: 'propertyType' });
  const listingType = useWatch({ name: 'listingType' });
  const locality = useWatch({ name: 'locality' });
  const city = useWatch({ name: 'city' });
  const expectedPrice = useWatch({ name: 'expectedPrice' });
  const bhk = useWatch({ name: 'bhk' });
  const negotiable = useWatch({ name: 'negotiable' });
  const amenities = useWatch({ name: 'amenities' }) || [];
  const images = useWatch({ name: 'images' }) || [];
  const coverIndex = useWatch({ name: 'coverIndex' }) || 0;

  const displayImage = images[coverIndex] || images[0] || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card-soft overflow-hidden sticky top-20">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Live Listing Preview
        </span>
        <Badge status="Draft" />
      </div>

      {/* Property Thumbnail */}
      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
        <img
          src={displayImage}
          alt="Property Preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Tag className="w-3 h-3" />
          <span>{listingType === 'Rent' ? 'For Rent' : 'For Sale'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mb-1">
            {propertyType || 'Apartment'} • {bhk || '2 BHK'}
          </div>
          <h3 className="text-base font-bold text-slate-900 line-clamp-1">
            {title || 'Untitled Property Listing'}
          </h3>
          <div className="flex items-center text-xs text-slate-400 mt-1">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
            <span className="truncate">
              {locality || city ? `${locality || ''}${city ? `, ${city}` : ''}` : 'Location Not Set'}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Expected Price</div>
            <div className="text-xl font-extrabold text-slate-900">
              {expectedPrice ? `$${Number(expectedPrice).toLocaleString()}` : '$ --'}
            </div>
          </div>
          {negotiable && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Negotiable
            </span>
          )}
        </div>

        {/* Selected Amenities Chips */}
        {amenities.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Amenities ({amenities.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {amenities.slice(0, 5).map((amenity) => (
                <span key={amenity} className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">
                  {amenity}
                </span>
              ))}
              {amenities.length > 5 && (
                <span className="text-[11px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-md">
                  +{amenities.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
