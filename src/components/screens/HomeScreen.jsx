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
      await createGame("Host");
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
    <div className="flex flex-col h-full max-w-[430px] md:max-w-[480px] w-full mx-auto justify-between overflow-hidden relative z-10">
      {showJoin ? (
        <div className="flex flex-col h-full justify-between p-6 animate-fadeUp">
          <div className="flex items-center justify-between pt-2">
            <button 
              onClick={() => { setShowJoin(false); setError(''); }}
              className="text-[14px] font-bold text-[#555] hover:text-[#1A1A1A] transition-colors flex items-center gap-1.5 cursor-pointer bg-white px-3.5 py-1.5 rounded-full border border-[#E0DBD4] shadow-[0_2px_0_#E0DBD4]"
            >
              ← Back
            </button>
            <span className="text-xs font-black text-[#F5821F] tracking-wider uppercase">GummyGum</span>
          </div>

          <div className="my-auto py-6">
            <div className="text-center mb-6">
              <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#F5821F] mb-1">
                2 Truths & a Lie
              </div>
              <h2 className="text-[32px] font-black tracking-tight text-[#1A1A1A]">Join Game</h2>
              <p className="text-[14px] text-[#555] mt-1.5 font-medium">Enter the code provided by your host.</p>
            </div>

            <div className="card p-6 flex flex-col gap-4 bg-white border-[1.5px] border-[#E0DBD4] shadow-[0_4px_0_#E0DBD4] rounded-[20px]">
              <div>
                <div className="text-[11px] font-extrabold tracking-[1.5px] uppercase text-[#555] mb-2">
                  Game Code
                </div>
                <input
                  type="text"
                  placeholder="e.g. LIE-482"
                  className="fi text-center font-black tracking-[4px] uppercase text-lg"
                  maxLength={8}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
              </div>
              
              <div>
                <div className="text-[11px] font-extrabold tracking-[1.5px] uppercase text-[#555] mb-2">
                  Your Name
                </div>
                <input
                  type="text"
                  placeholder="e.g. Ayoola"
                  className="fi text-center font-bold text-base"
                  maxLength={20}
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                />
              </div>

              {error && (
                <div className="text-xs text-[#E8334A] font-bold text-center bg-[#FFF0EE] border border-[#E8334A]/20 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <Button onClick={handleJoin} className="mt-2 w-full">
                Join Lobby →
              </Button>
            </div>
          </div>

          <div className="text-[11px] text-[#999] text-center pb-4 font-semibold">
            Takes about 30 seconds to set up
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between animate-fadeUp">
          {/* Illustrated orange hero top */}
          <div className="flex-1 relative flex flex-col items-center justify-end pb-7 overflow-hidden min-h-[260px] md:min-h-[300px]">
            {/* Radial orange blob */}
            <div 
              className="absolute inset-[-10%] z-0 rounded-b-[50%]"
              style={{
                background: 'radial-gradient(ellipse 80% 70% at 50% 28%, #FFCF99 0%, #FFB347 40%, #F5821F 70%, #E8710A 100%)'
              }}
            />

            {/* Illustrated card scene */}
            <div className="absolute inset-0 z-1 pointer-events-none">
              {/* Card 1: left, tilted */}
              <div 
                className="absolute bg-white rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.18)] flex flex-col items-center justify-center p-2.5 gap-1"
                style={{ width: '84px', left: '16px', top: '48px', transform: 'rotate(-8deg)' }}
              >
                <div className="text-[28px] leading-none">🦊</div>
                <div className="text-[9px] font-extrabold tracking-wider text-[#aaa] uppercase">Chidinma</div>
                <div className="h-[4px] rounded-full bg-[#F0EDE8] w-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#F5821F]" style={{ width: '70%' }}></div>
                </div>
                <div className="h-[4px] rounded-full bg-[#F0EDE8] w-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#FFB347]" style={{ width: '50%' }}></div>
                </div>
              </div>

              {/* Card 2: right, tilted other way */}
              <div 
                className="absolute bg-white rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.18)] flex flex-col items-center justify-center p-2.5 gap-1"
                style={{ width: '84px', right: '16px', top: '38px', transform: 'rotate(7deg)' }}
              >
                <div className="text-[28px] leading-none">🐻</div>
                <div className="text-[9px] font-extrabold tracking-wider text-[#aaa] uppercase">Emeka</div>
                <div className="h-[4px] rounded-full bg-[#F0EDE8] w-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#3b82f6]" style={{ width: '80%' }}></div>
                </div>
                <div className="h-[4px] rounded-full bg-[#F0EDE8] w-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#93c5fd]" style={{ width: '40%' }}></div>
                </div>
              </div>

              {/* Card 3: centre-left */}
              <div 
                className="absolute bg-white rounded-[14px] shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-2 gap-1 opacity-90 hidden sm:flex"
                style={{ width: '76px', left: '55px', top: '110px', transform: 'rotate(3deg)' }}
              >
                <div className="text-[24px] leading-none">🐯</div>
                <div className="text-[8px] font-extrabold tracking-wider text-[#aaa] uppercase">Zara</div>
                <div className="h-[3px] rounded-full bg-[#F0EDE8] w-full">
                  <div className="h-full rounded-full bg-[#a855f7]" style={{ width: '60%' }}></div>
                </div>
              </div>

              {/* Card 4: centre-right */}
              <div 
                className="absolute bg-white rounded-[14px] shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-2 gap-1 opacity-90 hidden sm:flex"
                style={{ width: '76px', right: '55px', top: '115px', transform: 'rotate(-5deg)' }}
              >
                <div className="text-[24px] leading-none">🦁</div>
                <div className="text-[8px] font-extrabold tracking-wider text-[#aaa] uppercase">Kelvin</div>
                <div className="h-[3px] rounded-full bg-[#F0EDE8] w-full">
                  <div className="h-full rounded-full bg-[#22c55e]" style={{ width: '65%' }}></div>
                </div>
              </div>

              {/* Big central ? card */}
              <div 
                className="absolute bg-[#F5821F] rounded-[14px] flex items-center justify-center text-[34px] font-black text-white shadow-[0_8px_28px_rgba(245,130,31,0.5)]"
                style={{ width: '74px', height: '90px', left: '50%', top: '75px', transform: 'translateX(-50%) rotate(-2deg)' }}
              >
                ?
              </div>
            </div>

            {/* GummyGum badge */}
            <div className="relative z-10 bg-white/25 backdrop-blur-md border border-white/45 rounded-full px-4 py-1.5 text-xs font-extrabold text-white tracking-wide shadow-sm">
              GummyGum
            </div>

            {/* SVG wave mask bottom */}
            <svg 
              className="absolute bottom-[-2px] left-0 right-0 h-[56px] w-full z-2" 
              viewBox="0 0 430 64" 
              xmlns="http://www.w3.org/2000/svg" 
              preserveAspectRatio="none"
            >
              <path d="M0,32 C80,64 160,0 215,32 C270,64 350,0 430,32 L430,64 L0,64 Z" fill="#EDEAE4" />
            </svg>
          </div>

          {/* Text & CTAs */}
          <div className="px-6 pt-4 shrink-0">
            <h1 className="text-[34px] md:text-[38px] font-black leading-[1.08] text-[#1A1A1A] tracking-tight">
              2 Truths &<br />
              a <span className="text-[#F5821F] underline decoration-[#F5821F]/40 underline-offset-4">Lie</span>
            </h1>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.6] mt-2.5">
              The team game where <strong>everyone's a suspect.</strong> Share your statements, fool your teammates, and find out who really knows who.
            </p>
          </div>

          <div className="p-6 flex flex-col gap-2.5 shrink-0">
            <Button onClick={handleCreate} className="w-full">
              Create a game
            </Button>
            
            <Button variant="outline" onClick={() => { setShowJoin(true); setError(''); }} className="w-full">
              Join a game
            </Button>

            {error && (
              <div className="text-xs text-[#E8334A] font-bold text-center bg-[#FFF0EE] border border-[#E8334A]/20 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="text-[11px] text-[#999] text-center mt-1 font-semibold">
              Free · Up to 10 players · No account needed
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
