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
    <div className="flex flex-col h-full max-w-[430px] md:max-w-none mx-auto relative z-10">
      <div className="flex items-center justify-between pt-8 px-6 md:hidden">
        <div className="text-[10px] tracking-[3px] uppercase text-white/50 font-bold">
          Waiting for players
        </div>
        <Badge variant="amber" className="shadow-[0_0_15px_rgba(245,166,35,0.2)] border border-amber/30">{playersList.length} / 10</Badge>
      </div>

      <div className="text-center pt-6 px-6 md:hidden">
        <div className="text-[10px] tracking-[3px] uppercase text-white/50 font-bold">
          Game code — share this
        </div>
        <div className="text-[44px] font-black tracking-[12px] text-transparent bg-clip-text bg-gradient-to-r from-amber to-orange-400 mt-2 drop-shadow-[0_0_20px_rgba(245,166,35,0.3)]">
          {gameCode}
        </div>
        <div className="text-xs text-white/40 mt-1 font-medium">
          Players enter this to join
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6 mt-4 md:hidden">
        <div className="flex flex-col gap-2">
          {playersList.map((p, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] animate-slideIn"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <PlayerAvatar name={p.name} color={p.color} />
              <div className="flex-1 text-[14px] font-bold tracking-tight" style={{ color: p.color }}>
                {p.name} {p.name === me?.name ? <span className="text-white/30 ml-1 font-medium">(you)</span> : ''}
              </div>
              <div className="text-xs flex items-center justify-center w-6 h-6 bg-black/20 rounded-full border border-white/5">
                {p.submitted ? '✅' : <span className="w-2 h-2 rounded-full bg-amber inline-block animate-dotPulse shadow-[0_0_8px_rgba(245,166,35,0.8)]"></span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center gap-6">
        <div className="text-[80px] animate-float drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">🎮</div>
        <h2 className="text-[42px] font-black tracking-tight">You're in the Lobby</h2>
        <p className="text-[16px] text-white/60 font-medium max-w-md leading-relaxed">
          The game code is in the sidebar. Once everyone has joined and submitted their statements, the host can start the game.
        </p>
      </div>

      <div className="p-6 bg-black/20 backdrop-blur-xl border-t border-white/10 flex flex-col md:flex-row md:items-center justify-center gap-4 shrink-0 md:rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:mx-6 md:mb-6 md:border md:bg-white/[0.02]">
        <div className="w-full md:w-[300px]">
          <Button 
            variant="amber" 
            onClick={onWrite}
            disabled={me?.submitted}
          >
            {me?.submitted ? '✓ Statements submitted' : '✍️ Write my statements'}
          </Button>
        </div>
        {isHost && (
          <div className="w-full md:w-[300px]">
            <Button 
              variant="coral" 
              onClick={startGame}
              disabled={!hasEnoughPlayers || !allSubmitted}
              className={(!hasEnoughPlayers || !allSubmitted) ? 'opacity-50 grayscale' : ''}
            >
              Start game
            </Button>
            <div className="text-[11px] text-white/40 text-center mt-2 font-medium tracking-wide">
              {!hasEnoughPlayers 
                ? `Need at least ${MIN_PLAYERS} players` 
                : !allSubmitted
                  ? 'Waiting for everyone to submit...'
                  : "Everyone's ready — let's go!"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
