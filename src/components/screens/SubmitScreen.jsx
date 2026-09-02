import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';

const MAX_SETS = 3;
const emptySet = () => ({ statements: ['', '', ''], lieIndex: -1 });

export const SubmitScreen = () => {
  const { submitStatements } = useGame();
  const navigate = useNavigate();
  const [sets, setSets] = useState([emptySet()]);
  const [error, setError] = useState('');

  const updateStatement = (setIdx, stmtIdx, value) => {
    setSets(prev => prev.map((s, i) => (
      i === setIdx
        ? { ...s, statements: s.statements.map((st, j) => (j === stmtIdx ? value : st)) }
        : s
    )));
  };

  const addSet = () => setSets(prev => (prev.length < MAX_SETS ? [...prev, emptySet()] : prev));
  const removeSet = (setIdx) => setSets(prev => prev.filter((_, i) => i !== setIdx));

  const handleSubmit = async () => {
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i];
      if (s.statements.some(st => !st.trim())) {
        setError(`Set ${i + 1}: fill in all 3 statements first.`);
        return;
      }
      if (s.lieIndex === -1) {
        setError(`Set ${i + 1}: mark which one is the lie 🤫`);
        return;
      }
    }
    setError('');
    await submitStatements(sets);
    navigate('/submit/wait');
  };

  return (
    <div className="flex flex-col h-full max-w-[430px] md:max-w-none w-full mx-auto relative z-10 md:justify-center md:items-center">
      <div className="pt-8 md:pt-0 px-[22px] flex items-center gap-3 shrink-0 md:w-full md:max-w-5xl md:mb-6">
        <div>
          <div className="text-[10px] tracking-[3px] uppercase text-white/50 font-bold">
            Your turn to confess
          </div>
          <div className="text-2xl md:text-4xl font-black mt-1 tracking-tight">
            Write your statements
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-[22px] pt-6 md:pt-0 pb-2 md:w-full md:max-w-5xl">
        <p className="text-[14px] md:text-[16px] text-white/70 font-medium leading-[1.6] mb-3 max-w-2xl">
          Write 2 things that are true about you and 1 that is a lie, then mark the lie. Nobody sees which one it is until the reveal.
        </p>
        <div className="text-xs md:text-[14px] text-amber font-medium italic mb-6 opacity-80">
          🤫 Optional: add up to 3 sets — you'll be in the hot seat once for each one.
        </div>

        <div className="flex flex-col gap-4">
          {sets.map((set, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 md:p-5 border border-white/10 bg-white/[0.02] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] relative"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`text-[10px] font-extrabold tracking-[2px] uppercase ${i === 0 ? 'text-amber/80' : 'text-white/40'}`}>
                  Set {i + 1}{i === 0 ? ' · required' : ' · optional'}
                </div>
                {i > 0 && (
                  <button
                    onClick={() => removeSet(i)}
                    className="text-[11px] font-bold text-white/30 hover:text-red transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-red/10"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              {set.statements.map((stmt, j) => (
                <div key={j} className="mb-3">
                  <textarea
                    className="w-full bg-black/30 border border-white/10 rounded-xl text-white text-[15px] font-medium py-2.5 px-3 focus:outline-none focus:border-amber/50 resize-none leading-[1.5] placeholder:text-white/20 transition-colors"
                    rows={2}
                    placeholder={j === 2 ? 'This one could be the lie...' : 'Tell them something true...'}
                    maxLength={120}
                    value={stmt}
                    onChange={(e) => updateStatement(i, j, e.target.value)}
                  />
                  <div className="text-[10px] text-white/30 text-right mt-1 font-medium">
                    {stmt.length} / 120
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-[11px] font-extrabold tracking-[1px] uppercase text-white/40 mr-1">
                  The lie is:
                </span>
                {set.statements.map((_, j) => (
                  <button
                    key={j}
                    onClick={() => setSets(prev => prev.map((s, si) => (si === i ? { ...s, lieIndex: j } : s)))}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all cursor-pointer ${
                      set.lieIndex === j
                        ? 'bg-coral border-coral text-white shadow-[0_0_12px_rgba(255,92,56,0.5)]'
                        : 'bg-black/20 border-white/15 text-white/40 hover:border-white/40 hover:text-white/70'
                    }`}
                  >
                    Statement {j + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {sets.length < MAX_SETS && (
            <button
              onClick={addSet}
              className="w-full py-3.5 rounded-2xl border border-dashed border-white/20 text-white/50 hover:text-white hover:border-amber/50 hover:bg-white/[0.03] text-[13px] font-bold tracking-wide transition-all cursor-pointer backdrop-blur-md"
            >
              ＋ Add another 2 truths &amp; a lie ({sets.length}/{MAX_SETS})
            </button>
          )}
        </div>
      </div>

      <div className="p-6 md:p-8 bg-black/20 backdrop-blur-xl border-t border-white/10 shrink-0 flex flex-col gap-2 rounded-t-2xl md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:w-full md:max-w-md md:mt-8 md:mb-6">
        <div className="text-xs text-red text-center min-h-[16px] font-medium">{error}</div>
        <Button variant="coral" onClick={handleSubmit}>
          Lock in {sets.length > 1 ? `all ${sets.length} sets` : 'my statements'}
        </Button>
      </div>
    </div>
  );
};
