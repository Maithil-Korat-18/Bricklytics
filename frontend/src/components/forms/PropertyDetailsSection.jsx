import React from 'react';
import NumberInput from './primitives/NumberInput';
import SelectInput from './primitives/SelectInput';
import { useFormContext } from 'react-hook-form';

export default function PropertyDetailsSection() {
  const { watch } = useFormContext();
  const propertyType = (watch('propertyType') || 'Apartment').toLowerCase();

  const isPlot = propertyType === 'plot';
  const isCommercial = ['commercial', 'office', 'shop'].includes(propertyType);
  const isResidential = !isPlot && !isCommercial;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">3. Property Specifications</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Specifications tailored for {watch('propertyType') || 'Apartment'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Residential Specific Fields */}
        {isResidential && (
          <>
            <SelectInput name="bhk" label="BHK Configuration" options={['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK', 'Studio']} />
            <NumberInput name="bedrooms" label="Bedrooms" min={0} />
            <NumberInput name="bathrooms" label="Bathrooms" min={0} />
            <NumberInput name="balconies" label="Balconies" min={0} />
          </>
        )}

        {/* Commercial Specific Fields */}
        {isCommercial && (
          <NumberInput name="bathrooms" label="Washrooms / Restrooms" min={0} />
        )}

        {/* Area Fields */}
        <NumberInput name="carpetArea" label={isPlot ? "Plot Area (sq ft)" : "Carpet Area (sq ft)"} required min={1} />
        
        {!isPlot && (
          <>
            <NumberInput name="builtUpArea" label="Built-up Area (sq ft)" min={1} />
            <NumberInput name="superBuiltUpArea" label="Super Built-up Area (sq ft)" min={0} />
            <NumberInput name="floorNumber" label="Floor Number" min={0} />
            <NumberInput name="totalFloors" label="Total Floors" min={0} />
          </>
        )}

        <NumberInput name="propertyAge" label="Property Age (Years)" min={0} />
        <SelectInput name="facing" label="Facing Direction" options={['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West']} />
        
        {!isPlot && (
          <>
            <SelectInput name="furnishing" label="Furnishing Status" options={['Unfurnished', 'Semi Furnished', 'Fully Furnished']} />
            <SelectInput name="parking" label="Dedicated Parking" options={['Yes', 'No']} />
            <SelectInput name="waterSupply" label="Water Supply" options={['24 Hours', 'Limited', 'None']} />
            <SelectInput name="powerBackup" label="Power Backup" options={['Yes', 'No']} />
          </>
        )}
      </div>
    </div>
  );
}

