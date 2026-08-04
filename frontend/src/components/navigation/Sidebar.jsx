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

  const isBuyer = user?.role === 'buyer';
  const navItems = getNavigationForRole(user?.role);
  const homePath = user?.role === 'seller' ? ROUTES.SELLER_DASHBOARD : ROUTES.BUYER_DASHBOARD;

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

  // Buyer Navigation items
  const buyerNavLinks = [
    { title: 'Dashboard', path: ROUTES.BUYER_DASHBOARD, icon: 'dashboard', exact: true },
    { title: 'Explore', path: ROUTES.PROPERTIES, icon: 'explore', exact: false },
    { title: 'Wishlist', path: ROUTES.WISHLIST, icon: 'favorite', exact: false },
    { title: 'Compare', path: ROUTES.COMPARE, icon: 'compare_arrows', exact: false },
    { title: 'Schedule Visit', path: ROUTES.SCHEDULE_VISIT, icon: 'calendar_month', exact: false },
    { title: 'Profile', path: ROUTES.BUYER_PROFILE, icon: 'person', exact: false },
  ];

  if (isBuyer) {
    return (
      <>
        {/* Mobile Overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* M3 Desktop & Mobile SideNavBar for Buyer */}
        <aside className={`
          fixed left-0 top-0 h-screen w-[280px] bg-surface dark:bg-surface-container-low 
          flex flex-col p-md border-r border-outline-variant z-40 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Logo Header — no horizontal bar */}
          <div className="flex items-center justify-between mb-xl px-sm">
            <NavLink to={homePath} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg shrink-0">
                B
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-primary">
                Bricklytics
              </h2>
            </NavLink>
            <button 
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-secondary hover:text-on-surface p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 flex-grow overflow-y-auto">
            {buyerNavLinks.map((item) => (
              <NavLink
                key={item.title}
                to={item.path}
                end={item.exact}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200
                  ${isActive 
                    ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-xs scale-[0.98] translate-x-1' 
                    : 'text-secondary hover:bg-surface-container-highest/50'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-on-secondary-container' : 'text-secondary'}`}>
                      {item.icon}
                    </span>
                    <span className="font-body-md text-body-md">{item.title}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Profile & Single Logout Dropdown Section — no horizontal bar */}
          <div ref={profileMenuRef} className="mt-auto pt-2 relative">
            {profileMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-1 shadow-ambient z-50 animate-fadeIn">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left font-body-md font-bold text-error transition-colors hover:bg-error-container/20"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  <span>Log out</span>
                </button>
              </div>
            )}

            <div 
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex items-center justify-between p-2 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-extrabold text-primary shrink-0 text-sm">
                    {initialLetter}
                  </div>
                )}
                <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                  {displayName}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Seller / Default Sidebar
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
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-[#e2e7ff]
        flex flex-col justify-between transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Header — no horizontal bar */}
          <div className="h-16 px-6 flex items-center justify-between">
            <NavLink to={homePath}>
              <Logo imgClassName="w-8 h-8 object-contain" showAccent={false} textClassName="text-lg font-bold text-[#131b2e] tracking-tight" />
            </NavLink>
            <button 
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-[#727785] hover:text-[#131b2e] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-0.5">
            <div className="px-3 py-2 text-[11px] font-bold text-[#727785] uppercase tracking-wider mb-1">
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
                      ? 'bg-[#d8e2ff] text-[#0058be] font-semibold' 
                      : 'text-[#424754] hover:bg-[#f2f3ff] hover:text-[#131b2e]'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#0058be]' : 'text-[#727785]'}`} />
                      <span>{item.title}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Account menu — no horizontal bar */}
        <div ref={profileMenuRef} className="relative p-4">
          {profileMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-xl border border-[#e2e7ff] bg-white py-1 shadow-ambient z-50 animate-fadeIn">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]/30"
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
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#f2f3ff] focus:outline-none focus:ring-2 focus:ring-[#0058be]/20"
          >
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0058be] text-sm font-extrabold text-white shadow-sm">
                {initialLetter}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[#131b2e]">{displayName}</span>
              <span className="block text-xs font-medium capitalize text-[#727785]">{user?.role || 'User'}</span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-[#727785] transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
}
