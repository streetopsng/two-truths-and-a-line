import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { db, auth } from "../firebase/config";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  deleteField,
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  resolveGummyGumLaunch,
  reportGummyGumResult,
  returnToGummyGum,
} from "../lib/gummygumSession";
import {
  authReady as authReadyPromise,
  getAuthFailure,
} from "../firebase/config";

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

const COLORS = [
  "#F5A623",
  "#3b82f6",
  "#a855f7",
  "#22c55e",
  "#ef4444",
  "#FF5C38",
  "#14b8a6",
  "#f43f5e",
  "#84cc16",
  "#0ea5e9",
];

// Build-time only — never runtime-detectable, or anyone could bypass the gate.
const MOCK_MODE =
  db.app.options.apiKey === "YOUR_API_KEY" ||
  import.meta.env.VITE_MOCK_MODE === "true";

export const GameProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(MOCK_MODE);
  const [authError, setAuthError] = useState(null);
  const [gameCode, setGameCode] = useState(
    localStorage.getItem("gameCode") || "",
  );
  const [gameState, setGameState] = useState({ status: "home" });
  const [ggSession, setGgSession] = useState(null);
  const [ggChecked, setGgChecked] = useState(false);
  const ggReportedRef = useRef(false);

  // 0. Resolve GummyGum hub launch identity (?ggt=...), if present.
  useEffect(() => {
    resolveGummyGumLaunch().then((session) => {
      setGgSession(session);
      setGgChecked(true);
    });
  }, []);

  // 1. Listen to Auth State (or mock it)
  useEffect(() => {
    if (MOCK_MODE) {
      setCurrentUser({ uid: "local_host" });
      setAuthReady(true);
      return;
    }

    const timeout = setTimeout(() => {
      console.warn("Firebase sign-in still pending after 8s — unlocking the UI anyway.");
      setAuthReady(true);
      setAuthError(
        (prev) =>
          prev ??
          "Sign-in took longer than expected. If actions fail, check whether an ad blocker or privacy extension is blocking googleapis.com.",
      );
    }, 8000);

    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        clearTimeout(timeout);
        setCurrentUser(user);
        setAuthReady(true);
        setAuthError(null);
      },
      (error) => {
        clearTimeout(timeout);
        console.error("onAuthStateChanged error:", error);
        setAuthReady(true);
        setAuthError(error?.message || "Authentication failed");
      },
    );

    authReadyPromise.catch((error) => {
      clearTimeout(timeout);
      console.error("Initial signInAnonymously failed:", error);
      setAuthReady(true);
      setAuthError(error?.message || "Sign-in failed");
    });

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  // 2. Listen to Firestore Game Document (or mock it)
  useEffect(() => {
    if (MOCK_MODE) return;

    if (!currentUser || !gameCode) {
      setGameState({ status: "home" });
      return;
    }

    const unsub = onSnapshot(
      doc(db, "games", gameCode),
      (docSnap) => {
        if (docSnap.exists()) {
          setGameState({ id: docSnap.id, ...docSnap.data() });
        } else {
          localStorage.removeItem("gameCode");
          setGameCode("");
          if (ggSession?.isHost) {
            // GummyGum is the source of the cancellation here, so the hub
            // already knows the session ended — just redirect, don't
            // re-hit the close endpoint.
            returnToGummyGum();
          } else if (ggSession) {
            setGameState({ status: "gg-cancelled" });
          } else {
            setGameState({ status: "home" });
          }
        }
      },
      (error) => {
        console.error("Firestore listen error:", error);
      },
    );

    return unsub;
  }, [currentUser, gameCode, ggSession]);

  // 3. Report the launching host's final result back to the GummyGum hub
  useEffect(() => {
    if (ggReportedRef.current) return;
    if (gameState.status !== "end") return;
    if (
      !currentUser ||
      !gameState.hostUid ||
      currentUser.uid !== gameState.hostUid
    )
      return;

    ggReportedRef.current = true;

    try {
      const players = gameState.players || {};
      const ranked = Object.entries(players)
        .map(([uid, p]) => ({ uid, ...p }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));

      const hostPlayer = players[currentUser.uid];
      const placement = ranked.findIndex((p) => p.uid === currentUser.uid) + 1;
      const bestLiar = [...ranked].sort(
        (a, b) => (b.liarPoints || 0) - (a.liarPoints || 0),
      )[0];
      const lieDetector = [...ranked].sort(
        (a, b) => (b.correctGuesses || 0) - (a.correctGuesses || 0),
      )[0];

      reportGummyGumResult({
        gameCode: gameState.gameCode,
        finalScore: hostPlayer?.score ?? 0,
        placement: placement || null,
        totalPlayers: ranked.length,
        correctGuesses: hostPlayer?.correctGuesses ?? 0,
        liarPoints: hostPlayer?.liarPoints ?? 0,
        bestLiarName: bestLiar?.name ?? null,
        lieDetectorName: lieDetector?.name ?? null,
        leaderboard: ranked.map((p) => ({
          name: p.name,
          score: p.score ?? 0,
          isHost: p.uid === currentUser.uid,
        })),
      });
    } catch (err) {
      console.error("GummyGum result report failed to build", err);
    }
  }, [
    gameState.status,
    gameState.hostUid,
    gameState.players,
    gameState.gameCode,
    currentUser,
  ]);

  const applyMockUpdates = (data) => {
    setGameState((prev) => {
      const next = { ...prev };
      for (const key in data) {
        const parts = key.split(".");
        if (parts.length === 1) {
          next[key] = data[key];
        } else if (parts.length === 3 && parts[0] === "players") {
          const uid = parts[1];
          const field = parts[2];
          next.players = {
            ...next.players,
            [uid]: { ...next.players[uid], [field]: data[key] },
          };
        } else if (parts.length === 2 && parts[0] === "votes") {
          next.votes = { ...next.votes, [parts[1]]: data[key] };
        }
      }
      return next;
    });
  };

  const ensureUser = async () => {
    if (MOCK_MODE) return currentUser || { uid: "local_host" };
    if (currentUser) return currentUser;
    if (auth.currentUser) {
      setCurrentUser(auth.currentUser);
      return auth.currentUser;
    }
    const user = await Promise.race([
      authReadyPromise,
      new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
    ]);
    if (user) {
      setCurrentUser(user);
      return user;
    }
    try {
      const cred = await signInAnonymously(auth);
      if (cred?.user) {
        setCurrentUser(cred.user);
        return cred.user;
      }
    } catch (e) {
      // ignore
    }
    const rawAuthError = getAuthFailure();
    console.error(
      "Sign-in blocked this action. Raw Firebase error:",
      rawAuthError,
    );
    throw (
      rawAuthError ??
      new Error(
        "auth/unreachable: sign-in never completed — check the Network tab for blocked requests to googleapis.com",
      )
    );
  };

  const createGame = async (playerName, presetCode) => {
    if (!ggSession) {
      throw new Error(
        "This experience is only available through GummyGum. Head back to the hub to launch it.",
      );
    }
    if (MOCK_MODE) {
      const code = "TEST12";
      const mkBot = (i, name, sets) => ({
        name,
        color: COLORS[i],
        score: 0,
        streak: 0,
        correctGuesses: 0,
        liarPoints: 0,
        submitted: true,
        statementSets: sets,
        statements: sets[0]?.statements || [],
        lieIndex: sets[0]?.lieIndex ?? 0,
        lastReaction: null,
      });

      const mockGame = {
        status: "lobby",
        gameCode: code,
        hostUid: "local_host",
        hostName: playerName || "Host",
        players: {
          bot_1: mkBot(0, "Chidinma", [
            {
              statements: [
                "I once met a celebrity",
                "I have three dogs",
                "I can play guitar",
              ],
              lieIndex: 1,
            },
            {
              statements: [
                "I once swam with dolphins",
                "I cannot ride a bicycle",
                "I make the best jollof rice",
              ],
              lieIndex: 2,
            },
          ]),
          bot_2: mkBot(1, "Tunde", [
            {
              statements: [
                "I hate chocolate",
                "I speak 3 languages",
                "I have never been on a plane",
              ],
              lieIndex: 2,
            },
            {
              statements: [
                "I have a phobia of cats",
                "I once won a dance battle",
                "I sleep with the lights on",
              ],
              lieIndex: 1,
            },
          ]),
          bot_3: mkBot(2, "Amaka", [
            {
              statements: [
                "I once ate 12 burgers in one sitting",
                "I have a twin brother",
                "I can wiggle my ears",
              ],
              lieIndex: 0,
            },
          ]),
        },
        currentRound: 0,
        roundOrder: [],
        votes: {},
        revealed: false,
      };
      setGameState(mockGame);
      setGameCode(code);
      return;
    }

    const user = await ensureUser();

    if (presetCode) {
      const existingSnap = await getDoc(doc(db, "games", presetCode));
      if (existingSnap.exists()) {
        localStorage.setItem("gameCode", presetCode);
        setGameCode(presetCode);
        return;
      }
    }

    const code =
      presetCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    const newGame = {
      status: "lobby",
      gameCode: code,
      hostUid: user.uid,
      hostName: playerName || "Host",
      players: {},
      currentRound: 0,
      roundOrder: [],
      votes: {},
      revealed: false,
    };

    await setDoc(doc(db, "games", code), newGame);

    localStorage.setItem("gameCode", code);
    setGameCode(code);
  };

  const joinGame = async (code, playerName, avatarId = null) => {
    if (!ggSession) {
      throw new Error(
        "This experience is only available through GummyGum. Head back to the hub to launch it.",
      );
    }
    if (MOCK_MODE) {
      alert(
        "Join game doesn't work in Mock Mode. Please click Create Game to test.",
      );
      return;
    }

    const user = await ensureUser();
    const gameRef = doc(db, "games", code);
    const snap = await getDoc(gameRef);
    if (!snap.exists()) throw new Error("Game not found");

    const data = snap.data();
    if (data.hostUid === user.uid) {
      localStorage.setItem("gameCode", code);
      setGameCode(code);
      return;
    }
    if (data.players && data.players[user.uid]) {
      localStorage.setItem("gameCode", code);
      setGameCode(code);
      return;
    }

    // Re-clicking the GummyGum invite link can land in a fresh anon-auth
    // session (different browser/webview), giving a new uid for the same
    // person. Reclaim their existing entry by email instead of adding a
    // duplicate, carrying over score/streak/submission state.
    const ggEmail = ggSession?.player?.email
      ? ggSession.player.email.toLowerCase().trim()
      : null;
    const staleEntry = ggEmail && data.players
      ? Object.entries(data.players).find(
          ([, p]) => p.email && p.email.toLowerCase() === ggEmail,
        )
      : null;

    if (staleEntry) {
      const [staleUid, stalePlayer] = staleEntry;
      await updateDoc(gameRef, {
        [`players.${user.uid}`]: {
          ...stalePlayer,
          name: playerName || stalePlayer.name,
          avatarId: avatarId || stalePlayer.avatarId || null,
          email: ggEmail,
        },
        [`players.${staleUid}`]: deleteField(),
      });
      localStorage.setItem("gameCode", code);
      setGameCode(code);
      return;
    }

    if (data.status !== "lobby") throw new Error("Game already started");

    const numPlayers = Object.keys(data.players || {}).length;
    if (numPlayers >= 10) throw new Error("Game is full");

    await updateDoc(gameRef, {
      [`players.${user.uid}`]: {
        name: playerName,
        color: COLORS[numPlayers % COLORS.length],
        avatarId: avatarId || null,
        email: ggEmail,
        score: 0,
        streak: 0,
        correctGuesses: 0,
        liarPoints: 0,
        submitted: false,
        statementSets: [],
        lastReaction: null,
      },
    });

    localStorage.setItem("gameCode", code);
    setGameCode(code);
  };

  const leaveGame = () => {
    if (MOCK_MODE) {
      setGameState({ status: "home" });
      setGameCode("");
      return;
    }
    localStorage.removeItem("gameCode");
    setGameCode("");
    setGameState({ status: "home" });
  };

  const startGame = async () => {
    if (!currentUser || !gameCode) {
      const why = !currentUser ? "not signed in yet" : "no active game code";
      console.error("startGame blocked:", why);
      throw new Error(`startGame blocked: ${why}`);
    }
    if (gameState.hostUid !== currentUser.uid) {
      console.error(
        "startGame blocked: not the host — hostUid:",
        gameState.hostUid,
        "your uid:",
        currentUser.uid,
      );
      throw new Error(
        "startGame blocked: you are not the host of this game. If you reloaded the page and lost host status, create a new game.",
      );
    }

    const entries = [];
    Object.entries(gameState.players).forEach(([uid, p]) => {
      const sets =
        p.statementSets ||
        (p.statements
          ? [{ statements: p.statements, lieIndex: p.lieIndex ?? 0 }]
          : []);
      sets.forEach((_, setIndex) => entries.push({ uid, setIndex }));
    });

    if (entries.length === 0) {
      console.error(
        "startGame blocked: no statement sets on any player.",
        gameState.players,
      );
      throw new Error(
        "Cannot start: no statement sets have been submitted yet.",
      );
    }

    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }

    const updates = {
      status: "question",
      roundOrder: entries,
      currentRound: 0,
      roundEndTime: Date.now() + 30000,
      votes: {},
      revealed: false,
    };

    if (MOCK_MODE) {
      applyMockUpdates(updates);
      setTimeout(() => {
        applyMockUpdates({
          [`votes.bot_1`]: Math.floor(Math.random() * 3),
          [`votes.bot_2`]: Math.floor(Math.random() * 3),
        });
      }, 5000);
      return;
    }

    try {
      await updateDoc(doc(db, "games", gameCode), updates);
    } catch (err) {
      console.error("startGame failed — updateDoc threw:", err);
      throw err;
    }
  };

  const submitStatements = async (setsOrStatements, maybeLieIndex) => {
    if (!currentUser || !gameCode) {
      console.error(
        "submitStatements blocked:",
        !currentUser ? "not signed in" : "no game code",
      );
      return;
    }
    if (currentUser.uid === gameState.hostUid) return;

    let sets = [];
    if (Array.isArray(setsOrStatements)) {
      sets = setsOrStatements;
    } else if (setsOrStatements && typeof maybeLieIndex === "number") {
      sets = [{ statements: setsOrStatements, lieIndex: maybeLieIndex }];
    }

    const capped = sets.slice(0, 3);
    if (capped.length === 0) return;

    const updates = {
      [`players.${currentUser.uid}.statementSets`]: capped,
      [`players.${currentUser.uid}.statements`]: capped[0].statements,
      [`players.${currentUser.uid}.lieIndex`]: capped[0].lieIndex,
      [`players.${currentUser.uid}.submitted`]: true,
    };

    if (MOCK_MODE) {
      applyMockUpdates(updates);
      return;
    }

    try {
      await updateDoc(doc(db, "games", gameCode), updates);
    } catch (err) {
      console.error("submitStatements failed:", err);
      throw err;
    }
  };

  const advanceGame = async (status, extraData = {}) => {
    if (!currentUser || !gameCode) return;

    const updates = { status, ...extraData };

    if (MOCK_MODE) {
      applyMockUpdates(updates);

      if (status === "question") {
        setTimeout(() => {
          applyMockUpdates({
            [`votes.bot_1`]: Math.floor(Math.random() * 3),
            [`votes.bot_2`]: Math.floor(Math.random() * 3),
          });
        }, 5000);
      }
      return;
    }

    await updateDoc(doc(db, "games", gameCode), updates);
  };

  const updateGameDoc = async (data) => {
    if (!currentUser || !gameCode) return;

    if (MOCK_MODE) {
      applyMockUpdates(data);
      if (data.status === "question") {
        setTimeout(() => {
          applyMockUpdates({
            [`votes.bot_1`]: Math.floor(Math.random() * 3),
            [`votes.bot_2`]: Math.floor(Math.random() * 3),
          });
        }, 5000);
      }
      return;
    }

    try {
      await updateDoc(doc(db, "games", gameCode), data);
    } catch (err) {
      console.error("updateGameDoc failed:", err);
      throw err;
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        currentUser,
        authReady,
        authError,
        ggSession,
        ggChecked,
        createGame,
        joinGame,
        leaveGame,
        startGame,
        submitStatements,
        advanceGame,
        updateGameDoc,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
