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

import { DesktopSidebar } from './components/layout/DesktopSidebar';

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

// Keeps the URL in sync with the shared game state.
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
  <div className="h-screen w-full bg-[#0a0b10] text-white font-inter flex items-center justify-center px-6">
    <div className="max-w-sm w-full text-center space-y-4">
      <h1 className="text-xl font-bold">This experience is only available through GummyGum</h1>
      <p className="text-muted text-sm">Open it from the GummyGum hub to play.</p>
      <a href="https://gummygum.app">
        <Button variant="amber">Go to GummyGum</Button>
      </a>
    </div>
  </div>
);

const GameCoordinator = () => {
  const { gameState, ggSession, ggChecked, createGame, joinGame } = useGame();
  const routedRef = React.useRef(false);

  useEffect(() => {
    if (!ggSession || !ggSession.roomCode || routedRef.current) return;
    routedRef.current = true;
    const name = ggSession.player?.name || 'Guest';
    if (ggSession.isHost) {
      createGame(name, ggSession.roomCode).catch((err) => console.error('GummyGum auto-create failed', err));
    } else {
      joinGame(ggSession.roomCode, name).catch((err) => console.error('GummyGum auto-join failed', err));
    }
  }, [ggSession, createGame, joinGame]);

  if (!ggChecked) {
    return <div className="h-screen w-full bg-[#0a0b10]" />;
  }

  // Restriction disabled: allow direct access without GummyGum launch session
  // if (!ggSession) {
  //   return <GummyGumLockedScreen />;
  // }

  // Waiting for the GummyGum pre-created room to show up
  if (ggSession?.roomCode && gameState.status === 'home') {
    return <div className="h-screen w-full bg-[#0a0b10]" />;
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
    <div className="h-screen w-full bg-[#0a0b10] text-white font-inter overflow-hidden relative selection:bg-amber/30 flex">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-glowPulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-coral/20 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-glowPulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {location.pathname !== '/' && <DesktopSidebar />}

      {/* Content wrapper with fade transition — re-keyed per route */}
      <div className="relative h-full flex-1 w-full animate-fadeUp z-10" key={location.pathname}>
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
