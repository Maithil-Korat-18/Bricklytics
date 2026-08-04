import React, { useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Building, Sparkles, Check, ShieldCheck, Waves, Dumbbell, Trees, Car, Camera, Baby, Footprints, Gamepad2, PhoneCall, Flame, Sun, Droplets, Home,X,School,Hospital,Train,ShoppingBag,Heart, Banknote} from 'lucide-react';
import AMENITIES_BY_TYPE from '../../../constants/amenitiesData';

const ICON_MAP = {Gym: Dumbbell,
  'Swimming Pool': Waves,
  Clubhouse: Building,
  Security: ShieldCheck,
  CCTV: Camera,
  Garden: Trees,
  'Children Play Area': Baby,
  'Jogging Track': Footprints,
  'Indoor Games': Gamepad2,
  'Visitor Parking': Car,
  Intercom: PhoneCall,
  'Fire Safety': Flame,
  Terrace: Home,
  'Private Lawn': Trees,
  'Private Parking': Car,
  'Solar Power': Sun,
  'Rain Water Harvesting': Droplets,
  'Community Temple': Heart,
  'Nearby School': School,
  'Nearby Hospital': Hospital,
  'Nearby Metro Station': Train,
  'Nearby Shopping Mall': ShoppingBag,
  'Nearby ATM/Bank': Banknote

};


