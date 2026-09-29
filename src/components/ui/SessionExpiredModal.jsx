import React from 'react';
import { Button } from './Button';
import { returnToGummyGum, reportGummyGumCancel } from '../../lib/gummygumSession';

// context: 'lobby' (idle in the waiting room) or 'game' (abandoned mid-play)
export const SessionExpiredModal = ({ isHost, context = 'lobby' }) => {
  const handleHostRehost = async () => {
    try {
      await reportGummyGumCancel();
    } catch {
      // ignore
    }
    returnToGummyGum();
  };

  const handleClose = () => {
    try {
      window.close();
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border-2 border-[#E0DBD4] rounded-[24px] p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-fadeUp flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF0EE] border border-[#E8334A]/20 text-[#E8334A] flex items-center justify-center mb-3 shadow-xs">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
        </div>
        <h3 className="text-xl font-black text-[#1A1A1A] mb-1.5">
          Session Expired
        </h3>
        <p className="text-xs sm:text-[13px] text-[#666] leading-relaxed mb-6">
          {context === 'game'
            ? isHost
              ? "This session was abandoned mid-game with nobody connected for several hours, so it has been ended. You can return to GummyGum to launch a fresh session."
              : "This session was ended after being abandoned for several hours. Thank you for being here - you can safely close this tab now."
            : isHost
            ? "This session was inactive in the lobby for more than 20 minutes and has expired. You can return to GummyGum to launch a fresh session."
            : "This session has expired due to inactivity. Thank you for being here - you can safely close this tab now."}
        </p>

        {isHost ? (
          <Button
            variant="orange"
            onClick={handleHostRehost}
            className="w-full py-3 rounded-xl font-bold cursor-pointer"
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 5 8 12l7 7" /></svg>
              Return to GummyGum to Rehost
            </span>
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full py-3 rounded-xl font-bold cursor-pointer"
          >
            Close Tab
          </Button>
        )}
      </div>
    </div>
  );
};
