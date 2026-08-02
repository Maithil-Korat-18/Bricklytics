import React, { useState } from 'react';
import { Building2, CheckCircle2, Mail, Phone, Save, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/ToastContext';

export default function SellerProfilePage() {
  const { user } = useAuth();
  const { showSuccess } = useToast();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    showSuccess('Seller profile information updated successfully!');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span>Seller Profile</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Manage your seller account and contact information.</p>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card-soft sm:p-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-extrabold text-white shadow-md shadow-blue-500/20">
            {formData.first_name?.[0] || user?.full_name?.[0] || 'S'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.full_name || 'Seller Account'}</h2>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold uppercase tracking-wider text-blue-600">Seller Account</span>
              <span className="flex items-center font-semibold text-emerald-600"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Verified Email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField label="First Name" icon={User} value={formData.first_name} onChange={(value) => setFormData({ ...formData, first_name: value })} />
            <ProfileField label="Last Name" icon={User} value={formData.last_name} onChange={(value) => setFormData({ ...formData, last_name: value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField label="Email Address" icon={Mail} value={formData.email} disabled />
            <ProfileField label="Phone Number" icon={Phone} value={formData.phone_number} onChange={(value) => setFormData({ ...formData, phone_number: value })} />
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700">
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileField({ label, icon: Icon, value, onChange, disabled = false }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type={label === 'Email Address' ? 'email' : 'text'}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm font-semibold focus:outline-none ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-600'}`}
        />
      </div>
    </label>
  );
}
