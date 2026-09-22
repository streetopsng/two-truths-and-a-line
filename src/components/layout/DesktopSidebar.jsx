import React from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { returnToGummyGum } from '../../lib/gummygumSession';

export const DesktopSidebar = () => {
  const { gameState, currentUser, ggSession } = useGame();
  const { players, gameCode, status, currentRound, roundOrder } = gameState;

  if (status === 'home' || !gameCode) return null;

  const playersList = Object.values(players || {});
  if (status !== 'lobby') {
    playersList.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  const me = players?.[currentUser?.uid];

  return (
    <div className="hidden md:flex flex-col w-[300px] lg:w-[320px] shrink-0 border-r border-[#E0DBD4] bg-white/70 backdrop-blur-md h-full p-6 relative z-20 shadow-[2px_0_12px_rgba(0,0,0,0.03)]">
      {(status === 'question' || status === 'reaction' || status === 'leaderboard') && (
        <div className="mb-5 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E0DBD4] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="text-[10px] tracking-[2px] uppercase text-[#999] font-extrabold mb-0.5">
            Progress
          </div>
          <div className="text-[14px] font-extrabold text-[#1A1A1A]">
            Round {currentRound + 1} of {roundOrder?.length || 0}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] tracking-[2px] uppercase text-[#999] font-extrabold">
          Players ({playersList.length}/10)
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-2">
          {playersList.map((p, i) => {
            const isMeRow = p.name === me?.name;
            return (
              <div 
                key={i} 
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isMeRow 
                    ? 'bg-[#FDE8D0] border-[#F5821F] shadow-[0_2px_0_#E8710A]' 
                    : 'bg-white border-[#E0DBD4] shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                }`}
              >
                <PlayerAvatar name={p.name} color={p.color} avatarId={p.avatarId} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className={`text-[13px] font-bold tracking-tight truncate ${isMeRow ? 'text-[#E8710A]' : 'text-[#1A1A1A]'}`}>
                    {p.name} {isMeRow && <span className="text-[#999] font-semibold text-xs ml-1">(you)</span>}
                  </div>
                  {status !== 'lobby' && (
                    <div className="text-[11px] font-extrabold text-[#555] mt-0.5">
                      {Math.round(p.score || 0)} pts
                      {p.streak >= 2 && <span className="text-[#E8710A] ml-1.5">🔥{p.streak}</span>}
                    </div>
                  )}
                </div>
                {status === 'lobby' && (
                  <div className="shrink-0 flex items-center justify-center w-5 h-5 text-xs">
                    {p.submitted ? '✅' : <span className="w-2 h-2 rounded-full bg-[#F5821F] animate-dotPulse"></span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-[#E0DBD4] mt-2">
        <button
          onClick={() => returnToGummyGum()}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-[#E0DBD4] text-xs font-bold text-[#555] hover:text-[#1A1A1A] hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <span>← Back to GummyGum</span>
        </button>
      </div>
    </div>
  );
};
