import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';

export const ReactionScreen = () => {
  const { gameState, currentUser, updateGameDoc } = useGame();
  const { currentRound, roundOrder, players, roundBonus, totalVoters, fooled, hostUid } = gameState;
  const [picked, setPicked] = useState(null);

  const subjectUid = roundOrder?.[currentRound];
  const subject = players?.[subjectUid];
  const isMe = subjectUid === currentUser?.uid;
  const isHost = currentUser?.uid === hostUid;

  const perfect = totalVoters > 0 && fooled === totalVoters;
  const gotMe = totalVoters - fooled;

  const title = perfect 
    ? 'Nobody caught you! 😈' 
    : fooled > gotMe 
      ? 'You fooled most of them! 😏' 
      : 'They got you! 😅';

  const subtitle = totalVoters > 0
    ? `${fooled} out of ${totalVoters} players fell for the lie. ${gotMe} spotted it.`
    : `Not enough voters this round to score.`;

  // Host auto-advances when the subject's reaction is recorded
  useEffect(() => {
    if (isHost && subject?.lastReaction) {
      const timer = setTimeout(() => {
        updateGameDoc({ status: 'leaderboard' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isHost, subject?.lastReaction, updateGameDoc]);

  const handlePick = async (emoji) => {
    setPicked(emoji);
    await updateGameDoc({
      [`players.${currentUser.uid}.lastReaction`]: emoji
    });
  };

  const skipReaction = () => {
    if (isHost) updateGameDoc({ status: 'leaderboard' });
  };

  const reactions = [
    { emoji: '😂', label: 'DYING' },
    { emoji: '🤯', label: 'SHOOK' },
    { emoji: '😏', label: 'CALM' },
    { emoji: '😤', label: 'MAD' },
    { emoji: '🙈', label: 'HIDE' },
  ];

  if (!isMe) {
    return (
      <div className="flex flex-col h-full max-w-[430px] mx-auto justify-center items-center p-6 text-center animate-fadeUp relative z-10">
        <div className="card p-8 bg-white border-[1.5px] border-[#E0DBD4] rounded-[22px] shadow-[0_4px_0_#E0DBD4] flex flex-col items-center gap-3 w-full">
          <div className="text-[48px] animate-bounce mb-1">
            {subject?.lastReaction || '⏳'}
          </div>
          <div className="text-[18px] font-black text-[#1A1A1A]">
            Waiting for {subject?.name || 'player'}'s reaction...
          </div>
          <div className="text-[13px] text-[#777]">
            They are reacting to the round reveal!
          </div>
          {isHost && (
            <button 
              onClick={skipReaction}
              className="mt-4 text-[13px] font-bold text-[#E8710A] underline cursor-pointer hover:text-[#F5821F]"
            >
              Skip waiting (Host) →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-[480px] mx-auto justify-center items-center p-6 relative z-10 animate-fadeUp">
      <div className="card p-6 sm:p-8 bg-white border-[1.5px] border-[#E0DBD4] rounded-[22px] shadow-[0_4px_0_#E0DBD4] flex flex-col items-center text-center w-full">
        <h2 className="text-[22px] font-black text-[#1A1A1A] tracking-tight">
          {title}
        </h2>
        <p className="text-[13px] text-[#555] mt-1 leading-[1.6]">
          {subtitle}
        </p>

        <div className="text-[46px] font-black text-[#F5821F] my-4 leading-none animate-scoreIn">
          +{roundBonus || 0} pts
        </div>

        <div className="grid grid-cols-5 gap-2 w-full mt-2 mb-4">
          {reactions.map(r => (
            <button
              key={r.emoji}
              onClick={() => handlePick(r.emoji)}
              className={`rounded-[10px] p-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-[1.5px] ${
                picked === r.emoji 
                  ? 'bg-[#FDE8D0] border-[#F5821F] shadow-[0_2px_0_#E8710A] scale-105' 
                  : 'bg-[#FAF7F2] border-[#E0DBD4] shadow-[0_2px_0_#E0DBD4] hover:border-[#F5821F] active:translate-y-[1px]'
              }`}
            >
              <span className="text-[24px] leading-none">{r.emoji}</span>
              <span className="text-[9px] font-extrabold text-[#777] tracking-wider">{r.label}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={skipReaction}
          className="text-[12px] font-bold text-[#999] hover:text-[#555] cursor-pointer underline mt-1"
        >
          Skip reaction
        </button>
      </div>
    </div>
  );
};
