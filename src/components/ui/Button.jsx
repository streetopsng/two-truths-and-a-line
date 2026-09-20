import React from 'react';

export const Button = ({ 
  children, 
  variant = 'orange', 
  className = '', 
  disabled,
  onClick,
  type = 'button'
}) => {
  let vClass = "btn-orange";
  if (variant === 'dark') {
    vClass = "btn-dark";
  } else if (variant === 'outline') {
    vClass = "btn-outline";
  } else if (variant === 'ghost') {
    vClass = "bg-transparent text-mid hover:text-black hover:bg-black/5 shadow-none border-none py-3";
  } else if (variant === 'amber' || variant === 'coral' || variant === 'orange' || variant === 'default') {
    vClass = "btn-orange";
  }

  const disabledClass = disabled ? "disabled" : "";

  return (
    <button 
      type={type}
      className={`btn ${vClass} ${disabledClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
