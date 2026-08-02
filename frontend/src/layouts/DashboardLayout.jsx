import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Footer from '../components/navigation/Footer';
import ThreeBackground from '../components/common/ThreeBackground';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
