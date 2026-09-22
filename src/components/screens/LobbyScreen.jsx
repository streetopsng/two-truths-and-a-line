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
  const { gameCode, players, hostUid } = gameState;
  
  const queryInvited = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('invitedCount') : null;
  const targetInvited = ggSession?.invitedCount || (queryInvited ? parseInt(queryInvited, 10) : null);

  const playersList = Object.values(players || {});
  const isHost = currentUser?.uid === hostUid;
  const MIN_PLAYERS = 3;
  const hasEnoughPlayers = playersList.length >= MIN_PLAYERS;
  const allSubmitted = playersList.length > 0 && playersList.every(p => p.submitted);
  const me = players?.[currentUser?.uid];

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
    <div className="flex flex-col h-full max-w-[430px] md:max-w-[500px] mx-auto justify-between relative z-10 p-4 sm:p-6 animate-fadeUp">
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
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-[#E0DBD4] text-xs font-bold text-[#555] hover:text-[#1A1A1A] hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
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

      {/* Game code / Session banner */}
      <div className="card p-4 mx-1 mt-2 text-center bg-white border-[1.5px] border-[#E0DBD4] rounded-[16px] shadow-[0_3px_0_#E0DBD4] shrink-0">
        <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#999]">
          {isHost ? "Invites already sent by email" : "Waiting for the host to start"}
        </div>
        <div className="text-[34px] font-black tracking-[8px] text-[#F5821F] my-1">
          {gameCode}
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="amber">
            {targetInvited ? `${playersList.length} / ${targetInvited} players` : `${playersList.length} player${playersList.length === 1 ? '' : 's'}`}
          </Badge>
        </div>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto my-3 px-1">
        {/* 'You' Card (only for players, not host) */}
        {!isHost && me && (
          <div className="mb-3 bg-white border-[1.5px] border-[#F5821F] rounded-[16px] p-3.5 flex items-center gap-3 shadow-[0_3px_0_#E8710A]">
            <PlayerAvatar name={me.name} color={me.color} avatarId={me.avatarId} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-extrabold text-[#1A1A1A]">
                {me.name} <span className="text-[#F5821F] text-xs">(You)</span>
              </div>
              <div className="text-[11px] text-[#999] font-medium italic">
                {me.submitted ? 'Statements ready' : 'Waiting for statements'}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
              me.submitted 
                ? 'bg-[#F0FFF5] text-[#22A855] border-[#22A855]/30' 
                : 'bg-[#FDE8D0] text-[#E8710A] border-[#F5821F]'
            }`}>
              {me.submitted ? '✓ Ready' : 'Incomplete'}
            </div>
          </div>
        )}

        <div className="text-[11px] font-extrabold tracking-[1.5px] uppercase text-[#555] px-1 mb-2">
          {isHost ? "Participants" : "Other Players"}
        </div>

        <div className="flex flex-col gap-2">
          {playersList.filter(p => isHost || p.name !== me?.name).map((p, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 p-3 rounded-[12px] bg-white border border-[#E0DBD4] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <PlayerAvatar name={p.name} color={p.color} avatarId={p.avatarId} size="sm" />
              <div className="flex-1 text-[13px] font-bold text-[#1A1A1A]">
                {p.name}
              </div>
              <div className="text-xs">
                {p.submitted ? (
                  <span className="text-[#22A855] font-bold">✓ Ready</span>
                ) : (
                  <span className="text-[#999] flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#F5821F] animate-dotPulse"></span> Writing...
                  </span>
                )}
              </div>
            </div>
          ))}

          {playersList.length === 0 && (
            <div className="text-center py-6 text-xs text-[#999] font-medium bg-white/50 border border-dashed border-[#E0DBD4] rounded-[12px]">
              Waiting for players to join...
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
            disabled={me?.submitted}
            className="w-full"
          >
            {me?.submitted ? '✓ Statements submitted' : '✍️ Write my statements'}
          </Button>
        )}

        {isHost && (
          <div>
            {error && (
              <div className="text-xs text-[#E8334A] font-bold text-center bg-[#FFF0EE] border border-[#E8334A]/20 py-2 rounded-lg mb-2">
                {error}
              </div>
            )}
            <Button 
              variant="orange"
              onClick={handleStart}
              disabled={!hasEnoughPlayers || !allSubmitted}
              className="w-full"
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
          <div className="bg-white border-2 border-[#E0DBD4] rounded-[22px] p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-black text-[#1A1A1A] mb-2">Cancel Session?</h3>
            <p className="text-xs text-[#666] mb-6 leading-relaxed">
              This will close the lobby for all connected players and return you to GummyGum.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCancelModal(false)} className="flex-1">
                Stay
              </Button>
              <Button
                variant="orange"
                onClick={async () => {
                  setShowCancelModal(false);
                  await reportGummyGumCancel();
                  returnToGummyGum();
                }}
                className="flex-1 !bg-red-500 hover:!bg-red-600 !text-white"
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
