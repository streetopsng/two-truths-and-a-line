import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { returnToGummyGum, reportGummyGumCancel } from '../../lib/gummygumSession';

export const LobbyScreen = ({ onWrite }) => {
  const { gameState, currentUser, startGame, ggSession } = useGame();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { gameCode, players, hostUid } = gameState;
  
  const queryInvited = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('invitedCount') : null;
  const targetInvited = ggSession?.invitedCount || (queryInvited ? parseInt(queryInvited, 10) : null) || gameState?.invitedCount;

  const playersList = Object.values(players || {});
  const isHost = currentUser?.uid === hostUid;
  const MIN_PLAYERS = 3;
  const hasEnoughPlayers = playersList.length >= MIN_PLAYERS;
  const readyCount = playersList.filter((p) => p.submitted).length;
  const allSubmitted = playersList.length > 0 && playersList.every((p) => p.submitted);
  const me = players?.[currentUser?.uid];

  const handleCopyLink = () => {
    const hubUrl = ggSession?.hubUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://gummygum.app');
    const joinUrl = `${hubUrl}/join?pin=${gameCode}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(joinUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    setError('');
    try {
      await startGame();
    } catch (err) {
      console.error('Start game failed:', err);
      setError(err?.code ? `${err.code}: ${err.message}` : String(err?.message || err));
    }
  };

  const handleWriteClick = () => {
    if (onWrite) {
      onWrite();
    } else {
      navigate('/submit');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-[440px] md:max-w-[520px] mx-auto justify-between relative z-10 p-4 sm:p-6 animate-fadeUp">
      {/* Top action bar */}
      <div className="flex items-center justify-between px-1 pb-1 shrink-0">
        <button
          onClick={() => {
            if (isHost) {
              setShowCancelModal(true);
            } else {
              returnToGummyGum();
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#E0DBD4] text-xs font-bold text-[#555] hover:text-[#1A1A1A] hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          title="Back to GummyGum"
        >
          <span>← Back to GummyGum</span>
        </button>
        <span className="text-[11px] font-extrabold text-[#999] uppercase tracking-wider">
          Two Truths
        </span>
      </div>

      {/* Session header */}
      <div className="text-center pt-1 pb-1 shrink-0">
        <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#999]">
          Session
        </div>
        <div className="text-[18px] font-black text-[#1A1A1A] flex items-center justify-center gap-2 mt-0.5">
          <div className="w-[7px] h-[7px] rounded-full bg-[#F5821F] shrink-0"></div>
          <span>{isHost ? "You're hosting" : "You're in the Lobby"}</span>
          <div className="w-[7px] h-[7px] rounded-full bg-[#F5821F] shrink-0"></div>
        </div>
      </div>

      {/* Invites Status Card (No giant room code) */}
      <div className="card p-5 mx-1 mt-2 text-center bg-white border-[1.5px] border-[#E0DBD4] rounded-[16px] shadow-[0_2px_0_#E0DBD4] shrink-0">
        <div className="w-11 h-11 mx-auto rounded-xl bg-[#FDE8D0] border border-[#F5821F]/30 text-[#F5821F] flex items-center justify-center mb-2.5 shadow-xs">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="text-[15px] font-black text-[#1A1A1A]">
          {isHost ? "Invites already sent by email" : "Waiting for host to start"}
        </div>
        <p className="text-[12px] text-[#666] max-w-[340px] mx-auto mt-1 leading-relaxed">
          {isHost 
            ? "Your teammates received their 1-click join links by email — they will connect automatically." 
            : "You're in the room! Sit tight while your host and teammates assemble."}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <Badge variant="amber" className="rounded-[8px] py-1 px-3">
            {targetInvited ? `${playersList.length} / ${targetInvited} players joined` : `${playersList.length} player${playersList.length === 1 ? '' : 's'} joined`}
          </Badge>
          {isHost && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1 bg-[#FAF7F2] hover:bg-[#F0EDE8] border border-[#E0DBD4] rounded-[8px] text-[11px] font-bold text-[#555] hover:text-[#1A1A1A] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Copy direct invite link"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied link!' : 'Copy invite link'}
            </button>
          )}
        </div>
      </div>

      {/* Players / Participants List */}
      <div className="flex-1 overflow-y-auto my-3 px-1">
        {/* 'You' Card (only for players, not host) */}
        {!isHost && me && (
          <div className="mb-3 bg-white border-[1.5px] border-[#F5821F] rounded-[14px] p-3.5 flex items-center gap-3 shadow-[0_2px_0_#E8710A]">
            <PlayerAvatar name={me.name} color={me.color} avatarId={me.avatarId} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-extrabold text-[#1A1A1A]">
                {me.name} <span className="text-[#F5821F] text-xs font-bold">(You)</span>
              </div>
              <div className="text-[11px] text-[#888] font-medium">
                {me.submitted ? 'Statements ready' : 'Statement not added'}
              </div>
            </div>
            {me.submitted ? (
              <button
                type="button"
                onClick={handleWriteClick}
                className="px-2.5 py-1 rounded-[8px] text-xs font-extrabold border bg-[#F0FFF5] text-[#22A855] border-[#22A855]/30 hover:bg-[#E0F8E8] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Change or edit your statements"
              >
                <span>✓ Ready</span>
                <span className="text-[10px] text-[#22A855] underline">Edit ✏️</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleWriteClick}
                className="px-2.5 py-1 rounded-[8px] text-[11px] font-extrabold border bg-[#FFF0EE] text-[#E8334A] border-[#E8334A]/30 hover:bg-[#FFE5E2] transition-all cursor-pointer shadow-2xs"
                title="Click to write statements"
              >
                Statement not added
              </button>
            )}
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="text-[11px] font-extrabold tracking-[1.5px] uppercase text-[#555]">
            {isHost ? "Participants" : "Other Players"} ({playersList.length}{targetInvited ? `/${targetInvited}` : ''})
          </div>
          {playersList.length > 0 && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[6px] ${
              allSubmitted 
                ? 'text-[#22A855] bg-[#F0FFF5] border border-[#22A855]/30' 
                : 'text-[#E8710A] bg-[#FDE8D0] border border-[#F5821F]/30'
            }`}>
              {readyCount} of {playersList.length} ready
            </span>
          )}
        </div>

        {/* Progress bar when players exist */}
        {playersList.length > 0 && (
          <div className="h-1.5 bg-[#E0DBD4] rounded-[6px] overflow-hidden mb-2.5 mx-1">
            <div 
              className="h-full bg-[#22A855] rounded-[6px] transition-all duration-500" 
              style={{ width: `${(readyCount / playersList.length) * 100}%` }}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {playersList.filter((p) => isHost || p.name !== me?.name).map((p, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 p-3 rounded-[12px] bg-white border border-[#E0DBD4] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#F5821F]/40 transition-all"
            >
              <PlayerAvatar name={p.name} color={p.color} avatarId={p.avatarId} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-[#1A1A1A] truncate">
                  {p.name}
                </div>
                {p.email && (
                  <div className="text-[11px] text-[#888] truncate">{p.email}</div>
                )}
              </div>
              <div className="text-xs shrink-0">
                {p.submitted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] font-extrabold bg-[#F0FFF5] text-[#22A855] border border-[#22A855]/30">
                    ✓ Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] font-bold bg-[#FFF0EE] text-[#E8334A] border border-[#E8334A]/30">
                    Statement not added
                  </span>
                )}
              </div>
            </div>
          ))}

          {playersList.length === 0 && (
            <div className="bg-white/80 border border-[#E0DBD4] rounded-[16px] p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-2 my-2">
              <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E0DBD4] text-[#F5821F] flex items-center justify-center shadow-2xs">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-[13px] font-bold text-[#1A1A1A]">
                Waiting for teammates to connect…
              </div>
              <p className="text-[11.5px] text-[#777] max-w-[280px] leading-relaxed">
                Teammates will appear here live once they open their email invite link.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#FAF7F2] border border-[#E0DBD4] text-[10.5px] font-bold text-[#888] mt-1">
                <span className="w-2 h-2 rounded-full bg-[#F5821F] animate-dotPulse" />
                Listening for live connections
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col gap-2.5 pt-2 shrink-0">
        {!isHost && (
          <Button 
            variant={me?.submitted ? 'outline' : 'orange'} 
            onClick={handleWriteClick}
            className="w-full rounded-xl cursor-pointer"
          >
            {me?.submitted ? '✏️ Edit my statements' : '✍️ Write my statements'}
          </Button>
        )}

        {isHost && (
          <div>
            {error && (
              <div className="text-xs text-[#E8334A] font-bold text-center bg-[#FFF0EE] border border-[#E8334A]/20 py-2 rounded-xl mb-2">
                {error}
              </div>
            )}
            <Button 
              variant="orange"
              onClick={handleStart}
              disabled={!hasEnoughPlayers || !allSubmitted}
              className="w-full rounded-xl"
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

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-[#E0DBD4] rounded-[20px] p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-black text-[#1A1A1A] mb-2">Cancel Session?</h3>
            <p className="text-xs text-[#666] mb-6 leading-relaxed">
              This will close the lobby for all connected players and return you to GummyGum.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCancelModal(false)} className="flex-1 rounded-xl">
                Stay
              </Button>
              <Button
                variant="orange"
                onClick={async () => {
                  setShowCancelModal(false);
                  await reportGummyGumCancel();
                  returnToGummyGum();
                }}
                className="flex-1 !bg-red-500 hover:!bg-red-600 !text-white rounded-xl"
              >
                Exit to Hub
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
