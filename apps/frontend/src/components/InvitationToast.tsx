import React, { useEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { SwordsIcon } from "./icons";
import { GamePanel } from "../design-system/GamePanel";
import { GameButton } from "../design-system/GameButton";
import { SoundFX } from "../design-system/sound";

export const InvitationToast: React.FC = () => {
  const { incomingInvite, acceptGame, declineGame } = useWebSocket();

  useEffect(() => {
    if (incomingInvite) {
      SoundFX.hover();
    }
  }, [incomingInvite]);

  if (!incomingInvite) return null;

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm w-full animate-game-pop select-none">
      <GamePanel
        variant="gold"
        ribbonTitle="DUEL CHALLENGE!"
        ribbonColor="gold"
        className="p-5! pt-7! shadow-2xl"
      >
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-linear-to-b from-amber-400 to-amber-600 border-2 border-amber-300 shadow-[0_3px_0_#451a03] flex items-center justify-center shrink-0">
            <SwordsIcon className="w-6 h-6 text-[#451a03] animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-white drop-shadow uppercase tracking-wide">
              Arithmetic Challenge!
            </h4>
            <p className="text-xs font-bold text-slate-300 mt-1 leading-snug">
              <span className="text-amber-400 font-extrabold">{incomingInvite.from.username}</span>{" "}
              demands a 60-second math duel with you!
            </p>

            <div className="flex items-center space-x-2.5 mt-3.5">
              <GameButton
                variant="green"
                btnSize="sm"
                onClick={() => acceptGame(incomingInvite.invitationId)}
                className="flex-1"
              >
                Accept
              </GameButton>
              <GameButton
                variant="slate"
                btnSize="sm"
                onClick={() => declineGame(incomingInvite.invitationId)}
                className="flex-1"
              >
                Decline
              </GameButton>
            </div>
          </div>
        </div>
      </GamePanel>
    </div>
  );
};
