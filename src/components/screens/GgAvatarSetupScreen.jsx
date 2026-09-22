import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { AvatarPickerModal } from '../ui/AvatarPickerModal';

// Shown to a GummyGum-invited participant right after their name/room code
// resolve, before they land in the lobby — mirrors HomeScreen's manual join
// step so both paths give people a chance to pick an avatar. Hosts never see
// this: they spectate and never get a `players` entry.
export const GgAvatarSetupScreen = () => {
  const email = (ggSession?.player?.email || '').toLowerCase().trim();
  const [avatarId, setAvatarId] = useState(() => {
    return (email && localStorage.getItem(`twotruths_avatar_${email}`)) || null;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const name = (email && localStorage.getItem(`twotruths_name_${email}`)) || ggSession?.player?.name || 'Guest';

  const handleContinue = async () => {
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
    }
  };

  return (
    <div className="h-screen w-full bg-[#0a0b10] text-white font-inter flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-glowPulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-coral/20 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-glowPulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 max-w-sm w-full text-center flex flex-col items-center animate-fadeUp">
        <div className="text-[11px] font-extrabold tracking-[3px] uppercase text-white/40 mb-4">
          You're in, {name}
        </div>
        <h2 className="text-[32px] md:text-[40px] font-black tracking-tight leading-tight mb-3">
          Pick your avatar
        </h2>
        <p className="text-[14px] text-white/50 font-medium mb-8 leading-relaxed">
          This is how the table will see you.
        </p>

        <button type="button" onClick={() => setShowPicker(true)} className="mb-8 group cursor-pointer">
          <PlayerAvatar
            name={name}
            color="#F5A623"
            avatarId={avatarId}
            size="lg"
            className="!w-24 !h-24 !text-3xl mx-auto ring-2 ring-white/10 group-hover:ring-amber/60 transition-all"
          />
          <div className="text-[12px] font-bold text-amber mt-3 uppercase tracking-wider">
            {avatarId ? 'Change avatar' : 'Choose an avatar'}
          </div>
        </button>

        {error && (
          <div className="text-sm text-red mb-4 font-bold text-center">{error}</div>
        )}

        <Button variant="amber" onClick={handleContinue} disabled={joining} className="w-full">
          {joining ? 'Joining…' : 'Continue to lobby →'}
        </Button>
      </div>

      {showPicker && (
        <AvatarPickerModal
          selectedId={avatarId}
          onSelect={setAvatarId}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};
