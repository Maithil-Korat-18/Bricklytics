import React from 'react';

export default function Badge({ status }) {
  const getStatusStyles = (statusText) => {
    switch (statusText?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-emerald-500/10';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200/60 ring-amber-500/10';
      case 'sold':
        return 'bg-blue-50 text-blue-700 border-blue-200/60 ring-blue-500/10';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ${getStatusStyles(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status}
    </span>
  );
}
