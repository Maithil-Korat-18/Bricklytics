import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { 
  Building, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Waves, 
  Dumbbell, 
  Zap, 
  Trees, 
  Car, 
  Camera, 
  Baby, 
  Footprints, 
  Gamepad2, 
  PhoneCall, 
  Flame, 
  Sun, 
  Droplets,
  ArrowUpFromLine,
  Home
} from 'lucide-react';
import AMENITIES_BY_TYPE from '../../../constants/amenitiesData';

const ICON_MAP = {
  Parking: Car,
  Lift: ArrowUpFromLine,
  Gym: Dumbbell,
  'Swimming Pool': Waves,
  Clubhouse: Building,
  'Power Backup': Zap,
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
};

export default function Step2PropertyDetails() {
  const { register, watch, control, formState: { errors } } = useFormContext();

  const propertyType = watch('propertyType') || 'Flat / Apartment';
  const listingType = watch('listingType') || 'New Property';
  const isFlat = propertyType === 'Flat / Apartment';
  const isNew = listingType === 'New Property';

  const amenitiesList = AMENITIES_BY_TYPE[propertyType] || AMENITIES_BY_TYPE['Flat / Apartment'];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* CARD 3: PROPERTY SPECIFICATIONS */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" /> 3. Property Specifications ({propertyType})
          </h3>
          <p className="text-xs text-slate-500 mt-1">Specify room configurations and layout dimensions</p>
        </div>

        {isFlat ? (
          /* FLAT / APARTMENT SPECIFICATIONS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Project Name</label>
              <input
                type="text"
                placeholder="e.g. Godrej Garden City"
                {...register('projectName')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">BHK Configuration</label>
              <select {...register('bhk')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 bg-white">
                <option value="">-- Select BHK --</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Bedrooms</label>
              <input type="number" min="0" placeholder="e.g. 3" {...register('bedrooms')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Bathrooms</label>
              <input type="number" min="0" placeholder="e.g. 2" {...register('bathrooms')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Balconies</label>
              <input type="number" min="0" placeholder="e.g. 1" {...register('balconies')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Carpet Area (sq.ft) <span className="text-red-500">*</span>
              </label>
              <input type="number" min="1" placeholder="e.g. 1450" {...register('carpetArea')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500" />
              {errors.carpetArea && <p className="text-xs text-red-500 mt-1 font-medium">{errors.carpetArea.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Built-up Area (sq.ft)</label>
              <input type="number" min="1" placeholder="e.g. 1650" {...register('builtUpArea')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Super Built-up Area (sq.ft)</label>
              <input type="number" min="1" placeholder="e.g. 1850" {...register('superBuiltUpArea')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Floor Number</label>
              <input type="number" min="0" placeholder="e.g. 5" {...register('floorNumber')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Total Floors</label>
              <input type="number" min="1" placeholder="e.g. 14" {...register('totalFloors')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Facing</label>
              <select {...register('facing')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select Facing --</option>
                <option value="East">East</option>
                <option value="North">North</option>
                <option value="North-East">North-East</option>
                <option value="West">West</option>
                <option value="South">South</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Furnishing Status</label>
              <select {...register('furnishing')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select Furnishing --</option>
                <option value="Unfurnished">Unfurnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Fully Furnished">Fully Furnished</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Property Age (Years)</label>
              <input type="number" min="0" placeholder="e.g. 2" {...register('propertyAge')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Parking</label>
              <select {...register('parking')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select Parking --</option>
                <option value="Yes">Covered Parking</option>
                <option value="Open">Open Parking</option>
                <option value="No">None</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lift</label>
              <select {...register('lift')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select Lift --</option>
                <option value="Yes">Available (High-speed Elevators)</option>
                <option value="No">Not Available</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Power Backup</label>
              <select {...register('powerBackup')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select Power Backup --</option>
                <option value="Full">Full Power Backup</option>
                <option value="Partial">Partial (Common Areas)</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>
        ) : (
          /* VILLA / HOUSE SPECIFICATIONS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">House Type</label>
              <select {...register('houseType')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select House Type --</option>
                <option value="Independent Villa">Independent Villa</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Row House">Row House</option>
                <option value="Duplex">Duplex</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">BHK Configuration</label>
              <select {...register('bhk')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select BHK --</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Bedrooms</label>
              <input type="number" min="0" placeholder="e.g. 4" {...register('bedrooms')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Bathrooms</label>
              <input type="number" min="0" placeholder="e.g. 4" {...register('bathrooms')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Balconies</label>
              <input type="number" min="0" placeholder="e.g. 2" {...register('balconies')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Land Area (sq.yard / sq.ft)</label>
              <input type="number" min="1" placeholder="e.g. 2500" {...register('landArea')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Built-up Area (sq.ft) <span className="text-red-500">*</span>
              </label>
              <input type="number" min="1" placeholder="e.g. 3200" {...register('carpetArea')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500" />
              {errors.carpetArea && <p className="text-xs text-red-500 mt-1 font-medium">{errors.carpetArea.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Number of Floors</label>
              <input type="number" min="1" placeholder="e.g. 2" {...register('totalFloors')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Garden</label>
              <select {...register('garden')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select Garden Option --</option>
                <option value="Yes">Private Garden</option>
                <option value="No">No Garden</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Terrace</label>
              <select {...register('terrace')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select Terrace Option --</option>
                <option value="Private Terrace">Private Terrace Access</option>
                <option value="None">None</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Parking</label>
              <select {...register('parking')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select Parking Option --</option>
                <option value="Private Garage">Private Garage / Covered Driveway</option>
                <option value="Open">Open Yard Parking</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Facing</label>
              <select {...register('facing')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select Facing --</option>
                <option value="East">East</option>
                <option value="North">North</option>
                <option value="North-East">North-East</option>
                <option value="West">West</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Furnishing Status</label>
              <select {...register('furnishing')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="">-- Select Furnishing --</option>
                <option value="Unfurnished">Unfurnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Fully Furnished">Fully Furnished</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Property Age (Years)</label>
              <input type="number" min="0" placeholder="e.g. 1" {...register('propertyAge')} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* CARD 4: BUILDER & PROJECT DETAILS (LIGHT THEME - ONLY FOR NEW PROPERTY) */}
      {isNew && (
        <div className="bg-slate-50/80 p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" /> 4. Builder & Project Details (New Property)
            </h3>
            <p className="text-xs text-slate-500 mt-1">Details required for developer & under-construction inventory</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Builder Name</label>
              <input
                type="text"
                placeholder="e.g. Adani Realty / Shaligram Group"
                {...register('builderName')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Project Name</label>
              <input
                type="text"
                placeholder="e.g. Shaligram Prime"
                {...register('projectName')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">RERA Registration Number</label>
              <input
                type="text"
                placeholder="e.g. PR/GJ/AHMEDABAD/..."
                {...register('reraNumber')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Possession Status</label>
              <select {...register('possessionStatus')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-indigo-500">
                <option value="">-- Select Status --</option>
                <option value="Ready to Move">Ready to Move</option>
                <option value="Under Construction">Under Construction</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Possession Date</label>
              <input
                type="month"
                {...register('possessionDate')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* CARD 5: PROPERTY AMENITIES & FEATURES */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> 5. Property Amenities & Features ({propertyType})
          </h3>
          <p className="text-xs text-slate-500 mt-1">Select all features available at the property using icon cards</p>
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
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500/40 text-white' : 'bg-slate-200/70 text-slate-600 group-hover:bg-slate-300/70'}`}>
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
