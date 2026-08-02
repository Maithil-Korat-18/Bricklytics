import React from 'react';
import TextInput from './primitives/TextInput';
import SelectInput from './primitives/SelectInput';
import { useFormContext } from 'react-hook-form';

export default function BuilderSection() {
  const { watch } = useFormContext();
  const saleType = watch('saleType');

  if (saleType === 'resale') {
    return null;
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">5. Builder & Project Details</h2>
        <p className="text-xs text-slate-400 mt-0.5">Developer credentials, RERA registration, and possession timeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TextInput name="builderName" label="Builder / Developer Name" placeholder="e.g. Prestige Group" />
        <TextInput name="projectName" label="Project Name" placeholder="e.g. Prestige Tech Towers" />
        <TextInput name="reraNumber" label="RERA Registration No." placeholder="e.g. PRM/KA/RERA/..." />
        <SelectInput name="possessionStatus" label="Possession Status" options={['Ready', 'Under Construction']} />
        <TextInput name="possessionDate" label="Possession Date" type="date" />
      </div>
    </div>
  );
}
