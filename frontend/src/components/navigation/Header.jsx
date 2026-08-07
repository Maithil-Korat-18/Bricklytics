import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';
import { ROUTES } from '../../constants/routes';
import { getComparePropertyIds } from '../../utils/compareSelection';

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();
  const [compareCount, setCompareCount] = useState(() => getComparePropertyIds().length);

  useEffect(() => {
    const handleUpdate = () => {
      setCompareCount(getComparePropertyIds().length);
    };
    window.addEventListener('bricklytics_compare_updated', handleUpdate);
    return () => window.removeEventListener('bricklytics_compare_updated', handleUpdate);
  }, []);

  const dashboardPath = role === 'seller' ? ROUTES.SELLER_DASHBOARD : ROUTES.BUYER_DASHBOARD;

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-card-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <Logo imgClassName="w-9 h-9 object-contain" textClassName="text-xl font-bold text-slate-900 tracking-tight" />
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <Link to={ROUTES.PROPERTIES} className="hover:text-blue-600 transition-colors">Properties</Link>
          <Link to={ROUTES.COMPARE} className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <span>Compare</span>
            {compareCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold text-white bg-blue-600 rounded-full leading-none">
                {compareCount}
              </span>
            )}
          </Link>
          {isAuthenticated && (
            <Link to={dashboardPath} className="hover:text-blue-600 transition-colors">Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate(dashboardPath)}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate(ROUTES.SIGNUP)}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all duration-300"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
