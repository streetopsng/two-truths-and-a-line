import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';

export const HomeScreen = () => {
  const { createGame, joinGame } = useGame();
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    try {
      await createGame("Host"); // Prompting for name could be added
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoin = async () => {
    if (!joinCode) {
      setError('Enter a game code.');
      return;
    }
    if (!joinName) {
      setError('Enter your display name.');
      return;
    }
    setError('');
    try {
      await joinGame(joinCode.toUpperCase(), joinName);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-none w-full mx-auto justify-between p-6 md:p-12 relative z-10">
      <div className="absolute top-6 left-6 md:top-12 md:left-12 text-[13px] md:text-[16px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber to-orange-400 tracking-tight">
        GummyGum
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-10 pb-5">
        <h1 className="text-[42px] md:text-[72px] font-black leading-tight tracking-tight">
          2 Truths &<br />
          a <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral to-red">Lie</span>
        </h1>
        <p className="text-[14px] md:text-[18px] text-white/60 mt-4 md:mt-8 leading-relaxed max-w-[280px] md:max-w-[400px] font-medium">
          How well do your teammates really know you?
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-3 md:gap-6 pb-10 md:pb-16 w-full max-w-[500px] mx-auto">
        <div className="w-full">
          <Button onClick={handleCreate} className="shadow-[0_4px_20px_rgba(255,255,255,0.05)] w-full">
            Create a game
          </Button>
        </div>
        <div className="w-full">
          <Button variant="ghost" onClick={() => setShowJoin(!showJoin)} className="w-full">
            Join a game
          </Button>
        </div>
      </div>
      
      <div className="w-full max-w-[500px] mx-auto">
        {error && (
          <div className="text-xs md:text-sm text-red min-h-[18px] text-center mt-2 px-4 bg-red/10 py-2.5 rounded-md border border-red/20 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            {error}
          </div>
        )}

        {showJoin && (
          <div className="flex flex-col gap-2.5 animate-fadeUp mt-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <input
              type="text"
              placeholder="Game code (e.g. LIE-482)"
              className="w-full bg-black/20 border border-white/10 rounded-lg text-white text-lg font-bold text-center tracking-widest p-3 focus:outline-none focus:border-amber focus:bg-white/[0.05] transition-all placeholder:text-white/20 placeholder:tracking-normal placeholder:font-normal placeholder:text-[15px]"
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <input
              type="text"
              placeholder="Your display name"
              className="w-full bg-black/20 border border-white/10 rounded-lg text-white text-[15px] p-3 focus:outline-none focus:border-amber focus:bg-white/[0.05] transition-all placeholder:text-white/20"
              maxLength={20}
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
            />
            <Button variant="amber" onClick={handleJoin} className="mt-1">Join →</Button>
          </div>
        )}

        <div className="text-[11px] text-white/40 text-center mt-6 font-medium uppercase tracking-wider">
          Free · Up to 10 players · No account needed
        </div>
      </div>
    </div>
  );
};
