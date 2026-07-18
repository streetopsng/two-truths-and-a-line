import React from 'react';

export const Button = ({ 
  children, 
  variant = 'default', 
  className = '', 
  disabled,
  onClick 
}) => {
  const base = "w-full p-4 rounded-r font-bold text-[15px] cursor-pointer transition-all duration-300 relative overflow-hidden group";
  
  let vClass = "";
  switch(variant) {
    case 'amber':
      vClass = "bg-gradient-to-r from-amber to-[#f58b23] text-[#1a0f00] hover:shadow-[0_0_20px_rgba(245,166,35,0.4)] hover:scale-[1.02] active:scale-[0.98]";
      break;
    case 'coral':
      vClass = "bg-gradient-to-r from-coral to-[#ff3b14] text-white hover:shadow-[0_0_20px_rgba(255,92,56,0.4)] hover:scale-[1.02] active:scale-[0.98]";
      break;
    case 'ghost':
      vClass = "bg-transparent text-muted hover:text-white hover:bg-white/5 active:scale-[0.98]";
      break;
    default:
      vClass = "bg-white/10 text-white hover:bg-white/15 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]";
      break;
  }

  const disabledClass = disabled ? "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none pointer-events-none" : "";

  return (
    <button 
      className={`${base} ${vClass} ${disabledClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out opacity-0 group-hover:opacity-100 mix-blend-overlay"></div>
      <span className="relative z-10">{children}</span>
    </button>
  );
};
