import React, { useState, useEffect } from 'react';
import { propertyApi } from '../../services/propertyApi';
import PageHeader from '../../components/common/PageHeader';
import ContentContainer from '../../components/common/ContentContainer';
import {
  Sparkles,
  Building2,
  TrendingUp,
  MapPin,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Award,
  Layers,
  Search,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const DEFAULT_LOCALITIES = [
  { name: 'Science City', value: 'science city', avg_rate_per_sqft: 6200 },
  { name: 'Sola', value: 'sola', avg_rate_per_sqft: 5400 },
  { name: 'South Bopal', value: 'south bopal', avg_rate_per_sqft: 4800 },
  { name: 'Motera', value: 'motera', avg_rate_per_sqft: 5100 },
  { name: 'Bodakdev', value: 'bodakdev', avg_rate_per_sqft: 8500 },
  { name: 'Thaltej', value: 'thaltej', avg_rate_per_sqft: 7800 },
  { name: 'Prahlad Nagar', value: 'prahlad nagar', avg_rate_per_sqft: 7600 },
  { name: 'Memnagar', value: 'memnagar', avg_rate_per_sqft: 7100 },
  { name: 'Jodhpur', value: 'jodhpur', avg_rate_per_sqft: 5200 },
  { name: 'Narol', value: 'narol', avg_rate_per_sqft: 2800 },
  { name: 'Ghodasar', value: 'ghodasar', avg_rate_per_sqft: 3400 },
  { name: 'Jagatpur', value: 'jagatpur', avg_rate_per_sqft: 4200 },
  { name: 'Nikol', value: 'nikol', avg_rate_per_sqft: 3600 },
];

export default function AiPredictionsPage() {
  const [predictionMode, setPredictionMode] = useState('condition'); // 'condition' or 'property'
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [localities, setLocalities] = useState(DEFAULT_LOCALITIES);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Condition Form State
  const [locality, setLocality] = useState('science city');
  const [bhk, setBhk] = useState(3);
  const [areaSqft, setAreaSqft] = useState(1650);
  const [ratePerSqft, setRatePerSqft] = useState(5800);
  const [schoolDist, setSchoolDist] = useState(1.5);
  const [hospitalDist, setHospitalDist] = useState(1.0);
  const [bankDist, setBankDist] = useState(2.0);
  const [transportDist, setTransportDist] = useState(1.2);
  const [railwayDist, setRailwayDist] = useState(3.5);

  // Prediction Outcome State
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Fetch initial data
  useEffect(() => {
    async function initData() {
      setLoadingLocations(true);
      try {
        const [locRes, propsRes] = await Promise.allSettled([
          propertyApi.getAhmedabadLocations(),
          propertyApi.getProperties({ page_size: 20 })
        ]);

        if (locRes.status === 'fulfilled' && locRes.value?.data?.locations?.length > 0) {
          setLocalities(locRes.value.data.locations);
        }

        if (propsRes.status === 'fulfilled') {
          const pList = propsRes.value?.data?.items || propsRes.value?.data || propsRes.value || [];
          if (Array.isArray(pList) && pList.length > 0) {
            setProperties(pList);
            setSelectedPropertyId(pList[0].id || pList[0]._id || '');
          }
        }
      } catch (err) {
        console.error('Failed loading ML form data:', err);
      } finally {
        setLoadingLocations(false);
      }
    }

    initData();
    // Run default prediction on mount
    runConditionPrediction();
  }, []);

  const handleLocalityChange = (e) => {
    const val = e.target.value;
    setLocality(val);
    const matched = localities.find(l => (l.value || l.name.toLowerCase()) === val);
    if (matched && matched.avg_rate_per_sqft) {
      setRatePerSqft(matched.avg_rate_per_sqft);
    }
  };

  const runConditionPrediction = async () => {
    setPredicting(true);
    setError(null);
    try {
      const payload = {
        locality,
        bhk: Number(bhk),
        area_sqft: Number(areaSqft),
        rate_per_sqft: Number(ratePerSqft),
        school_dist_km: Number(schoolDist),
        hospital_dist_km: Number(hospitalDist),
        bank_dist_km: Number(bankDist),
        transport_dist_km: Number(transportDist),
        railway_dist_km: Number(railwayDist),
      };

      const res = await propertyApi.predictCondition(payload);
      if (res && res.data) {
        setPredictionResult(res.data);
        setHistoryLogs(prev => [
          {
            id: Date.now(),
            locality: res.data.locality,
            bhk: res.data.bhk,
            area_sqft: res.data.area_sqft,
            price_formatted: res.data.predicted_price_formatted,
            confidence: res.data.confidence_score,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 4)
        ]);
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Could not run ML prediction model. Please check connectivity.');
    } finally {
      setPredicting(false);
    }
  };

  const runPropertyPrediction = async () => {
    if (!selectedPropertyId) return;
    setPredicting(true);
    setError(null);
    try {
      const res = await propertyApi.predictPrice(selectedPropertyId);
      if (res && res.data) {
        setPredictionResult(res.data);
        setHistoryLogs(prev => [
          {
            id: Date.now(),
            locality: res.data.locality || 'Property Listing',
            bhk: res.data.bhk || 3,
            area_sqft: res.data.area_sqft || 1500,
            price_formatted: res.data.predicted_price_formatted || `₹${(res.data.predicted_price / 10000000).toFixed(2)} Cr`,
            confidence: res.data.confidence_score,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 4)
        ]);
      }
    } catch (err) {
      console.error('Property prediction error:', err);
      setError('Could not run prediction for selected property.');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <ContentContainer>
      <PageHeader
        title="AI Valuation & Predictive Model Suite"
        description="Condition-wise price forecasting, feature impact analysis, and multi-year appreciation modeling powered by Scikit-Learn trained on 16,000+ Ahmedabad properties."
      />

      {/* Mode Selection Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setPredictionMode('condition')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              predictionMode === 'condition'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Custom Condition Simulator</span>
          </button>

          <button
            onClick={() => setPredictionMode('property')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              predictionMode === 'property'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Predict for Listed Property</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>RandomForestRegressor v2.4 (Ahmedabad Model)</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Controls + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              {predictionMode === 'condition' ? 'Property Condition Parameters' : 'Select Listed Property'}
            </h3>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              Ahmedabad Dataset
            </span>
          </div>

          {predictionMode === 'condition' ? (
            <div className="space-y-5 text-xs">
              {/* Locality */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Ahmedabad Locality / Micro-Market
                </label>
                <select
                  value={locality}
                  onChange={handleLocalityChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {localities.map((loc, idx) => (
                    <option key={idx} value={loc.value || loc.name.toLowerCase()}>
                      {loc.name} {loc.avg_rate_per_sqft ? `(Avg ₹${loc.avg_rate_per_sqft}/sqft)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* BHK Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Bedrooms / BHK Config</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBhk(val)}
                      className={`py-2 text-center font-bold rounded-xl border transition-all ${
                        bhk === val
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val} {val === 5 ? '+' : ''} BHK
                    </button>
                  ))}
                </div>
              </div>

              {/* Area SqFt */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-700">Total Area (Sq. Ft.)</label>
                  <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {areaSqft.toLocaleString()} sq ft
                  </span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="6000"
                  step="50"
                  value={areaSqft}
                  onChange={(e) => setAreaSqft(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Rate per SqFt */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-700">Base Rate per Sq. Ft. (₹)</label>
                  <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    ₹{ratePerSqft.toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  value={ratePerSqft}
                  onChange={(e) => setRatePerSqft(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-1.5 mt-2">
                  {[3500, 4800, 6200, 8500, 11000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRatePerSqft(preset)}
                      className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all"
                    >
                      ₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenity Distances */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Amenity Proximity Distances (km)
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-[11px] block">School Distance</span>
                    <input
                      type="number"
                      step="0.1"
                      value={schoolDist}
                      onChange={(e) => setSchoolDist(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block">Hospital Distance</span>
                    <input
                      type="number"
                      step="0.1"
                      value={hospitalDist}
                      onChange={(e) => setHospitalDist(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block">Transport BRTS Dist</span>
                    <input
                      type="number"
                      step="0.1"
                      value={transportDist}
                      onChange={(e) => setTransportDist(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block">Railway Station Dist</span>
                    <input
                      type="number"
                      step="0.1"
                      value={railwayDist}
                      onChange={(e) => setRailwayDist(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={runConditionPrediction}
                disabled={predicting}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {predicting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing ML Prediction...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run AI Model Valuation</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <label className="block font-bold text-slate-700">Select Property from Portfolio</label>
              {properties.length === 0 ? (
                <p className="text-slate-500 py-4">No active properties available. Please add a property first.</p>
              ) : (
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                >
                  {properties.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.title} — {p.locality || p.address || 'Ahmedabad'} (₹{p.price?.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={runPropertyPrediction}
                disabled={predicting || !selectedPropertyId}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {predicting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running ML Valuation...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Valuate Listed Property</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Prediction Results Dashboard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {predicting ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
              <h4 className="text-base font-bold text-slate-900">Evaluating Features via RandomForest...</h4>
              <p className="text-xs text-slate-500">Processing spatial coordinates, BHK density, and amenity accessibility index.</p>
            </div>
          ) : predictionResult ? (
            <>
              {/* Primary AI Valuation Banner */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Predicted Market Value
                  </span>
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{predictionResult.confidence_score}% Model Confidence</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                      {predictionResult.predicted_price_formatted || `₹${(predictionResult.predicted_price / 10000000).toFixed(2)} Cr`}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Estimated for {predictionResult.bhk} BHK in {predictionResult.locality} ({predictionResult.area_sqft} sq.ft)
                    </p>
                  </div>
                </div>

                {predictionResult.locality_benchmark && (
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                    <span>Locality Avg Rate: <strong className="text-white">{predictionResult.locality_benchmark.avg_rate_formatted}</strong></span>
                    <span className={`font-bold ${predictionResult.locality_benchmark.difference_percent >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {predictionResult.locality_benchmark.difference_percent >= 0 ? '+' : ''}{predictionResult.locality_benchmark.difference_percent}% vs Locality Avg
                    </span>
                  </div>
                )}
              </div>

              {/* 3-Yr & 5-Yr Appreciation Forecast Cards */}
              {predictionResult.appreciation && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-blue-600">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">3-Year Forecast CAGR</span>
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">
                      +{predictionResult.appreciation.cagr_3yr_percent}%
                    </p>
                    <p className="text-xs text-slate-600 font-semibold">
                      Future Value: <span className="text-blue-600 font-bold">{predictionResult.appreciation.future_price_3yr_formatted}</span>
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-emerald-600">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">5-Year Forecast CAGR</span>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">
                      +{predictionResult.appreciation.cagr_5yr_percent}%
                    </p>
                    <p className="text-xs text-slate-600 font-semibold">
                      Future Value: <span className="text-emerald-600 font-bold">{predictionResult.appreciation.future_price_5yr_formatted}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Feature Importance Breakdown */}
              {predictionResult.feature_importance && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Feature Importance Contribution Breakdown
                  </h4>

                  <div className="space-y-3 text-xs">
                    {predictionResult.feature_importance.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-semibold text-slate-700">
                          <span>{item.feature}</span>
                          <span className="font-extrabold text-slate-900">{item.weight_percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${item.weight_percent}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Select parameters and click "Run AI Model Valuation" to view detailed prediction analytics.
            </div>
          )}

          {/* History Log */}
          {historyLogs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Model Session Logs
              </h4>
              <div className="space-y-2">
                {historyLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{log.locality.toUpperCase()}</span>
                      <p className="text-slate-500 text-[11px]">{log.bhk} BHK • {log.area_sqft} sq ft</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-blue-600">{log.price_formatted}</span>
                      <p className="text-emerald-600 text-[10px] font-semibold">{log.confidence}% confidence</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </ContentContainer>
  );
}
