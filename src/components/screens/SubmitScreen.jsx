import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';

export const SubmitScreen = ({ onSubmitted }) => {
  const { submitStatements } = useGame();
  const [statements, setStatements] = useState(['', '', '']);
  const [lieIndex, setLieIndex] = useState(-1);
  const [error, setError] = useState('');

  const handleStmtChange = (index, value) => {
    const newStmts = [...statements];
    newStmts[index] = value;
    setStatements(newStmts);
  };

  const handleSubmit = async () => {
    if (statements.some(s => !s.trim())) {
      setError('Fill in all 3 statements first.');
      return;
    }
    if (lieIndex === -1) {
      setError('Mark which one is the lie 🤫');
      return;
    }
    setError('');
    await submitStatements(statements, lieIndex);
    onSubmitted();
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

      <div className="flex-1 overflow-y-auto px-[22px] pt-6 md:pt-0 pb-2 md:w-full md:max-w-5xl md:flex-none">
        <p className="text-[14px] md:text-[16px] text-white/70 font-medium leading-[1.6] mb-3 max-w-2xl">
          Write 2 things that are true about you and 1 that is a lie. Mark the lie — nobody else will see which one it is until the reveal.
        </p>
        <div className="text-xs md:text-[14px] text-amber font-medium italic mb-6 opacity-80">
          🤔 Make your lie believable — but not obvious.
        </div>

        <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              className={`rounded-xl p-4.5 relative transition-all duration-300 border backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] 
                ${lieIndex === i 
                  ? 'bg-white/[0.05] border-coral/50 shadow-[0_0_30px_rgba(255,92,56,0.15)] scale-[1.02]' 
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'}`}
            >
              <div className={`text-[10px] font-extrabold tracking-[2px] uppercase mb-3 transition-colors ${lieIndex === i ? 'text-coral' : 'text-white/30'}`}>
                Statement {i + 1}
              </div>
              <textarea
                className="w-full bg-transparent border-none border-b border-white/10 text-white text-[15px] font-medium py-2 focus:outline-none focus:border-amber/50 resize-none leading-[1.5] placeholder:text-white/20 transition-colors"
                rows={2}
                placeholder={i === 2 ? "This one could be the lie..." : "Tell them something true..."}
                maxLength={120}
                value={statements[i]}
                onChange={(e) => handleStmtChange(i, e.target.value)}
              />
              <div className="text-[11px] text-white/30 text-right mt-1.5 font-medium">
                {statements[i].length} / 120
              </div>
              
              <div 
                className={`flex items-center gap-2.5 mt-4 cursor-pointer group w-fit`}
                onClick={() => setLieIndex(i)}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${lieIndex === i ? 'bg-coral border-coral shadow-[0_0_10px_rgba(255,92,56,0.5)]' : 'bg-black/20 border-white/20 group-hover:border-white/40'}`}>
                  {lieIndex === i && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
                <div className={`text-[13px] font-bold tracking-wide transition-colors ${lieIndex === i ? 'text-coral' : 'text-white/40 group-hover:text-white/60'}`}>
                  This is the lie 🤫
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 bg-black/20 backdrop-blur-xl border-t border-white/10 shrink-0 flex flex-col gap-2 rounded-t-2xl md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:w-full md:max-w-md md:mt-8 md:mb-6">
        <div className="text-xs text-red text-center min-h-[16px] font-medium">{error}</div>
        <Button variant="coral" onClick={handleSubmit}>
          Lock in my statements
        </Button>
      </div>
    </div>
  );
};
