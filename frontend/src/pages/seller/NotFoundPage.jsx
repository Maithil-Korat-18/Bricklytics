import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200/80 shadow-card-soft max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto mb-6">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">404</h1>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          The seller page or resource you requested could not be located on Bricklytics.
        </p>
        <Link
          to={ROUTES.SELLER_DASHBOARD}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
