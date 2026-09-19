import React from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PlayerAvatar } from '../ui/PlayerAvatar';

export const LobbyScreen = ({ onWrite }) => {
  const { gameState, currentUser, startGame } = useGame();
  const { gameCode, players, hostUid } = gameState;
  
  const playersList = Object.values(players || {});
  const isHost = currentUser?.uid === hostUid;
  const MIN_PLAYERS = 3;
  const hasEnoughPlayers = playersList.length >= MIN_PLAYERS;
  const allSubmitted = playersList.length > 0 && playersList.every(p => p.submitted);
  const me = players?.[currentUser?.uid];

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-[500px] mx-auto justify-between relative z-10 p-4 sm:p-6 animate-fadeUp">
      {/* Session header */}
      <div className="text-center pt-2 pb-1 shrink-0">
        <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#999]">
          Session
        </div>
        <div className="text-[18px] font-black text-[#1A1A1A] flex items-center justify-center gap-2 mt-0.5">
          <div className="w-[7px] h-[7px] rounded-full bg-[#F5821F] shrink-0"></div>
          <span>You're in the Lobby</span>
          <div className="w-[7px] h-[7px] rounded-full bg-[#F5821F] shrink-0"></div>
        </div>
      </div>

      {/* Game code banner */}
      <div className="card p-4 mx-1 mt-2 text-center bg-white border-[1.5px] border-[#E0DBD4] rounded-[16px] shadow-[0_3px_0_#E0DBD4] shrink-0">
        <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#999]">
          Game code — share with your team
        </div>
        <div className="text-[34px] font-black tracking-[8px] text-[#F5821F] my-1">
          {gameCode}
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="amber">{playersList.length} / 10 players</Badge>
        </div>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto my-3 px-1">
        {/* 'You' Card */}
        {me && (
          <div className="mb-3 bg-white border-[1.5px] border-[#F5821F] rounded-[16px] p-3.5 flex items-center gap-3 shadow-[0_3px_0_#E8710A]">
            <PlayerAvatar name={me.name} color={me.color} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-extrabold text-[#1A1A1A]">
                {me.name} <span className="text-[#F5821F] text-xs">(You)</span>
              </div>
              <div className="text-[11px] text-[#999] font-medium italic">
                {me.submitted ? 'Statements ready' : 'Waiting for statements'}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
              me.submitted 
                ? 'bg-[#F0FFF5] text-[#22A855] border-[#22A855]/30' 
                : 'bg-[#FDE8D0] text-[#E8710A] border-[#F5821F]'
            }`}>
              {me.submitted ? '✓ Ready' : 'Incomplete'}
            </div>
          </div>
        )}

        <div className="text-[11px] font-extrabold tracking-[1.5px] uppercase text-[#555] px-1 mb-2">
          Other Players
        </div>

        <div className="flex flex-col gap-2">
          {playersList.filter(p => p.name !== me?.name).map((p, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 p-3 rounded-[12px] bg-white border border-[#E0DBD4] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <PlayerAvatar name={p.name} color={p.color} size="sm" />
              <div className="flex-1 text-[13px] font-bold text-[#1A1A1A]">
                {p.name}
              </div>
              <div className="text-xs">
                {p.submitted ? (
                  <span className="text-[#22A855] font-bold">✓ Ready</span>
                ) : (
                  <span className="text-[#999] flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#F5821F] animate-dotPulse"></span> Writing...
                  </span>
                )}
              </div>
            </div>
          ))}

          {playersList.length === 1 && (
            <div className="text-center py-6 text-xs text-[#999] font-medium bg-white/50 border border-dashed border-[#E0DBD4] rounded-[12px]">
              Waiting for others to join using code <strong className="text-[#F5821F]">{gameCode}</strong>...
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col gap-2.5 pt-2 shrink-0">
        <Button 
          variant={me?.submitted ? 'outline' : 'orange'} 
          onClick={onWrite}
          disabled={me?.submitted}
          className="w-full"
        >
          {me?.submitted ? '✓ Statements submitted' : '✍️ Write my statements'}
        </Button>

        {isHost && (
          <div>
            <Button 
              variant="orange"
              onClick={startGame}
              disabled={!hasEnoughPlayers || !allSubmitted}
              className="w-full"
            >
              Start game
            </Button>
            <div className="text-[11px] text-[#777] text-center mt-1.5 font-semibold">
              {!hasEnoughPlayers 
                ? `Need at least ${MIN_PLAYERS} players to start` 
                : !allSubmitted
                  ? 'Waiting for all players to submit their statements...'
                  : "Everyone's ready — you can start the game!"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
