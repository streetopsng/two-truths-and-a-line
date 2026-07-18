import React from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from '../ui/PlayerAvatar';

export const DesktopSidebar = () => {
  const { gameState, currentUser } = useGame();
  const { players, gameCode, status, currentRound, roundOrder } = gameState;

  if (status === 'home' || !gameCode) return null;

  const playersList = Object.values(players || {});
  // Sort by score for most screens except lobby
  if (status !== 'lobby') {
    playersList.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  
  const me = players?.[currentUser?.uid];

  return (
    <div className="hidden md:flex flex-col w-[320px] shrink-0 border-r border-white/10 bg-white/[0.02] backdrop-blur-xl h-full p-6 relative z-20 shadow-[10px_0_30px_rgba(0,0,0,0.2)]">
      <div className="mb-8">
        <div className="text-[10px] tracking-[3px] uppercase text-white/50 font-bold mb-1">
          Game Code
        </div>
        <div className="text-[32px] font-black tracking-[8px] text-transparent bg-clip-text bg-gradient-to-r from-amber to-orange-400 drop-shadow-[0_0_10px_rgba(245,166,35,0.3)]">
          {gameCode}
        </div>
      </div>

      {(status === 'question' || status === 'reaction' || status === 'leaderboard') && (
        <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="text-[10px] tracking-[3px] uppercase text-white/50 font-bold mb-1">
            Progress
          </div>
          <div className="text-[14px] font-bold text-white/90">
            Round {currentRound + 1} of {roundOrder?.length || 0}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] tracking-[3px] uppercase text-white/50 font-bold">
          Players ({playersList.length}/10)
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <div className="flex flex-col gap-2">
          {playersList.map((p, i) => {
            const isMeRow = p.name === me?.name;
            return (
              <div 
                key={i} 
                className={`flex items-center gap-3 p-3 rounded-xl border backdrop-blur-md transition-all ${
                  isMeRow 
                    ? 'bg-amber/[0.05] border-amber/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_10px_rgba(245,166,35,0.1)]' 
                    : 'bg-white/[0.03] border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]'
                }`}
              >
                <PlayerAvatar name={p.name} color={p.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold tracking-tight truncate" style={{ color: p.color }}>
                    {p.name} {isMeRow && <span className="text-white/30 font-medium ml-1">(you)</span>}
                  </div>
                  {status !== 'lobby' && (
                    <div className="text-[11px] font-black text-white/60 mt-0.5">
                      {Math.round(p.score || 0)} pts
                      {p.streak >= 3 && <span className="text-coral ml-1">🔥{p.streak}</span>}
                    </div>
                  )}
                </div>
                {status === 'lobby' && (
                  <div className="shrink-0 flex items-center justify-center w-5 h-5 bg-black/20 rounded-full border border-white/5">
                    {p.submitted ? '✅' : <span className="w-1.5 h-1.5 rounded-full bg-amber animate-dotPulse shadow-[0_0_8px_rgba(245,166,35,0.8)]"></span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
