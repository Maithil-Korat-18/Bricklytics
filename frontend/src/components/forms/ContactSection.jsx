import React from 'react';
import TextInput from './primitives/TextInput';
import PhoneInput from './primitives/PhoneInput';
import SelectInput from './primitives/SelectInput';

export default function ContactSection() {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">8. Seller Contact Information</h2>
        <p className="text-xs text-slate-400 mt-0.5">Primary contact details for buyer inquiries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput name="sellerName" label="Seller / Agent Name" required />
        <PhoneInput name="phoneNumber" label="Phone Number" required />
        <TextInput name="email" label="Email Address" type="email" required />
        <SelectInput 
          name="preferredContactTime" 
          label="Preferred Contact Time" 
          options={['Anytime', 'Morning', 'Afternoon', 'Evening']} 
        />
      </div>
    </div>
  );
}
