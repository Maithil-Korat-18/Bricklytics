import React from 'react';
import PriceInput from './primitives/PriceInput';
import NumberInput from './primitives/NumberInput';
import { useFormContext } from 'react-hook-form';

export default function PricingSection() {
  const { register } = useFormContext();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">4. Pricing & Commercial Terms</h2>
        <p className="text-xs text-slate-400 mt-0.5">Listing valuation, maintenance fees, and deposit</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PriceInput name="expectedPrice" label="Expected Price ($ / ₹)" required />
        <NumberInput name="maintenanceCharges" label="Maintenance Charges / Mo" min={0} />
        <NumberInput name="bookingAmount" label="Booking / Token Amount" min={0} />

        <div className="md:col-span-3 flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="negotiable"
            {...register('negotiable')}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300 cursor-pointer"
          />
          <label htmlFor="negotiable" className="text-sm font-semibold text-slate-700 cursor-pointer">
            Price is Negotiable
          </label>
        </div>
      </div>
    </div>
  );
}
