import React from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';

export const SubmitWaitScreen = ({ onBack }) => {
  const { gameState } = useGame();
  const { players } = gameState;
  const playersList = Object.values(players || {});

  return (
    <div className="flex flex-col h-full max-w-[430px] mx-auto items-center justify-center p-8 text-center gap-4">
      <div className="text-6xl animate-float">🤫</div>
      <div className="text-[22px] font-extrabold">You're in.</div>
      <div className="text-[13px] text-muted leading-[1.6]">
        Waiting for everyone else to submit their statements...
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
        {playersList.map((p, i) => (
          <div 
            key={i} 
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              p.submitted 
                ? 'bg-green/10 text-green border-green/25' 
                : 'bg-white/5 text-muted border-border'
            }`}
          >
            {p.submitted && '✓ '} {p.name}
          </div>
        ))}
      </div>

      <Button 
        variant="ghost" 
        className="mt-4 !w-auto !py-3 !px-6 !text-[13px]"
        onClick={onBack}
      >
        ← Back to lobby
      </Button>
    </div>
  );
};
