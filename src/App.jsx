import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { HomeScreen } from './components/screens/HomeScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { SubmitScreen } from './components/screens/SubmitScreen';
import { SubmitWaitScreen } from './components/screens/SubmitWaitScreen';
import { QuestionScreen } from './components/screens/QuestionScreen';
import { ReactionScreen } from './components/screens/ReactionScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { EndScreen } from './components/screens/EndScreen';

import { DesktopSidebar } from './components/layout/DesktopSidebar';

const GameCoordinator = () => {
  const { gameState } = useGame();
  
  // Use local state for screens that don't affect all players (like writing statements)
  const [localScreen, setLocalScreen] = useState(null);

  // Sync local screen clearance when global status changes
  useEffect(() => {
    setLocalScreen(null);
  }, [gameState.status]);

  const activeScreen = localScreen || gameState.status;

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
    <div className="h-screen w-full bg-[#0a0b10] text-white font-inter overflow-hidden relative selection:bg-amber/30 flex">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-glowPulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-coral/20 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-glowPulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      {activeScreen !== 'home' && <DesktopSidebar />}

      {/* Content wrapper with fade transition */}
      <div className="relative h-full flex-1 w-full animate-fadeUp z-10" key={activeScreen}>
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
