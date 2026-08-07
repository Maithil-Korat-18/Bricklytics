import React, { useState, useEffect } from 'react';
import {
  Building2, CheckCircle2, Mail, Phone, Save, User, ShieldCheck,
  TrendingUp, MessageSquare, Clock, Award, Sparkles, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/ToastContext';
import { propertyApi } from '../../services/propertyApi';

export default function SellerProfilePage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    company: 'Apex Developers & Realty',
    about: 'Verified premium real estate developer and seller active across Ahmedabad.',
    total_properties: 0,
    total_inquiries: 0,
    response_rate: 98,
    avg_response_time: '< 15 mins',
  });

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await propertyApi.getProfile();
        if (res.data) {
          setProfileData((prev) => ({
            ...prev,
            ...res.data,
            first_name: res.data.first_name || user?.first_name || '',
            last_name: res.data.last_name || user?.last_name || '',
            email: res.data.email || user?.email || '',
            phone_number: res.data.phone_number || user?.phone_number || '',
          }));
        }
      } catch (err) {
        console.warn('Using local profile state:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await propertyApi.updateProfile({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone_number: profileData.phone_number,
      });
      showSuccess('Seller profile information updated successfully!');
    } catch (err) {
      showError('Failed to update seller profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span>Seller Profile & Account Settings</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Manage your seller credentials, contact details, and developer bio.</p>
      </div>

      {/* Seller Header Avatar Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card-soft sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 pb-6 text-center sm:text-left">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-3xl font-black text-white shadow-xl ring-4 ring-blue-500/20">
              {profileData.first_name?.[0] || user?.full_name?.[0] || 'S'}
            </div>
            <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-white" title="Active Verified Seller" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                {profileData.first_name} {profileData.last_name}
              </h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-extrabold text-blue-600 border border-blue-200">
                Verified Seller
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500">{profileData.company}</p>
            <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-500">
              <span className="flex items-center font-semibold text-emerald-600">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Identity Verified
              </span>
              <span className="flex items-center font-semibold text-slate-500">
                <ShieldCheck className="mr-1 h-3.5 w-3.5 text-blue-600" /> RERA Partner
              </span>
            </div>
          </div>
        </div>

        {/* Portfolio Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Listings</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{profileData.total_properties || 0}</p>
          </div>
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
            <span className="text-[10px] font-extrabold uppercase text-blue-600">Inquiries Received</span>
            <p className="text-xl font-black text-blue-700 mt-0.5">{profileData.total_inquiries || 0}</p>
          </div>
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
            <span className="text-[10px] font-extrabold uppercase text-emerald-600">Response Rate</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{profileData.response_rate}%</p>
          </div>
          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
            <span className="text-[10px] font-extrabold uppercase text-indigo-600">Avg Response</span>
            <p className="text-xl font-black text-indigo-700 mt-0.5">{profileData.avg_response_time}</p>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField
              label="First Name"
              icon={User}
              value={profileData.first_name}
              onChange={(value) => setProfileData({ ...profileData, first_name: value })}
            />
            <ProfileField
              label="Last Name"
              icon={User}
              value={profileData.last_name}
              onChange={(value) => setProfileData({ ...profileData, last_name: value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField
              label="Email Address"
              icon={Mail}
              value={profileData.email}
              disabled
            />
            <ProfileField
              label="Phone Number"
              icon={Phone}
              value={profileData.phone_number}
              onChange={(value) => setProfileData({ ...profileData, phone_number: value })}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Developer / Company Name</span>
            <input
              type="text"
              value={profileData.company}
              onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">About / Developer Bio</span>
            <textarea
              rows={3}
              value={profileData.about}
              onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile Changes</span>
                </>
              )}
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
          className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm font-semibold focus:outline-none ${
            disabled
              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500'
              : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-600'
          }`}
        />
      </div>
    </label>
  );
}
