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
  const {
    locality, carpetArea, bhk, propertyType, amenities = [], expectedPrice,
    reconstructionNeeded, sampleHouseReady, builderName, propertyAge, furnishing, parking, floorNumber, facing
  } = formValues;

  const runAIPrediction = async () => {
    if (!carpetArea) return;

    try {
      setIsPredicting(true);
      setPredictionError('');

      const payload = {
        carpetArea: Number(carpetArea),
        area_sqft: Number(carpetArea),
        bhk: bhk ? Number(bhk) : 2,
        propertyType: propertyType || 'Flat / Apartment',
        latitude: formValues.latitude ? Number(formValues.latitude) : 23.0225,
        longitude: formValues.longitude ? Number(formValues.longitude) : 72.5714,
        listingType: formValues.listingType || 'New Property',
        saleType: formValues.saleType || 'new',
        propertyAge: propertyAge ? Number(propertyAge) : 1,
        facing: facing || 'East',
        reconstructionNeeded: reconstructionNeeded || '',
      };

      const res = await propertyApi.predictCondition(payload);
      if (res.success && res.data) {
        setPredictionData(res.data);
        if (res.data.final_suggested_price) {
          setValue('aiSuggestedPrice', res.data.final_suggested_price);
          setValue('baseMlPrice', res.data.base_market_price || res.data.base_ai_price);
        }
      }
    } catch (err) {
      console.error('AI prediction error:', err);
      setPredictionError('Unable to calculate AI suggested price. Ensure Carpet Area is specified.');
    } finally {
      setIsPredicting(false);
    }
  };

  // Real-time reactive recalculation whenever ANY ML training feature or resale parameter changes
  useEffect(() => {
    if (!carpetArea) return;
    const timer = setTimeout(() => {
      runAIPrediction();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    carpetArea, bhk, propertyType, formValues.latitude, formValues.longitude, formValues.listingType, formValues.saleType, propertyAge, facing, reconstructionNeeded
  ]);


  const acceptSuggestedPrice = () => {
    if (predictionData?.final_suggested_price) {
      setValue('expectedPrice', Math.round(predictionData.final_suggested_price), { shouldValidate: true });
    }
  };

  const currentExpected = expectedPrice ? Number(expectedPrice) : 0;
  const suggestedPrice = predictionData?.final_suggested_price || 0;
  const difference = currentExpected && suggestedPrice ? (currentExpected - suggestedPrice) : 0;

  const formatPriceCr = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* CARD 7: PROPERTY MEDIA & DOCUMENTS */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e2e7ff] shadow-ambient space-y-6">
        <div className="border-b border-[#f2f3ff] pb-4">
          <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#0058be]" /> Property Media & Documents
          </h3>
          <p className="text-xs text-[#727785] mt-1">
            {sampleHouseReady 
              ? 'Upload high-resolution property images, sample house photos, and project brochure' 
              : 'Upload high-resolution property building images and project brochure'}
          </p>
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
                  className="border-2 border-dashed border-[#c2c6d6] hover:border-[#0058be] bg-[#f2f3ff]/70 hover:bg-[#eaedff] p-8 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
                >
                  <div className="p-3 bg-[#d8e2ff] text-[#0058be] rounded-full">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#131b2e]">Drag & Drop Property Images here (Mandatory)</span>
                    <p className="text-xs text-[#727785] mt-0.5">Supports PNG, JPG, WEBP (Cover image will be used in listing card)</p>
                  </div>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileDrop} />
                </label>

                {/* Previews */}
                {value.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#424754] uppercase tracking-wider mb-3">Uploaded Image Previews</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {value.map((src, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-[#e2e7ff] aspect-video bg-[#f2f3ff]">
                          <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-[#ba1a1a] text-white opacity-90 hover:opacity-100 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setValue('coverIndex', index)}
                            className={`absolute bottom-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              coverIndex === index ? 'bg-[#006947] text-white' : 'bg-[#131b2e]/80 text-white hover:bg-[#131b2e]'
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
        <div className="pt-4 border-t border-[#f2f3ff]">
          <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#727785]" /> Upload Project Brochure PDF (Optional)
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
            className="w-full text-xs text-[#727785] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#d8e2ff] file:text-[#0058be] hover:file:bg-[#eaedff] cursor-pointer"
          />
        </div>
      </div>

      {/* CARD 8: PRICING & COMMERCIAL TERMS */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e2e7ff] shadow-ambient space-y-6">
        <div className="border-b border-[#f2f3ff] pb-4">
          <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-[#006947]" /> Pricing & Dynamic AI Analytics
          </h3>
          <p className="text-xs text-[#727785] mt-1">Set expected price alongside real-time AI valuation</p>
        </div>

        {predictionError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{predictionError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* LEFT SIDE: SELLER EXPECTED PRICE INPUTS */}
          <div className="bg-[#f2f3ff]/70 p-8 rounded-2xl border border-[#c2c6d6] space-y-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#0058be]/10 flex items-center justify-center">
                  <span className="text-[#0058be] font-bold text-sm">₹</span>
                </div>
                <h4 className="text-base font-bold text-[#131b2e]">Set Your Price</h4>
              </div>
              <p className="text-xs text-[#727785] mb-6 leading-relaxed">
                Enter seller expected price and financial terms
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-2">
                    Seller Expected Price (₹) <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="e.g. 18500000"
                      {...register('expectedPrice', {
                        onChange: (e) => {
                          const rounded = e.target.value ? Math.round(Number(e.target.value)) : '';
                          setValue('expectedPrice', rounded, { shouldValidate: true });
                        },
                      })}
                      onKeyDown={(e) => {
                        if (e.key === '.' || e.key === ',' || e.key === '-') e.preventDefault();
                      }}
                      className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-[#c2c6d6] focus:border-[#0058be] focus:ring-2 focus:ring-[#adc6ff] text-base font-bold text-[#131b2e] outline-none transition bg-white"
                    />
                  </div>

                  {currentExpected > 0 && (
                    <p className="text-xs text-[#0058be] font-bold mt-2">
                      Formatted: {formatPriceCr(currentExpected)}
                    </p>
                  )}
                  {errors.expectedPrice && (
                    <p className="text-xs text-[#ba1a1a] mt-2 font-medium">{errors.expectedPrice.message}</p>
                  )}
                </div>
              </div>
            </div>

            {currentExpected > 0 && suggestedPrice > 0 && (
              <div className="pt-4 border-t border-[#c2c6d6] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#727785]">Price Difference vs AI:</span>
                <span className={`text-sm font-bold ${difference >= 0 ? 'text-[#006947]' : 'text-[#ba1a1a]'}`}>
                  {difference >= 0 ? `+₹${difference.toLocaleString('en-IN')}` : `-₹${Math.abs(difference).toLocaleString('en-IN')}`}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: DYNAMIC AI PREDICTION CARD */}
          <div className="bg-gradient-to-br from-[#d8e2ff]/50 via-[#f2f3ff] to-white p-6 sm:p-8 rounded-2xl border border-[#adc6ff] shadow-ambient flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 bg-[#d8e2ff] text-[#0058be] px-3 py-1 rounded-full text-xs font-extrabold border border-[#adc6ff]">
                  <Sparkles className="w-4 h-4 text-[#0058be]" /> AI Engine Analysis
                </span>
                <button
                  type="button"
                  onClick={runAIPrediction}
                  disabled={isPredicting}
                  className="text-xs text-[#0058be] hover:text-[#004395] flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{isPredicting ? 'Calculating...' : 'Recalculate AI'}</span>
                </button>
              </div>

              {/* Price & Confidence */}
              <div className="mt-4 text-center py-4 bg-white rounded-xl border border-[#e2e7ff] shadow-ambient space-y-2">
                <span className="text-xs font-extrabold text-[#0058be] uppercase tracking-widest block">AI Suggested Price</span>
                <div className="text-3xl sm:text-4xl font-black text-[#131b2e] tracking-tight">
                  {predictionData?.final_suggested_price_formatted || '₹ --'}
                </div>
                {predictionData?.base_ai_price_formatted && (
                  <p className="text-xs text-[#727785] font-medium">
                    Base Market Price: <strong className="text-[#131b2e]">{predictionData.base_ai_price_formatted}</strong>
                  </p>
                )}
                {predictionData?.confidence_score && (
                  <p className="text-xs text-[#006947] font-bold">
                    {predictionData.confidence_score}% Confidence ({predictionData?.model_used || 'AI Model'})
                  </p>
                )}
              </div>

              {/* Resale Adjustment Breakdown */}
              {predictionData?.adjustment_breakdown && predictionData?.listing_type === 'Resale Property' && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-[#e2e7ff] space-y-2 text-xs">
                  <span className="font-extrabold text-[#131b2e] uppercase tracking-wider block border-b border-[#f2f3ff] pb-1.5">
                    Resale Rule Adjustments Breakdown
                  </span>
                  <div className="flex justify-between text-[#424754]">
                    <span>Property Age ({predictionData.adjustment_breakdown.property_age_percent}%):</span>
                    <span className="font-bold text-[#ba1a1a]">
                      {predictionData.adjustment_breakdown.property_age_adjustment < 0 ? `-₹${Math.abs(predictionData.adjustment_breakdown.property_age_adjustment).toLocaleString('en-IN')}` : `₹${predictionData.adjustment_breakdown.property_age_adjustment.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#424754]">
                    <span>Renovation Status ({predictionData.adjustment_breakdown.renovation_percent}%):</span>
                    <span className="font-bold text-[#006947]">
                      {predictionData.adjustment_breakdown.renovation_adjustment >= 0 ? `+₹${predictionData.adjustment_breakdown.renovation_adjustment.toLocaleString('en-IN')}` : `-₹${Math.abs(predictionData.adjustment_breakdown.renovation_adjustment).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#424754]">
                    <span>Facing Direction ({predictionData.adjustment_breakdown.facing_percent}%):</span>
                    <span className="font-bold text-[#006947]">
                      {predictionData.adjustment_breakdown.facing_adjustment >= 0 ? `+₹${predictionData.adjustment_breakdown.facing_adjustment.toLocaleString('en-IN')}` : `-₹${Math.abs(predictionData.adjustment_breakdown.facing_adjustment).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#f2f3ff] flex justify-between font-bold text-[#131b2e]">
                    <span>Total Resale Adjustment:</span>
                    <span className={predictionData.adjustment_breakdown.total_adjustment >= 0 ? 'text-[#006947]' : 'text-[#ba1a1a]'}>
                      {predictionData.adjustment_breakdown.total_adjustment >= 0 ? `+₹${predictionData.adjustment_breakdown.total_adjustment.toLocaleString('en-IN')}` : `-₹${Math.abs(predictionData.adjustment_breakdown.total_adjustment).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Estimated from market similarity; not historical time-series forecasting. */}
              {/* {predictionData?.appreciation && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-[#e2e7ff] space-y-2">
                  <span className="text-[11px] font-extrabold text-[#424754] uppercase tracking-wider block">Appreciation Forecasts</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-[#f5fff6] border border-[#00855b]/20">
                      <span className="text-[10px] text-[#727785] block font-semibold">1 Year</span>
                      <span className="font-extrabold text-[#006947]">+{predictionData.appreciation.estimated_1yr.appreciation_percent}%</span>
                      <span className="text-[10px] text-[#424754] block font-bold mt-0.5">{formatPriceCr(predictionData.appreciation.estimated_1yr.future_estimated_price)}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#f5fff6] border border-[#00855b]/20">
                      <span className="text-[10px] text-[#727785] block font-semibold">3 Years</span>
                      <span className="font-extrabold text-[#006947]">+{predictionData.appreciation.estimated_3yr.appreciation_percent}%</span>
                      <span className="text-[10px] text-[#424754] block font-bold mt-0.5">{formatPriceCr(predictionData.appreciation.estimated_3yr.future_estimated_price)}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#f5fff6] border border-[#00855b]/20">
                      <span className="text-[10px] text-[#727785] block font-semibold">5 Years</span>
                      <span className="font-extrabold text-[#006947]">+{predictionData.appreciation.estimated_5yr.appreciation_percent}%</span>
                      <span className="text-[10px] text-[#424754] block font-bold mt-0.5">{formatPriceCr(predictionData.appreciation.estimated_5yr.future_estimated_price)}</span>
                    </div>
                  </div>
                </div>
              )} */}

              {/* Investment Score & Rating */}
              {/* {predictionData?.investment && (
                <div className="mt-4 p-4 bg-[#f2f3ff] rounded-xl border border-[#c2c6d6] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[#0058be] uppercase tracking-wider">Investment Score</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      predictionData.investment.rating === 'Excellent' ? 'bg-[#006947] text-white' :
                      predictionData.investment.rating === 'Good' ? 'bg-[#0058be] text-white' :
                      predictionData.investment.rating === 'Moderate' ? 'bg-amber-500 text-white' : 'bg-[#ba1a1a] text-white'
                    }`}>
                      {predictionData.investment.rating} ({predictionData.investment.score}/100)
                    </span>
                  </div>
                  <p className="text-xs text-[#424754] font-medium leading-snug">
                    {predictionData.investment.explanation}
                  </p>
                </div>
              )} */}
            </div>

            {predictionData?.final_suggested_price && (
              <button
                type="button"
                onClick={acceptSuggestedPrice}
                className="w-full py-3 rounded-xl bg-[#0058be] hover:bg-[#004395] text-white text-xs font-black transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
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
