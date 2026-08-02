import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const routeNameMap = {
  seller: 'Seller Portal',
  dashboard: 'Dashboard',
  'add-property': 'Add Property',
  'manage-properties': 'Manage Properties',
  property: 'Property Details',
  'edit-property': 'Edit Property',
  analytics: 'Analytics',
  'ai-predictions': 'AI Predictions',
  settings: 'Settings',
};

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500 mb-3">
      <Link 
        to={ROUTES.SELLER_DASHBOARD} 
        className="flex items-center hover:text-blue-600 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>Seller</span>
      </Link>

      {pathnames.map((value, index) => {
        const isLast = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const displayName = routeNameMap[value] || (value.length > 15 ? `${value.substring(0, 12)}...` : value);

        // Skip root 'seller' segment if already shown home icon
        if (value === 'seller') return null;

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 capitalize">
                {displayName}
              </span>
            ) : (
              <Link 
                to={to} 
                className="hover:text-blue-600 transition-colors capitalize"
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
