import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Building2, MapPin, Wrench } from 'lucide-react';
import { propertyApi } from '../../../services/propertyApi';
import LocationMap from './LocationMap';

const AHMEDABAD_LOCALITIES = [
  'South Bopal',
  'Satellite',
  'Bodakdev',
  'Prahlad Nagar',
  'Science City',
  'Vastrapur',
  'Thaltej',
  'SG Highway',
  'Sindhu Bhavan Road',
  'Ambli',
  'Shela',
  'Gota',
  'Chandkheda',
  'Naranpura',
  'Paldi',
  'CG Road',
  'Maninagar',
  'Motera',
  'Navrangpura',
  'Ellisbridge',
  'Memnagar',
  'Sola',
  'Vatva',
  'Naroda',
  'Nikol',
  'Shahibaug',
];

const RENOVATION_OPTIONS = [
  'Never Renovated',
  'Minor Renovation',
  'Major Renovation',
  'Fully Reconstructed',
  'Newly Renovated',
];

export default function Step1BasicInfo({ mode, preloadedLocalities }) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const [apiLocalities, setApiLocalities] = useState([]);

  const selectedPropertyType = watch('propertyType') || 'Flat / Apartment';
  const selectedListingType = watch('listingType') || 'New Property';
  const isResale = selectedListingType === 'Resale Property';

  useEffect(() => {
    // If parent already provided localities (e.g. EditPropertyPage), don't re-fetch
    if (preloadedLocalities && preloadedLocalities.length > 0) {
      setApiLocalities(preloadedLocalities);
      return;
    }
    async function loadLocalities() {
      try {
        const res = await propertyApi.getAhmedabadLocations();
        if (res.success && res.data?.locations?.length > 0) {
          const names = res.data.locations.map((loc) => loc.name);
          setApiLocalities(names);
        }
      } catch (err) {
        console.error('Failed to fetch localities from API', err);
      }
    }
    loadLocalities();
  }, [preloadedLocalities]);

  const localitiesList =
    apiLocalities.length > 0
      ? Array.from(new Set([...apiLocalities, ...AHMEDABAD_LOCALITIES]))
      : AHMEDABAD_LOCALITIES;

  const showBasic = !mode || mode === 'basic';
  const showLocation = !mode || mode === 'location';


  return (
    <div className="space-y-8 animate-fadeIn">
      {/* CARD 1: PROPERTY INFORMATION */}
      {showBasic && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e2e7ff] shadow-ambient space-y-6">
          <div className="border-b border-[#f2f3ff] pb-4">
            <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0058be]" /> Basic Information
            </h3>
            <p className="text-xs text-[#727785] mt-1">Basic title, property type, sale classification, and description</p>
          </div>

          <div className="space-y-5">
            {/* Property Title */}
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">
                PROPERTY TITLE <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 3 BHK Luxury Apartment in South Bopal"
                {...register('title')}
                className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] focus:border-[#0058be] focus:ring-2 focus:ring-[#adc6ff] text-sm outline-none transition"
              />
              <p className="text-[11px] text-[#727785] mt-1">Provide a descriptive, attractive title for your listing (3-150 characters).</p>
              {errors.title && <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.title.message}</p>}
            </div>

            {/* Property Type & Sale Type Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">
                  PROPERTY TYPE <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  {...register('propertyType')}
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] focus:border-[#0058be] focus:ring-2 focus:ring-[#adc6ff] text-sm outline-none bg-white font-medium text-[#131b2e]"
                >
                  <option value="Flat / Apartment">Flat / Apartment</option>
                  <option value="Villa / House">Villa / House</option>
                  {/* <option value="Plot / Land">Plot / Land</option> */}
                </select>
                {errors.propertyType && <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.propertyType.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-2">
                  SALE TYPE <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="flex items-center space-x-6 pt-1">
                  <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      value="New Property"
                      checked={selectedListingType === 'New Property'}
                      onChange={() => {
                        setValue('listingType', 'New Property', { shouldValidate: true });
                        setValue('saleType', 'new');
                        setValue('reconstructionNeeded', '');
                      }}
                      className="w-4 h-4 text-[#0058be] border-[#c2c6d6] focus:ring-[#0058be]"
                    />
                    <span className="text-sm font-semibold text-[#131b2e]">New Property</span>
                  </label>

                  <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="listingType"
                      value="Resale Property"
                      checked={selectedListingType === 'Resale Property'}
                      onChange={() => {
                        setValue('listingType', 'Resale Property', { shouldValidate: true });
                        setValue('saleType', 'resale');
                      }}
                      className="w-4 h-4 text-[#0058be] border-[#c2c6d6] focus:ring-[#0058be]"
                    />
                    <span className="text-sm font-semibold text-[#131b2e]">Resale Property</span>
                  </label>
                </div>
                {errors.listingType && <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.listingType.message}</p>}
              </div>
            </div>

            {/* RECONSTRUCTION / RENOVATION STATUS (REQUIRED ONLY FOR RESALE PROPERTY) */}
            {isResale && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-600" /> Reconstruction / Renovation Status <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  {...register('reconstructionNeeded')}
                  className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm outline-none bg-white font-semibold text-[#131b2e]"
                >
                  <option value="">-- Select Renovation Status --</option>
                  {RENOVATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-amber-700 font-medium">This status will factor directly into the AI Price Valuation.</p>
                {errors.reconstructionNeeded && (
                  <p className="text-xs text-[#ba1a1a] mt-1 font-bold">{errors.reconstructionNeeded.message}</p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">
                DESCRIPTION
              </label>
              <textarea
                rows={4}
                placeholder="Highlight unique selling points, architectural details, neighborhood perks..."
                {...register('description')}
                className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] focus:border-[#0058be] focus:ring-2 focus:ring-[#adc6ff] text-sm outline-none transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* CARD 2: LOCATION DETAILS */}
      {showLocation && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e2e7ff] shadow-ambient space-y-6">
          <div className="border-b border-[#f2f3ff] pb-4">
            <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#006947]" /> Location Details
            </h3>
            <p className="text-xs text-[#727785] mt-1">Specify state, city, area locality, and complete address</p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">
                  STATE <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  {...register('state')}
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] bg-[#f2f3ff] text-[#131b2e] text-sm font-semibold outline-none focus:border-[#0058be]"
                >
                  <option value="Gujarat">Gujarat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">
                  CITY <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  {...register('city')}
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] bg-[#f2f3ff] text-[#131b2e] text-sm font-semibold outline-none focus:border-[#0058be]"
                >
                  <option value="Ahmedabad">Ahmedabad</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">
                AREA / LOCALITY <span className="text-[#ba1a1a]">*</span>
              </label>
              <select
                {...register('locality')}
                className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] focus:border-[#0058be] focus:ring-2 focus:ring-[#adc6ff] text-sm outline-none transition text-[#131b2e]"
              >
                <option value="">-- Select Area / Locality --</option>
                {localitiesList.map((loc, idx) => (
                  <option key={idx} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              {errors.locality && <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.locality.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">
                COMPLETE ADDRESS <span className="text-[#ba1a1a]">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter building name, street, landmarks, and area address"
                {...register('fullAddress')}
                className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] focus:border-[#0058be] focus:ring-2 focus:ring-[#adc6ff] text-sm outline-none transition"
              />
              {errors.fullAddress && <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.fullAddress.message}</p>}
            </div>

            {/* Interactive Leaflet Location Map */}
            <LocationMap />
          </div>
        </div>
      )}
    </div>
  );
}
