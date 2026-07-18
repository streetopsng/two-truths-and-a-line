import React from 'react';

export const Badge = ({ children, variant = 'muted', className = '' }) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold';
  
  const variants = {
    amber: 'bg-amber/10 text-amber border border-amber/25',
    green: 'bg-green/10 text-green border border-green/25',
    coral: 'bg-coral/10 text-coral border border-coral/25',
    muted: 'bg-white/5 text-muted border border-border',
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
