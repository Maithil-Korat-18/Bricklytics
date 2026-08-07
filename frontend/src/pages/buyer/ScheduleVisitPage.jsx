import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Building2, CheckCircle2, ArrowRight, MessageSquare,
  Sparkles, Send, Phone, Mail, Heart, SlidersHorizontal, X, User, ShieldCheck
} from 'lucide-react';
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

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const targetPropertyId = location.state?.propertyId || searchParams.get('propertyId') || '';
  const initialRequestType = location.state?.requestType || searchParams.get('type') || 'visit';

  const [wishlistProperties, setWishlistProperties] = useState([]);
  const [comparePropertiesList, setComparePropertiesList] = useState([]);
  const [marketProperties, setMarketProperties] = useState([]);
  
  const [selectedPropertyId, setSelectedPropertyId] = useState(targetPropertyId);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduledVisits, setScheduledVisits] = useState([]);
  const [showAllVisits, setShowAllVisits] = useState(false);

  // Active conversation modal state
  const [activeConversation, setActiveConversation] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySending, setReplySending] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const compareIds = getComparePropertyIds();

        const [propsRes, visitsRes, wishlistRes, compareRes] = await Promise.allSettled([
          buyerApi.getProperties({ page_size: 100 }),
          buyerApi.getScheduledVisits(),
          buyerApi.getWishlist(),
          compareIds.length > 0 ? buyerApi.compareProperties(compareIds) : Promise.resolve({ success: true, data: [] })
        ]);

        let allListings = [];
        if (propsRes.status === 'fulfilled' && propsRes.value) {
          const val = propsRes.value;
          allListings = Array.isArray(val.data)
            ? val.data
            : (val.data?.results || val.results || []);
          setMarketProperties(allListings);
        }

        let wProps = [];
        if (wishlistRes.status === 'fulfilled' && wishlistRes.value) {
          const wData = wishlistRes.value.data || wishlistRes.value || [];
          const wItems = Array.isArray(wData) ? wData : (wData.results || []);
          wProps = wItems.map((item) => item.property_details || item).filter(Boolean);
          setWishlistProperties(wProps);
        }

        let cProps = [];
        if (compareRes.status === 'fulfilled' && compareRes.value) {
          const cData = compareRes.value.data || compareRes.value || [];
          cProps = Array.isArray(cData) ? cData : [];
          setComparePropertiesList(cProps);
        }

        if (visitsRes.status === 'fulfilled' && visitsRes.value) {
          const vData = visitsRes.value.data || visitsRes.value || [];
          setScheduledVisits(Array.isArray(vData) ? vData : (vData.results || []));
        }

        if (targetPropertyId) {
          setSelectedPropertyId(String(targetPropertyId));
          const allCombined = [...allListings, ...wProps, ...cProps];
          const match = allCombined.find((p) => String(p.id) === String(targetPropertyId));
          if (match) {
            setSelectedProperty(match);
          } else {
            try {
              const singleRes = await buyerApi.getPropertyById(targetPropertyId);
              if (singleRes?.data) {
                const singleProp = singleRes.data;
                setMarketProperties((prev) => [singleProp, ...prev]);
                setSelectedProperty(singleProp);
              }
            } catch (err) {
              console.warn('Could not fetch target property:', err);
            }
          }
        } else if (allListings.length > 0) {
          setSelectedPropertyId(String(allListings[0].id));
          setSelectedProperty(allListings[0]);
        }
      } catch (err) {
        console.error('Error loading schedule visit data:', err);
      }
    }
    loadData();
  }, [targetPropertyId]);

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

    if (!preferredDate || !preferredTime) {
      showError('Please select your preferred date and time slot for the meeting.');
      return;
    }

    setLoading(true);
    try {
      const res = await buyerApi.scheduleVisit({
        property_id: selectedPropertyId,
        request_type: 'visit',
        preferred_date: preferredDate || new Date().toISOString().split('T')[0],
        preferred_time: preferredTime || '10:00 AM',
        notes: notes ? `Notes: ${notes}` : '',
      });

      showSuccess('Meeting scheduled successfully! Seller will confirm shortly.');

      setScheduledVisits((prev) => [res.data, ...prev]);
      setPreferredDate('');
      setNotes('');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit meeting request.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeConversation || !replyMessage.trim()) return;
    setReplySending(true);
    try {
      const res = await buyerApi.replyToVisit(activeConversation.id, replyMessage.trim());
      showSuccess('Reply sent to seller!');
      
      setScheduledVisits((prev) =>
        prev.map((item) => (item.id === activeConversation.id ? res.data : item))
      );
      setActiveConversation(res.data);
      setReplyMessage('');
    } catch (err) {
      showError('Failed to send reply. Please try again.');
    } finally {
      setReplySending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <span>Schedule Meeting with Seller</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select properties from your wishlist, compare list, or market listings to schedule an in-person meeting with the seller.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Container */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* STEP 1: Select Property */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>1. Select Target Property</span>
                {targetPropertyId && (
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                    Pre-selected from Listing
                  </span>
                )}
              </label>
              <select
                value={selectedPropertyId}
                onChange={handlePropertyChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="">-- Select a Property --</option>
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
                        {p.title} {p.price ? `(₹${(p.price / 100000).toFixed(1)} L)` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}

                {marketProperties.length > 0 && (
                  <optgroup label="🏠 All Active Properties">
                    {marketProperties.map((p) => (
                      <option key={`mkt-${p.id}`} value={p.id}>
                        {p.title} — {p.locality || 'Ahmedabad'} {p.price ? `(₹${(p.price / 100000).toFixed(1)} L)` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Selected Property Preview Banner */}
            {selectedProperty && (
              <div className="flex items-center gap-4 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                {selectedProperty.images?.[0]?.url ? (
                  <img
                    src={getPropertyMediaUrl(selectedProperty.images[0].url)}
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

            {/* STEP 2: Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Preferred Visit Date <span className="text-red-500">*</span>
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
                  3. Preferred Time Slot <span className="text-red-500">*</span>
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

            {/* STEP 4: Special Instructions / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                4. Special Instructions / Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please arrange key access for parking area during walkthrough..."
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
                  <span>Submit Meeting Request</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar: Your Scheduled Meetings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Your Scheduled Meetings</h2>
            <span className="text-xs font-semibold text-slate-400">Showing {Math.min(5, scheduledVisits.length)} of {scheduledVisits.length}</span>
          </div>

          {scheduledVisits.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No scheduled meetings yet.</p>
          ) : (
            <div className="space-y-3">
              {(showAllVisits ? scheduledVisits : scheduledVisits.slice(0, 5)).map((v) => {
                const isConfirmed = v.status === 'confirmed';
                const isRejected = v.status === 'rejected';
                const propMatch = [...marketProperties, ...comparePropertiesList, ...wishlistProperties].find(
                  (p) => String(p.id) === String(v.property_id)
                );
                const coverImg = propMatch?.images?.find((img) => img.is_cover)?.url || propMatch?.images?.[0]?.url || v.property_image;

                return (
                  <div
                    key={v.id}
                    onClick={() => setActiveConversation(v)}
                    className="p-4 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200/80 hover:border-blue-200 text-xs space-y-2.5 cursor-pointer transition-all"
                  >
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
                          : isRejected
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {isConfirmed ? 'Confirmed' : v.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                        Meeting Request
                      </span>
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        {v.preferred_date || 'Flex'} at {v.preferred_time || 'Slot'}
                      </span>
                    </div>

                    {/* Message Preview */}
                    {v.seller_reply ? (
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-[11px] text-emerald-800 font-medium truncate">
                        💬 Seller: "{v.seller_reply}"
                      </div>
                    ) : (
                      <p className="text-slate-400 text-[11px] italic truncate">
                        Click to view meeting thread & details...
                      </p>
                    )}
                  </div>
                );
              })}

              {scheduledVisits.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllVisits((prev) => !prev)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  {showAllVisits ? 'Show Only 5 Meetings' : `View All Meetings (${scheduledVisits.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Active Conversation Modal ────────────────────────────────────── */}
      {activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                  Scheduled Meeting with Seller
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{activeConversation.property_title}</h3>
                <p className="text-xs text-slate-500">
                  Requested Slot: {activeConversation.preferred_date} at {activeConversation.preferred_time}
                </p>
              </div>
              <button
                onClick={() => setActiveConversation(null)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Details (Unlocked after response/accept) */}
            <div className="p-4 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <ShieldCheck className={`w-4 h-4 ${activeConversation.contact_unlocked ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="font-bold text-slate-800">Seller Contact Details:</span>
              </div>
              {activeConversation.contact_unlocked ? (
                <div className="flex items-center space-x-3 font-semibold text-slate-700">
                  <span className="flex items-center space-x-1"><Phone className="w-3.5 h-3.5 text-blue-600" /><span>+91 79 2600 0000</span></span>
                  <span className="flex items-center space-x-1"><Mail className="w-3.5 h-3.5 text-blue-600" /><span>seller@bricklytics.com</span></span>
                </div>
              ) : (
                <span className="text-slate-400 font-medium italic">Contact details unlock when seller accepts the meeting request.</span>
              )}
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30">
              {activeConversation.notes && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-blue-900">Meeting Notes:</span>
                  <p className="text-slate-700 whitespace-pre-wrap">{activeConversation.notes}</p>
                </div>
              )}

              {activeConversation.messages && activeConversation.messages.length > 0 ? (
                activeConversation.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender_role === 'buyer' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs shadow-xs ${
                        m.sender_role === 'buyer'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p className="font-bold text-[10px] opacity-80 mb-0.5">{m.sender_name} ({m.sender_role})</p>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    </div>
                  </div>
                ))
              ) : activeConversation.seller_reply ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-emerald-900">Seller Reply:</span>
                  <p className="text-emerald-800">{activeConversation.seller_reply}</p>
                </div>
              ) : null}
            </div>

            {/* Reply Input Box */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center space-x-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your message to the seller..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
              />
              <button
                onClick={handleSendReply}
                disabled={replySending || !replyMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition disabled:opacity-50 flex items-center space-x-1"
              >
                {replySending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
