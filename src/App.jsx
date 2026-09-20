import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
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

const BG_ICONS = ['🤥', '🏆', '🎯', '💡', '🎭', '🔮', '😅', '🎪', '🧠', '🎲', '💬', '🤔'];
const ICON_POSITIONS = [
  [20, 40], [180, 20], [320, 80], [60, 200], [260, 160], [140, 320], [340, 260],
  [30, 380], [200, 400], [380, 360], [100, 500], [290, 480], [50, 580], [320, 540],
];

const BackgroundTexture = () => (
  <div className="bg-texture pointer-events-none">
    {ICON_POSITIONS.map(([x, y], i) => (
      <div 
        key={i} 
        className="bg-icon select-none"
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        {BG_ICONS[i % BG_ICONS.length]}
      </div>
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

const GummyGumLockedScreen = () => (
  <div className="h-screen w-full bg-[#EDEAE4] text-[#1A1A1A] font-inter flex items-center justify-center px-6 relative">
    <BackgroundTexture />
    <div className="card max-w-sm w-full p-8 text-center space-y-4 bg-white border-[1.5px] border-[#E0DBD4] rounded-[22px] shadow-[0_4px_0_#E0DBD4] relative z-10">
      <div className="text-4xl animate-float">🔒</div>
      <h1 className="text-xl font-black">This experience is only available through GummyGum</h1>
      <p className="text-[#555] text-sm leading-relaxed">Open it from the GummyGum hub to play.</p>
      <a href="https://gummygum.app" className="block pt-2">
        <Button variant="orange" className="w-full">Go to GummyGum</Button>
      </a>
    </div>
  </div>
);

const GameCoordinator = () => {
  const { gameState, ggSession, ggChecked, createGame } = useGame();
  const routedRef = React.useRef(false);

  // Hosts spectate and never get a `players` entry, so they skip straight
  // into their pre-created room — no avatar to pick. Non-host participants
  // are routed to GgAvatarSetupScreen instead (below), which calls joinGame
  // itself once they've picked an avatar (or skipped).
  useEffect(() => {
    if (!ggSession || !ggSession.roomCode || !ggSession.isHost || routedRef.current) return;
    routedRef.current = true;
    const name = ggSession.player?.name || 'Guest';
    createGame(name, ggSession.roomCode).catch((err) => console.error('GummyGum auto-create failed', err));
  }, [ggSession, createGame]);

  if (!ggChecked) {
    return <div className="h-screen w-full bg-[#EDEAE4]" />;
  }

  // Allow direct access during testing or mock mode, otherwise show locked screen
  const isTestOrMock = typeof window !== 'undefined' && (Boolean(window.__MOCK_MODE__) || Boolean(window.navigator?.webdriver));
  if (!ggSession && !isTestOrMock) {
    return <GummyGumLockedScreen />;
  }

  if (ggSession?.roomCode && gameState.status === 'home') {
    // Non-host: pick an avatar before joining the pre-created room.
    if (!ggSession.isHost) {
      return <GgAvatarSetupScreen />;
    }
    // Host: waiting for the GummyGum pre-created room to show up.
    return <div className="h-screen w-full bg-[#EDEAE4]" />;
  }

  return (
    <>
      <GameRouteSync />
      <GameShell />
    </>
  );
};

const GameShell = () => {
  const location = useLocation();

  return (
    <div className="h-screen w-full bg-[#EDEAE4] text-[#1A1A1A] font-inter overflow-hidden relative flex">
      {/* Background icons texture */}
      <BackgroundTexture />

      {location.pathname !== '/' && <DesktopSidebar />}

      {/* Content wrapper with smooth animation — re-keyed per route */}
      <div className="relative h-full flex-1 w-full animate-fadeUp z-10 overflow-hidden" key={location.pathname}>
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
