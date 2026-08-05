import React from 'react';
import { Search, FolderOpen, RefreshCw } from 'lucide-react';

/**
 * Reusable Empty State Component
 * Standardizes empty search results, empty wishlist, no listings, etc.
 */
export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No Data Found',
  description = 'We could not find any items matching your request.',
  actionLabel = '',
  onAction = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm my-6 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-[#3E6FE0]/10 border border-[#3E6FE0]/20 flex items-center justify-center text-[#3E6FE0] mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-[#14171F] mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#3E6FE0] text-white font-semibold text-sm hover:bg-[#2A54BE] transition-all shadow-md shadow-[#3E6FE0]/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
