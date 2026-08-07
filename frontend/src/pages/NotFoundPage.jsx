import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Logo from '../components/common/Logo';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';

export default function NotFoundPage() {
  const { isAuthenticated, role } = useAuth();
  const returnPath = isAuthenticated
    ? role === 'seller'
      ? ROUTES.SELLER_DASHBOARD
      : ROUTES.BUYER_DASHBOARD
    : ROUTES.HOME;
  const returnLabel = isAuthenticated ? 'Return to Dashboard' : 'Return to Homepage';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
      <Logo imgClassName="w-12 h-12 object-contain mb-4" textClassName="text-2xl font-extrabold text-slate-900" />
      <h1 className="text-6xl font-extrabold text-blue-600 tracking-tight">404</h1>
      <h2 className="text-2xl font-bold text-slate-900 mt-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Link
        to={returnPath}
        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
      >
        <Home className="w-4 h-4" />
        <span>{returnLabel}</span>
      </Link>
    </div>
  );
}
