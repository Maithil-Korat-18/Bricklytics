import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, User, X } from 'lucide-react';
import { getNavigationForRole } from '../../config/navigationConfig';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';
import { ROUTES } from '../../constants/routes';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const navItems = getNavigationForRole(user?.role);
  const homePath = user?.role === 'seller' ? ROUTES.SELLER_DASHBOARD : ROUTES.BUYER_DASHBOARD;
  const profilePath = user?.role === 'seller' ? ROUTES.SELLER_PROFILE : ROUTES.BUYER_PROFILE;

  useEffect(() => {
    const closeProfileMenu = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeProfileMenu);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeProfileMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200/80 
        flex flex-col justify-between transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
            <NavLink to={homePath}>
              <Logo imgClassName="w-8 h-8 object-contain" showAccent={false} textClassName="text-lg font-bold text-slate-900 tracking-tight" />
            </NavLink>
            {/* Mobile close button */}
            <button 
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {user?.role === 'seller' ? 'Seller Portal' : 'Buyer Portal'}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.title}
                  to={item.path}
                  end={item.exact}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{item.title}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Account menu */}
        <div ref={profileMenuRef} className="relative p-4 border-t border-slate-100">
          {profileMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <NavLink
                to={profilePath}
                onClick={() => {
                  setProfileMenuOpen(false);
                  setMobileOpen(false);
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-600"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>Profile</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
              {user?.first_name?.[0] || user?.full_name?.[0] || 'U'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-800">{user?.full_name || 'Account'}</span>
              <span className="block text-xs font-medium capitalize text-slate-400">{user?.role || 'User'}</span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
}
