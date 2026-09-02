import React from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from '../ui/PlayerAvatar';

export const LeaderboardScreen = () => {
  const { gameState, currentUser, updateGameDoc } = useGame();
  const { currentRound, roundOrder, players, hostUid, votes, fooled, totalVoters } = gameState;

  // Each round entry is { uid, setIndex } — one entry per statement set.
  const roundEntry = roundOrder?.[currentRound];
  const subjectUid = roundEntry?.uid;
  const setIndex = roundEntry?.setIndex ?? 0;
  const subject = players?.[subjectUid];
  const activeSet = subject?.statementSets?.[setIndex];
  const isMe = subjectUid === currentUser?.uid;
  const isHost = currentUser?.uid === hostUid;
  
  // Did current user guess correctly?
  const myVote = votes?.[currentUser?.uid];
  const voterCorrect = myVote === activeSet?.lieIndex;

  const allPlayers = Object.values(players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
  const isLast = currentRound >= (roundOrder?.length || 1) - 1;

  const handleNext = async () => {
    if (isLast) {
      await updateGameDoc({ status: 'end' });
    } else {
      await updateGameDoc({ 
        status: 'question',
        currentRound: currentRound + 1,
        roundEndTime: Date.now() + 30000,
        votes: {},
        revealed: false
      });
    }
  };

  if (!subject || !activeSet) return null;

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-none w-full mx-auto relative z-10 md:justify-center md:items-center">
      <div className="pt-8 px-6 pb-4 shrink-0 md:w-full md:max-w-5xl md:mb-4">
        <div className="text-[10px] text-white/50 tracking-[3px] uppercase font-bold">
          After round {currentRound + 1}
        </div>
        <div className="text-[28px] md:text-[42px] font-black mt-1 tracking-tight">
          That was <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber to-orange-400">{subject.name}</span>!
          {setIndex > 0 && <span className="text-white/40 text-[15px] md:text-[24px] ml-2 font-bold">· set {setIndex + 1}</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 md:w-full md:max-w-5xl">
        <div className="flex flex-col md:flex-row md:gap-8">
          <div className="mx-6 md:mx-0 mb-5 md:mb-0 bg-white/[0.03] border border-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:flex-1 h-fit">
            <div className="p-3.5 md:p-5 px-5 md:px-6 flex items-center gap-3 md:gap-4 border-b border-white/5 bg-black/20">
              <PlayerAvatar name={subject.name} color={subject.color} size="md" />
              <div className="text-[14px] md:text-[18px] font-bold flex-1 tracking-tight">
                {subject.name}'s statements {subject.lastReaction && <span className="ml-1 text-[16px] md:text-[20px]">{subject.lastReaction}</span>}
              </div>
              <div className="text-xs md:text-[14px] text-amber font-bold tracking-wide">
                {isMe
                  ? 'Your round'
                  : isHost
                    ? (totalVoters > 0 ? `🤫 ${fooled ?? 0} of ${totalVoters} fell for it` : 'Host view')
                    : (voterCorrect ? '✓ You got it' : '✗ You missed it')}
              </div>
            </div>
            
            <div className="p-3 md:p-6 px-5 md:px-6 pb-4 flex flex-col gap-2 md:gap-4">
              {activeSet.statements.map((stmt, i) => {
                const isLie = i === activeSet.lieIndex;
                return (
                  <div 
                    key={i} 
                    className={`text-[13px] md:text-[16px] p-2.5 md:p-4 px-4 md:px-5 rounded-lg md:rounded-xl leading-[1.5] border transition-all ${
                      isLie 
                        ? 'bg-red/10 text-white border-red/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] scale-[1.02]' 
                        : 'bg-white/[0.02] text-white/70 border-white/5'
                    }`}
                  >
                    <div className={`text-[10px] md:text-[12px] font-extrabold tracking-[2px] uppercase mb-1 md:mb-2 ${isLie ? 'text-red' : 'text-green'}`}>
                      {isLie ? '🔴 The lie' : '🟢 Truth'}
                    </div>
                    <span className={isLie ? 'font-semibold' : 'font-medium'}>{stmt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 pb-6 md:px-0 md:pb-0 md:flex-1">
            <div className="hidden md:block text-[10px] text-white/50 tracking-[3px] uppercase font-bold mb-4">
              Current Standings
            </div>
            <div className="flex flex-col gap-2 md:gap-3">
              {allPlayers.map((p, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                const isMeRow = p.name === players[currentUser?.uid]?.name;
                return (
                  <div 
                    key={i}
                    className={`flex items-center gap-3 md:gap-4 p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-white/[0.03] border backdrop-blur-md animate-slideIn ${
                      isMeRow 
                        ? 'border-amber/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_15px_rgba(245,166,35,0.15)] bg-amber/[0.02]' 
                        : 'border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-white/[0.05]'
                    }`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="text-[18px] md:text-[24px] font-extrabold w-6 md:w-8 text-center shrink-0 drop-shadow-md">
                      {medals[i] || (i + 1)}
                    </div>
                    <PlayerAvatar name={p.name} color={p.color} size="sm" />
                    <div className="flex-1">
                      <div className="text-[14px] md:text-[16px] font-bold tracking-tight" style={{ color: p.color }}>
                        {p.name} {isMeRow ? <span className="text-white/30 ml-1 font-medium">(you)</span> : ''}
                      </div>
                      {p.streak >= 3 && (
                        <div className="text-[11px] md:text-[13px] text-coral mt-0.5 font-bold tracking-wide">🔥 {p.streak} streak</div>
                      )}
                    </div>
                    <div className="text-[20px] md:text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber to-orange-400 drop-shadow-sm">
                      {Math.round(p.score || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 bg-black/20 backdrop-blur-xl border-t border-white/10 shrink-0 rounded-t-2xl md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:w-full md:max-w-md md:mt-8 md:mb-6">
        {isHost ? (
          <button 
            onClick={handleNext}
            className="w-full p-4 rounded-xl text-[15px] font-bold border-none cursor-pointer bg-gradient-to-r from-coral to-red text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,92,56,0.3)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out mix-blend-overlay"></div>
            {isLast ? 'See final results 🏆' : 'Next round →'}
          </button>
        ) : (
          <div className="w-full p-4 rounded-xl text-[14px] text-center font-bold border border-white/10 text-white/50 bg-white/[0.02]">
            Waiting for host to continue...
          </div>
        )}
      </div>
    </div>
  );
};
