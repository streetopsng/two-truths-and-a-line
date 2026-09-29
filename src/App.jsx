import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import { joinedRoomKey } from './lib/gummygumSession';
import { Button } from './components/ui/Button';
import { HomeScreen } from './components/screens/HomeScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { SubmitScreen } from './components/screens/SubmitScreen';
import { SubmitWaitScreen } from './components/screens/SubmitWaitScreen';
import { QuestionScreen } from './components/screens/QuestionScreen';
import { ReactionScreen } from './components/screens/ReactionScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { EndScreen } from './components/screens/EndScreen';
import { GgAvatarSetupScreen } from './components/screens/GgAvatarSetupScreen';

import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { EndSessionButton } from './components/ui/EndSessionButton';

const ICON_POSITIONS = [
  [20, 40], [180, 20], [320, 80], [60, 200], [260, 160], [140, 320], [340, 260],
  [30, 380], [200, 400], [380, 360], [100, 500], [290, 480], [50, 580], [320, 540],
];

// Flat line icons standing in for the old emoji watermark texture.
const BG_ICON_PATHS = [
  <><path d="M8 3h8v4a4 4 0 0 1-8 0V3Z" /><path d="M5 4H3v2a3 3 0 0 0 3 3" /><path d="M19 4h2v2a3 3 0 0 1-3 3" /><path d="M9 17h6" /><path d="M12 12v5" /><path d="M9 21h6" /></>,
  <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  <><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 2a7 7 0 0 0-4 12.6c.6.5 1 1.3 1 2.4h6c0-1.1.4-1.9 1-2.4A7 7 0 0 0 12 2Z" /></>,
  <><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" /></>,
  <path d="M4 5h16v11H8l-4 4V5Z" />,
  <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3Z" />,
  <><circle cx="12" cy="12" r="9" /><path d="M9.2 9a2.8 2.8 0 1 1 4.6 2.1c-.7.6-1.3 1-1.3 2.2" /><path d="M12 17v.01" /></>,
  <path d="M12 20s-7-4.4-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9Z" />,
];

const BackgroundTexture = () => (
  <div className="bg-texture pointer-events-none">
    {ICON_POSITIONS.map(([x, y], i) => (
      <svg
        key={i}
        className="bg-icon select-none"
        style={{ left: `${x}px`, top: `${y}px` }}
        width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      >
        {BG_ICON_PATHS[i % BG_ICON_PATHS.length]}
      </svg>
    ))}
  </div>
);

// The Firestore `status` field is the multiplayer source of truth — when the
// host advances the game, every player's status changes and this map pushes
// their route along with it.
const STATUS_ROUTES = {
  home: '/',
  lobby: '/lobby',
  question: '/round',
  reaction: '/round/reaction',
  leaderboard: '/round/scores',
  end: '/final',
};

// While waiting in the lobby, players can move between these routes on their
// own device (writing statements) without being forced back to /lobby.
const LOBBY_ROUTES = ['/lobby', '/submit', '/submit/wait'];

const GameRouteSync = () => {
  const { gameState } = useGame();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const status = gameState.status || 'home';
    const expected = STATUS_ROUTES[status] || '/';
    const allowed = status === 'lobby' ? LOBBY_ROUTES : [expected];
    if (!allowed.includes(location.pathname)) {
      navigate(expected, { replace: true });
    }
  }, [gameState.status, location.pathname, navigate]);

  return null;
};

import { SessionExpiredModal } from './components/ui/SessionExpiredModal';

const LoadingScreen = ({ message = "Connecting to session…" }) => (
  <div className="h-screen w-full bg-[#EDEAE4] text-[#1A1A1A] font-inter flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <BackgroundTexture />
    <div className="card max-w-xs w-full p-8 text-center space-y-4 bg-white border-[1.5px] border-[#E0DBD4] rounded-[24px] shadow-[0_2px_0_#E0DBD4] relative z-10 flex flex-col items-center animate-fadeUp">
      <div className="w-14 h-14 rounded-2xl bg-[#FDE8D0] border border-[#F5821F]/30 flex items-center justify-center text-[#F5821F] shadow-xs">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="animate-spin"><circle cx="12" cy="12" r="9" opacity="0.25" /><path d="M21 12a9 9 0 0 0-9-9" /></svg>
      </div>
      <div>
        <h3 className="text-[15px] font-black text-[#1A1A1A]">{message}</h3>
        <p className="text-[12px] text-[#777] mt-1 font-medium">Getting everything ready for you…</p>
      </div>
      <div className="w-full bg-[#EDEAE4] h-1.5 rounded-full overflow-hidden mt-1">
        <div className="bg-[#F5821F] h-full w-2/3 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

const GummyGumLockedScreen = () => {
  const isParticipant = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('player') ||
    new URLSearchParams(window.location.search).get('code') ||
    new URLSearchParams(window.location.search).get('invitedCount')
  );

  return (
    <div className="h-screen w-full bg-[#EDEAE4] text-[#1A1A1A] font-inter flex items-center justify-center px-6 relative">
      <BackgroundTexture />
      <div className="card max-w-sm w-full p-8 text-center space-y-4 bg-white border-[1.5px] border-[#E0DBD4] rounded-[22px] shadow-[0_2px_0_#E0DBD4] relative z-10">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FDE8D0] border border-[#F5821F]/30 text-[#F5821F] flex items-center justify-center animate-float">
          {isParticipant ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M5 3v18" strokeLinecap="round" /><path d="M5 4h13l-2.5 3.5L18 11H5" strokeLinejoin="round" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          )}
        </div>
        <h1 className="text-xl font-black">
          {isParticipant ? 'Session concluded' : 'This experience is only available through GummyGum'}
        </h1>
        <p className="text-[#555] text-sm leading-relaxed">
          {isParticipant 
            ? 'This session is no longer active. You can safely close this tab now.'
            : 'Open it from the GummyGum hub to play.'}
        </p>
        {!isParticipant && (
          <a href="https://gummygum.app" className="block pt-2">
            <Button variant="orange" className="w-full">Go to GummyGum</Button>
          </a>
        )}
      </div>
    </div>
  );
};

// Participant-side landing when the host or GummyGum ends the session (room
// marked ended or deleted). Tries to close the tab first; message is the fallback.
const GummyGumCancelledScreen = ({ completed }) => {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    window.close();
    const t = setTimeout(() => setShowMessage(true), 400);
    return () => clearTimeout(t);
  }, []);

  if (!showMessage) {
    return <LoadingScreen message="Session ending…" />;
  }

  return (
    <div className="h-screen w-full bg-[#EDEAE4] text-[#1A1A1A] font-inter flex items-center justify-center px-6 relative">
      <BackgroundTexture />
      <div className="card max-w-sm w-full p-8 text-center space-y-4 bg-white border-[1.5px] border-[#E0DBD4] rounded-[22px] shadow-[0_2px_0_#E0DBD4] relative z-10">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FDE8D0] border border-[#F5821F]/30 text-[#F5821F] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="m20 6-11 11-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="text-xl font-black">{completed ? 'Session complete' : 'Session ended'}</h1>
        <p className="text-[#555] text-sm leading-relaxed">
          {completed
            ? 'Thanks for playing! The host has closed this session. You can close this tab now.'
            : 'The host ended this session. You can close this tab now.'}
        </p>
      </div>
    </div>
  );
};

