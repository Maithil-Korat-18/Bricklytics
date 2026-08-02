import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Building, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { buyerApi } from '../../services/buyerApi';
import { useToast } from '../../components/common/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';

export default function ScheduleVisitPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(location.state?.propertyId || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduledVisits, setScheduledVisits] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [propsRes, visitsRes] = await Promise.allSettled([
          buyerApi.getProperties({ page_size: 20 }),
          buyerApi.getScheduledVisits()
        ]);

        if (propsRes.status === 'fulfilled' && propsRes.value?.data) {
          setProperties(propsRes.value.data.results || []);
          if (!selectedPropertyId && propsRes.value.data.results?.length > 0) {
            setSelectedPropertyId(propsRes.value.data.results[0].id);
          }
        }

        if (visitsRes.status === 'fulfilled' && visitsRes.value?.data) {
          setScheduledVisits(visitsRes.value.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId || !preferredDate || !preferredTime) {
      showError('Please complete all required visit fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await buyerApi.scheduleVisit({
        property_id: selectedPropertyId,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        notes,
      });

      showSuccess(res.message || 'Site visit requested successfully!');
      setScheduledVisits((prev) => [res.data, ...prev]);
      setPreferredDate('');
      setNotes('');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to schedule visit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <span>Schedule Property Site Visit</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Book an in-person walkthrough or guided tour with verified sellers in Ahmedabad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
          <h2 className="text-base font-bold text-slate-900">Request Visit Slot</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Select Property */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Property
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.locality || 'Ahmedabad'} (₹{(p.price / 100000).toFixed(1)} Lakhs)
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  value={preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Time Slot
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="10:00 AM">10:00 AM - Morning</option>
                  <option value="01:00 PM">01:00 PM - Afternoon</option>
                  <option value="04:00 PM">04:00 PM - Evening</option>
                  <option value="06:00 PM">06:00 PM - Sunset</option>
                </select>
              </div>
            </div>

            {/* Buyer Info Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Your Contact Details:</span>
              <p className="font-bold text-slate-900 text-sm">{user?.full_name} ({user?.phone_number})</p>
              <p className="text-slate-500">{user?.email}</p>
            </div>

            {/* Special Instructions / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Special Requests / Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention any specific requirements, virtual tour request, or parking questions..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Request Visit Booking</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Scheduled Visits Sidebar List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
          <h2 className="text-base font-bold text-slate-900">Your Booked Visits</h2>

          {scheduledVisits.length === 0 ? (
            <p className="text-xs text-slate-400">No upcoming visits booked yet.</p>
          ) : (
            <div className="space-y-3">
              {scheduledVisits.map((v) => (
                <div key={v.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between items-start font-bold text-slate-900">
                    <span className="line-clamp-1">{v.property_title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 uppercase">
                      {v.status}
                    </span>
                  </div>
                  <div className="text-slate-500 font-semibold flex items-center space-x-2 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{v.preferred_date} at {v.preferred_time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
