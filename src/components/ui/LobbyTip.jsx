import React, { useState, useEffect } from 'react';

const TIPS = [
  'The best lies sound almost too normal to question.',
  'Vague statements are easier to fake, so go specific.',
  'Watch for hesitation when someone reads their own lie aloud.',
  'You score 100 points for every correct guess, so vote in every round.',
  'You can edit your statements anytime before the host starts the game.',
];

const DISMISS_KEY = 'twotruths_tips_dismissed';

const readDismissed = () => {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

// In-flow snackbar rather than a fixed overlay so it can never sit on top of the footer CTA.
export const LobbyTip = ({ items = TIPS, intervalMs = 6000 }) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    if (dismissed || items.length < 2) return;
    let swap;
    const cycle = setInterval(() => {
      setVisible(false);
      swap = setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setVisible(true);
      }, 250);
    }, intervalMs);
    return () => {
      clearInterval(cycle);
      clearTimeout(swap);
    };
  }, [dismissed, items.length, intervalMs]);

  if (dismissed || items.length === 0) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* storage blocked */
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-2.5 bg-white border border-[#E0DBD4] rounded-[12px] pl-3 pr-1.5 py-2 animate-fadeUp"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5821F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-[2px]" aria-hidden="true">
        <path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z" />
      </svg>
      <p
        className={`flex-1 min-w-0 text-[12px] leading-snug text-[#555] font-medium py-[1px] transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="font-extrabold text-[#1A1A1A]">Tip: </span>
        {items[index]}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tips"
        className="shrink-0 w-7 h-7 -my-0.5 rounded-lg flex items-center justify-center text-[#999] hover:text-[#1A1A1A] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>
  );
};
