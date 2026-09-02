import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from '../ui/PlayerAvatar';

export const EndScreen = () => {
  const { gameState, leaveGame } = useGame();
  const { players } = gameState;
  const [confetti, setConfetti] = useState([]);

  const allPlayers = Object.values(players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
  const podiumPlayers = [allPlayers[1], allPlayers[0], allPlayers[2]]; // Silver, Gold, Bronze
  const bestLiar = [...allPlayers].sort((a, b) => (b.liarPoints || 0) - (a.liarPoints || 0))[0];
  const lieDetector = [...allPlayers].sort((a, b) => (b.correctGuesses || 0) - (a.correctGuesses || 0))[0];

  useEffect(() => {
    // Generate confetti
    const cols = ['#F5A623', '#3b82f6', '#a855f7', '#22c55e', '#ef4444'];
    const newConfetti = Array.from({ length: 20 }).map((_, i) => ({
      left: Math.random() * 100,
      bg: cols[i % 5],
      delay: Math.random() * 0.8,
      duration: 0.8 + Math.random() * 0.6
    }));
    setConfetti(newConfetti);
  }, []);

  const handleRxn = (emoji) => {
    // Scaffold: Trigger room reaction in Firebase if desired
  };

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-none w-full mx-auto items-center overflow-hidden relative z-10">
      <button 
        onClick={leaveGame}
        className="absolute top-6 left-6 md:top-8 md:left-8 text-[12px] md:text-[14px] font-bold uppercase tracking-wider text-white/30 hover:text-white transition-colors cursor-pointer z-20"
      >
        Leave game
      </button>

      <div className="pt-16 md:pt-24 px-6 text-center w-full shrink-0 relative z-10">
        <div className="text-[12px] md:text-[16px] tracking-[4px] md:tracking-[6px] uppercase text-white/50 font-extrabold inline-block px-4 py-1.5 md:px-6 md:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          Game over
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {confetti.map((c, i) => (
          <div 
            key={i}
            className="absolute top-0 w-[8px] h-[16px] rounded-[4px] animate-fall shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            style={{ 
              left: `${c.left}%`, 
              backgroundColor: c.bg,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`
            }}
          />
        ))}
      </div>

      <div className="flex items-end justify-center gap-3 md:gap-8 pt-8 md:pt-12 px-6 w-full shrink-0 relative z-10">
        {podiumPlayers.map((p, i) => {
          if (!p) return null;
          const config = [
            { cls: 'h-[80px] md:h-[120px] bg-gradient-to-t from-gray-400 to-gray-300 text-gray-900 border-t-2 border-white/50 shadow-[0_0_20px_rgba(156,163,175,0.4)]', medal: '🥈' },
            { cls: 'h-[110px] md:h-[160px] bg-gradient-to-t from-amber to-yellow-300 text-amber-900 border-t-2 border-white/60 shadow-[0_0_30px_rgba(245,166,35,0.5)]', medal: '🥇' },
            { cls: 'h-[60px] md:h-[90px] bg-gradient-to-t from-orange-700 to-orange-500 text-orange-950 border-t-2 border-white/40 shadow-[0_0_15px_rgba(184,115,51,0.4)]', medal: '🥉' }
          ][i];
          
          return (
            <div key={i} className="flex flex-col items-center gap-2 md:gap-4">
              <PlayerAvatar 
                name={p.name} 
                color={p.color} 
                className={`animate-dropIn shadow-[0_10px_20px_rgba(0,0,0,0.5)]`}
                size={i === 1 ? 'lg' : 'md'}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
              <div className={`text-[12px] md:text-[18px] font-extrabold text-center max-w-[85px] md:max-w-[120px] truncate px-1 ${i === 1 ? 'text-amber' : 'text-white/80'}`}>
                {p.name}
              </div>
              <div className={`w-[85px] md:w-[120px] rounded-t-xl flex items-start pt-2 md:pt-4 justify-center text-[24px] md:text-[36px] font-extrabold ${config.cls} backdrop-blur-md`}>
                {config.medal}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 md:gap-6 pt-6 md:pt-10 px-6 w-full justify-center flex-wrap shrink-0 relative z-10">
        <div className="flex items-center gap-2 py-2 md:py-3 px-4 md:px-6 rounded-full border border-coral/30 bg-coral/10 backdrop-blur-md text-[13px] md:text-[16px] font-bold shadow-[0_0_15px_rgba(255,92,56,0.15)]">
          😈 Best Liar: <span className="text-coral ml-1 drop-shadow-md">{bestLiar?.name || '---'}</span>
        </div>
        <div className="flex items-center gap-2 py-2 md:py-3 px-4 md:px-6 rounded-full border border-green/30 bg-green/10 backdrop-blur-md text-[13px] md:text-[16px] font-bold shadow-[0_0_15px_rgba(34,197,94,0.15)]">
          🕵️ Lie Detector: <span className="text-green ml-1 drop-shadow-md">{lieDetector?.name || '---'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-6 md:p-10 w-full mt-2 relative z-10 flex justify-center">
        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-2xl p-4 md:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] w-full md:max-w-3xl">
          <div className="text-[10px] md:text-[14px] tracking-[3px] md:tracking-[5px] uppercase text-white/50 mb-4 md:mb-6 font-bold text-center">
            Final standings
          </div>
          <div className="flex flex-col gap-2 md:gap-3">
            {allPlayers.map((p, i) => (
              <div key={i} className="flex items-center gap-3 md:gap-6 py-2.5 md:py-4 px-3 md:px-6 rounded-lg md:rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-[20px] md:w-[30px] font-black text-white/30 text-[14px] md:text-[20px] text-center">
                  {i + 1}
                </div>
                <PlayerAvatar name={p.name} color={p.color} size="sm" />
                <div className="flex-1 text-[14px] md:text-[20px] font-bold tracking-tight" style={{ color: p.color }}>
                  {p.name}
                </div>
                <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber to-orange-400 text-[16px] md:text-[24px]">
                  {Math.round(p.score || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 md:gap-5 justify-center py-4 px-6 pb-8 md:pb-12 w-full shrink-0 relative z-10">
        {['🔥', '😂', '😱', '👏', '👑'].map((emoji, i) => (
          <button 
            key={i}
            onClick={() => handleRxn(emoji)}
            className="text-[24px] md:text-[32px] bg-white/[0.05] border border-white/10 backdrop-blur-md rounded-full w-[52px] h-[52px] md:w-[72px] md:h-[72px] flex items-center justify-center cursor-pointer hover:border-amber hover:bg-amber/10 hover:scale-110 hover:shadow-[0_0_20px_rgba(245,166,35,0.3)] transition-all active:scale-[0.9]"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
