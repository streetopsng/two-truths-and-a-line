import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';

export const SubmitWaitScreen = () => {
  const { gameState } = useGame();
  const navigate = useNavigate();
  const { players } = gameState;
  const playersList = Object.values(players || {});

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-[480px] mx-auto items-center justify-center p-8 text-center gap-4 animate-fadeUp relative z-10">
      <div className="card p-8 bg-white border-[1.5px] border-[#E0DBD4] rounded-[22px] shadow-[0_2px_0_#E0DBD4] flex flex-col items-center gap-4 w-full">
        <div className="w-16 h-16 rounded-2xl bg-[#FDE8D0] border border-[#F5821F]/30 text-[#F5821F] flex items-center justify-center animate-float">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
        </div>
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
              <span className="inline-flex items-center gap-1">
                {p.submitted ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6 9 17l-5-5" /></svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                )}
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2.5 mt-2 flex-wrap w-full">
        <Button 
          variant="orange" 
          className="!w-auto !py-2.5 !px-5 !text-[13px] rounded-xl"
          onClick={() => navigate('/submit')}
        >
          <span className="inline-flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            Edit my statements
          </span>
        </Button>
        <Button
          variant="outline"
          className="!w-auto !py-2.5 !px-5 !text-[13px] rounded-xl"
          onClick={() => navigate('/lobby')}
        >
          <span className="inline-flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back to lobby
          </span>
        </Button>
      </div>
    </div>
  );
};
