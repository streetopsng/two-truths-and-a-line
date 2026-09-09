const API_URL = import.meta.env.VITE_GUMMYGUM_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'gummygum_launch_session';

export function getGummyGumSession() {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Resolves the GummyGum hub launch token (?ggt=...) into a session, if present.
export async function resolveGummyGumLaunch() {
  const params = new URLSearchParams(window.location.search);
  const ggt = params.get('ggt');

  if (!ggt) {
    return getGummyGumSession();
  }

  try {
    const res = await fetch(`${API_URL}/api/gummygum/launch/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: ggt }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) return null;

    const hubUrl = body.data.hubUrl || (typeof document !== 'undefined' && document.referrer ? new URL(document.referrer).origin : 'https://gummygum.app');

    const session = {
      sessionId: body.data.sessionId,
      experienceId: body.data.experienceId,
      isGuest: body.data.isGuest,
      player: body.data.player,
      reportToken: body.data.reportToken,
      roomCode: body.data.roomCode || null,
      isHost: Boolean(body.data.isHost),
      hubUrl,
      round: 1,
      reported: false,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    params.delete('ggt');
    const query = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));

    return session;
  } catch (err) {
    console.error('GummyGum launch verify failed', err);
    return null;
  }
}

// Reports the launching player's final result back to the hub.
export async function reportGummyGumResult(report) {
  const session = getGummyGumSession();
  if (!session || !session.reportToken) return;

  try {
    await fetch(`${API_URL}/api/gummygum/launch/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportToken: session.reportToken, report }),
    });
    session.reported = true;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('GummyGum result report failed', err);
  }
}

// Host-only: explicitly close session, ensure final report submitted, and return to GummyGum
export async function closeGummyGumSession(finalReport) {
  const session = getGummyGumSession();
  if (!session) {
    window.location.href = 'https://gummygum.app';
    return;
  }

  if (!session.isHost) {
    console.warn('Only the session host can close the session.');
    returnToGummyGum();
    return;
  }

  try {
    await fetch(`${API_URL}/api/gummygum/launch/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportToken: session.reportToken, report: finalReport }),
    });
  } catch (err) {
    console.error('GummyGum close session failed', err);
  } finally {
    const hub = session.hubUrl || 'https://gummygum.app';
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = hub;
  }
}

// Player / guest return: safe navigation back to GummyGum without closing the host's room
export function returnToGummyGum() {
  const session = getGummyGumSession();
  const hub = session?.hubUrl || 'https://gummygum.app';
  sessionStorage.removeItem(STORAGE_KEY);
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
