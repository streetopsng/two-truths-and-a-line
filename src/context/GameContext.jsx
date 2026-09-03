import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { db, auth } from "../firebase/config";
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  resolveGummyGumLaunch,
  reportGummyGumResult,
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

// Mock mode: kicks in when Firebase keys are missing, or when explicitly
// requested via env (used by the Playwright e2e suite so tests are
// deterministic and never touch the real Firestore).
const MOCK_MODE =
  db.app.options.apiKey === "YOUR_API_KEY" ||
  import.meta.env.VITE_MOCK_MODE === "true";

// Raw Firebase errors are surfaced as-is (code + message) — no friendly
// wrapping — so failures are always diagnosable.
const rawAuthMessage = (error) =>
  error?.code
    ? `${error.code}: ${error.message}`
    : String(error ?? "Unknown Firebase error");

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

    // Hard fallback: if the sign-in attempt HANGS (blocked network, privacy
    // extension, restricted browser storage), never leave the UI disabled
    // forever — unlock after 8s and explain how to troubleshoot.
    const timeout = setTimeout(() => {
      console.warn("Firebase sign-in still pending after 8s — unlocking the UI anyway.");
      setAuthReady(true);
      setAuthError(
        (prev) =>
          prev ??
          "Still connecting to Firebase… If this persists, check your internet connection, disable ad-blockers/VPN, and reload the page.",
      );
    }, 8000);

    // Surface anonymous-auth problems (provider disabled, unauthorized
    // domain, network down) as soon as the sign-in attempt settles.
    authReadyPromise.then((user) => {
      clearTimeout(timeout);
      setAuthReady(true);
      if (user) {
        setAuthError(null);
      } else {
        setAuthError(rawAuthMessage(getAuthFailure()));
      }
    });

    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        clearTimeout(timeout);
        setCurrentUser(user);
        setAuthReady(true);
        if (user) setAuthError(null);
      },
      (err) => {
        clearTimeout(timeout);
        setAuthError(rawAuthMessage(err));
        setAuthReady(true);
      },
    );

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
          setGameState({ status: "home" });
        }
      },
      (error) => {
        console.error("Firestore listen error:", error);
      },
    );

    return unsub;
  }, [currentUser, gameCode]);

  // 3. Report the launching host's final result back to the GummyGum hub
  // once their game reaches its real conclusion. Fires at most once per
  // session, and only for the host (the player who came from the hub
  // redirect) — other players never carry a launch session.
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
        leaderboard: ranked.map((p) => ({ name: p.name, score: p.score ?? 0 })),
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

  // Mock Helper for Local State mutation
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

  // Wait for the anonymous sign-in attempt to settle before creating/joining.
  // Prevents the "clicked too early" race and replaces the old dead-end
  // "Connecting to server..." error with an actionable message.
  const ensureUser = async () => {
    if (MOCK_MODE) return currentUser;
    if (currentUser) return currentUser;
    const user = await Promise.race([
      authReadyPromise,
      new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
    ]);
    if (user) return user;
    // Throw the raw Firebase error as-is — no friendly wrapping.
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

  // Actions
  const createGame = async (playerName, presetCode) => {
    if (!ggSession) {
      throw new Error('This experience is only available through GummyGum. Head back to the hub to launch it.');
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
        lastReaction: null,
      });
      // The host only sets the game up and spectates — bots are the players.
      // Bots submit 1–3 sets each so multi-set rounds get exercised.
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
      // Also what makes GummyGum's room pre-creation work: if GummyGum already
      // created this room, adopt it as-is. The host spectates, so they are
      // never seated in `players` — they just take over the room code.
      const existingSnap = await getDoc(doc(db, "games", presetCode));
      if (existingSnap.exists()) {
        localStorage.setItem("gameCode", presetCode);
        setGameCode(presetCode);
        return;
      }
    }

    const code =
      presetCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    // The host sets the game up, runs the flow and spectates — they are not a
    // player: no statements, no votes, and never part of `roundOrder`.
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

  const joinGame = async (code, playerName) => {
    if (!ggSession) {
      throw new Error('This experience is only available through GummyGum. Head back to the hub to launch it.');
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
    if (data.status !== "lobby") throw new Error("Game already started");
    // The host re-entering their own code just resumes hosting — they never
    // join their own game as a player.
    if (data.hostUid === user.uid) {
      localStorage.setItem("gameCode", code);
      setGameCode(code);
      return;
    }
    if (data.players[user.uid]) {
      localStorage.setItem("gameCode", code);
      setGameCode(code);
      return;
    }

    const numPlayers = Object.keys(data.players).length;
    if (numPlayers >= 10) throw new Error("Game is full");

    await updateDoc(gameRef, {
      [`players.${user.uid}`]: {
        name: playerName,
        color: COLORS[numPlayers % COLORS.length],
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
    // One round per submitted statement set — a player with 3 sets is the
    // subject 3 times. Shuffle the flattened (uid, setIndex) entries so
    // everyone's sets are interleaved.
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
      // Simulate bots voting instantly for testing
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
      // Raw Firebase error, thrown as-is (e.g. permission-denied).
      console.error("startGame failed — updateDoc threw:", err);
      throw err;
    }
  };

  // Players can submit 1–3 statement sets. `sets` is an array of
  // { statements: [3 strings], lieIndex } — each set gets its own round
  // in the hot seat. Submitting once is fine; 3 is the max.
  const submitStatements = async (sets) => {
    if (!currentUser || !gameCode) {
      console.error(
        "submitStatements blocked:",
        !currentUser ? "not signed in" : "no game code",
      );
      return;
    }
    // Hosts spectate — they never submit statements.
    if (currentUser.uid === gameState.hostUid) return;

    const capped = (sets || []).slice(0, 3);
    if (capped.length === 0) return;

    const updates = {
      [`players.${currentUser.uid}.statementSets`]: capped,
      [`players.${currentUser.uid}.submitted`]: true,
    };

    if (MOCK_MODE) {
      applyMockUpdates(updates);
      return;
    }

    try {
      await updateDoc(doc(db, "games", gameCode), updates);
    } catch (err) {
      // Raw Firebase error, thrown as-is.
      console.error("submitStatements failed:", err);
      throw err;
    }
  };

  const advanceGame = async (status, extraData = {}) => {
    if (!currentUser || !gameCode) return;

    const updates = { status, ...extraData };

    if (MOCK_MODE) {
      applyMockUpdates(updates);

      // If moving to next question, queue bot votes
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
      // Raw Firebase error, thrown as-is (e.g. permission-denied).
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
