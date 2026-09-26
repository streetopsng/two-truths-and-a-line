import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { AvatarPickerModal } from '../ui/AvatarPickerModal';
import { GameRulesModal } from '../ui/GameRulesModal';

// Shown to a GummyGum-invited participant right after their name/room code
// resolve, before they land in the lobby — mirrors HomeScreen's manual join
// step so both paths give people a chance to pick an avatar. Hosts never see
// this: they spectate and never get a `players` entry.
export const GgAvatarSetupScreen = () => {
  const { ggSession, joinGame } = useGame();
  const email = (ggSession?.player?.email || '').toLowerCase().trim();
  const [avatarId, setAvatarId] = useState(() => {
    return (email && localStorage.getItem(`twotruths_avatar_${email}`)) || null;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  // GummyGum verified player name is the source of truth
  const name = ggSession?.player?.name || (email && localStorage.getItem(`twotruths_name_${email}`)) || 'Guest';

  const handleStartJoin = () => {
    setShowRules(true);
  };

  const handleConfirmRules = async () => {
    if (joining) return;
    setJoining(true);
    setError('');
    try {
      if (email) {
        if (avatarId) localStorage.setItem(`twotruths_avatar_${email}`, avatarId);
        localStorage.setItem(`twotruths_name_${email}`, name);
        if (ggSession?.roomCode) {
          localStorage.setItem(`twotruths_joined_${ggSession.roomCode}_${email}`, 'true');
        }
      }
      await joinGame(ggSession.roomCode, name, avatarId);
    } catch (err) {
      console.error('GummyGum avatar setup join failed:', err);
      setError(err?.message || 'Could not join the game.');
      setJoining(false);
      setShowRules(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#EDEAE4] text-[#1A1A1A] font-inter flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="relative z-10 max-w-sm md:max-w-md w-full bg-white border-[1.5px] border-[#E0DBD4] rounded-[22px] shadow-[0_4px_0_#E0DBD4] p-6 sm:p-8 text-center flex flex-col items-center animate-fadeUp">
        <div className="text-[11px] font-extrabold tracking-[2px] uppercase text-[#F5821F] mb-1.5">
          You're in, {name}
        </div>
        <h2 className="text-[26px] sm:text-[30px] font-black tracking-tight text-[#1A1A1A] leading-tight mb-2">
          Pick your avatar
        </h2>
        <p className="text-[13px] sm:text-[14px] text-[#666] font-medium mb-6">
          This is how your teammates will see you at the table.
        </p>

        <button type="button" onClick={() => setShowPicker(true)} className="mb-6 group cursor-pointer flex flex-col items-center">
          <PlayerAvatar
            name={name}
            color="#F5821F"
            avatarId={avatarId}
            size="2xl"
            className="mx-auto shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-4 ring-[#FAF7F2] group-hover:scale-105 transition-all"
          />
          <div className="text-[12px] font-extrabold text-[#F5821F] mt-3 uppercase tracking-wider flex items-center gap-1.5 bg-[#FDE8D0] px-3.5 py-1.5 rounded-full border border-[#F5821F]/30 group-hover:bg-[#FCD9B3] transition-colors">
            {avatarId ? '✏️ Change avatar' : '🎨 Choose an avatar'}
          </div>
        </button>

        {error && (
          <div className="text-xs text-[#E8334A] mb-4 font-bold text-center bg-[#FFF0EE] border border-[#E8334A]/20 py-2 px-3 rounded-lg w-full">
            {error}
          </div>
        )}

        <Button variant="orange" onClick={handleStartJoin} disabled={joining} className="w-full">
          {joining ? 'Joining…' : 'Continue to game rules →'}
        </Button>
      </div>

      {showPicker && (
        <AvatarPickerModal
          selectedId={avatarId}
          onSelect={setAvatarId}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showRules && (
        <GameRulesModal
          name={name}
          onConfirm={handleConfirmRules}
        />
      )}
    </div>
  );
};
