const API_URL = import.meta.env.VITE_GUMMYGUM_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://paige-server.onrender.com');
const STORAGE_KEY = 'gummygum_launch_session';

export function getGummyGumSession() {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

async function verifyLaunchTokenOnce(ggt) {
  try {
    const res = await fetch(`${API_URL}/api/gummygum/launch/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: ggt }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      const fallbackUrl = body?.data?.fallbackUrl;
      // A rejected invite link goes to the hub's /join page, which explains the specific reason.
      if (typeof fallbackUrl === 'string' && fallbackUrl.startsWith('https://gummygum.app/')) {
        window.location.replace(fallbackUrl);
        return new Promise(() => {});
      }
      return null;
    }
    return body;
  } catch (err) {
    console.error('GummyGum launch verify failed', err);
    return null;
  }
}

export async function resolveGummyGumLaunch() {
  const params = new URLSearchParams(window.location.search);
  const ggt = params.get('ggt');

  if (!ggt) {
    return getGummyGumSession();
  }

  let body = await verifyLaunchTokenOnce(ggt);
  if (!body) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    body = await verifyLaunchTokenOnce(ggt);
  }

  if (!body) {
    const existing = getGummyGumSession();
    if (existing) {
      params.delete('ggt');
      const query = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));
      return existing;
    }
    return null;
  }

  // The URL sessionId is the hub's hosted session; verify's data.sessionId is per-launch.
  const hostedSessionId = params.get('sessionId') || null;

  const hubUrl = body.data.hubUrl || (typeof document !== 'undefined' && document.referrer ? new URL(document.referrer).origin : 'https://gummygum.app');

  const session = {
    sessionId: body.data.sessionId,
    experienceId: body.data.experienceId,
    isGuest: body.data.isGuest,
    player: body.data.player,
    reportToken: body.data.reportToken,
    roomCode: body.data.roomCode || null,
    hostedSessionId,
    isHost: Boolean(body.data.isHost),
    invitedCount: body.data.invitedCount || null,
    hubUrl,
    round: 1,
    reported: false,
  };
  localStorage.removeItem('gameCode');
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

  params.delete('ggt');
  const query = params.toString();
  window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));

  return session;
}

// The hub reuses a PIN across hosted sessions, so "already joined" is per hosted session.
export function joinedRoomKey(session, email) {
  return ['twotruths_joined', session?.roomCode, session?.hostedSessionId, email].filter(Boolean).join('_');
}

// Storage is cleared by returnToGummyGum afterwards, so the hub URL survives until navigation.
export async function reportGummyGumCancel() {
  const session = getGummyGumSession();
  if (!session || !session.reportToken) return;

  try {
    await fetch(`${API_URL}/api/gummygum/launch/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportToken: session.reportToken }),
      keepalive: true,
    });
  } catch (err) {
    console.error('GummyGum cancel report failed', err);
  }
}

export async function reportGummyGumResult(report) {
  const session = getGummyGumSession();
  if (!session || !session.reportToken || session.reported) return;

  try {
    const res = await fetch(`${API_URL}/api/gummygum/launch/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportToken: session.reportToken, report }),
      keepalive: true,
    });
    if (!res.ok) throw new Error(`report rejected (${res.status})`);
    session.reported = true;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('GummyGum result report failed', err);
  }
}

// Host-only: marks the hosted session ended hub-side; caller navigates via returnToGummyGum.
export async function closeGummyGumSession(finalReport) {
  const session = getGummyGumSession();
  if (!session || !session.isHost || !session.reportToken) return;

  try {
    await fetch(`${API_URL}/api/gummygum/launch/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportToken: session.reportToken, report: session.reported ? undefined : finalReport }),
      keepalive: true,
    });
  } catch (err) {
    console.error('GummyGum close session failed', err);
  }
}

// Player / guest return: safe navigation back to GummyGum without closing the host's room
export function returnToGummyGum() {
  const session = getGummyGumSession();
  const hub = session?.hubUrl || 'https://gummygum.app';
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = hub;
}

// Host-only: start next round from within the experience, preserving tracking in GummyGum
export async function startNextRoundGummyGum(previousRoundReport) {
  const session = getGummyGumSession();
  if (!session || !session.isHost || !session.reportToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/gummygum/launch/next-round`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportToken: session.reportToken, report: previousRoundReport }),
    });
    const body = await res.json();
    if (res.ok && body.success && body.data) {
      session.sessionId = body.data.sessionId;
      session.reportToken = body.data.reportToken;
      session.round = body.data.round || (session.round + 1);
      session.reported = false;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return session;
    }
  } catch (err) {
    console.error('GummyGum start next round failed', err);
  }
  return session;
}

const HUB_STATUS_POLL_MS = 15000;

// The hub can't write to this experience's realtime DB, so a hub-side end is only visible via the backend.
export function watchHubSessionStatus({ pin, hostedSessionId, onEnded }) {
  if (typeof window === 'undefined' || !pin || !hostedSessionId) return () => {};
  let stopped = false;
  let inFlight = false;
  let timer = null;

  const stop = () => {
    stopped = true;
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
  };

  const check = async () => {
    if (stopped || inFlight || document.hidden) return;
    inFlight = true;
    try {
      const res = await fetch(`${API_URL}/api/gummygum/sessions/by-pin/${encodeURIComponent(pin)}`);
      if (!res.ok) return;
      const body = await res.json();
      const data = body?.data;
      if (stopped || !body?.success || !data?.id) return;
      const isOurs = String(data.id) === String(hostedSessionId);
      if (!isOurs || data.status === 'Ended') {
        stop();
        onEnded(data);
      }
    } catch {
      // Network errors never end the session.
    } finally {
      inFlight = false;
    }
  };

  function onVisibility() {
    if (!document.hidden) check();
  }

  document.addEventListener('visibilitychange', onVisibility);
  timer = setInterval(check, HUB_STATUS_POLL_MS);
  check();
  return stop;
}
