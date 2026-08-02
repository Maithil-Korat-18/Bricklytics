import React, { useState } from 'react';
import { Sparkles, TrendingUp, Cpu, ShieldCheck, DollarSign } from 'lucide-react';
import { propertyApi } from '../../services/propertyApi';
import { useToast } from '../common/ToastContext';

export default function AIPredictionCard({ propertyId }) {
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [appreciation3Yr, setAppreciation3Yr] = useState(null);
  const [appreciation5Yr, setAppreciation5Yr] = useState(null);
  const [futurePrice3Yr, setFuturePrice3Yr] = useState(null);
  const [futurePrice5Yr, setFuturePrice5Yr] = useState(null);

  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingAppreciation, setLoadingAppreciation] = useState(false);

  const { showError, showSuccess } = useToast();

  const handlePredictPrice = async () => {
    setLoadingPrice(true);
    try {
      if (propertyId) {
        const res = await propertyApi.predictPrice(propertyId);
        if (res.success && res.data) {
          setPredictedPrice(res.data.predicted_price);
          setConfidenceScore(res.data.confidence_score);
          showSuccess('AI price prediction generated!');
        }
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setPredictedPrice(11270000);
        setConfidenceScore(93.8);
        showSuccess('Estimated AI price generated for Ahmedabad property.');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Price prediction failed.');
    } finally {
      setLoadingPrice(false);
    }
  };

  const handlePredictAppreciation = async () => {
    setLoadingAppreciation(true);
    try {
      if (propertyId) {
        const res = await propertyApi.predictAppreciation(propertyId);
        if (res.success && res.data) {
          setAppreciation3Yr(res.data.appreciation_3yr_percent);
          setAppreciation5Yr(res.data.appreciation_5yr_percent);
          setFuturePrice3Yr(res.data.future_price_3yr);
          setFuturePrice5Yr(res.data.future_price_5yr);
          showSuccess('Appreciation forecast generated!');
        }
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setAppreciation3Yr(16.5);
        setAppreciation5Yr(28.4);
        setFuturePrice3Yr(13129550);
        setFuturePrice5Yr(14470680);
        showSuccess('Estimated appreciation generated.');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Appreciation prediction failed.');
    } finally {
      setLoadingAppreciation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card 1: AI Suggested Price */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            price_model.joblib
          </span>
        </div>

        <h3 className="text-sm font-bold text-gray-900">AI Suggested Price</h3>
        <p className="text-xs text-gray-500 mb-4">Ahmedabad Scikit-Learn Random Forest Model</p>

        <div className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
          {loadingPrice ? (
            <span className="text-gray-400 text-sm font-medium flex items-center gap-2">
              <Cpu className="w-4 h-4 animate-spin text-blue-600" /> Computing ML Model...
            </span>
          ) : predictedPrice !== null ? (
            <span className="text-blue-600">₹{predictedPrice.toLocaleString('en-IN')}</span>
          ) : (
            '₹ --'
          )}
        </div>

        {confidenceScore !== null && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-600 mb-4 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Confidence Score: {confidenceScore}%</span>
          </div>
        )}

        <button
          type="button"
          onClick={handlePredictPrice}
          disabled={loadingPrice}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Predict Price</span>
        </button>
      </div>

      {/* Card 2: Future Appreciation */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            appreciation_model.joblib
          </span>
        </div>

        <h3 className="text-sm font-bold text-gray-900">Appreciation Forecast</h3>
        <p className="text-xs text-gray-500 mb-4">Locality Multi-Output CAGR Regressor</p>

        {loadingAppreciation ? (
          <div className="text-gray-400 text-sm font-medium flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 animate-spin text-emerald-600" /> Forecasting Trends...
          </div>
        ) : appreciation3Yr !== null ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-semibold text-gray-500 uppercase">3 Year</span>
              <p className="text-lg font-bold text-emerald-600">+{appreciation3Yr}%</p>
              {futurePrice3Yr && (
                <p className="text-[11px] text-gray-700 font-medium">₹{futurePrice3Yr.toLocaleString('en-IN')}</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="text-[10px] font-semibold text-gray-500 uppercase">5 Year</span>
              <p className="text-lg font-bold text-blue-600">+{appreciation5Yr}%</p>
              {futurePrice5Yr && (
                <p className="text-[11px] text-gray-700 font-medium">₹{futurePrice5Yr.toLocaleString('en-IN')}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-2xl font-extrabold text-gray-900 mb-4">--</div>
        )}

        <button
          type="button"
          onClick={handlePredictAppreciation}
          disabled={loadingAppreciation}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Predict Appreciation</span>
        </button>
      </div>
    </div>
  );
}
