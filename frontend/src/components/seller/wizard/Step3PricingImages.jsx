import React, { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { 
  IndianRupee, 
  Sparkles, 
  UploadCloud, 
  X, 
  Check, 
  FileText, 
  Image as ImageIcon,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { propertyApi } from '../../../services/propertyApi';

export default function Step3PricingImages() {
  const { register, watch, setValue, control, formState: { errors } } = useFormContext();
  const [predictionData, setPredictionData] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState('');

  const formValues = watch();
  const { locality, carpetArea, bhk, propertyType, amenities = [], expectedPrice, reconstructionNeeded } = formValues;

  const runAIPrediction = async () => {
    if (!carpetArea || !locality) return;

    try {
      setIsPredicting(true);
      setPredictionError('');

      const payload = {
        locality: locality,
        area_sqft: Number(carpetArea),
        bhk: bhk ? Number(bhk) : 3,
        property_type: (propertyType || 'Flat / Apartment').includes('Villa') ? 'villa' : 'flat',
        amenities: amenities,
        reconstruction_needed: reconstructionNeeded,
        rate_per_sqft: 0,
      };

      const res = await propertyApi.predictCondition(payload);
      if (res.success && res.data) {
        setPredictionData(res.data);
      }
    } catch (err) {
      console.error('Hybrid prediction error:', err);
      setPredictionError('Unable to calculate AI suggested price. Ensure Locality & Carpet Area are filled.');
    } finally {
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    if (carpetArea && locality) {
      runAIPrediction();
    }
  }, [locality, carpetArea, bhk, propertyType, reconstructionNeeded, JSON.stringify(amenities)]);

  const acceptSuggestedPrice = () => {
    if (predictionData?.final_suggested_price) {
      setValue('expectedPrice', predictionData.final_suggested_price, { shouldValidate: true });
    }
  };

  const currentExpected = expectedPrice ? Number(expectedPrice) : 0;
  const suggestedPrice = predictionData?.final_suggested_price || 0;
  const difference = currentExpected && suggestedPrice ? (currentExpected - suggestedPrice) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* CARD 7: PROPERTY MEDIA & DOCUMENTS */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" /> 7. Property Media & Documents
          </h3>
          <p className="text-xs text-slate-500 mt-1">Upload high-resolution property images and project brochure</p>
        </div>

        <Controller
          name="images"
          control={control}
          render={({ field: { value = [], onChange } }) => {
            const handleFileDrop = (e) => {
              e.preventDefault();
              const files = Array.from(e.target.files || e.dataTransfer.files);
              if (!files.length) return;

              const existingRaw = watch('rawImageFiles') || [];
              setValue('rawImageFiles', [...existingRaw, ...files]);

              const previewUrls = files.map((file) => URL.createObjectURL(file));
              onChange([...value, ...previewUrls]);
            };

            const removeImage = (index) => {
              const updatedPreviews = value.filter((_, i) => i !== index);
              const existingRaw = watch('rawImageFiles') || [];
              const updatedRaw = existingRaw.filter((_, i) => i !== index);
              setValue('rawImageFiles', updatedRaw);
              onChange(updatedPreviews);
            };

            const coverIndex = watch('coverIndex') || 0;

            return (
              <div className="space-y-5">
                {/* Drag & Drop Zone */}
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30 p-8 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
                >
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800">Drag & Drop Property Images here</span>
                    <p className="text-xs text-slate-400 mt-0.5">Supports PNG, JPG, WEBP (Max 10MB per file)</p>
                  </div>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileDrop} />
                </label>

                {/* Previews */}
                {value.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Uploaded Image Previews</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {value.map((src, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                          <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setValue('coverIndex', index)}
                            className={`absolute bottom-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              coverIndex === index ? 'bg-emerald-600 text-white' : 'bg-slate-900/80 text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            {coverIndex === index ? '★ Cover Image' : 'Set as Cover'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }}
        />

        {/* Brochure PDF Upload */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-500" /> Upload Project Brochure PDF (Optional)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setValue('rawBrochureFile', file);
              }
            }}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>
      </div>

      {/* CARD 8: PRICING & COMMERCIAL TERMS (LIGHT THEME SIDE-BY-SIDE CARD LAYOUT) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-600" /> 8. Pricing & Commercial Terms
          </h3>
          <p className="text-xs text-slate-500 mt-1">Set expected price alongside AI Suggested Price</p>
        </div>

        {predictionError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{predictionError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* LEFT SIDE: SELLER EXPECTED PRICE INPUTS */}
          <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Set Your Price</h4>
              <p className="text-xs text-slate-500 mb-4">Enter seller expected price and financial terms</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Seller Expected Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 7500000"
                      {...register('expectedPrice')}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-base font-bold text-slate-900 outline-none transition bg-white"
                    />
                  </div>
                  {errors.expectedPrice && <p className="text-xs text-red-500 mt-1 font-medium">{errors.expectedPrice.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Maintenance (₹/Mo)</label>
                    <input
                      type="number"
                      placeholder="e.g. 3500"
                      {...register('maintenanceCharges')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Booking Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 100000"
                      {...register('bookingAmount')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {currentExpected > 0 && suggestedPrice > 0 && (
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Price Difference vs AI:</span>
                <span className={difference >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {difference >= 0 ? `+₹${difference.toLocaleString('en-IN')}` : `-₹${Math.abs(difference).toLocaleString('en-IN')}`}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: AI SUGGESTED PRICE CARD (PREMIUM LIGHT THEME WITH SINGLE PRICE DISPLAY) */}
          <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-white p-6 sm:p-8 rounded-2xl border border-blue-200/80 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-extrabold border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Valuation Engine
                </span>
                <button
                  type="button"
                  onClick={runAIPrediction}
                  disabled={isPredicting}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{isPredicting ? 'Calculating...' : 'Refresh AI Price'}</span>
                </button>
              </div>

              <div className="mt-6 text-center py-4 bg-white/80 rounded-xl border border-blue-100 shadow-sm">
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block">AI Suggested Price</span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
                  {predictionData?.final_suggested_price_formatted || '₹ --'}
                </div>
                {predictionData?.confidence_score && (
                  <p className="text-xs text-emerald-600 font-bold mt-2">
                    {predictionData.confidence_score}% Valuation Accuracy
                  </p>
                )}
              </div>
            </div>

            {predictionData?.final_suggested_price && (
              <button
                type="button"
                onClick={acceptSuggestedPrice}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Accept Suggested Price ({predictionData.final_suggested_price_formatted})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
