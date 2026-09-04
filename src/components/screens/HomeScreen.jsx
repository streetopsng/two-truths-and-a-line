import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';

export const HomeScreen = () => {
  const { createGame, joinGame, authReady, authError } = useGame();
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [error, setError] = useState('');
  const [showGateModal, setShowGateModal] = useState(false);

  const handleGameError = (err) => {
    if (err.message.includes('only available through GummyGum')) {
      setShowGateModal(true);
    } else {
      setError(err.message);
    }
  };

  const handleCreate = async () => {
    try {
      await createGame("Host"); // Prompting for name could be added
    } catch (err) {
      console.error("Create game failed:", err);
      handleGameError(err);
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
      console.error("Join game failed:", err);
      handleGameError(err);
    }
  };

  return (
    <>
    {showGateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowGateModal(false)} />
        <div className="relative bg-[#12131a] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <h3 className="text-xl font-black mb-2">Not available here</h3>
          <p className="text-sm text-white/60 mb-6">This experience is only available through GummyGum. Head back to the hub to launch it.</p>
          <a href="https://gummygum.app">
            <Button variant="amber" className="w-full">Back to GummyGum</Button>
          </a>
        </div>
      </div>
    )}
    {showJoin ? (
        <div className="flex flex-col h-full max-w-[430px] md:max-w-[500px] w-full mx-auto justify-center p-6 relative z-10 animate-fadeUp">
          <button 
            onClick={() => { setShowJoin(false); setError(''); }}
            className="absolute top-6 left-6 text-[13px] md:text-[15px] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
          >
            ← Back
          </button>

          <div className="text-center mb-8 mt-12">
            <h2 className="text-[36px] md:text-[48px] font-black tracking-tight leading-none mb-3">Join Game</h2>
            <p className="text-[15px] text-white/50 font-medium">Enter the code provided by the host.</p>
          </div>

          <div className="flex flex-col gap-4 p-6 md:p-8 rounded-[24px] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div>
              <div className="text-[11px] font-extrabold tracking-[2px] uppercase text-white/40 mb-2 ml-1">Game Code</div>
              <input
                type="text"
                placeholder="e.g. LIE-482"
                className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-xl font-black text-center tracking-[4px] p-4 focus:outline-none focus:border-amber focus:bg-black/60 transition-all placeholder:text-white/20 placeholder:tracking-normal placeholder:font-normal shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] uppercase"
                maxLength={8}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
            </div>
            
            <div className="mt-2">
              <div className="text-[11px] font-extrabold tracking-[2px] uppercase text-white/40 mb-2 ml-1">Your Name</div>
              <input
                type="text"
                placeholder="What should we call you?"
                className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-[16px] font-bold p-4 focus:outline-none focus:border-amber focus:bg-black/60 transition-all placeholder:text-white/30 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]"
                maxLength={20}
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-sm text-red mt-2 font-bold text-center animate-fadeUp">
                {error}
              </div>
            )}

            <Button variant="amber" onClick={handleJoin} className="mt-4 w-full py-4 text-[16px] shadow-[0_0_20px_rgba(245,166,35,0.2)] hover:shadow-[0_0_30px_rgba(245,166,35,0.4)]">
              Join Lobby →
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full max-w-[430px] md:max-w-none w-full mx-auto justify-between p-6 md:p-12 relative z-10 animate-fadeUp">
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

          <div className="w-full max-w-[500px] mx-auto flex flex-col gap-4 pb-6 md:pb-12 relative z-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-3 md:gap-4 w-full">
              <div className="w-full">
                <Button
                  onClick={handleCreate}
                  disabled={!authReady}
                  className={`shadow-[0_4px_20px_rgba(255,255,255,0.05)] w-full ${!authReady ? 'opacity-50' : ''}`}
                >
                  {authReady ? 'Create a game' : 'Connecting…'}
                </Button>
              </div>
              <div className="w-full">
                <Button variant="ghost" onClick={() => { setShowJoin(true); setError(''); }} className="w-full">
                  Join a game
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="text-xs md:text-sm text-red min-h-[18px] text-center px-4 bg-red/10 py-3 rounded-xl border border-red/20 backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-fadeUp">
                {error}
              </div>
            )}

            {authError && (
              <div className="text-[11px] md:text-xs text-amber text-center px-4 py-3 rounded-xl border border-amber/25 bg-amber/10 backdrop-blur-md leading-relaxed animate-fadeUp">
                ⚠️ {authError}
              </div>
            )}

            <div className="text-[11px] text-white/30 text-center mt-4 font-bold uppercase tracking-widest">
              Free · Up to 10 players · No account
            </div>
          </div>
        </div>
      )}
    </>
  );
};
