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
    <div className="flex flex-col h-full max-w-[430px] md:max-w-[500px] w-full mx-auto relative z-10 p-4 sm:p-6 justify-between animate-fadeUp">
      <div className="shrink-0 pt-2 pb-2">
        <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#F5821F]">
          2 Truths & a Lie
        </div>
        <h2 className="text-[26px] font-black text-[#1A1A1A] mt-0.5 tracking-tight">
          Write your statements
        </h2>
        <p className="text-[13px] text-[#555] leading-[1.55] mt-1">
          Write 2 things that are true about you and 1 that's a lie. Mark the lie — nobody sees which one until the reveal.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto my-2 space-y-3 pr-1">
        {[0, 1, 2].map(i => {
          const isLie = lieIndex === i;
          return (
            <div 
              key={i}
              className={`rounded-[16px] p-4 transition-all duration-200 border-[1.5px] ${
                isLie 
                  ? 'bg-white border-[#F5821F] shadow-[0_3px_0_#E8710A]' 
                  : 'bg-[#FAF7F2] border-[#E0DBD4] shadow-[0_3px_0_#E0DBD4]'
              }`}
            >
              <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#999] mb-1.5">
                Statement {i + 1}
              </div>
              <textarea
                className="w-full bg-transparent border-b-[1.5px] border-[#E0DBD4] text-[#1A1A1A] text-[15px] font-medium py-1.5 focus:outline-none focus:border-[#F5821F] resize-none leading-[1.4] placeholder:text-[#bbb]"
                rows={2}
                placeholder={i === 2 ? "This one could be the lie..." : "Tell them something true..."}
                maxLength={120}
                value={statements[i]}
                onChange={(e) => handleStmtChange(i, e.target.value)}
              />
              <div className="text-[10px] text-[#999] text-right mt-1 font-medium">
                {statements[i].length} / 120
              </div>

              <div 
                className="flex items-center gap-2 mt-2.5 cursor-pointer w-fit select-none"
                onClick={() => setLieIndex(i)}
              >
                <div className={`w-5 h-5 rounded-[5px] border-2 flex items-center justify-center transition-all ${
                  isLie 
                    ? 'bg-[#F5821F] border-[#F5821F] text-white font-black text-xs' 
                    : 'bg-white border-[#E0DBD4]'
                }`}>
                  {isLie && '✓'}
                </div>
                <div className={`text-[12px] font-bold ${isLie ? 'text-[#E8710A]' : 'text-[#555]'}`}>
                  This is the lie 🤫
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 shrink-0 flex flex-col gap-2">
        {error && (
          <div className="text-xs text-[#E8334A] font-bold text-center bg-[#FFF0EE] border border-[#E8334A]/20 py-2 rounded-lg">
            {error}
          </div>
        )}
        <Button onClick={handleSubmit} className="w-full">
          Lock in my statements
        </Button>
      </div>
    </div>
  );
};
