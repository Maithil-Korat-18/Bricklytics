import React from 'react';
import { 
  Building2, 
  Home, 
  CheckCircle2, 
  Eye, 
  WalletCards,
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

const iconMap = {
  Building2,
  Home,
  CheckCircle2,
  Eye,
  WalletCards,
  TrendingUp,
};

export default function StatCard({ data }) {
  const Icon = iconMap[data.iconName] || Building2;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-50 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        {data.trend && (
          <div className={`inline-flex items-center space-x-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            data.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            <span>{data.trend}</span>
            {data.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {data.title}
        </h3>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {data.value}
        </div>
        <p className="text-xs text-slate-400">
          {data.description}
        </p>
      </div>
    </div>
  );
}
