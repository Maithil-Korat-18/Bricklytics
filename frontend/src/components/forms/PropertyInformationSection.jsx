import React from 'react';
import TextInput from './primitives/TextInput';
import SelectInput from './primitives/SelectInput';
import TextArea from './primitives/TextArea';
import { useFormContext } from 'react-hook-form';
import { Wrench } from 'lucide-react';

const RENOVATION_OPTIONS = [
  'Never Renovated',
  'Minor Renovation',
  'Major Renovation',
  'Fully Reconstructed',
  'Newly Renovated',
];

export default function PropertyInformationSection() {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const saleType = watch('saleType');
  const listingType = watch('listingType');

  const isResale = saleType === 'resale' || listingType === 'Resale Property';

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">1. Property Information</h2>
        <p className="text-xs text-slate-400 mt-0.5">Basic title, property type, sale classification, and description</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Title */}
        <div className="md:col-span-2">
          <TextInput
            name="title"
            label="Property Title"
            placeholder="e.g. Modern Sunset Villa with Ocean View"
            required
            helperText="Provide a descriptive, attractive title for your listing (3-150 characters)."
          />
        </div>

        {/* Property Type */}
        <div>
          <SelectInput
            name="propertyType"
            label="Property Type"
            required
            options={['Flat / Apartment', 'Villa / House', 'Plot / Land']}
          />
        </div>

        {/* Sale Type (New vs Resale) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Sale Type <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="radio"
                value="new"
                checked={!isResale}
                onChange={() => {
                  setValue('saleType', 'new');
                  setValue('listingType', 'New Property', { shouldValidate: true });
                  setValue('reconstructionNeeded', '');
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>New Property</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="radio"
                value="resale"
                checked={isResale}
                onChange={() => {
                  setValue('saleType', 'resale');
                  setValue('listingType', 'Resale Property', { shouldValidate: true });
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Resale Property</span>
            </label>
          </div>
          {errors.saleType && (
            <p className="text-xs text-red-500 mt-1">{errors.saleType.message}</p>
          )}
        </div>

        {/* Reconstruction / Renovation Status (Required for Resale) */}
        {isResale && (
          <div className="md:col-span-2 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 animate-fadeIn">
            <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-600" /> Reconstruction / Renovation Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register('reconstructionNeeded')}
              className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm outline-none bg-white font-semibold text-slate-800"
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
              <p className="text-xs text-red-500 mt-1 font-bold">{errors.reconstructionNeeded.message}</p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="md:col-span-2">
          <TextArea
            name="description"
            label="Description"
            placeholder="Highlight unique selling points, architectural details, neighborhood perks..."
          />
        </div>
      </div>
    </div>
  );
}
