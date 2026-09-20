import React from 'react';
import { AVATAR_IDS, avatarUrl } from '../../lib/avatars';

export const AvatarPickerModal = ({ selectedId, onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-[#12131a] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-fadeUp">
      <h3 className="text-xl font-black mb-1 text-center">Choose your avatar</h3>
      <p className="text-sm text-white/50 mb-6 text-center">Pick who represents you at the table.</p>

      <div className="grid grid-cols-5 gap-3 max-h-80 overflow-y-auto pr-1">
        {AVATAR_IDS.map((id) => {
          const isSelected = selectedId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`relative rounded-full aspect-square overflow-hidden border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber shadow-[0_0_15px_rgba(245,166,35,0.5)] scale-105'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <img src={avatarUrl(id)} alt="" className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={!selectedId}
        className={`mt-6 w-full py-3.5 rounded-xl font-bold text-[15px] transition-all cursor-pointer ${
          selectedId
            ? 'bg-gradient-to-r from-amber to-[#f58b23] text-[#1a0f00] hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(245,166,35,0.4)]'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        Confirm
      </button>
    </div>
  </div>
);
