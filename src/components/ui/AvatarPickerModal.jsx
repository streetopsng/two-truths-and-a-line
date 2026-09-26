import React from 'react';
import { AVATAR_IDS, avatarUrl } from '../../lib/avatars';
import { Button } from './Button';

export const AvatarPickerModal = ({ selectedId, onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white border-[1.5px] border-[#E0DBD4] rounded-[22px] p-6 md:p-8 max-w-md w-full shadow-2xl animate-fadeUp text-[#1A1A1A] z-10">
      <h3 className="text-xl font-black mb-1 text-center text-[#1A1A1A]">Choose your avatar</h3>
      <p className="text-sm text-[#666] mb-5 text-center">Pick who represents you at the table.</p>

      <div className="grid grid-cols-5 gap-3 max-h-72 overflow-y-auto p-1">
        {AVATAR_IDS.map((id) => {
          const isSelected = selectedId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`relative rounded-full aspect-square overflow-hidden border-2 transition-all cursor-pointer bg-[#FAF7F2] ${
                isSelected
                  ? 'border-[#F5821F] ring-3 ring-[#F5821F]/30 scale-105 shadow-sm'
                  : 'border-[#E0DBD4] hover:border-[#F5821F]/60 hover:scale-102'
              }`}
            >
              <img src={avatarUrl(id)} alt="" className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Button
          variant="orange"
          onClick={onClose}
          disabled={!selectedId}
          className="w-full"
        >
          Confirm Avatar
        </Button>
      </div>
    </div>
  </div>
);
