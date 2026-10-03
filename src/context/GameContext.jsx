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
  reportGummyGumCancel,
  closeGummyGumSession,
  returnToGummyGum,
  getGummyGumSession,
  watchHubSessionStatus,
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

// Hours, not the lobby's 20 min: an in-game room with no connected client
// this long is abandoned rather than just a long game.
const ABANDON_THRESHOLD_MS = 3 * 60 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const IN_GAME_STATUSES = ["question", "reaction", "leaderboard"];
// 'ended' = host ended from inside the experience; 'Ended' = GummyGum dashboard force-end.
const ENDED_STATUSES = ["ended", "Ended", "cancelled"];
const LOBBY_EXPIRY_MS = 20 * 60 * 1000;
const WRITE_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1000;
const phaseOf = (g) => `${g?.status}|${g?.currentRound}|${g?.revealed}`;

const isClosedRoom = (data, now = Date.now()) => {
  if (data.status === "expired" || data.status === "end" || ENDED_STATUSES.includes(data.status)) return true;
  if (data.status === "lobby") return Boolean(data.createdAt) && now - data.createdAt >= LOBBY_EXPIRY_MS;
  const lastActivity = data.lastActivity || data.roundEndTime || data.createdAt;
  return IN_GAME_STATUSES.includes(data.status) && Boolean(lastActivity) && now - lastActivity >= ABANDON_THRESHOLD_MS;
};

// The hub reuses a PIN for re-runs, so the room under it may belong to an earlier hosted session.
const isFromEarlierRoom = (data, hostedSessionId) => {
  if (!data || !hostedSessionId) return false;
  if (data.hostedSessionId) return data.hostedSessionId !== hostedSessionId;
  return isClosedRoom(data);
};

  const getInitialGameCode = () => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    // ggt in the URL, or a ggSession already resolved earlier this tab
    // (survives a refresh even after ggt itself is stripped from the URL)
    // both mean the async resolve effect below decides gameCode instead —
    // trusting the raw pin/roomCode/code params here would adopt the room
    // before a participant's actually joined, skipping GgAvatarSetupScreen.
    if (params.get("ggt") || getGummyGumSession()) return "";
    const urlCode = params.get("pin") || params.get("roomCode") || params.get("code") || params.get("gameCode");
    if (urlCode) return urlCode.toUpperCase();
    return localStorage.getItem("gameCode") || "";
  };

