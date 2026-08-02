import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Edit, CheckCircle, MapPin, Building, IndianRupee, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function Step4ReviewPublish({ onJumpToStep }) {
  const { watch } = useFormContext();
  const data = watch();

  const isNew = data.listingType === 'New Property';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Review Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" /> Review Your Property Listing Details
          </h3>
          <p className="text-xs text-blue-200 mt-1">
            Please verify all details before publishing to the Ahmedabad Real Estate database.
          </p>
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" /> Basic Information
          </h4>
          <button
            type="button"
            onClick={() => onJumpToStep(0)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Section
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Property Name</span>
            <span className="font-bold text-slate-800 text-sm">{data.title || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Property Type</span>
            <span className="font-bold text-slate-800">{data.propertyType || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Listing Type</span>
            <span className="font-bold text-slate-800">{data.listingType || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">City / State</span>
            <span className="font-bold text-slate-800">{data.city}, {data.state}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Area / Locality</span>
            <span className="font-bold text-slate-800">{data.locality || 'N/A'}</span>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <span className="text-slate-400 block font-medium">Full Address</span>
            <span className="font-semibold text-slate-700">{data.fullAddress || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Property Details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" /> Property Specifications
          </h4>
          <button
            type="button"
            onClick={() => onJumpToStep(1)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Section
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">BHK</span>
            <span className="font-bold text-slate-800">{data.bhk ? `${data.bhk} BHK` : 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Bedrooms / Baths</span>
            <span className="font-bold text-slate-800">{data.bedrooms || 0} Bed / {data.bathrooms || 0} Bath</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Carpet Area</span>
            <span className="font-bold text-slate-800">{data.carpetArea ? `${data.carpetArea} sq.ft` : 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Furnishing</span>
            <span className="font-bold text-slate-800">{data.furnishing || 'Unfurnished'}</span>
          </div>
        </div>

        {/* Selected Amenities List */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-slate-400 block text-xs font-medium mb-2">Selected Amenities</span>
          <div className="flex flex-wrap gap-2">
            {(data.amenities || []).map((amenity, idx) => (
              <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                ✓ {amenity}
              </span>
            ))}
            {(!data.amenities || data.amenities.length === 0) && (
              <span className="text-xs text-slate-400">No specific amenities selected.</span>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Builder Details (If New Property) */}
      {isNew && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Builder & Project Details
            </h4>
            <button
              type="button"
              onClick={() => onJumpToStep(1)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Section
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Builder Name</span>
              <span className="font-bold text-slate-800">{data.builderName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Project Name</span>
              <span className="font-bold text-slate-800">{data.projectName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">RERA Number</span>
              <span className="font-bold text-slate-800">{data.reraNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Pricing & Images */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-600" /> Pricing & Media Preview
          </h4>
          <button
            type="button"
            onClick={() => onJumpToStep(2)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Section
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Expected Price</span>
            <span className="font-black text-emerald-600 text-base">
              ₹{data.expectedPrice ? Number(data.expectedPrice).toLocaleString('en-IN') : '0'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Maintenance Charges</span>
            <span className="font-bold text-slate-800">
              ₹{data.maintenanceCharges ? Number(data.maintenanceCharges).toLocaleString('en-IN') : '0'} / Mo
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Images Uploaded</span>
            <span className="font-bold text-slate-800">{(data.images || []).length} Photos</span>
          </div>
        </div>

        {/* Thumbnail Previews */}
        {data.images && data.images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pt-2">
            {data.images.map((src, i) => (
              <img key={i} src={src} alt="Thumbnail" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
