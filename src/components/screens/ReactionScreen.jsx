import React, { useState } from 'react';
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

  const title = perfect ? 'Nobody caught you! 😈' : fooled > gotMe ? 'You fooled most of them! 😏' : 'They got you! 😅';
  const subtitle = totalVoters > 0
    ? `${fooled} out of ${totalVoters} players fell for the lie. ${gotMe} spotted it.`
    : `Not enough voters this round to score.`;

  const handlePick = async (emoji) => {
    setPicked(emoji);
    await updateGameDoc({
      [`players.${currentUser.uid}.lastReaction`]: emoji
    });
    setTimeout(() => {
      if (isHost) updateGameDoc({ status: 'leaderboard' });
    }, 1200);
  };

  const skipReaction = () => {
    if (isHost) updateGameDoc({ status: 'leaderboard' });
  };

  const reactions = [
    { emoji: '😂', label: 'Dying' },
    { emoji: '🤯', label: 'Shook' },
    { emoji: '😏', label: 'Unbothered' },
    { emoji: '😤', label: 'Annoyed' },
    { emoji: '🙈', label: 'Hiding' },
  ];

  if (!isMe) {
    // Other players just see a waiting screen while subject reacts
    return (
      <div className="flex flex-col h-full max-w-[430px] mx-auto justify-center items-center">
        <div className="text-4xl animate-bounce mb-4">{subject?.lastReaction || '⏳'}</div>
        <div className="text-lg font-bold">Waiting for {subject?.name}'s reaction...</div>
        {isHost && (
          <button 
            onClick={skipReaction}
            className="mt-6 text-[13px] text-muted underline cursor-pointer hover:text-white"
          >
            Skip waiting (Host)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-none w-full mx-auto justify-center items-center relative z-10">
      <div className="flex flex-col items-center text-center px-8 py-10 w-[90%] max-w-[360px] md:max-w-[480px] md:p-12 gap-4 md:gap-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="text-[28px] md:text-[36px] font-black leading-[1.2] tracking-tight">
          {title}
        </div>
        <div className="text-[14px] md:text-[18px] text-white/70 font-medium leading-[1.6]">
          {subtitle}
        </div>
        <div className="text-[48px] md:text-[64px] font-black text-transparent bg-clip-text bg-gradient-to-b from-coral to-red animate-scoreIn drop-shadow-[0_0_20px_rgba(255,92,56,0.4)]">
          +{roundBonus || 0} pts
        </div>

        <div className="grid grid-cols-5 gap-3 md:gap-4 w-full mt-4 md:mt-6">
          {reactions.map(r => (
            <button
              key={r.emoji}
              onClick={() => handlePick(r.emoji)}
              className={`rounded-xl p-2.5 md:p-4 text-[32px] md:text-[42px] cursor-pointer transition-all duration-200 flex flex-col items-center gap-2 border backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]
                ${picked === r.emoji 
                  ? 'border-amber bg-amber/20 shadow-[0_0_20px_rgba(245,166,35,0.4)] scale-110 z-10' 
                  : 'border-white/10 bg-white/[0.02] hover:border-amber/50 hover:bg-white/[0.05] hover:scale-105 active:scale-95'}
              `}
            >
              <span className="drop-shadow-md">{r.emoji}</span>
              <span className={`text-[10px] md:text-[12px] font-bold tracking-wide transition-colors ${picked === r.emoji ? 'text-amber' : 'text-white/40'}`}>{r.label}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={skipReaction}
          className="text-[12px] md:text-[14px] text-white/30 font-bold uppercase tracking-wider cursor-pointer mt-4 hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-white/5"
        >
          Skip reaction →
        </button>
      </div>
    </div>
  );
};
