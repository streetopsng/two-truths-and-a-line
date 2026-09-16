import React from 'react';
import { avatarUrl } from '../../lib/avatars';

export const PlayerAvatar = ({ name, color, avatarId, className = '', size = 'md' }) => {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const sizes = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-11 h-11 text-base',
  };

  if (avatarId) {
    return (
      <div className={`rounded-full overflow-hidden shrink-0 ${sizes[size]} ${className}`}>
        <img src={avatarUrl(avatarId)} alt={name || 'Player avatar'} className="rounded-full object-cover w-full h-full" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-extrabold text-[#1a0f00] shrink-0 ${sizes[size]} ${className}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};
