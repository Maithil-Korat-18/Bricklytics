import React from 'react';
import Logo from '../common/Logo';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500 gap-4">
        <div className="flex items-center space-x-3">
          <Logo imgClassName="w-7 h-7 object-contain" textClassName="text-base font-bold text-slate-900" />
          <span>© {new Date().getFullYear()} Bricklytics AI Platform. All rights reserved.</span>
        </div>

        <div className="flex space-x-6 text-xs font-semibold text-slate-600">
          <Link to={ROUTES.PROPERTIES} className="hover:text-blue-600 transition-colors">Properties</Link>
          <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Contact Support</a>
        </div>
      </div>
    </footer>
  );
}