const GameCoordinator = () => {
  const { gameState, ggSession, ggChecked, awaitingHost, createGame, isSessionExpired, setIsSessionExpired, setGameCode } = useGame();
  const routedRef = React.useRef(false);

  // Hosts spectate and never get a `players` entry, so they skip straight
  // into their pre-created room — no avatar to pick. Non-host participants
  // are routed to GgAvatarSetupScreen instead (below), which calls joinGame
  // itself once they've picked an avatar (or skipped).
  useEffect(() => {
    if (!ggSession || !ggSession.roomCode || !ggSession.isHost || routedRef.current) return;
    routedRef.current = true;
    setIsSessionExpired(false);
    setGameCode(ggSession.roomCode);
    const name = ggSession.player?.name || 'Guest';
    createGame(name, ggSession.roomCode).catch((err) => console.error('GummyGum auto-create failed', err));
  }, [ggSession, createGame, setIsSessionExpired, setGameCode]);

  if (!ggChecked) {
    return <LoadingScreen message="Connecting to session…" />;
  }

  // GummyGum-launched participant whose room just disappeared (host cancelled
  // from the hub). The host's own branch never reaches this state — it's
  // redirected straight back to GummyGum by the listener that sets this.
  if (gameState.status === 'gg-cancelled') {
    return <GummyGumCancelledScreen completed={gameState.completed} />;
  }

  if (!ggSession) {
    return <GummyGumLockedScreen />;
  }

  if (ggSession?.roomCode && gameState.status === 'home') {
    // Non-host: pick an avatar before joining the pre-created room.
    // If the participant already joined this room before reloading, wait for room doc sync instead of prompting for avatar setup again.
    if (!ggSession.isHost) {
      if (awaitingHost) {
        return <LoadingScreen message="Waiting for the host to start…" />;
      }
      const email = (ggSession.player?.email || '').toLowerCase().trim();
      const alreadyJoined = typeof window !== 'undefined' && (
        localStorage.getItem('gameCode') === ggSession.roomCode ||
        (email && localStorage.getItem(joinedRoomKey(ggSession, email)) === 'true')
      );
      if (alreadyJoined) {
        return <LoadingScreen message="Reconnecting to your room…" />;
      }
      return <GgAvatarSetupScreen />;
    }
    // Host: waiting for the GummyGum pre-created room to show up.
    return <LoadingScreen message="Setting up host room…" />;
  }

  return (
    <>
      <GameRouteSync />
      <GameShell />
      {isSessionExpired && (
        <SessionExpiredModal isHost={ggSession?.isHost} context={gameState.abandoned ? 'game' : 'lobby'} />
      )}
    </>
  );
};

// Lobby and final screens carry their own mobile End session control.
const HOST_BAR_ROUTES = ['/round', '/round/reaction', '/round/scores'];

const GameShell = () => {
  const location = useLocation();
  const { ggSession } = useGame();
  const showHostBar = ggSession?.isHost && HOST_BAR_ROUTES.includes(location.pathname);

  return (
    <div className="h-screen w-full bg-[#EDEAE4] text-[#1A1A1A] font-inter overflow-hidden relative flex">
      {/* Background icons texture */}
      <BackgroundTexture />

      {location.pathname !== '/' && <DesktopSidebar />}

      {/* Content wrapper with smooth animation — re-keyed per route */}
      <div className="relative h-full flex-1 w-full animate-fadeUp z-10 overflow-hidden flex flex-col" key={location.pathname}>
        {showHostBar && (
          <div className="md:hidden shrink-0 flex justify-end px-4 pt-3">
            <EndSessionButton />
          </div>
        )}
        <div className="relative flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/lobby" element={<LobbyScreen />} />
          <Route path="/submit" element={<SubmitScreen />} />
          <Route path="/submit/wait" element={<SubmitWaitScreen />} />
          <Route path="/round" element={<QuestionScreen />} />
          <Route path="/round/reaction" element={<ReactionScreen />} />
          <Route path="/round/scores" element={<LeaderboardScreen />} />
          <Route path="/final" element={<EndScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <GameProvider>
      <GameCoordinator />
    </GameProvider>
  );
}

export default App;
