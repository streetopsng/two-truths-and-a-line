import React from 'react';

export const PlayerAvatar = ({ name, color, av, className = '', size = 'md' }) => {
  // If an avatar emoji is provided, or if the name is an emoji, show it
  // Otherwise show the first letter / initials
  const isEmoji = (str) => str && /\p{Extended_Pictographic}/u.test(str);
  
  let content = '?';
  if (av) {
    content = av;
  } else if (isEmoji(name)) {
    content = name;
  } else if (name) {
    content = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-11 h-11 text-xl',
    xl: 'w-16 h-16 text-3xl',
  };

  return (
    <div 
      className={`rounded-full flex items-center justify-center font-extrabold bg-[#FDE8D0] border-[1.5px] border-[#F5821F] text-[#1A1A1A] shrink-0 select-none shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${sizes[size] || sizes.md} ${className}`}
      style={color && !isEmoji(content) ? { backgroundColor: '#FDE8D0', borderColor: color } : undefined}
    >
      <span>{content}</span>
    </div>
  );
};
