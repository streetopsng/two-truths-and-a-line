import React from 'react';

export const Badge = ({ children, variant = 'muted', className = '' }) => {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-[8px] text-[11px] font-extrabold tracking-wide';
  
  const variants = {
    amber: 'bg-[#FDE8D0] text-[#E8710A] border border-[#F5821F]',
    orange: 'bg-[#FDE8D0] text-[#E8710A] border border-[#F5821F]',
    green: 'bg-[#F0FFF5] text-[#22A855] border border-[#22A855]/30',
    coral: 'bg-[#FFF0EE] text-[#E8334A] border border-[#E8334A]/30',
    muted: 'bg-white text-mid border border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
  };

  return (
    <span className={`${baseClasses} ${variants[variant] || variants.muted} ${className}`}>
      {children}
    </span>
  );
};
