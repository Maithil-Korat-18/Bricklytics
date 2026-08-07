import React from 'react';

export default function Badge({ status, variant = '', children, className = '' }) {
  const getStatusStyles = (statusText) => {
    const text = (statusText || children || '').toString().toLowerCase();
    switch (text) {
      case 'active':
      case 'available':
      case 'success':
      case 'verified':
        return 'chip-success';
      case 'pending':
      case 'warning':
      case 'draft':
        return 'chip-warning';
      case 'sold':
      case 'inactive':
      case 'error':
      case 'danger':
        return 'chip-error';
      case 'primary':
      case 'featured':
      case 'ai estimate':
        return 'chip-primary';
      default:
        return 'chip-secondary';
    }
  };

  const activeVariant = variant ? `chip-${variant}` : getStatusStyles(status);

  return (
    <span className={`chip ${activeVariant} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80"></span>
      {children || status}
    </span>
  );
}
