import React from 'react';

export default function ContentContainer({ children, className = '' }) {
  return (
    <div className={`max-w-7xl w-full mx-auto space-y-8 ${className}`}>
      {children}
    </div>
  );
}
