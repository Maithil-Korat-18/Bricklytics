import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Edit, CheckCircle, MapPin, Building, IndianRupee, Sparkles, Heart } from 'lucide-react';

const formatPriceCr = (val) => {
  if (!val) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakhs`;
  return `₹${num.toLocaleString('en-IN')}`;
};

export default function Step4ReviewPublish({ onJumpToStep }) {
  const { watch } = useFormContext();
  const data = watch();

  const isNew = data.listingType === 'New Property';
  const isFlat = data.propertyType === 'Flat / Apartment';
  const totalFloors = Number(data.totalFloors) || 0;
  const unitsPerFloor = Number(data.unitsPerFloor) || 0;
  const unitsSold = Number(data.unitsSold) || 0;
  const totalUnits = totalFloors * unitsPerFloor || Number(data.totalUnits) || 0;
  const unitsAvailable = Math.max(0, totalUnits - unitsSold);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Review Header Banner */}
      <div className="bg-gradient-to-r from-[#0058be] to-[#2170e4] text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-300" /> Review Your Property Listing Details
          </h3>
          <p className="text-xs text-[#d8e2ff] mt-1">
            Please verify all details below before publishing your property listing to the database.
          </p>
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <div className="bg-white p-6 rounded-2xl border border-[#e2e7ff] shadow-ambient space-y-4">
        <div className="flex items-center justify-between border-b border-[#f2f3ff] pb-3">
          <h4 className="text-sm font-bold text-[#131b2e] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0058be]" /> Basic Information & Location
          </h4>
          <button
            type="button"
            onClick={() => onJumpToStep(0)}
            className="text-xs font-semibold text-[#0058be] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Section
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[#727785] block font-medium">Property Title</span>
            <span className="font-bold text-[#131b2e] text-sm">{data.title || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#727785] block font-medium">Property Type</span>
            <span className="font-bold text-[#131b2e]">{data.propertyType || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#727785] block font-medium">Listing Type</span>
            <span className="font-bold text-[#131b2e]">{data.listingType || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#727785] block font-medium">City / State</span>
            <span className="font-bold text-[#131b2e]">{data.city}, {data.state}</span>
          </div>
          <div>
            <span className="text-[#727785] block font-medium">Area / Locality</span>
            <span className="font-bold text-[#131b2e]">{data.locality || 'N/A'}</span>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <span className="text-[#727785] block font-medium">Full Address</span>
            <span className="font-semibold text-[#424754]">{data.fullAddress || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Property Details */}
      <div className="bg-white p-6 rounded-2xl border border-[#e2e7ff] shadow-ambient space-y-4">
        <div className="flex items-center justify-between border-b border-[#f2f3ff] pb-3">
          <h4 className="text-sm font-bold text-[#131b2e] flex items-center gap-2">
            <Building className="w-4 h-4 text-[#0058be]" /> Specifications & Unit Inventory
          </h4>
          <button
            type="button"
            onClick={() => onJumpToStep(2)}
            className="text-xs font-semibold text-[#0058be] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Section
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#727785] block font-medium">BHK</span>
            <span className="font-bold text-[#131b2e]">{data.bhk ? `${data.bhk} BHK` : 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#727785] block font-medium">Bedrooms / Baths</span>
            <span className="font-bold text-[#131b2e]">{data.bedrooms || 0} Bed / {data.bathrooms || 0} Bath</span>
          </div>
          <div>
            <span className="text-[#727785] block font-medium">Carpet Area</span>
            <span className="font-bold text-[#131b2e]">{data.carpetArea ? `${data.carpetArea} sq.ft` : 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#727785] block font-medium">Furnishing</span>
            <span className="font-bold text-[#131b2e]">{data.furnishing || 'Unfurnished'}</span>
          </div>

          {isFlat && (
            <>
              <div>
                <span className="text-[#727785] block font-medium">Floors / Units per Floor</span>
                <span className="font-bold text-[#131b2e]">{totalFloors} Floors ({unitsPerFloor} / floor)</span>
              </div>
              <div>
                <span className="text-[#727785] block font-medium">Total Units</span>
                <span className="font-bold text-[#0058be]">{totalUnits} Total Flats</span>
              </div>
              <div>
                <span className="text-[#727785] block font-medium">Units Sold</span>
                <span className="font-bold text-[#131b2e]">{unitsSold} Sold</span>
              </div>
              <div>
                <span className="text-[#727785] block font-medium">Units Available</span>
                <span className="font-bold text-[#006947]">{unitsAvailable} Left</span>
              </div>
            </>
          )}

          {!isFlat && (
            <>
              <div>
                <span className="text-[#727785] block font-medium">Layout Type</span>
                <span className="font-bold text-[#131b2e]">{data.layoutType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#727785] block font-medium">Sample House Ready</span>
                <span className="font-bold text-[#006947]">{data.sampleHouseReady ? 'Yes (Ready)' : 'No'}</span>
              </div>
            </>
          )}
        </div>

        {/* Selected Nearby Community Facilities */}
        {(data.nearbyPlaces || []).length > 0 && (
          <div className="pt-3 border-t border-[#f2f3ff]">
            <span className="text-[#727785] block text-xs font-medium mb-2">Nearby Community Facilities</span>
            <div className="flex flex-wrap gap-2">
              {data.nearbyPlaces.map((facility, idx) => (
                <span key={idx} className="px-3 py-1 bg-[#f5fff6] text-[#006947] border border-[#00855b]/20 rounded-lg text-xs font-bold">
                  ✓ {facility}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Selected Amenities List */}
        <div className="pt-3 border-t border-[#f2f3ff]">
          <span className="text-[#727785] block text-xs font-medium mb-2">Selected Amenities</span>
          <div className="flex flex-wrap gap-2">
            {(data.amenities || []).map((amenity, idx) => (
              <span key={idx} className="px-3 py-1 bg-[#f2f3ff] text-[#424754] rounded-lg text-xs font-semibold">
                ✓ {amenity}
              </span>
            ))}
            {(!data.amenities || data.amenities.length === 0) && (
              <span className="text-xs text-[#727785]">No specific amenities selected.</span>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Builder Details (If New Property) */}
      {isNew && (
        <div className="bg-white p-6 rounded-2xl border border-[#e2e7ff] shadow-ambient space-y-4">
          <div className="flex items-center justify-between border-b border-[#f2f3ff] pb-3">
            <h4 className="text-sm font-bold text-[#131b2e] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0058be]" /> Builder & Project Details
            </h4>
            <button
              type="button"
              onClick={() => onJumpToStep(2)}
              className="text-xs font-semibold text-[#0058be] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Section
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#727785] block font-medium">Builder Name</span>
              <span className="font-bold text-[#131b2e]">{data.builderName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#727785] block font-medium">Project Name</span>
              <span className="font-bold text-[#131b2e]">{data.projectName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#727785] block font-medium">RERA Number</span>
              <span className="font-bold text-[#131b2e]">{data.reraNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Pricing & Images */}
      <div className="bg-white p-6 rounded-2xl border border-[#e2e7ff] shadow-ambient space-y-4">
        <div className="flex items-center justify-between border-b border-[#f2f3ff] pb-3">
          <h4 className="text-sm font-bold text-[#131b2e] flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-[#006947]" /> Pricing & Media Preview
          </h4>
          <button
            type="button"
            onClick={() => onJumpToStep(3)}
            className="text-xs font-semibold text-[#0058be] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Section
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[#727785] block font-medium">Expected Price</span>
            <span className="font-black text-[#006947] text-base">
              {formatPriceCr(data.expectedPrice)}
            </span>
          </div>
          <div>
            <span className="text-[#727785] block font-medium">Maintenance Charges</span>
            <span className="font-bold text-[#131b2e]">
              ₹{data.maintenanceCharges ? Number(data.maintenanceCharges).toLocaleString('en-IN') : '0'} / Mo
            </span>
          </div>
          <div>
            <span className="text-[#727785] block font-medium">Images Uploaded</span>
            <span className="font-bold text-[#131b2e]">{(data.images || []).length} Photos</span>
          </div>
        </div>

        {/* Thumbnail Previews */}
        {data.images && data.images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pt-2">
            {data.images.map((src, i) => (
              <img key={i} src={src} alt="Thumbnail" className="w-16 h-16 rounded-lg object-cover border border-[#e2e7ff]" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
