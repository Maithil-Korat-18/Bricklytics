import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Building2, CheckCircle2, ArrowRight, MessageSquare, Sparkles, Send, Phone, Mail, Heart, SlidersHorizontal } from 'lucide-react';
import { buyerApi } from '../../services/buyerApi';
import { useToast } from '../../components/common/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES, getPropertyDetailsPath } from '../../constants/routes';
import { getComparePropertyIds } from '../../utils/compareSelection';
import { getPropertyMediaUrl } from '../../utils/propertyMedia';

export default function ScheduleVisitPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [wishlistProperties, setWishlistProperties] = useState([]);
  const [comparePropertiesList, setComparePropertiesList] = useState([]);
  const [marketProperties, setMarketProperties] = useState([]);
  
  const [selectedPropertyId, setSelectedPropertyId] = useState(location.state?.propertyId || '');
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Request Type: 'visit' | 'inquiry' (Both removed per instructions)
  const [requestType, setRequestType] = useState('visit');
  
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [inquirySubject, setInquirySubject] = useState('Price & Property Details Inquiry');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduledVisits, setScheduledVisits] = useState([]);
  const [showAllVisits, setShowAllVisits] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const compareIds = getComparePropertyIds();

        const [propsRes, visitsRes, wishlistRes, compareRes] = await Promise.allSettled([
          buyerApi.getProperties({ page_size: 50 }),
          buyerApi.getScheduledVisits(),
          buyerApi.getWishlist(),
          compareIds.length > 0 ? buyerApi.compareProperties(compareIds) : Promise.resolve({ success: true, data: [] })
        ]);

        let allListings = [];
        if (propsRes.status === 'fulfilled' && propsRes.value?.data) {
          allListings = propsRes.value.data.results || [];
          setMarketProperties(allListings);
        }

        if (wishlistRes.status === 'fulfilled' && wishlistRes.value?.data) {
          const wItems = wishlistRes.value.data || [];
          // Resolve full property details for every wishlist item
          const resolvedWishlist = await Promise.all(
            wItems.map(async (item) => {
              const pid = item.property_id || item.id;
              const match = allListings.find((p) => String(p.id) === String(pid));
              if (match) return match;
              try {
                const detailRes = await buyerApi.getPropertyById(pid);
                if (detailRes?.data) return detailRes.data;
              } catch {}
              return { id: pid, title: item.property_title || item.title || 'Wishlist Property', price: item.price || 0 };
            })
          );
          setWishlistProperties(resolvedWishlist);
        }

        if (compareRes.status === 'fulfilled' && compareRes.value?.data) {
          setComparePropertiesList(compareRes.value.data || []);
        }

        if (visitsRes.status === 'fulfilled' && visitsRes.value?.data) {
          setScheduledVisits(visitsRes.value.data);
        }

        // Target initial property selection
        const initialId = location.state?.propertyId || (allListings.length > 0 ? allListings[0].id : '');
        setSelectedPropertyId(initialId);
      } catch (err) {
        console.error('Error loading schedule visit data:', err);
      }
    }
    loadData();
  }, [location.state?.propertyId]);

  // Helper to parse notes string into clean structured elements
  const parseNotes = (notesStr) => {
    if (!notesStr) return { type: 'Inquiry', subject: '', message: '' };
    const isVisit = notesStr.includes('[Site Visit Request]');
    const type = isVisit ? 'Site Visit' : 'Inquiry';
    
    let subject = '';
    let message = notesStr;

    const subjMatch = notesStr.match(/Subject:\s*([^\n]+)/);
    if (subjMatch) subject = subjMatch[1];

    const msgMatch = notesStr.match(/Message:\s*([\s\S]+)/);
    if (msgMatch) message = msgMatch[1];
    else message = notesStr.replace(/Type:[^\n]+\n?/, '').replace(/Subject:[^\n]+\n?/, '').trim();

    return { type, subject, message };
  };


  // Re-run selected property object match whenever selectedPropertyId updates
  useEffect(() => {
    if (!selectedPropertyId) return;
    const allCombined = [...marketProperties, ...comparePropertiesList, ...wishlistProperties];
    const found = allCombined.find((p) => String(p.id) === String(selectedPropertyId));
    if (found) setSelectedProperty(found);
  }, [selectedPropertyId, marketProperties, comparePropertiesList, wishlistProperties]);

  const handlePropertyChange = (e) => {
    const pid = e.target.value;
    setSelectedPropertyId(pid);
    const allCombined = [...marketProperties, ...comparePropertiesList, ...wishlistProperties];
    const found = allCombined.find((p) => String(p.id) === String(pid));
    setSelectedProperty(found || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      showError('Please select a property.');
      return;
    }

    if (requestType === 'visit' && (!preferredDate || !preferredTime)) {
      showError('Please select your preferred date and time slot for the site visit.');
      return;
    }

    setLoading(true);
    try {
      const typeLabel = requestType === 'visit' ? '[Site Visit Request]' : '[Property Inquiry]';
      const combinedNotes = `Type: ${typeLabel}\nSubject: ${inquirySubject}\n${notes ? `Message: ${notes}` : ''}`;

      const res = await buyerApi.scheduleVisit({
        property_id: selectedPropertyId,
        preferred_date: preferredDate || new Date().toISOString().split('T')[0],
        preferred_time: preferredTime || 'Flexible',
        notes: combinedNotes,
      });

      showSuccess(
        requestType === 'visit'
          ? 'Site visit requested successfully!'
          : 'Inquiry sent to seller successfully!'
      );

      setScheduledVisits((prev) => [res.data, ...prev]);
      setPreferredDate('');
      setNotes('');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <span>Schedule Visit & Buyer Inquiry</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select properties from your wishlist, compare list, or market listings to schedule an in-person meeting or send an inquiry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Container */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
          
          {/* STEP 1: Select Action Type */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Choose Request Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRequestType('visit')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  requestType === 'visit'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <Calendar className={`w-5 h-5 mb-2 ${requestType === 'visit' ? 'text-blue-600' : 'text-slate-400'}`} />
                <p className="font-bold text-sm">Schedule Site Visit</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Book an in-person walkthrough meeting slot</p>
              </button>

              <button
                type="button"
                onClick={() => setRequestType('inquiry')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  requestType === 'inquiry'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-600/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <MessageSquare className={`w-5 h-5 mb-2 ${requestType === 'inquiry' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className="font-bold text-sm">Send Direct Inquiry</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Ask custom questions & request RERA quotes</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2 border-t border-slate-100">
            {/* STEP 2: Select Property */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Select Target Property (Wishlist / Compare / Market)
              </label>
              <select
                value={selectedPropertyId}
                onChange={handlePropertyChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                {wishlistProperties.length > 0 && (
                  <optgroup label="⭐ Your Wishlist Properties">
                    {wishlistProperties.map((p) => (
                      <option key={`wish-${p.id}`} value={p.id}>
                       {p.title} {p.price ? `(₹${(p.price / 100000).toFixed(1)} L)` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}

                {comparePropertiesList.length > 0 && (
                  <optgroup label="⚖️ Your Compared Properties">
                    {comparePropertiesList.map((p) => (
                      <option key={`comp-${p.id}`} value={p.id}>
                         {p.title} (₹{(p.price / 100000).toFixed(1)} L)
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="🏠 All Active Properties">
                  {marketProperties.map((p) => (
                    <option key={`mkt-${p.id}`} value={p.id}>
                      {p.title} — {p.locality || 'Ahmedabad'} (₹{(p.price / 100000).toFixed(1)} L)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Selected Property Preview Banner */}
            {selectedProperty && (
              <div className="flex items-center gap-4 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                {selectedProperty.images?.[0]?.url ? (
                  <img
                    src={selectedProperty.images[0].url}
                    alt={selectedProperty.title}
                    className="w-14 h-14 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{selectedProperty.title}</p>
                  <p className="text-xs text-slate-500 truncate">{selectedProperty.locality || 'Ahmedabad'} • {selectedProperty.bhk ? `${selectedProperty.bhk} BHK` : ''}</p>
                  {selectedProperty.price && (
                    <p className="text-xs font-bold text-blue-700 mt-0.5">₹{(selectedProperty.price / 100000).toFixed(2)} Lakhs</p>
                  )}
                </div>
                <Link
                  to={getPropertyDetailsPath(selectedProperty.id)}
                  className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                >
                  View Details
                </Link>
              </div>
            )}

            {/* Date & Time Grid (for Visit) */}
            {requestType === 'visit' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preferred Visit Date <span className="text-red-500">*</span>
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
                    Preferred Time Slot <span className="text-red-500">*</span>
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
            )}

            {/* Inquiry Subject (for Inquiry) */}
            {requestType === 'inquiry' && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Inquiry Subject
                </label>
                <select
                  value={inquirySubject}
                  onChange={(e) => setInquirySubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="Price & Property Details Inquiry">Price & Property Details Inquiry</option>
                  <option value="RERA Approval & Document Verification">RERA Approval & Document Verification</option>
                  <option value="Payment Plan & Home Loan Quote">Payment Plan & Home Loan Quote</option>
                  <option value="Virtual Video Walkthrough Request">Virtual Video Walkthrough Request</option>
                  <option value="Custom Buyer Questions">Custom Buyer Questions</option>
                </select>
              </div>
            )}

            {/* Detailed Message / Special Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {requestType === 'visit' ? 'Special Instructions for Visit (Optional)' : 'Your Message / Inquiry Questions'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  requestType === 'visit'
                    ? 'e.g. Please arrange key access for parking area during walkthrough...'
                    : 'e.g. Please share the floor plan, expected possession timeline, and negotiation scope...'
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Buyer Contact Details Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Submitting as Verified Buyer:</span>
              <p className="font-bold text-slate-900 text-sm">{user?.first_name} {user?.last_name} ({user?.phone_number || 'Phone on file'})</p>
              <p className="text-slate-500">{user?.email}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {requestType === 'visit'
                      ? 'Submit Visit Booking Request'
                      : 'Send Property Inquiry'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar: Buyer Booked Visits & Sent Inquiries */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Your Activity & Bookings</h2>
            <span className="text-xs font-semibold text-slate-400">Showing {Math.min(5, scheduledVisits.length)} of {scheduledVisits.length}</span>
          </div>

          {scheduledVisits.length === 0 ? (
            <p className="text-xs text-slate-400">No requests submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {(showAllVisits ? scheduledVisits : scheduledVisits.slice(0, 5)).map((v) => {
                const { type, subject, message } = parseNotes(v.notes);
                const isConfirmed = v.status === 'confirmed';
                const propMatch = [...marketProperties, ...comparePropertiesList, ...wishlistProperties].find(
                  (p) => String(p.id) === String(v.property_id)
                );
                const coverImg = propMatch?.images?.find((img) => img.is_cover)?.url || propMatch?.images?.[0]?.url || v.property_image;

                return (
                  <div key={v.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2.5">
                    {/* Header with Property Image Thumbnail */}
                    <div className="flex items-center gap-3">
                      {coverImg ? (
                        <img
                          src={getPropertyMediaUrl(coverImg)}
                          alt={v.property_title || 'Property'}
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-xs shrink-0 border border-blue-100">
                          <Building2 className="w-6 h-6 text-blue-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900 block text-sm truncate">{v.property_title}</span>
                        {propMatch?.locality && <span className="text-slate-400 text-[11px] truncate block">{propMatch.locality}</span>}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isConfirmed ? 'Meeting Scheduled' : v.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        type === 'Site Visit' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                      }`}>
                        {type}
                      </span>
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        {v.preferred_date} at {v.preferred_time}
                      </span>
                    </div>

                    {subject && (
                      <p className="text-slate-700 font-semibold">
                        Subject: <span className="font-normal text-slate-600">{subject}</span>
                      </p>
                    )}

                    {message && (
                      <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 text-[11px] leading-relaxed">
                        "{message}"
                      </p>
                    )}

                    {/* Seller Reply Section */}
                    {v.seller_reply ? (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                        <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                          💬 Seller Representative Response:
                        </span>
                        <p className="text-emerald-800 font-medium text-xs leading-relaxed">
                          "{v.seller_reply}"
                        </p>
                      </div>
                    ) : isConfirmed ? (
                      <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-[11px] font-semibold text-blue-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span>Meeting is Scheduled! Seller will reach out prior to visit slot.</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {scheduledVisits.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllVisits((prev) => !prev)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  {showAllVisits ? 'Show Only 5 Requests' : `View All Requests (${scheduledVisits.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

