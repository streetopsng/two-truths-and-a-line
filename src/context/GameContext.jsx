import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

const COLORS = ['#F5A623','#3b82f6','#a855f7','#22c55e','#ef4444','#FF5C38','#14b8a6','#f43f5e','#84cc16','#0ea5e9'];

// Detect if user hasn't added Firebase keys
const MOCK_MODE = db.app.options.apiKey === "YOUR_API_KEY";

export const GameProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [gameCode, setGameCode] = useState(localStorage.getItem('gameCode') || '');
  const [gameState, setGameState] = useState({ status: 'home' });

  // 1. Listen to Auth State (or mock it)
  useEffect(() => {
    if (MOCK_MODE) {
      setCurrentUser({ uid: 'local_host' });
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  // 2. Listen to Firestore Game Document (or mock it)
  useEffect(() => {
    if (MOCK_MODE) return;
    
    if (!currentUser || !gameCode) {
      setGameState({ status: 'home' });
      return;
    }

    const unsub = onSnapshot(doc(db, 'games', gameCode), (docSnap) => {
      if (docSnap.exists()) {
        setGameState({ id: docSnap.id, ...docSnap.data() });
      } else {
        localStorage.removeItem('gameCode');
        setGameCode('');
        setGameState({ status: 'home' });
      }
    }, (error) => {
      console.error("Firestore listen error:", error);
    });

    return unsub;
  }, [currentUser, gameCode]);

  // Mock Helper for Local State mutation
  const applyMockUpdates = (data) => {
    setGameState(prev => {
      const next = { ...prev };
      for (const key in data) {
        const parts = key.split('.');
        if (parts.length === 1) {
          next[key] = data[key];
        } else if (parts.length === 3 && parts[0] === 'players') {
          const uid = parts[1];
          const field = parts[2];
          next.players = { ...next.players, [uid]: { ...next.players[uid], [field]: data[key] } };
        } else if (parts.length === 2 && parts[0] === 'votes') {
          next.votes = { ...next.votes, [parts[1]]: data[key] };
        }
      }
      return next;
    });
  };

  // Actions
  const createGame = async (playerName) => {
    if (MOCK_MODE) {
      const code = 'TEST12';
      const mockGame = {
        status: 'lobby',
        gameCode: code,
        hostUid: 'local_host',
        players: {
          'local_host': { name: playerName, color: COLORS[0], score: 0, streak: 0, correctGuesses: 0, liarPoints: 0, submitted: false, statements: [], lieIndex: -1, lastReaction: null },
          'bot_1': { name: 'Chidinma', color: COLORS[1], score: 0, streak: 0, correctGuesses: 0, liarPoints: 0, submitted: true, statements: ['I once met a celebrity', 'I have three dogs', 'I can play guitar'], lieIndex: 1, lastReaction: null },
          'bot_2': { name: 'Tunde', color: COLORS[2], score: 0, streak: 0, correctGuesses: 0, liarPoints: 0, submitted: true, statements: ['I hate chocolate', 'I speak 3 languages', 'I have never been on a plane'], lieIndex: 2, lastReaction: null },
        },
        currentRound: 0,
        roundOrder: [],
        votes: {},
        revealed: false
      };
      setGameState(mockGame);
      setGameCode(code);
      return;
    }

    if (!currentUser) throw new Error("Connecting to server... If this persists, check Firebase config.");
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newGame = {
      status: 'lobby',
      gameCode: code,
      hostUid: currentUser.uid,
      players: {
        [currentUser.uid]: { name: playerName, color: COLORS[0], score: 0, streak: 0, correctGuesses: 0, liarPoints: 0, submitted: false, statements: [], lieIndex: -1, lastReaction: null }
      },
      currentRound: 0,
      roundOrder: [],
      votes: {},
      revealed: false
    };

    await setDoc(doc(db, 'games', code), newGame);
    localStorage.setItem('gameCode', code);
    setGameCode(code);
  };

  const joinGame = async (code, playerName) => {
    if (MOCK_MODE) {
      alert("Join game doesn't work in Mock Mode. Please click Create Game to test.");
      return;
    }

    if (!currentUser) throw new Error("Connecting to server... If this persists, check Firebase config.");
    const gameRef = doc(db, 'games', code);
    const snap = await getDoc(gameRef);
    if (!snap.exists()) throw new Error("Game not found");
    
    const data = snap.data();
    if (data.status !== 'lobby') throw new Error("Game already started");
    if (data.players[currentUser.uid]) {
      localStorage.setItem('gameCode', code);
      setGameCode(code);
      return;
    }

    const numPlayers = Object.keys(data.players).length;
    if (numPlayers >= 10) throw new Error("Game is full");

    await updateDoc(gameRef, {
      [`players.${currentUser.uid}`]: {
        name: playerName, color: COLORS[numPlayers % COLORS.length], score: 0, streak: 0, correctGuesses: 0, liarPoints: 0, submitted: false, statements: [], lieIndex: -1, lastReaction: null
      }
    });

    localStorage.setItem('gameCode', code);
    setGameCode(code);
  };

  const leaveGame = () => {
    if (MOCK_MODE) {
      setGameState({ status: 'home' });
      setGameCode('');
      return;
    }
    localStorage.removeItem('gameCode');
    setGameCode('');
    setGameState({ status: 'home' });
  };

  const startGame = async () => {
    if (!currentUser || !gameCode || gameState.hostUid !== currentUser.uid) return;
    const uids = Object.keys(gameState.players);
    for (let i = uids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uids[i], uids[j]] = [uids[j], uids[i]];
    }

    const updates = {
      status: 'question',
      roundOrder: uids,
      currentRound: 0,
      roundEndTime: Date.now() + 30000,
      votes: {},
      revealed: false
    };

    if (MOCK_MODE) {
      applyMockUpdates(updates);
      // Simulate bots voting instantly for testing
      setTimeout(() => {
        applyMockUpdates({
          [`votes.bot_1`]: Math.floor(Math.random() * 3),
          [`votes.bot_2`]: Math.floor(Math.random() * 3)
        });
      }, 5000);
      return;
    }

    await updateDoc(doc(db, 'games', gameCode), updates);
  };

  const submitStatements = async (statements, lieIndex) => {
    if (!currentUser || !gameCode) return;
    
    const updates = {
      [`players.${currentUser.uid}.statements`]: statements,
      [`players.${currentUser.uid}.lieIndex`]: lieIndex,
      [`players.${currentUser.uid}.submitted`]: true
    };

    if (MOCK_MODE) {
      applyMockUpdates(updates);
      return;
    }

    await updateDoc(doc(db, 'games', gameCode), updates);
  };

  const advanceGame = async (status, extraData = {}) => {
    if (!currentUser || !gameCode) return;
    
    const updates = { status, ...extraData };
    
    if (MOCK_MODE) {
      applyMockUpdates(updates);
      
      // If moving to next question, queue bot votes
      if (status === 'question') {
        setTimeout(() => {
          applyMockUpdates({
            [`votes.bot_1`]: Math.floor(Math.random() * 3),
            [`votes.bot_2`]: Math.floor(Math.random() * 3)
          });
        }, 5000);
      }
      return;
    }

    await updateDoc(doc(db, 'games', gameCode), updates);
  };

  const updateGameDoc = async (data) => {
    if (!currentUser || !gameCode) return;
    
    if (MOCK_MODE) {
      applyMockUpdates(data);
      if (data.status === 'question') {
        setTimeout(() => {
          applyMockUpdates({
            [`votes.bot_1`]: Math.floor(Math.random() * 3),
            [`votes.bot_2`]: Math.floor(Math.random() * 3)
          });
        }, 5000);
      }
      return;
    }
    
    await updateDoc(doc(db, 'games', gameCode), data);
  };

  return (
    <GameContext.Provider value={{
      gameState,
      currentUser,
      createGame,
      joinGame,
      leaveGame,
      startGame,
      submitStatements,
      advanceGame,
      updateGameDoc
    }}>
      {children}
    </GameContext.Provider>
  );
};
