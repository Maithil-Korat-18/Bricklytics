import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { 
  Dumbbell, 
  ArrowUpFromLine, 
  Waves, 
  Building, 
  ShieldCheck, 
  Camera, 
  Trees, 
  Baby, 
  Footprints, 
  Gamepad2, 
  Zap, 
  Car, 
  Landmark, 
  ShoppingBag, 
  Stethoscope, 
  GraduationCap, 
  Train 
} from 'lucide-react';

const availableAmenities = [
  { id: 'Gym', label: 'Gymnasium', icon: Dumbbell },
  { id: 'Lift', label: 'High-speed Elevators', icon: ArrowUpFromLine },
  { id: 'Swimming Pool', label: 'Swimming Pool', icon: Waves },
  { id: 'Clubhouse', label: 'Clubhouse', icon: Building },
  { id: 'Security', label: '24x7 Security', icon: ShieldCheck },
  { id: 'CCTV', label: 'CCTV Surveillance', icon: Camera },
  { id: 'Garden', label: 'Landscaped Garden', icon: Trees },
  { id: 'Children Park', label: "Children's Play Area", icon: Baby },
  { id: 'Jogging Track', label: 'Jogging Track', icon: Footprints },
  { id: 'Indoor Games', label: 'Indoor Games Room', icon: Gamepad2 },
  { id: 'Power Backup', label: 'Power Backup', icon: Zap },
  { id: 'Parking', label: 'Covered Parking', icon: Car },
  { id: 'Temple', label: 'Community Temple', icon: Landmark },
  { id: 'Shopping Mall Nearby', label: 'Shopping Mall Nearby', icon: ShoppingBag },
  { id: 'Hospital Nearby', label: 'Hospital Nearby', icon: Stethoscope },
  { id: 'School Nearby', label: 'School Nearby', icon: GraduationCap },
  { id: 'Metro Nearby', label: 'Metro Station Nearby', icon: Train },
];

export default function AmenitiesSelector() {
  const { control } = useFormContext();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">6. Property Amenities & Features</h2>
        <p className="text-xs text-slate-400 mt-0.5">Select all relevant facilities available at the property</p>
      </div>

      <Controller
        name="amenities"
        control={control}
        render={({ field: { value = [], onChange } }) => (
          <div className="flex flex-wrap gap-3">
            {availableAmenities.map((item) => {
              const isSelected = value.includes(item.id);
              const Icon = item.icon;

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
                    inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer
                    ${isSelected 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      />
    </div>
  );
}
