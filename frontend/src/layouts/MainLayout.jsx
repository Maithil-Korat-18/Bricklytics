import React from 'react';
import Header from '../components/navigation/Header';
import Footer from '../components/navigation/Footer';

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
