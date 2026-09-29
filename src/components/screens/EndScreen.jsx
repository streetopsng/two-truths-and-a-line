import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { EndSessionButton } from '../ui/EndSessionButton';

const REACTION_ICONS = [
  { id: 'fire', path: <path d="M12 2c-1.2 3-3.2 4.3-3.2 7.3a3.2 3.2 0 0 0 6.4 0c0-1-.3-1.8-.7-2.5 1.6 1.2 2.5 3 2.5 5.2a5 5 0 1 1-10 0c0-4.3 3.2-6.6 5-10Z" fill="currentColor" stroke="none" /> },
  { id: 'laugh', path: <><circle cx="12" cy="12" r="9" /><path d="M8 10h.01M16 10h.01M8 13.5c1 1.5 2.5 2.2 4 2.2s3-.7 4-2.2" strokeLinecap="round" /></> },
  { id: 'shock', path: <><circle cx="12" cy="12" r="9" /><path d="M8.5 9v.01M15.5 9v.01" strokeLinecap="round" strokeWidth={2.4} /><circle cx="12" cy="15" r="1.7" /></> },
  { id: 'clap', path: <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3H14ZM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" strokeLinejoin="round" /> },
  { id: 'crown', path: <path d="M3 18h18l-1.5-9-4.5 4-3-6-3 6-4.5-4L3 18Z" strokeLinejoin="round" /> },
];

export const EndScreen = () => {
  const { gameState, ggSession } = useGame();
  const { players } = gameState;
  const [confetti, setConfetti] = useState([]);
  const [activeRxn, setActiveRxn] = useState(null);

  const allPlayers = Object.values(players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
  const podiumPlayers = [allPlayers[1], allPlayers[0], allPlayers[2]]; // Silver (left), Gold (center), Bronze (right)
  const bestLiar = [...allPlayers].sort((a, b) => (b.liarPoints || 0) - (a.liarPoints || 0))[0];
  const lieDetector = [...allPlayers].sort((a, b) => (b.correctGuesses || 0) - (a.correctGuesses || 0))[0];

  useEffect(() => {
    // Generate confetti particles
    const cols = ['#F5821F', '#3b82f6', '#a855f7', '#22c55e', '#ef4444'];
    const newConfetti = Array.from({ length: 24 }).map((_, i) => ({
      left: Math.random() * 100,
      bg: cols[i % cols.length],
      delay: Math.random() * 0.8,
      duration: 0.8 + Math.random() * 0.6
    }));
    setConfetti(newConfetti);
  }, []);

  const handleRxn = (emoji) => {
    setActiveRxn(emoji);
    setTimeout(() => setActiveRxn(null), 300);
  };

  const handleClose = () => {
    try {
      window.close();
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-[500px] w-full mx-auto relative z-10 p-4 sm:p-6 justify-between animate-fadeUp overflow-hidden">
      {/* Top bar with leave button */}
      <div className="flex items-center justify-between pt-1 shrink-0 relative z-20">
        {ggSession?.isHost ? (
          <EndSessionButton />
        ) : (
          <button
            onClick={handleClose}
            className="text-[12px] font-extrabold uppercase tracking-wider text-[#555] hover:text-[#1A1A1A] cursor-pointer bg-white px-3.5 py-1.5 rounded-full border border-[#E0DBD4] shadow-[0_2px_0_#E0DBD4]"
          >
            Close tab
          </button>
        )}
        <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#E8710A]">
          Game Over
        </div>
      </div>

      {/* Confetti container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {confetti.map((c, i) => (
          <div 
            key={i}
            className="absolute top-0 w-[8px] h-[14px] rounded-[3px] animate-fall opacity-90 shadow-sm"
            style={{ 
              left: `${c.left}%`, 
              backgroundColor: c.bg,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`
            }}
          />
        ))}
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 pt-4 px-2 shrink-0 relative z-10">
        {podiumPlayers.map((p, i) => {
          if (!p) return null;
          const config = [
            { cls: 'h-[64px] bg-[#9ca3af] text-white shadow-[0_3px_0_#6b7280]', label: '2nd' },
            { cls: 'h-[86px] bg-[#F5821F] text-[#1A1A1A] shadow-[0_3px_0_#E8710A]', label: '1st' },
            { cls: 'h-[48px] bg-[#b87333] text-white shadow-[0_3px_0_#8B5A2B]', label: '3rd' }
          ][i];
          
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1 max-w-[90px]">
              <PlayerAvatar 
                name={p.name} 
                color={p.color} 
                avatarId={p.avatarId}
                className="animate-dropIn shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
                size={i === 1 ? 'lg' : 'md'}
              />
              <div className={`text-[11px] font-extrabold text-center truncate px-1 max-w-[80px] ${i === 1 ? 'text-[#E8710A]' : 'text-[#1A1A1A]'}`}>
                {p.name}
              </div>
              <div className={`w-full rounded-t-[8px] flex flex-col items-center justify-center font-black ${config.cls}`}>
                <span className="text-[15px] leading-none tracking-tight">{config.label}</span>
                <span className="text-[10px] mt-0.5">{Math.round(p.score || 0)} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badges strip */}
      <div className="flex gap-2 justify-center flex-wrap shrink-0 relative z-10 my-2">
        <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white border border-[#E0DBD4] text-[12px] font-bold shadow-[0_2px_0_#E0DBD4]">
          Best Liar: <strong className="text-[#E8710A] ml-1">{bestLiar?.name || '—'}</strong>
        </div>
        <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white border border-[#E0DBD4] text-[12px] font-bold shadow-[0_2px_0_#E0DBD4]">
          Top Detective: <strong className="text-[#22A855] ml-1">{lieDetector?.name || '—'}</strong>
        </div>
      </div>

      {/* Final standings list */}
      <div className="flex-1 overflow-y-auto bg-white border-[1.5px] border-[#E0DBD4] rounded-[16px] p-3.5 shadow-[0_2px_0_#E0DBD4] my-2 relative z-10">
        <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#999] mb-2 px-1">
          Final Standings
        </div>
        <div className="flex flex-col gap-1.5">
          {allPlayers.map((p, i) => (
            <div key={p.uid || i} className="flex items-center gap-2.5 py-2 px-2 border-b border-[#E0DBD4] last:border-b-0">
              <div className="w-5 font-black text-[#999] text-xs text-center">
                {i + 1}
              </div>
              <PlayerAvatar name={p.name} color={p.color} avatarId={p.avatarId} size="sm" />
              <div className="flex-1 text-[13px] font-bold text-[#1A1A1A] truncate">
                {p.name}
              </div>
              <div className="font-extrabold text-[#E8710A] text-xs">
                {Math.round(p.score || 0)} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reactions bar */}
      <div className="flex gap-2.5 justify-center py-2 shrink-0 relative z-10">
        {REACTION_ICONS.map(({ id, path }) => (
          <button
            key={id}
            onClick={() => handleRxn(id)}
            aria-label={id}
            className={`bg-white border-[1.5px] border-[#E0DBD4] rounded-full w-[42px] h-[42px] flex items-center justify-center cursor-pointer shadow-[0_2px_0_#E0DBD4] transition-all active:translate-y-[2px] text-[#555] ${
              activeRxn === id ? 'scale-125 border-[#F5821F] text-[#F5821F]' : 'hover:border-[#F5821F]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>{path}</svg>
          </button>
        ))}
      </div>

      {ggSession && (
        <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-center z-10">
          {ggSession.isHost ? (
            <EndSessionButton variant="primary" />
          ) : (
            <div className="text-center px-5 py-3 bg-white/90 border border-[#E0DBD4] rounded-2xl shadow-xs">
              <div className="text-xs font-black text-[#1A1A1A]">Session completed!</div>
              <p className="text-[11.5px] text-[#777] mt-0.5">Thank you for playing — you can safely close this tab now.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
