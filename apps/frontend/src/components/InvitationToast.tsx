import React from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { SwordsIcon } from "./icons";

export const InvitationToast: React.FC = () => {
  const { incomingInvite, acceptGame, declineGame } = useWebSocket();

  if (!incomingInvite) return null;

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-2xl p-5 animate-in slide-in-from-top duration-300">
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
          <SwordsIcon className="w-6 h-6 animate-bounce" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold text-white">Match Challenge!</h4>
          <p className="text-sm text-slate-300 mt-1">
            <span className="font-semibold text-indigo-400">
              {incomingInvite.from.username}
            </span>{" "}
            has challenged you to an arithmetic battle.
          </p>

          <div className="flex items-center space-x-3 mt-4">
            <button
              onClick={() => acceptGame(incomingInvite.invitationId)}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-md shadow-emerald-900/30"
            >
              Accept Battle
            </button>
            <button
              onClick={() => declineGame(incomingInvite.invitationId)}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
