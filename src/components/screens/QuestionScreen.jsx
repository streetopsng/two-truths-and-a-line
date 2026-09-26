import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from '../ui/PlayerAvatar';

export const QuestionScreen = () => {
  const { gameState, currentUser, updateGameDoc } = useGame();
  const { currentRound, roundOrder, players, roundEndTime, votes, revealed, hostUid } = gameState;
  
  // Each round entry is { uid, setIndex } — one entry per statement set.
  const roundEntry = roundOrder?.[currentRound];
  const subjectUid = roundEntry?.uid;
  const setIndex = roundEntry?.setIndex ?? 0;
  const subject = players?.[subjectUid];
  const activeSet = subject?.statementSets?.[setIndex] || (subject?.statements ? { statements: subject.statements, lieIndex: subject.lieIndex } : null);
  const hasValidStatements = Boolean(
    activeSet?.statements &&
    Array.isArray(activeSet.statements) &&
    activeSet.statements.length > 0 &&
    activeSet.statements.some((st) => st && String(st).trim())
  );
  const me = players?.[currentUser?.uid];
  const isMe = subjectUid === currentUser?.uid;
  const isHost = currentUser?.uid === hostUid;

  // Host spectator data: live votes per statement, who still has to vote, and
  // the running scoreboard. Players never see any of this — only the host does.
  const votersByStatement = [0, 1, 2].map((idx) =>
    Object.entries(votes || {})
      .filter(([uid, choice]) => choice === idx && players?.[uid])
      .map(([uid]) => ({ uid, ...players[uid] }))
  );
  const waitingOn = Object.entries(players || {})
    .filter(([uid]) => uid !== subjectUid && votes?.[uid] === undefined)
    .map(([, p]) => p.name);
  const liveStandings = Object.entries(players || {})
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  
  const [timeLeft, setTimeLeft] = useState(30);
  const hasRevealedRef = useRef(false);

  // Reset ref when we move to a new round
  useEffect(() => {
    if (!revealed) {
      hasRevealedRef.current = false;
    }
  }, [revealed]);

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

  useEffect(() => {
    if (!isHost || revealed || hasRevealedRef.current) return;
    
    const numVoters = Object.keys(players || {}).length - 1; // excluding subject
    const votesCast = Object.keys(votes || {}).length;
    const allVoted = numVoters > 0 && votesCast >= numVoters;

    if (timeLeft === 0 || allVoted) {
      hasRevealedRef.current = true;
      handleReveal().catch((err) => console.error('handleReveal failed:', err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, votes, players, isHost, revealed]);

  const handleVote = async (idx) => {
    if (revealed || isMe || isHost) return;
    await updateGameDoc({
      [`votes.${currentUser.uid}`]: idx
    });
  };

  const handleReveal = async () => {
    const voters = Object.keys(players || {}).filter(uid => uid !== subjectUid);
    const updates = { revealed: true };
    
    let wrongVoters = 0;
    
    voters.forEach(vUid => {
      const chosen = votes?.[vUid];
      const correct = chosen === activeSet.lieIndex;
      const vPlayer = players[vUid];
      const fast = correct && (timeLeft >= 20);
      
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
    
    // Move to reaction after 3 seconds
    setTimeout(() => {
      updateGameDoc({ status: 'reaction', roundBonus: bonus, totalVoters: voters.length, fooled: wrongVoters });
    }, 3000);
  };

  if (!subject || !activeSet) return null;

  const myVote = votes?.[currentUser?.uid];
  const votesCast = Object.keys(votes || {}).length;
  const isDangerTime = timeLeft <= 8;

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-[520px] w-full mx-auto relative z-10 p-4 sm:p-6 justify-between animate-fadeUp">
      {/* Session header */}
      <div className="text-center pt-1 pb-2 shrink-0">
        <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#999]">
          Round {currentRound + 1} of {roundOrder?.length || 0}
        </div>
        <div className="text-[16px] font-black text-[#1A1A1A] flex items-center justify-center gap-2 mt-0.5">
          <div className="w-[6px] h-[6px] rounded-full bg-[#F5821F] shrink-0"></div>
          <span>2 Truths & a Lie</span>
          <div className="w-[6px] h-[6px] rounded-full bg-[#F5821F] shrink-0"></div>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <div className="bg-white border-[1.5px] border-[#E0DBD4] rounded-[10px] p-2 text-center shadow-[0_2px_0_#E0DBD4]">
          <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#999] mb-1">🏆 Score</div>
          <div className="text-[18px] font-black text-[#1A1A1A] leading-none">{Math.round(me?.score || 0)}</div>
        </div>
        <div className="bg-white border-[1.5px] border-[#E0DBD4] rounded-[10px] p-2 text-center shadow-[0_2px_0_#E0DBD4]">
          <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#999] mb-1">⏱ Time</div>
          <div className={`text-[18px] font-black leading-none ${isDangerTime ? 'text-[#E8334A]' : 'text-[#1A1A1A]'}`}>
            {timeLeft}s
          </div>
        </div>
        <div className="bg-white border-[1.5px] border-[#E0DBD4] rounded-[10px] p-2 text-center shadow-[0_2px_0_#E0DBD4]">
          <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#999] mb-1">{isHost ? 'Role' : '🔥 Streak'}</div>
          <div className={`text-[18px] font-black leading-none ${isHost ? 'text-[#F5821F] text-[13px]' : 'text-[#E8710A]'}`}>
            {isHost ? '👁 Host' : (me?.streak || 0)}
          </div>
        </div>
        <div className="bg-white border-[1.5px] border-[#E0DBD4] rounded-[10px] p-2 text-center shadow-[0_2px_0_#E0DBD4]">
          <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#999] mb-1">📍 Round</div>
          <div className="text-[18px] font-black text-[#1A1A1A] leading-none">{currentRound + 1}/{roundOrder?.length || 1}</div>
        </div>
      </div>

      {/* Timer progress bar */}
      <div className="h-[6px] bg-[#E0DBD4] rounded-full overflow-hidden mt-3 shrink-0">
        <div 
          className={`h-full rounded-full transition-all duration-500 linear ${isDangerTime ? 'bg-[#E8334A]' : 'bg-[#F5821F]'}`}
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        />
      </div>

      {/* Subject card */}
      <div className="card p-3.5 mt-3 bg-white border-[1.5px] border-[#E0DBD4] rounded-[16px] shadow-[0_3px_0_#E0DBD4] flex items-center gap-3 shrink-0">
        <PlayerAvatar name={subject.name} color={subject.color} avatarId={subject.avatarId} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-black text-[#1A1A1A] truncate">
            {subject.name} {isMe ? <span className="text-[#F5821F] text-xs font-bold">(you)</span> : ''}
          </div>
          <div className="text-[12px] text-[#777] font-medium mt-0.5">
            Which one is the lie?
          </div>
        </div>
        {!isMe && (
          <div className="text-right shrink-0">
            <div className="text-[20px] font-black text-[#F5821F] leading-none">{votesCast}</div>
            <div className="text-[9px] text-[#999] font-bold uppercase tracking-wider mt-1">voted</div>
          </div>
        )}
      </div>

      {/* Statements or Subject Wait */}
      {!hasValidStatements ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3 my-3 bg-white border border-[#E0DBD4] rounded-[16px] shadow-[0_2px_0_#E0DBD4]">
          <div className="text-[44px] leading-none">📝</div>
          <div className="text-[18px] font-black text-[#1A1A1A]">Statement not added</div>
          <div className="text-[13px] text-[#666] max-w-[280px] leading-relaxed">
            {isMe 
              ? "You didn't add your statements before this round began." 
              : `${subject?.name || 'This player'} didn't add their statements before this round began.`}
          </div>
        </div>
      ) : isMe && !revealed ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3 my-2">
          <div className="text-[52px] animate-pulseCustom leading-none">👀</div>
          <div className="text-[22px] font-black text-[#1A1A1A]">It's your round!</div>
          <div className="text-[13px] text-[#555] leading-[1.6] max-w-[260px]">
            Your teammates are deciding which of your statements is the lie...
          </div>
          <div className="text-[20px] font-black text-[#F5821F] mt-2">
            {votesCast} voted so far
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center gap-3 my-3">
          {activeSet.statements.map((stmt, i) => {
            const isLie = activeSet.lieIndex === i;
            const amISelected = myVote === i;
            const statementVoters = votersByStatement[i];
            const numVotes = Object.values(votes || {}).filter(v => v === i).length;

            let cardStyle = 'bg-white border-[#E0DBD4] shadow-[0_3px_0_#E0DBD4] hover:border-[#F5821F] hover:shadow-[0_3px_0_#E8710A]';
            if (revealed) {
              cardStyle = isLie
                ? 'bg-[#FFF0EE] !border-[#E8334A] !shadow-[0_3px_0_#c0271d]'
                : 'bg-[#F0FFF5] !border-[#22A855] !shadow-[0_3px_0_#1a8040]';
            } else if (amISelected) {
              cardStyle = 'bg-[#FDF0E4] border-[#F5821F] shadow-[0_3px_0_#E8710A]';
            }

            return (
              <button
                key={i}
                disabled={revealed || isMe || isHost}
                onClick={() => handleVote(i)}
                className={`relative rounded-[16px] p-4 text-left border-[2px] transition-all duration-150 ${
                  revealed || isMe || isHost ? 'cursor-default' : 'cursor-pointer'
                } ${cardStyle}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`text-[10px] font-extrabold tracking-[2px] uppercase mb-1 ${
                    revealed 
                      ? (isLie ? 'text-[#E8334A]' : 'text-[#22A855]') 
                      : (amISelected ? 'text-[#E8710A]' : 'text-[#999]')
                  }`}>
                    Statement {i + 1}
                  </div>
                  {(revealed || isHost) && (
                    <div className={`text-[11px] font-bold ${revealed ? (isLie ? 'text-[#E8334A]' : 'text-[#777]') : 'text-[#999]'}`}>
                      {numVotes} {numVotes === 1 ? 'vote' : 'votes'}
                    </div>
                  )}
                </div>

                <div className="text-[14px] font-semibold text-[#1A1A1A] leading-[1.45]">
                  {stmt}
                </div>

                {/* Host only: live tally of who voted */}
                {isHost && statementVoters?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-[#E0DBD4]">
                    {statementVoters.map((v) => (
                      <div key={v.uid} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E0DBD4]">
                        <PlayerAvatar name={v.name} color={v.color} avatarId={v.avatarId} size="sm" className="!w-4 !h-4 !text-[7px]" />
                        <span className="text-[10px] font-bold text-[#555]">{v.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {revealed && (
                  <div className={`text-[11px] font-bold mt-2 ${isLie ? 'text-[#E8334A]' : 'text-[#22A855]'}`}>
                    {numVotes} {numVotes === 1 ? 'player picked this' : 'players picked this'}
                  </div>
                )}

                {revealed && isLie && (
                  <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 bg-[#E8334A] text-white text-[9px] font-black px-3.5 py-0.5 rounded-b-[10px] tracking-[1.5px] uppercase shadow-sm">
                    THE LIE
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Host-only spectator panel: live scoreboard + who still has to vote */}
      {isHost ? (
        <div className="mt-2 mb-2 w-full rounded-[16px] border-[1.5px] border-[#E0DBD4] bg-white p-4 shadow-[0_3px_0_#E0DBD4] shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2.5">
            <div className="text-[10px] tracking-[2px] uppercase text-[#999] font-black">
              Live scores
            </div>
            {!revealed && (waitingOn.length > 0
              ? <div className="text-[11px] text-[#E8710A] font-bold tracking-wide truncate max-w-[65%]">⏳ Waiting on: {waitingOn.join(', ')}</div>
              : <div className="text-[11px] text-[#22A855] font-bold tracking-wide">✓ All votes in — revealing…</div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
            {liveStandings.map((p) => {
              const hasVoted = p.uid !== subjectUid && votes?.[p.uid] !== undefined;
              return (
                <div key={p.uid} className="flex items-center gap-2.5 p-2 rounded-[10px] bg-[#FAF7F2] border border-[#E0DBD4]">
                  <PlayerAvatar name={p.name} color={p.color} avatarId={p.avatarId} size="sm" />
                  <div className="flex-1 text-[13px] font-bold text-[#1A1A1A] truncate">
                    {p.name}
                    {p.uid === subjectUid && <span className="text-[#999] font-medium ml-1.5 text-xs">(in the hot seat)</span>}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide w-16 text-right whitespace-nowrap">
                    {p.uid === subjectUid
                      ? <span className="text-[#999]">hot seat</span>
                      : hasVoted
                        ? <span className="text-[#22A855]">✓ voted</span>
                        : <span className="text-[#E8710A]">voting…</span>}
                  </div>
                  <div className="text-[15px] font-black text-[#F5821F] w-10 text-right">
                    {Math.round(p.score || 0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-[#999] text-center font-bold uppercase tracking-wider shrink-0 pb-1">
          {!hasValidStatements ? 'No statements submitted for this player' : revealed ? 'Revealing results...' : (isMe ? 'Host managing round' : (myVote !== undefined ? '✓ Vote submitted' : 'Pick the statement you think is the lie'))}
        </div>
      )}
    </div>
  );
};