export const GameProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(MOCK_MODE);
  const [authError, setAuthError] = useState(null);
  const [gameCode, setGameCode] = useState(getInitialGameCode);
  const [gameState, setGameState] = useState({ status: "home" });
  const [ggSession, setGgSession] = useState(null);
  const [ggChecked, setGgChecked] = useState(false);
  const ggReportedRef = useRef(false);
  const hostExitInProgressRef = useRef(false);
  // Set when the hub ended the session; the room doc itself never changes, so snapshots must not undo it.
  const hubEndedRef = useRef(false);
  const ggSessionRef = useRef(null);
  ggSessionRef.current = ggSession;
  const [syncError, setSyncError] = useState(false);

  // 0. Resolve GummyGum hub launch identity (?ggt=...), if present.
  useEffect(() => {
    resolveGummyGumLaunch().then((session) => {
      setGgSession(session);
      setGgChecked(true);
      // Host-only: hosts skip straight into their pre-created room with no
      // avatar step, so gameCode needs to be set immediately. Setting it for
      // a participant here — before they've actually joined — makes
      // GameCoordinator's `alreadyJoined` check (localStorage.getItem('gameCode')
      // === ggSession.roomCode) true on their very first visit, which skips
      // GgAvatarSetupScreen (avatar + GameRulesModal) entirely. Participants
      // get gameCode set for real inside joinGame, once they've confirmed.
      if (session?.roomCode && session.isHost) {
        setGameCode(session.roomCode);
        localStorage.setItem("gameCode", session.roomCode);
        setIsSessionExpired(false);
      } else if (session?.roomCode && localStorage.getItem("gameCode") === session.roomCode) {
        // Participant refresh after a completed join (a fresh ggt launch clears this key first).
        setGameCode(session.roomCode);
      }
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

  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const gameDocSeenRef = useRef(false);

  // 2. Listen to Firestore Game Document (or mock it)
  useEffect(() => {
    if (MOCK_MODE) return;

    if (!currentUser || !gameCode) {
      setGameState({ status: "home" });
      return;
    }

    gameDocSeenRef.current = false;

    const unsub = onSnapshot(
      doc(db, "games", gameCode),
      (docSnap) => {
        // Firestore fires this optimistically for the host's own 'ended' write; don't reroute mid-exit.
        if (hostExitInProgressRef.current || hubEndedRef.current) return;
        if (docSnap.exists()) {
          gameDocSeenRef.current = true;
          const data = docSnap.data();
          const ownHostedSessionId = ggSession?.hostedSessionId;
          if (!ggSession?.isHost && ownHostedSessionId && data.hostedSessionId && data.hostedSessionId !== ownHostedSessionId) {
            // The host reset this PIN for a newer hosted session, so this participant's session is over.
            setGameState({ status: 'gg-cancelled' });
            return;
          }
          if (data.status === 'expired') {
            setIsSessionExpired(true);
          }
          if (data.status === 'lobby' && data.createdAt && Date.now() - data.createdAt >= 20 * 60 * 1000) {
            setIsSessionExpired(true);
          }
          // The host drives their own exit through the UI, so only reroute participants.
          if (ENDED_STATUSES.includes(data.status) && !ggSession?.isHost) {
            setGameState({ status: 'gg-cancelled', completed: Boolean(data.completed) });
            return;
          }
          setGameState({ id: docSnap.id, ...data });
        } else if (gameDocSeenRef.current && !ggSession?.isHost) {
          // Room existed and just vanished — host cancelled/exited, not a stale/unused code.
          setGameState({ status: 'gg-cancelled' });
        } else {
          // Document does not exist (may still be creating or stale code). Do NOT falsely mark as expired!
          setGameState({ status: "home" });
        }
      },
      (error) => {
        console.error("Firestore listen error:", error);
      },
    );

    return unsub;
  }, [currentUser, gameCode, ggSession]);

  // Participants still on the avatar step (or reconnecting) have no gameCode
  // yet, so watch the pre-created room directly to catch a host ending it.
  const preJoinRoomCode =
    ggSession && !ggSession.isHost && !gameCode ? ggSession.roomCode : null;
  const preJoinHostedSessionId = preJoinRoomCode ? ggSession.hostedSessionId || null : null;
  const [preJoinRoomReady, setPreJoinRoomReady] = useState(false);
  // Until the host (re)creates this hosted session's room, the PIN may be missing or hold an earlier session's room.
  const awaitingHost = Boolean(preJoinHostedSessionId) && !preJoinRoomReady;
  useEffect(() => {
    if (MOCK_MODE || !currentUser || !preJoinRoomCode) return;

    let seen = false;
    const unsub = onSnapshot(
      doc(db, "games", preJoinRoomCode),
      (docSnap) => {
        if (hubEndedRef.current) return;
        const data = docSnap.exists() ? docSnap.data() : null;
        if (preJoinHostedSessionId && (!data || isFromEarlierRoom(data, preJoinHostedSessionId))) {
          if (!seen) {
            setPreJoinRoomReady(false);
            return;
          }
        }
        if (data) {
          seen = true;
          setPreJoinRoomReady(true);
          if (ENDED_STATUSES.includes(data.status)) {
            setGameState({ status: 'gg-cancelled', completed: Boolean(data.completed) });
          }
        } else if (seen) {
          setGameState({ status: 'gg-cancelled' });
        }
      },
      (error) => console.error("Pre-join room listen error:", error),
    );
    return unsub;
  }, [currentUser, preJoinRoomCode, preJoinHostedSessionId]);

  // 'checking' until we know whether this invite email already holds a slot in the room.
  const [ggRejoin, setGgRejoin] = useState('checking');
  useEffect(() => {
    if (MOCK_MODE || !currentUser || !ggSession || ggSession.isHost || !ggSession.roomCode || gameCode || awaitingHost) return;
    let cancelled = false;
    const email = (ggSession.player?.email || '').toLowerCase().trim();
    getDoc(doc(db, "games", ggSession.roomCode))
      .then(async (snap) => {
        const players = snap.exists() ? snap.data().players || {} : {};
        const existing = players[currentUser.uid]
          || (email ? Object.values(players).find((p) => (p.email || '').toLowerCase().trim() === email) : null);
        if (cancelled) return;
        if (!existing) {
          setGgRejoin('none');
          return;
        }
        await joinGame(ggSession.roomCode, existing.name, existing.avatarId || null);
        if (!cancelled) setGgRejoin('joined');
      })
      .catch((err) => {
        console.error('GummyGum rejoin check failed:', err);
        if (!cancelled) setGgRejoin('none');
      });
    return () => { cancelled = true; };
  }, [currentUser, ggSession, gameCode, awaitingHost]);

  const latestStatusRef = useRef(null);
  latestStatusRef.current = gameState.status;
  const latestGameRef = useRef(gameState);
  latestGameRef.current = gameState;

  // A failed write must not freeze the round, so it is retried; once the game has moved on a late retry is dropped.
  const writeGame = async (data) => {
    const gameRef = doc(db, "games", gameCode);
    const startPhase = phaseOf(latestGameRef.current);
    let lastError = null;
    for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt++) {
      if (attempt > 0 && phaseOf(latestGameRef.current) !== startPhase) return;
      try {
        await updateDoc(gameRef, data);
        setSyncError(false);
        return;
      } catch (err) {
        lastError = err;
        console.error(`Game write failed (attempt ${attempt + 1}):`, err);
        if (err?.code === "permission-denied" || err?.code === "not-found") break;
        if (attempt < WRITE_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
    setSyncError(true);
    throw lastError;
  };

  // One-time abandonment check, run before this client's heartbeat starts so
  // a returning client can't mask a room nobody has touched for hours.
  useEffect(() => {
    if (MOCK_MODE || !currentUser || !gameCode) return;

    const gameRef = doc(db, "games", gameCode);
    let cancelled = false;
    let heartbeat;

    getDoc(gameRef)
      .then((snap) => {
        if (cancelled || !snap.exists()) return;
        const data = snap.data();
        const lastActivity = data.lastActivity || data.roundEndTime || data.createdAt;
        if (
          IN_GAME_STATUSES.includes(data.status) &&
          lastActivity &&
          Date.now() - lastActivity >= ABANDON_THRESHOLD_MS
        ) {
          updateDoc(gameRef, { status: "expired", abandoned: true }).catch(() => {});
          setIsSessionExpired(true);
          return;
        }

        // Host only: every player writing the game doc made every other device re-read it each minute.
        const beat = () => {
          if (hostExitInProgressRef.current || !ggSessionRef.current?.isHost) return;
          if (IN_GAME_STATUSES.includes(latestStatusRef.current)) {
            updateDoc(gameRef, { lastActivity: Date.now() }).catch(() => {});
          }
        };
        beat();
        heartbeat = setInterval(beat, HEARTBEAT_INTERVAL_MS);
      })
      .catch((err) => console.error("Abandonment check failed:", err));

    return () => {
      cancelled = true;
      if (heartbeat) clearInterval(heartbeat);
    };
  }, [currentUser, gameCode]);

  // The host may end the session from the hub, which never touches this room.
  const hubPin = ggSession?.roomCode || gameCode;
  useEffect(() => {
    if (!ggSession || !hubPin || !ggSession.hostedSessionId) return;
    return watchHubSessionStatus({
      pin: hubPin,
      hostedSessionId: ggSession.hostedSessionId,
      onEnded: async (hubSession) => {
        if (hostExitInProgressRef.current || hubEndedRef.current) return;
        hubEndedRef.current = true;
        const completed = latestStatusRef.current === "end";
        if (!ggSession.isHost) {
          setGameState({ status: "gg-cancelled", completed });
          return;
        }
        hostExitInProgressRef.current = true;
        // A newer re-run owns the PIN's room now, so only mark it ended if it is still ours.
        if (!MOCK_MODE && String(hubSession.id) === String(ggSession.hostedSessionId)) {
          await Promise.race([
            updateDoc(doc(db, "games", hubPin), { status: "ended", endedAt: Date.now(), completed }).catch(() => {}),
            new Promise((resolve) => setTimeout(resolve, 5000)),
          ]);
        }
        localStorage.removeItem("gameCode");
        returnToGummyGum();
      },
    });
  }, [ggSession, hubPin]);

  // Real-time interval check every 10s for 20-minute lobby expiration
  useEffect(() => {
    if (gameState.status !== 'lobby' || !gameState.createdAt) return;

    const checkExpiration = () => {
      const elapsed = Date.now() - gameState.createdAt;
      if (elapsed >= 20 * 60 * 1000) {
        setIsSessionExpired(true);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 10000);
    return () => clearInterval(interval);
  }, [gameState.status, gameState.createdAt]);

  const buildGgReport = () => {
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

    return {
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
    };
  };

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
      reportGummyGumResult(buildGgReport());
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

    setIsSessionExpired(false);
    const user = await ensureUser();

    if (presetCode) {
      const existingSnap = await getDoc(doc(db, "games", presetCode));
      if (existingSnap.exists()) {
        const existingData = existingSnap.data();
        const hostedSessionId = ggSession?.hostedSessionId || null;
        if (!isFromEarlierRoom(existingData, hostedSessionId)) {
          const sameHostedSession = Boolean(hostedSessionId) && existingData.hostedSessionId === hostedSessionId;
          // An abandoned mid-game room, or one this hosted session already ended, is terminal:
          // surface it rather than silently recreating a fresh lobby over it.
          if (
            (existingData.status === 'expired' && existingData.abandoned) ||
            (sameHostedSession && (existingData.status === 'expired' || ENDED_STATUSES.includes(existingData.status)))
          ) {
            localStorage.setItem("gameCode", presetCode);
            setGameCode(presetCode);
            return;
          }
          const isStale =
            existingData.status === 'expired' ||
            ENDED_STATUSES.includes(existingData.status) ||
            (existingData.status === 'lobby' && existingData.createdAt && Date.now() - existingData.createdAt >= LOBBY_EXPIRY_MS);
          if (!isStale) {
            if (hostedSessionId && !existingData.hostedSessionId) {
              await updateDoc(doc(db, "games", presetCode), { hostedSessionId }).catch(() => {});
            }
            // The hub-verified host relaunching from another browser has a new anonymous uid; keep them in control.
            if (ggSession?.isHost && existingData.hostUid !== user.uid) {
              await updateDoc(doc(db, "games", presetCode), { hostUid: user.uid }).catch(() => {});
            }
            localStorage.setItem("gameCode", presetCode);
            setGameCode(presetCode);
            return;
          }
        }
      }
    }

    const code =
      presetCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    const targetInvited = ggSession?.invitedCount || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('invitedCount') : null);
    const newGame = {
      status: "lobby",
      gameCode: code,
      createdAt: Date.now(),
      hostUid: user.uid,
      hostName: playerName || "Host",
      invitedCount: targetInvited ? parseInt(targetInvited, 10) : null,
      hostedSessionId: ggSession?.hostedSessionId || null,
      players: {},
      currentRound: 0,
      roundOrder: [],
      votes: {},
      revealed: false,
    };

    await setDoc(doc(db, "games", code), newGame);

    localStorage.setItem("gameCode", code);
    setGameCode(code);
    setIsSessionExpired(false);
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
    if (isFromEarlierRoom(data, ggSession?.hostedSessionId)) throw new Error("The host hasn't started this session yet");
    if (ENDED_STATUSES.includes(data.status)) throw new Error("This session has ended");
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
      // Rounds and votes are keyed by uid; left on the old uid, this player's rounds would render blank for everyone.
      const moved = {};
      if (Array.isArray(data.roundOrder) && data.roundOrder.some((e) => e.uid === staleUid)) {
        moved.roundOrder = data.roundOrder.map((e) => (e.uid === staleUid ? { ...e, uid: user.uid } : e));
      }
      if (data.votes && data.votes[staleUid] !== undefined) {
        moved[`votes.${user.uid}`] = data.votes[staleUid];
        moved[`votes.${staleUid}`] = deleteField();
      }
      await updateDoc(gameRef, {
        ...moved,
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
    const maxLimit = data.invitedCount ? Math.max(data.invitedCount, 50) : 50;
    if (numPlayers >= maxLimit) throw new Error("Game is full");

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

  const isRoomClosed = () =>
    hostExitInProgressRef.current ||
    hubEndedRef.current ||
    gameState.status === 'gg-cancelled' ||
    ENDED_STATUSES.includes(gameState.status);

  const startGame = async () => {
    if (isRoomClosed()) return;
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

    await writeGame(updates);
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
    if (isRoomClosed()) return;

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

    await writeGame(updates);
  };

  const advanceGame = async (status, extraData = {}) => {
    if (!currentUser || !gameCode || isRoomClosed()) return;

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

    await writeGame(updates);
  };

  const updateGameDoc = async (data) => {
    if (!currentUser || !gameCode || isRoomClosed()) return;

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

    await writeGame(data);
  };

  // Host-only exit: notify participants via the room doc, then close the hub session, then leave.
  const endSession = async () => {
    if (hostExitInProgressRef.current) return;
    hostExitInProgressRef.current = true;
    const completed = gameState.status === "end";

    if (!MOCK_MODE && gameCode) {
      try {
        await Promise.race([
          updateDoc(doc(db, "games", gameCode), {
            status: "ended",
            endedAt: Date.now(),
            completed,
          }),
          new Promise((resolve) => setTimeout(resolve, 5000)),
        ]);
      } catch (err) {
        console.error("Marking room ended failed:", err);
      }
    }

    if (completed) {
      // The report sent on reaching the end may have failed; close carries it unless it already landed.
      let finalReport;
      try {
        finalReport = buildGgReport();
      } catch {
        finalReport = undefined;
      }
      await closeGummyGumSession(finalReport);
    } else {
      await reportGummyGumCancel();
    }

    localStorage.removeItem("gameCode");
    returnToGummyGum();
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
        awaitingHost,
        ggRejoin,
        isSessionExpired,
        syncError,
        setSyncError,
        setIsSessionExpired,
        setGameCode,
        createGame,
        joinGame,
        leaveGame,
        startGame,
        submitStatements,
        advanceGame,
        updateGameDoc,
        endSession,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
