import React from 'react';
import { Construction, Sparkles } from 'lucide-react';

export default function PlaceholderCard({ title, subtitle, featureList = [] }) {
  return (
    <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200/80 shadow-card-soft text-center max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-sm">
        <Construction className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        {title || 'Module Under Construction'}
      </h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
        {subtitle || 'This seller module UI view is scheduled for the upcoming implementation phase. Full state management and business logic will be connected soon.'}
      </p>

      {featureList.length > 0 && (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-left max-w-md mx-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Planned Features</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            {featureList.map((item, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
