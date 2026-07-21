import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from '../ui/PlayerAvatar';

export const QuestionScreen = () => {
  const { gameState, currentUser, updateGameDoc } = useGame();
  const { currentRound, roundOrder, players, roundEndTime, votes, revealed, hostUid } = gameState;
  
  const subjectUid = roundOrder?.[currentRound];
  const subject = players?.[subjectUid];
  const me = players?.[currentUser?.uid];
  const isMe = subjectUid === currentUser?.uid;
  const isHost = currentUser?.uid === hostUid;
  
  const [timeLeft, setTimeLeft] = useState(30);
  const hasRevealedRef = useRef(false);

  // Reset ref when we move to a new round
  useEffect(() => {
    if (!revealed) {
      hasRevealedRef.current = false;
    }
  }, [revealed]);

  // Sync Timer
  useEffect(() => {
    const calcTime = () => {
      if (!roundEndTime) return 30;
      const t = Math.round((roundEndTime - Date.now()) / 1000);
      return t > 0 ? t : 0;
    };
    
    setTimeLeft(calcTime());
    const timer = setInterval(() => {
      setTimeLeft(calcTime());
    }, 500);
    
    return () => clearInterval(timer);
  }, [roundEndTime]);

  // Trigger reveal when time is up or everyone voted
  useEffect(() => {
    if (!isHost || revealed || hasRevealedRef.current) return;
    
    const numVoters = Object.keys(players || {}).length - 1; // excluding subject
    const votesCast = Object.keys(votes || {}).length;
    const allVoted = numVoters > 0 && votesCast >= numVoters;

    if (timeLeft === 0 || allVoted) {
      hasRevealedRef.current = true;
      handleReveal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, votes, players, isHost, revealed]);

  const handleVote = async (idx) => {
    if (revealed || isMe) return;
    await updateGameDoc({
      [`votes.${currentUser.uid}`]: idx
    });
  };

  const handleReveal = async () => {
    // Calculate points
    const voters = Object.keys(players || {}).filter(uid => uid !== subjectUid);
    const results = {};
    const updates = { revealed: true };
    
    let wrongVoters = 0;
    
    voters.forEach(vUid => {
      const chosen = votes?.[vUid];
      const correct = chosen === subject.lieIndex;
      const vPlayer = players[vUid];
      const fast = correct && (timeLeft >= 20); // rough approximation
      
      let newScore = vPlayer.score;
      let newStreak = vPlayer.streak;
      let newGuesses = vPlayer.correctGuesses;
      
      if (correct) {
        let pts = 150;
        if (fast) pts += 50;
        const mult = newStreak >= 5 ? 2.0 : newStreak >= 3 ? 1.5 : newStreak >= 2 ? 1.2 : 1.0;
        newScore += Math.round(pts * mult);
        newStreak += 1;
        newGuesses += 1;
      } else {
        newStreak = 0;
        wrongVoters++;
      }
      
      updates[`players.${vUid}.score`] = newScore;
      updates[`players.${vUid}.streak`] = newStreak;
      updates[`players.${vUid}.correctGuesses`] = newGuesses;
    });

    const pctWrong = voters.length ? wrongVoters / voters.length : 0;
    let bonus = wrongVoters * 100;
    if (voters.length > 0 && pctWrong >= 0.8) bonus += 200;
    if (voters.length > 0 && wrongVoters === voters.length) bonus += 500;
    
    updates[`players.${subjectUid}.score`] = subject.score + bonus;
    updates[`players.${subjectUid}.liarPoints`] = (subject.liarPoints || 0) + bonus;

    await updateGameDoc(updates);
    
    // Move to reaction after a few seconds
    setTimeout(() => {
      updateGameDoc({ status: 'reaction', roundBonus: bonus, totalVoters: voters.length, fooled: wrongVoters });
    }, 3000);
  };

  if (!subject) return null;

  const myVote = votes?.[currentUser?.uid];
  const votesCast = Object.keys(votes || {}).length;

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-none w-full mx-auto relative z-10 md:justify-center md:items-center">
      <div className="pt-6 md:pt-0 px-6 flex items-start justify-between shrink-0 md:w-full md:max-w-5xl md:mb-6">
        <div className="md:hidden">
          <div className="text-[10px] text-white/50 tracking-[3px] uppercase font-bold">
            Round {currentRound + 1} of {roundOrder.length}
          </div>
        </div>
        <div className="text-right md:text-left">
          <div className="text-[26px] md:text-[36px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber to-orange-400 leading-none drop-shadow-[0_0_10px_rgba(245,166,35,0.3)]">{Math.round(me?.score || 0)} <span className="text-[12px] md:text-[16px] text-white/50 uppercase tracking-widest font-bold hidden md:inline-block">pts</span></div>
          {me?.streak >= 2 && (
            <div className="text-[11px] md:text-[14px] text-coral mt-1.5 font-bold tracking-wide">
              🔥 {me.streak} streak
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 px-6 shrink-0 md:w-full md:max-w-5xl">
        <div className="h-1.5 md:h-2 bg-black/40 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
          <div 
            className={`h-full rounded-full transition-all duration-1000 linear ${timeLeft <= 8 ? 'bg-red shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-gradient-to-r from-amber to-coral shadow-[0_0_10px_rgba(255,92,56,0.6)]'}`}
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>
        <div className="text-[11px] md:text-[14px] text-white/50 text-right mt-1.5 font-bold">
          {timeLeft}
        </div>
      </div>

      <div className="mx-6 md:mx-0 mt-5 md:mt-8 bg-white/[0.03] backdrop-blur-md rounded-xl p-4 md:p-6 flex items-center gap-3.5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] shrink-0 relative md:w-full md:max-w-5xl">
        <PlayerAvatar name={subject.name} color={subject.color} size="lg" />
        <div className="flex-1">
          <div className="text-[17px] md:text-[24px] font-extrabold tracking-tight">{subject.name} {isMe ? <span className="text-white/30 font-medium ml-1">(you)</span> : ''}</div>
          <div className="text-[13px] md:text-[16px] text-amber mt-0.5 font-medium opacity-90">Which one is the lie?</div>
        </div>
        {!isMe && (
          <div className="text-right">
            <div className="text-[22px] md:text-[32px] font-black text-white leading-none">{votesCast}</div>
            <div className="text-[10px] md:text-[12px] text-white/50 font-bold uppercase tracking-wide mt-1">voted</div>
          </div>
        )}
      </div>

      {isMe && !revealed ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="text-[64px] animate-pulseCustom drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">👀</div>
          <div className="text-[26px] md:text-[36px] font-black tracking-tight">It's your round!</div>
          <div className="text-[14px] md:text-[18px] text-white/60 font-medium leading-[1.6] max-w-[260px] md:max-w-[400px]">
            Your teammates are deciding which of your statements is the lie. You won't see how the vote is going until it's revealed.
          </div>
        </div>
      ) : (
        <div className="px-6 py-4 pb-6 flex flex-col md:grid md:grid-cols-3 gap-3.5 md:gap-6 flex-1 justify-center perspective-[1000px] md:w-full md:max-w-5xl md:flex-none md:mt-4">
          {subject.statements.map((stmt, i) => {
            const isLie = subject.lieIndex === i;
            const amISelected = myVote === i;
            
            let revealClass = '';
            if (revealed) {
               revealClass = isLie 
                ? 'bg-red/10 !border-red shadow-[0_0_30px_rgba(239,68,68,0.3)] z-10 scale-[1.03]' 
                : 'bg-white/[0.01] !border-white/5 opacity-50 grayscale';
            } else if (amISelected) {
               revealClass = 'bg-white/[0.08] !border-amber shadow-[0_0_20px_rgba(245,166,35,0.2)] scale-[1.02]';
            }
            
            const numVotes = Object.values(votes || {}).filter(v => v === i).length;

            return (
              <button 
                key={i}
                disabled={revealed || isMe}
                onClick={() => handleVote(i)}
                className={`rounded-xl p-5 md:p-8 text-left border backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 relative 
                  ${!revealed && !amISelected ? 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]' : ''}
                  ${!revealed && !isMe ? 'hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer' : 'cursor-default'}
                  ${revealed ? 'animate-cardFlip' : ''}
                  ${revealClass}
                `}
              >
                <div className={`text-[10px] md:text-[12px] font-extrabold tracking-[2px] md:tracking-[3px] uppercase mb-2 md:mb-4 transition-colors ${revealed ? (isLie ? 'text-red drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'text-white/30') : (amISelected ? 'text-amber' : 'text-white/30')}`}>
                  Statement {i + 1}
                </div>
                <div className={`text-[15px] md:text-[18px] font-medium leading-[1.5] transition-colors ${revealed && !isLie ? 'text-white/50' : 'text-white'}`}>
                  {stmt}
                </div>
                {revealed && (
                  <>
                    <div className={`absolute top-4 right-4 md:top-6 md:right-6 text-[12px] md:text-[14px] font-bold ${isLie ? 'text-red' : 'text-white/30'}`}>
                      {numVotes} {numVotes === 1 ? 'picked this' : 'picked this'}
                    </div>
                    {isLie && (
                      <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 bg-red text-white text-[10px] md:text-[12px] font-extrabold px-4 py-1 md:py-1.5 rounded-b-[10px] tracking-[2px] uppercase whitespace-nowrap shadow-[0_0_15px_rgba(239,68,68,0.8)]">
                        THE LIE
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
