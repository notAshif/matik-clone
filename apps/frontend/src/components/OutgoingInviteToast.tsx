import React from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { SwordsIcon } from "./icons";
import { GamePanel } from "../design-system/GamePanel";
import { GameButton } from "../design-system/GameButton";

export const OutgoingInviteToast: React.FC = () => {
  const { outgoingInvite, cancelInvitation, inviteFeedback } = useWebSocket();

  if (!outgoingInvite && !inviteFeedback) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-game-pop select-none">
      {outgoingInvite && (
        <GamePanel
          variant="gold"
          ribbonTitle="CHALLENGE SENT"
          ribbonColor="blue"
          className="p-4! pt-7! shadow-2xl border-2 border-amber-400/80"
        >
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-xl bg-linear-to-b from-indigo-500 to-indigo-800 border-2 border-indigo-300 shadow-[0_2px_0_#1e1b4b] flex items-center justify-center shrink-0">
              <SwordsIcon className="w-5 h-5 text-amber-300 animate-spin" />
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-black text-white truncate">
                Duel sent to <span className="text-amber-300">{outgoingInvite.to.username}</span>!
              </p>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5 animate-pulse">
                Awaiting response...
              </p>
            </div>
            <GameButton
              variant="red"
              btnSize="sm"
              onClick={cancelInvitation}
              className="px-3! py-1! text-xs shrink-0"
            >
              Cancel
            </GameButton>
          </div>
        </GamePanel>
      )}

      {inviteFeedback && !outgoingInvite && (
        <div className="game-panel p-3! bg-[#0d1322] border-2 border-amber-500/60 shadow-xl flex items-center space-x-2 text-xs font-bold text-amber-300 animate-game-pop">
          <span>⚔️</span>
          <span>{inviteFeedback}</span>
        </div>
      )}
    </div>
  );
};