export default function Step2PropertyDetails() {
  const { register, watch, setValue, control, formState: { errors } } = useFormContext();

  const propertyType = watch('propertyType') || 'Flat / Apartment';
  const listingType = watch('listingType') || 'New Property';
  const totalFloors = Number(watch('totalFloors')) || 0;
  const unitsPerFloor = Number(watch('unitsPerFloor')) || 0;
  const unitsSold = Number(watch('unitsSold')) || 0;
  const sampleHouseReady = watch('sampleHouseReady') || false;

  const isFlat = propertyType === 'Flat / Apartment';
  const isNew = listingType === 'New Property';

  // Auto-calculate Total Units and Available Units
  const computedTotalUnits = totalFloors * unitsPerFloor;
  const computedAvailableUnits = Math.max(0, computedTotalUnits - unitsSold);

  useEffect(() => {
    if (isFlat && totalFloors > 0 && unitsPerFloor > 0) {
      setValue('totalUnits', computedTotalUnits);
    }
  }, [totalFloors, unitsPerFloor, isFlat, setValue]);

  const amenitiesList = AMENITIES_BY_TYPE[propertyType] || AMENITIES_BY_TYPE['Flat / Apartment'];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* CARD 3: PROPERTY SPECIFICATIONS */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e2e7ff] shadow-ambient space-y-6">
        <div className="border-b border-[#f2f3ff] pb-4">
          <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
            <Building className="w-5 h-5 text-[#0058be]" /> Property Specifications ({propertyType})
          </h3>
          <p className="text-xs text-[#727785] mt-1">Specify room configurations and layout dimensions</p>
        </div>

        {isFlat ? (
          /* FLAT / APARTMENT SPECIFICATIONS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">BHK Configuration</label>
              <select {...register('bhk')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none focus:border-[#0058be] bg-white text-[#131b2e] font-medium">
                <option value="">-- Select BHK --</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Bedrooms</label>
              <input type="number" min="0" placeholder="e.g. 3" {...register('bedrooms')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Bathrooms</label>
              <input type="number" min="0" placeholder="e.g. 2" {...register('bathrooms')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Balconies</label>
              <input type="number" min="0" placeholder="e.g. 1" {...register('balconies')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">
                Carpet Area (sq.ft) <span className="text-[#ba1a1a]">*</span>
              </label>
              <input type="number" min="1" placeholder="e.g. 1450" {...register('carpetArea')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none focus:border-[#0058be] text-[#131b2e]" />
              {errors.carpetArea && <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.carpetArea.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Built-up Area (sq.ft)</label>
              <input type="number" min="1" placeholder="e.g. 1650" {...register('builtUpArea')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div>

            {/* <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Total Floors in Building</label>
              <input type="number" min="1" placeholder="e.g. 14" {...register('totalFloors')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Units / Flats per Floor</label>
              <input type="number" min="1" placeholder="e.g. 4" {...register('unitsPerFloor')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div> */}

            {/* Auto Calculated Total & Available Units */}
            {/* <div className="p-3.5 rounded-xl bg-[#f2f3ff] border border-[#d8e2ff] space-y-1">
              <span className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider block">Total Units in Building</span>
              <div className="text-lg font-black text-[#0058be]">{computedTotalUnits > 0 ? `${computedTotalUnits} Total Flats` : 'Enter Floors & Units'}</div>
            </div> */}

            {/* <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Units / Flats Sold</label>
              <input type="number" min="0" placeholder="e.g. 12" {...register('unitsSold')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div> */}

            {/* <div className="p-3.5 rounded-xl bg-[#f5fff6] border border-[#00855b]/30 space-y-1">
              <span className="text-[11px] font-bold text-[#006947] uppercase tracking-wider block">Available Units Left</span>
              <div className="text-lg font-black text-[#006947]">{computedTotalUnits > 0 ? `${computedAvailableUnits} Units Left` : '--'}</div>
            </div> */}

            {/* <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Floor Number of Listing</label>
              <input type="number" min="0" placeholder="e.g. 5" {...register('floorNumber')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div> */}

            {/* <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Furnishing Status</label>
              <select {...register('furnishing')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none bg-white text-[#131b2e] font-medium">
                <option value="">-- Select Furnishing --</option>
                <option value="Unfurnished">Unfurnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Fully Furnished">Fully Furnished</option>
              </select>
            </div> */}
             {isNew && (
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Is Sample House Ready?</label>
              <div className="flex items-center space-x-6 pt-2">
                <label className="inline-flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sampleHouseReady"
                    checked={sampleHouseReady === true}
                    onChange={() => setValue('sampleHouseReady', true)}
                    className="w-4 h-4 text-[#0058be] focus:ring-[#0058be]"
                  />
                  <span className="text-sm font-semibold text-[#131b2e]">Yes</span>
                </label>
                <label className="inline-flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sampleHouseReady"
                    checked={sampleHouseReady === false}
                    onChange={() => setValue('sampleHouseReady', false)}
                    className="w-4 h-4 text-[#0058be] focus:ring-[#0058be]"
                  />
                  <span className="text-sm font-semibold text-[#131b2e]">No</span>
                </label>
              </div>
            </div>
             )}

            {/* SHOW FACING DIRECTION & PROPERTY AGE ONLY FOR RESALE PROPERTIES */}
            {!isNew && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Facing Direction (Resale)</label>
                  <select {...register('facing')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none bg-white text-[#131b2e] font-medium">
                    <option value="">-- Select Facing --</option>
                    <option value="East">East</option>
                    <option value="North">North</option>
                    <option value="North-East">North-East</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Property Age (Years)</label>
                  <input type="number" min="0" placeholder="e.g. 3" {...register('propertyAge')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
                </div>
              </>
            )}
          </div>
        ) : (
          /* VILLA / HOUSE SPECIFICATIONS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">House Type</label>
              <select {...register('houseType')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none bg-white text-[#131b2e] font-medium">
                <option value="">-- Select House Type --</option>
                <option value="Independent Villa">Independent Villa</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Row House">Row House</option>
                <option value="Duplex">Duplex</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">BHK Configuration</label>
              <select {...register('bhk')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none bg-white text-[#131b2e] font-medium">
                <option value="">-- Select BHK --</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Bedrooms</label>
              <input type="number" min="0" placeholder="e.g. 4" {...register('bedrooms')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Bathrooms</label>
              <input type="number" min="0" placeholder="e.g. 4" {...register('bathrooms')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Balconies</label>
              <input type="number" min="0" placeholder="e.g. 2" {...register('balconies')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Land Area (sq.yard / sq.ft)</label>
              <input type="number" min="1" placeholder="e.g. 2500" {...register('landArea')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">
                Built-up Area (sq.ft) <span className="text-[#ba1a1a]">*</span>
              </label>
              <input type="number" min="1" placeholder="e.g. 3200" {...register('carpetArea')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none focus:border-[#0058be] text-[#131b2e]" />
              {errors.carpetArea && <p className="text-xs text-[#ba1a1a] mt-1 font-medium">{errors.carpetArea.message}</p>}
            </div>

            {/* <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Basic Layout Type</label>
              <select {...register('layoutType')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none bg-white text-[#131b2e] font-medium">
                <option value="">-- Select Layout Type --</option>
                <option value="1-Floor Open Plan">1-Floor Open Plan</option>
                <option value="2-Floor Duplex">2-Floor Duplex Layout</option>
                <option value="Traditional 3-Story">Traditional 3-Story Layout</option>
              </select>
            </div> */}
            {isNew && (
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Is Sample House Ready?</label>
              <div className="flex items-center space-x-6 pt-2">
                <label className="inline-flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sampleHouseReady"
                    checked={sampleHouseReady === true}
                    onChange={() => setValue('sampleHouseReady', true)}
                    className="w-4 h-4 text-[#0058be] focus:ring-[#0058be]"
                  />
                  <span className="text-sm font-semibold text-[#131b2e]">Yes</span>
                </label>
                <label className="inline-flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sampleHouseReady"
                    checked={sampleHouseReady === false}
                    onChange={() => setValue('sampleHouseReady', false)}
                    className="w-4 h-4 text-[#0058be] focus:ring-[#0058be]"
                  />
                  <span className="text-sm font-semibold text-[#131b2e]">No</span>
                </label>
              </div>
            </div>
             )}

            {/* SHOW FACING DIRECTION & PROPERTY AGE ONLY FOR RESALE PROPERTIES */}
            {!isNew && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Facing Direction (Resale)</label>
                  <select {...register('facing')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none bg-white text-[#131b2e] font-medium">
                    <option value="">-- Select Facing --</option>
                    <option value="East">East</option>
                    <option value="North">North</option>
                    <option value="North-East">North-East</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Property Age (Years)</label>
                  <input type="number" min="0" placeholder="e.g. 2" {...register('propertyAge')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] text-sm outline-none text-[#131b2e]" />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* CARD 5: BUILDER & PROJECT DETAILS (ONLY FOR NEW PROPERTY) */}
      {isNew && (
        <div className="bg-[#f2f3ff]/80 p-6 sm:p-8 rounded-2xl border border-[#d8e2ff] shadow-ambient space-y-6">
          <div className="border-b border-[#dae2fd] pb-4">
            <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0058be]" /> Builder & Project Details
            </h3>
            <p className="text-xs text-[#727785] mt-1">Details required for developer & under-construction inventory</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Builder Name</label>
              <input
                type="text"
                placeholder="e.g. Adani Realty / Shaligram Group"
                {...register('builderName')}
                className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] bg-white text-[#131b2e] placeholder-[#727785] text-sm outline-none focus:border-[#0058be]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Project Name</label>
              <input
                type="text"
                placeholder="e.g. Shaligram Prime"
                {...register('projectName')}
                className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] bg-white text-[#131b2e] placeholder-[#727785] text-sm outline-none focus:border-[#0058be]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">RERA Registration Number</label>
              <input
                type="text"
                placeholder="e.g. PR/GJ/AHMEDABAD/..."
                {...register('reraNumber')}
                className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] bg-white text-[#131b2e] placeholder-[#727785] text-sm outline-none focus:border-[#0058be]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Possession Status</label>
              <select {...register('possessionStatus')} className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] bg-white text-[#131b2e] text-sm outline-none focus:border-[#0058be]">
                <option value="">-- Select Status --</option>
                <option value="Ready to Move">Ready to Move</option>
                <option value="Under Construction">Under Construction</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5">Possession Date</label>
              <input
                type="month"
                {...register('possessionDate')}
                className="w-full px-4 py-3 rounded-xl border border-[#c2c6d6] bg-white text-[#131b2e] text-sm outline-none focus:border-[#0058be]"
              />
            </div>
          </div>
        </div>
      )}

      {/* CARD 6: PROPERTY AMENITIES & FEATURES */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e2e7ff] shadow-ambient space-y-6">
        <div className="border-b border-[#f2f3ff] pb-4">
          <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Property Amenities & Features ({propertyType})
          </h3>
          <p className="text-xs text-[#727785] mt-1">Select all features available at the property using icon cards</p>
        </div>

        <Controller
          name="amenities"
          control={control}
          render={({ field: { value = [], onChange } }) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {amenitiesList.map((item) => {
                const isSelected = value.includes(item.id);
                const IconComponent = ICON_MAP[item.id] || Sparkles;

                const toggleAmenity = () => {
                  if (isSelected) {
                    onChange(value.filter((id) => id !== item.id));
                  } else {
                    onChange([...value, item.id]);
                  }
                };

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={toggleAmenity}
                    className={`
                      p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer group
                      ${isSelected
                        ? 'bg-[#0058be] text-white border-[#0058be] shadow-md'
                        : 'bg-[#f2f3ff] text-[#424754] border-[#c2c6d6] hover:bg-[#eaedff]'}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-[#d8e2ff] text-[#0058be]'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>
    </div>
  );
}
