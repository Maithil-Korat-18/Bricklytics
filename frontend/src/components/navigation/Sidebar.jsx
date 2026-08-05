import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, X } from 'lucide-react';
import { getNavigationForRole } from '../../config/navigationConfig';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';
import { ROUTES } from '../../constants/routes';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const isSeller = user?.role === 'seller';
  const navItems = getNavigationForRole(user?.role);
  const homePath = isSeller ? ROUTES.SELLER_DASHBOARD : ROUTES.BUYER_DASHBOARD;
  const portalTitle = isSeller ? 'Seller Portal' : 'Buyer Portal';

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

  const handleLogout = async (e) => {
    if (e) e.stopPropagation();
    setProfileMenuOpen(false);
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  // User avatar image or fallback initial letter
  const userAvatar = user?.profile_picture || user?.avatar || null;
  const initialLetter = (user?.first_name?.[0] || user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const displayName = user?.full_name || user?.first_name || 'User Account';

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Spacious Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-[#e2e7ff]
        flex flex-col justify-between transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex-1 overflow-y-auto">
          {/* Logo Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-[#e2e7ff]/60">
            <NavLink to={homePath} className="flex items-center">
              <Logo imgClassName="w-8 h-8 object-contain" showAccent={false} textClassName="text-xl font-extrabold text-[#131b2e] tracking-tight" />
            </NavLink>
            <button 
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-[#727785] hover:text-[#131b2e] p-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-5 space-y-1.5">
            <div className="px-3.5 py-1.5 text-[11px] font-extrabold text-[#727785] uppercase tracking-wider mb-2">
              {portalTitle}
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
                    flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200
                    ${isActive 
                      ? 'bg-[#3E6FE0]/10 text-[#3E6FE0] font-bold shadow-xs translate-x-0.5' 
                      : 'text-[#5B6270] hover:bg-[#FAFAF8] hover:text-[#14171F]'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {Icon && <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#3E6FE0]' : 'text-[#727785]'}`} />}
                      <span className="truncate">{item.title}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Spacious Account Menu Footer */}
        <div ref={profileMenuRef} className="relative p-5 border-t border-[#e2e7ff]/80 bg-slate-50/40">
          {profileMenuOpen && (
            <div className="absolute bottom-full left-5 right-5 mb-3 overflow-hidden rounded-2xl border border-[#e2e7ff] bg-white py-1.5 shadow-xl z-50 animate-fadeIn">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]/30 cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all border border-slate-200/80 bg-white hover:bg-[#FAFAF8] hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-[#3E6FE0]/20 cursor-pointer shadow-xs"
          >
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3E6FE0] text-sm font-extrabold text-white shadow-sm">
                {initialLetter}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-[#131b2e]">{displayName}</span>
              <span className="block text-xs font-semibold capitalize text-[#727785]">{user?.role || 'User'}</span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-[#727785] transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
}
