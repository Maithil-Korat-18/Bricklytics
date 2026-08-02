import React from 'react';
import TextInput from './primitives/TextInput';

export default function LocationSection({ hidePincode = false }) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">2. Location Details</h2>
        <p className="text-xs text-slate-400 mt-0.5">Geographic position and full street address</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TextInput name="country" label="Country" placeholder="e.g. United States / India" required />
        <TextInput name="state" label="State" placeholder="e.g. California / Maharashtra" required />
        <TextInput name="city" label="City" placeholder="e.g. Los Angeles / Mumbai" required />
        <div className="md:col-span-2">
          <TextInput name="locality" label="Area / Locality" placeholder="e.g. Beverly Hills / Bandra West" required />
        </div>
        {!hidePincode && <TextInput name="pincode" label="Pincode / Zip Code" placeholder="6 digits (e.g. 400050)" required maxLength={6} />}
        <div className="md:col-span-3">
          <TextInput name="fullAddress" label="Full Address" placeholder="Street address, building number, landmark..." required />
        </div>
      </div>
    </div>
  );
}
