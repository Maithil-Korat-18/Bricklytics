import React from 'react';

/**
 * Reusable Loading Skeleton Component
 * Displays customizable animated shimmer blocks for property cards, tables, dashboards, etc.
 */
export default function LoadingSkeleton({ variant = 'card', count = 1, className = '' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'table') {
    return (
      <div className={`space-y-3 w-full animate-pulse ${className}`}>
        <div className="h-10 bg-slate-200/70 rounded-xl w-full"></div>
        {items.map((key) => (
          <div key={key} className="h-14 bg-slate-100 rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full ${className}`}>
        {items.map((key) => (
          <div key={key} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm animate-pulse space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-9 w-9 bg-slate-200 rounded-xl"></div>
            </div>
            <div className="h-7 bg-slate-300 rounded w-32"></div>
            <div className="h-3 bg-slate-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={`space-y-6 w-full animate-pulse ${className}`}>
        <div className="h-8 bg-slate-200 rounded-xl w-2/3"></div>
        <div className="h-72 bg-slate-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Default: Card grid variant
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full ${className}`}>
      {items.map((key) => (
        <div key={key} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm animate-pulse space-y-4">
          <div className="h-44 bg-slate-200 rounded-xl w-full"></div>
          <div className="h-5 bg-slate-300 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 bg-slate-300 rounded w-28"></div>
            <div className="h-8 bg-slate-200 rounded-xl w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
