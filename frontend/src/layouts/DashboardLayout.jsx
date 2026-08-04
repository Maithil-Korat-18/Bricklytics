import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Footer from '../components/navigation/Footer';
import ThreeBackground from '../components/common/ThreeBackground';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const isBuyer = user?.role === 'buyer';

  if (isBuyer) {
    return (
      <div className="bg-background text-on-surface font-body-md antialiased min-h-screen">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main className="flex-1 md:ml-[280px] min-h-screen overflow-y-auto p-4 md:p-lg lg:p-margin bg-background">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans relative overflow-hidden">
      {/* 3D Soft Canvas Background */}
      <ThreeBackground />

      {/* Responsive Sidebar & Drawer */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 relative z-10">
        {/* Nested Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Dashboard Footer */}
        <Footer />
      </div>
    </div>
  );
}

