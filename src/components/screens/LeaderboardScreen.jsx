import React from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { Button } from '../ui/Button';

export const LeaderboardScreen = () => {
  const { gameState, currentUser, updateGameDoc } = useGame();
  const { currentRound, roundOrder, players, hostUid, votes } = gameState;

  const subjectUid = roundOrder?.[currentRound];
  const subject = players?.[subjectUid];
  const isMe = subjectUid === currentUser?.uid;
  const isHost = currentUser?.uid === hostUid;
  
  // Did current user guess correctly?
  const myVote = votes?.[currentUser?.uid];
  const voterCorrect = myVote === subject?.lieIndex;

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

  if (!subject) return null;

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-[500px] w-full mx-auto relative z-10 p-4 sm:p-6 justify-between animate-fadeUp">
      {/* Header */}
      <div className="pt-1 pb-2 shrink-0">
        <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#E8710A]">
          After round {currentRound + 1}
        </div>
        <h2 className="text-[26px] font-black text-[#1A1A1A] mt-0.5 tracking-tight">
          That was <span className="text-[#F5821F]">{subject.name}</span>!
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 my-2 pr-1">
        {/* Reveal summary card */}
        <div className="bg-white border-[1.5px] border-[#E0DBD4] rounded-[16px] overflow-hidden shadow-[0_3px_0_#E0DBD4]">
          <div className="p-3.5 px-4 flex items-center gap-3 border-b border-[#E0DBD4] bg-[#FAF7F2]">
            <PlayerAvatar name={subject.name} color={subject.color} size="sm" />
            <div className="text-[14px] font-extrabold text-[#1A1A1A] flex-1">
              {subject.name}'s statements {subject.lastReaction && <span className="ml-1 text-[16px]">{subject.lastReaction}</span>}
            </div>
            <div className="text-[12px] font-bold text-[#E8710A]">
              {isMe ? 'Your round' : (voterCorrect ? '✓ You got it' : '✗ You missed it')}
            </div>
          </div>

          <div className="p-3.5 flex flex-col gap-2">
            {subject.statements.map((stmt, i) => {
              const isLie = i === subject.lieIndex;
              return (
                <div 
                  key={i}
                  className={`text-[12px] p-2.5 px-3 rounded-[10px] leading-[1.4] border ${
                    isLie 
                      ? 'bg-[#FFF0EE] text-[#E8334A] border-[#fbc9c4] font-semibold' 
                      : 'bg-[#F0FFF5] text-[#22A855] border-[#b8f0cf]'
                  }`}
                >
                  <div className="text-[9px] font-extrabold tracking-[1.5px] uppercase mb-1">
                    {isLie ? '🔴 The lie' : '🟢 Truth'}
                  </div>
                  <span>{stmt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live rankings panel */}
        <div className="bg-white border-[1.5px] border-[#E0DBD4] rounded-[16px] overflow-hidden shadow-[0_3px_0_#E0DBD4]">
          <div className="p-3 px-4 flex items-center gap-2 border-b border-[#E0DBD4]">
            <div className="w-[7px] h-[7px] rounded-full bg-[#F5821F] animate-blink"></div>
            <div className="text-[11px] font-extrabold tracking-[1.5px] uppercase text-[#1A1A1A]">
              Live rankings
            </div>
          </div>

          <div className="p-2 flex flex-col gap-1.5">
            {allPlayers.map((p, i) => {
              const isMeRow = p.name === players[currentUser?.uid]?.name;
              if (isMeRow) {
                return (
                  <div 
                    key={i} 
                    className="flex items-center gap-2.5 p-2.5 px-3 bg-[#FDE8D0] rounded-[10px] border-[1.5px] border-[#F5821F]"
                  >
                    <div className="text-[13px] font-extrabold text-[#F5821F] w-6 text-center">
                      #{i + 1}
                    </div>
                    <PlayerAvatar name={p.name} color={p.color} size="sm" />
                    <div className="text-[12px] font-bold text-[#E8710A] flex-1">
                      {p.name} <span className="text-[10px] font-black">(YOU)</span>
                      {p.streak >= 2 && <span className="ml-1 text-[11px]">🔥{p.streak}</span>}
                    </div>
                    <div className="text-[12px] font-bold text-[#E8710A]">
                      {Math.round(p.score || 0)} pts
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={i} 
                  className="flex items-center gap-2.5 p-2.5 px-3 bg-[#FAF7F2] rounded-[10px] border border-[#E0DBD4]"
                >
                  <div className="w-5 h-5 rounded-full bg-white text-[#555] text-[11px] font-extrabold flex items-center justify-center border border-[#E0DBD4]">
                    {i + 1}
                  </div>
                  <PlayerAvatar name={p.name} color={p.color} size="sm" />
                  <div className="text-[13px] font-bold text-[#1A1A1A] flex-1">
                    {p.name}
                    {p.streak >= 2 && <span className="ml-1 text-[11px] text-[#E8710A]">🔥{p.streak}</span>}
                  </div>
                  <div className="text-[12px] font-extrabold text-[#555]">
                    {Math.round(p.score || 0)} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / next CTA */}
      <div className="pt-2 shrink-0">
        {isHost ? (
          <Button onClick={handleNext} className="w-full">
            {isLast ? 'See final results 🏆' : 'Next round ›'}
          </Button>
        ) : (
          <div className="p-3 rounded-full text-center text-xs font-bold text-[#777] bg-white border border-[#E0DBD4] shadow-[0_2px_0_#E0DBD4]">
            Waiting for host to continue...
          </div>
        )}
      </div>
    </div>
  );
};
