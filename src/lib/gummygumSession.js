const API_URL = import.meta.env.VITE_GUMMYGUM_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'gummygum_launch_session';

// Resolves the GummyGum hub launch token (?ggt=...) into a session, if present.
// Never throws: on any failure (missing token, network error, bad response),
// this resolves to null and the app proceeds exactly as it would without the hub.
export async function resolveGummyGumLaunch() {
  const params = new URLSearchParams(window.location.search);
  const ggt = params.get('ggt');

  if (!ggt) {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  try {
    const res = await fetch(`${API_URL}/api/gummygum/launch/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: ggt }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) return null;

    const session = {
      sessionId: body.data.sessionId,
      experienceId: body.data.experienceId,
      isGuest: body.data.isGuest,
      player: body.data.player,
      reportToken: body.data.reportToken,
      roomCode: body.data.roomCode || null,
      isHost: Boolean(body.data.isHost),
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

// Reports the launching player's final result back to the hub, if a launch
// session is on record. Silently no-ops on any failure so gameplay is never
// affected by this integration.
export async function reportGummyGumResult(report) {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  let session;
  try {
    session = JSON.parse(stored);
  } catch (err) {
    console.error('GummyGum stored session parse failed', err);
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  try {
    await fetch(`${API_URL}/api/gummygum/launch/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportToken: session.reportToken, report }),
    });
  } catch (err) {
    console.error('GummyGum result report failed', err);
  } finally {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
