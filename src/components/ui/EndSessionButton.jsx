import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from './Button';

const VARIANT_CLASSES = {
  pill: 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#E0DBD4] text-xs font-bold text-[#555] hover:text-[#1A1A1A] hover:bg-slate-50 transition-colors shadow-xs cursor-pointer',
  block: 'w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-[#E0DBD4] text-xs font-bold text-[#555] hover:text-[#1A1A1A] hover:bg-slate-50 transition-colors shadow-xs cursor-pointer',
  primary: 'flex items-center justify-center gap-1.5 px-6 py-3 rounded-full bg-[#F5821F] hover:bg-[#E8710A] text-white font-extrabold text-[14px] transition-all cursor-pointer shadow-[0_3px_0_#c06412]',
};

// Host-only; renders nothing for participants.
export const EndSessionButton = ({ variant = 'pill', className = '' }) => {
  const { ggSession, endSession } = useGame();
  const [showConfirm, setShowConfirm] = useState(false);
  const [ending, setEnding] = useState(false);

  if (!ggSession?.isHost) return null;

  const handleConfirm = async () => {
    setEnding(true);
    await endSession();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={`${VARIANT_CLASSES[variant]} ${className}`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
        <span>End session</span>
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-[#E0DBD4] rounded-[20px] p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-black text-[#1A1A1A] mb-2">End this session?</h3>
            <p className="text-xs text-[#666] mb-6 leading-relaxed">
              Everyone will be removed and the session will close in GummyGum.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={ending} className="flex-1 rounded-xl">
                Stay
              </Button>
              <Button
                variant="orange"
                onClick={handleConfirm}
                disabled={ending}
                className="flex-1 !bg-red-500 hover:!bg-red-600 !text-white rounded-xl"
              >
                {ending ? 'Ending...' : 'End session'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
