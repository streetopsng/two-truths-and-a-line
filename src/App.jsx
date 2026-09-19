import React, { useState, useEffect } from 'react';
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

const GameCoordinator = () => {
  const { gameState, ggSession, ggChecked, createGame, joinGame } = useGame();

  // Use local state for screens that don't affect all players (like writing statements)
  const [localScreen, setLocalScreen] = useState(null);
  const routedRef = React.useRef(false);

  // Sync local screen clearance when global status changes
  useEffect(() => {
    setLocalScreen(null);
  }, [gameState.status]);

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

  const activeScreen = localScreen || gameState.status;

  if (!ggChecked) {
    return <div className="h-screen w-full bg-[#EDEAE4]" />;
  }

  if (ggSession?.roomCode && activeScreen === 'home') {
    return <div className="h-screen w-full bg-[#EDEAE4]" />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home': return <HomeScreen />;
      case 'lobby': return <LobbyScreen onWrite={() => setLocalScreen('submit')} />;
      case 'submit': return <SubmitScreen onSubmitted={() => setLocalScreen('submit-wait')} />;
      case 'submit-wait': return <SubmitWaitScreen onBack={() => setLocalScreen(null)} />;
      case 'question': return <QuestionScreen />;
      case 'reaction': return <ReactionScreen />;
      case 'leaderboard': return <LeaderboardScreen />;
      case 'end': return <EndScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="h-screen w-full bg-[#EDEAE4] text-[#1A1A1A] font-inter overflow-hidden relative flex">
      {/* Background icons texture */}
      <BackgroundTexture />

      {activeScreen !== 'home' && <DesktopSidebar />}

      {/* Content wrapper with smooth animation */}
      <div className="relative h-full flex-1 w-full animate-fadeUp z-10 overflow-hidden" key={activeScreen}>
        {renderScreen()}
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
