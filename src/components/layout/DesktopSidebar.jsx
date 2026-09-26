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

  const queryInvited = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('invitedCount') : null;
  const targetInvited = ggSession?.invitedCount || (queryInvited ? parseInt(queryInvited, 10) : null) || gameState?.invitedCount;
  const readyCount = playersList.filter((p) => p.submitted).length;
  const allSubmitted = playersList.length > 0 && playersList.every((p) => p.submitted);

  return (
    <div className="hidden md:flex flex-col w-[320px] lg:w-[350px] shrink-0 border-r border-[#E0DBD4] bg-white/70 backdrop-blur-md h-full p-6 relative z-20 shadow-[2px_0_12px_rgba(0,0,0,0.03)]">
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

      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] tracking-[2px] uppercase text-[#999] font-extrabold">
          {status === 'lobby'
            ? `Participants (${playersList.length}${targetInvited ? `/${targetInvited}` : ''})`
            : `Players (${playersList.length})`}
        </div>
        {status === 'lobby' && playersList.length > 0 && (
          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-[6px] ${
            allSubmitted 
              ? 'text-[#22A855] bg-[#F0FFF5] border border-[#22A855]/30' 
              : 'text-[#E8710A] bg-[#FDE8D0] border border-[#F5821F]/30'
          }`}>
            {readyCount} of {playersList.length} ready
          </span>
        )}
      </div>

      {status === 'lobby' && playersList.length > 0 && (
        <div className="h-1.5 bg-[#E0DBD4] rounded-[6px] overflow-hidden mb-3">
          <div 
            className="h-full bg-[#22A855] rounded-[6px] transition-all duration-500" 
            style={{ width: `${(readyCount / playersList.length) * 100}%` }}
          />
        </div>
      )}

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
                  {p.email && (
                    <div className="text-[11px] text-[#888] truncate">{p.email}</div>
                  )}
                  {status !== 'lobby' && (
                    <div className="text-[11px] font-extrabold text-[#555] mt-0.5">
                      {Math.round(p.score || 0)} pts
                      {p.streak >= 2 && <span className="text-[#E8710A] ml-1.5">🔥{p.streak}</span>}
                    </div>
                  )}
                </div>
                {status === 'lobby' && (
                  <div className="shrink-0 flex items-center justify-center">
                    {p.submitted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] font-extrabold bg-[#F0FFF5] text-[#22A855] border border-[#22A855]/30">
                        ✓ Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[8px] text-[10.5px] font-bold bg-[#FFF0EE] text-[#E8334A] border border-[#E8334A]/30" title="Statement not added">
                        Statement not added
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {playersList.length === 0 && (
            <div className="bg-white/80 border border-[#E0DBD4] rounded-[16px] p-5 text-center flex flex-col items-center justify-center gap-2 my-2 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E0DBD4] text-[#F5821F] flex items-center justify-center shadow-2xs">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-[12.5px] font-bold text-[#1A1A1A]">
                Waiting for teammates…
              </div>
              <p className="text-[11px] text-[#777] leading-relaxed">
                Teammates will appear here live once they open their email invite.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-[#FAF7F2] border border-[#E0DBD4] text-[10px] font-bold text-[#888] mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5821F] animate-dotPulse" />
                Listening for connections
              </div>
            </div>
          )}
        </div>
      </div>

      {ggSession?.isHost && (
        <div className="pt-4 border-t border-[#E0DBD4] mt-2">
          <button
            onClick={() => returnToGummyGum()}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-[#E0DBD4] text-xs font-bold text-[#555] hover:text-[#1A1A1A] hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <span>← Back to GummyGum</span>
          </button>
        </div>
      )}
    </div>
  );
};
