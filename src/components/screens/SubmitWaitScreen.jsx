import React from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';

export const SubmitWaitScreen = ({ onBack }) => {
  const { gameState } = useGame();
  const { players } = gameState;
  const playersList = Object.values(players || {});

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-[480px] mx-auto items-center justify-center p-8 text-center gap-4 animate-fadeUp relative z-10">
      <div className="card p-8 bg-white border-[1.5px] border-[#E0DBD4] rounded-[22px] shadow-[0_4px_0_#E0DBD4] flex flex-col items-center gap-4 w-full">
        <div className="text-[54px] animate-float leading-none">🤫</div>
        <h2 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">You're in.</h2>
        <p className="text-[13px] text-[#555] leading-[1.6]">
          Waiting for everyone else to submit their statements...
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {playersList.map((p, i) => (
            <div 
              key={i} 
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                p.submitted 
                  ? 'bg-[#F0FFF5] text-[#22A855] border-[#22A855]/30' 
                  : 'bg-white text-[#999] border-[#E0DBD4]'
              }`}
            >
              {p.submitted ? '✓ ' : '⏳ '} {p.name}
            </div>
          ))}
        </div>
      </div>

      <Button 
        variant="outline" 
        className="mt-2 !w-auto !py-3 !px-6 !text-[13px]"
        onClick={onBack}
      >
        ← Back to lobby
      </Button>
    </div>
  );
};
