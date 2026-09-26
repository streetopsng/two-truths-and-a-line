import React from 'react';
import { Button } from './Button';

export const GameRulesModal = ({ onConfirm, name }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border-2 border-[#E0DBD4] rounded-[24px] p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fadeUp flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDE8D0] border border-[#F5821F]/30 text-[#F5821F] text-[11px] font-extrabold uppercase tracking-wider mb-2">
            Game Overview
          </div>
          <h3 className="text-2xl sm:text-[26px] font-black text-[#1A1A1A] tracking-tight">
            How Two Truths Works
          </h3>
          <p className="text-xs sm:text-[13px] text-[#666] mt-1.5 leading-relaxed">
            Welcome{name ? `, ${name}` : ''}! Before you enter the room, here's what to expect in this experience.
          </p>
        </div>

        {/* 3 Steps */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E0DBD4]">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8D0] text-[#F5821F] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              1
            </div>
            <div className="text-left">
              <div className="text-[13px] font-black text-[#1A1A1A]">Write 3 statements</div>
              <div className="text-[11.5px] text-[#666] mt-0.5 leading-snug">
                Submit <strong>2 true facts</strong> and <strong>1 convincing lie</strong> about yourself.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E0DBD4]">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8D0] text-[#F5821F] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              2
            </div>
            <div className="text-left">
              <div className="text-[13px] font-black text-[#1A1A1A]">Spot your teammates' lies</div>
              <div className="text-[11.5px] text-[#666] mt-0.5 leading-snug">
                Each round, everyone reads a teammate's statements and votes on which one is fake.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E0DBD4]">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8D0] text-[#F5821F] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              3
            </div>
            <div className="text-left">
              <div className="text-[13px] font-black text-[#1A1A1A]">Score points & rise up</div>
              <div className="text-[11.5px] text-[#666] mt-0.5 leading-snug">
                Earn <strong>100 points</strong> for every lie you catch, plus bonus points when your own lie fools teammates!
              </div>
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="p-3 bg-[#FFF9F2] border border-[#F5821F]/20 rounded-xl text-left flex items-center gap-2.5 mb-6">
          <span className="text-base shrink-0">💡</span>
          <span className="text-[11.5px] text-[#885215] font-medium leading-snug">
            <strong>Pro tip:</strong> The best lies are simple and realistic, while the best truths sound unbelievable!
          </span>
        </div>

        {/* Action Button */}
        <Button
          variant="orange"
          onClick={onConfirm}
          className="w-full py-3.5 text-sm font-extrabold rounded-xl shadow-[0_3px_0_#C06412] active:translate-y-0.5 cursor-pointer"
        >
          Got it, enter lobby →
        </Button>
      </div>
    </div>
  );
};
