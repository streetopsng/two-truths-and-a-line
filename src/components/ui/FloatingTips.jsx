import React, { useState, useEffect } from 'react';

const TIPS = [
  'The best lies sound almost too normal to question.',
  'Vague statements are easier to fake — go specific.',
  'Watch for hesitation when someone reads their own lie aloud.',
  'You score 100 points for every correct guess, so vote on all three rounds.',
  'You can edit your statements anytime before the host starts the game.',
];

export const FloatingTips = ({ items = TIPS, intervalMs = 4500 }) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (items.length < 2) return;
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setVisible(true);
      }, 300);
    }, intervalMs);
    return () => clearInterval(cycle);
  }, [items.length, intervalMs]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-4 w-full flex justify-center">
      <div
        className={`flex items-center gap-2.5 max-w-[420px] bg-[#1C1B19] text-white rounded-full px-4 py-2.5 shadow-lg transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5'
        }`}
      >
        <span className="w-5 h-5 rounded-full bg-[#D9760F]/20 text-[#F5A623] flex items-center justify-center text-[11px] font-bold shrink-0">
          i
        </span>
        <span className="text-[12.5px] font-medium leading-snug truncate">{items[index]}</span>
      </div>
    </div>
  );
};
