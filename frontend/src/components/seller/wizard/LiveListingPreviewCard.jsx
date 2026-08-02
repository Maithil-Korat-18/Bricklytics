import React from 'react';
import { useFormContext } from 'react-hook-form';
import { MapPin, Tag, Building2, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function LiveListingPreviewCard() {
  const { watch } = useFormContext();
  const formValues = watch();

  const {
    title = '',
    propertyType = 'Flat / Apartment',
    listingType = 'New Property',
    locality = '',
    city = 'Ahmedabad',
    expectedPrice = '',
    bhk = '',
    amenities = [],
    images = [],
    coverIndex = 0,
  } = formValues;

  const isVilla = (propertyType || '').includes('Villa');
  const coverImageSrc = images && images.length > 0 ? (images[coverIndex] || images[0]) : null;

  const formattedPrice = expectedPrice && !isNaN(Number(expectedPrice))
    ? `₹${Number(expectedPrice).toLocaleString('en-IN')}`
    : '₹ --';

  return (
    <div className="sticky top-6 bg-white rounded-2xl border border-slate-200/90 shadow-card-soft overflow-hidden transition-all duration-300">
      {/* Card Header Tag */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Live Listing Preview
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Ready to Publish
        </span>
      </div>

      {/* Image Preview Area */}
      <div className="relative aspect-[16/10] bg-slate-100 flex items-center justify-center overflow-hidden">
        {coverImageSrc ? (
          <img src={coverImageSrc} alt="Cover Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-6 text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-400">Upload Property Image</p>
          </div>
        )}

        {/* Sale Type Tag */}
        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center space-x-1.5 shadow-md">
          <Tag className="w-3 h-3 text-blue-400" />
          <span>{listingType === 'New Property' ? 'For Sale (New)' : 'Resale'}</span>
        </div>
      </div>

      {/* Property Details Body */}
      <div className="p-5 space-y-4">
        {/* Type & BHK Badge */}
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-100/70 text-blue-800 uppercase tracking-wider">
            {isVilla ? 'Villa' : 'Apartment'} {bhk ? `• ${bhk} BHK` : ''}
          </span>
        </div>

        {/* Title */}
        <div>
          <h4 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2">
            {title.trim() || 'Property Title Here'}
          </h4>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span>{locality ? `${locality}, ${city}` : `${city}, Gujarat`}</span>
          </p>
        </div>

        {/* Expected Price */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expected Price</span>
            <span className="text-xl font-black text-slate-900">{formattedPrice}</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80">
            Negotiable
          </span>
        </div>

        {/* Selected Amenities Chips */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Selected Amenities ({amenities.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 6).map((amenity, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                {amenity}
              </span>
            ))}
            {amenities.length > 6 && (
              <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-200 text-slate-600">
                +{amenities.length - 6} more
              </span>
            )}
            {amenities.length === 0 && (
              <span className="text-xs text-slate-400 italic">No amenities selected yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
