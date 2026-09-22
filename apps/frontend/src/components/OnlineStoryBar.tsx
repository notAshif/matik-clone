import React from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";
import { SwordsIcon } from "./icons";
import { SoundFX } from "../design-system/sound";

export const OnlineStoryBar: React.FC = () => {
  const { onlineUsers, invitePlayer } = useWebSocket();
  const { user: currentUser } = useAuth();

  const otherUsers = onlineUsers.filter((u) => u.id !== currentUser?.id);

  const handleChallenge = (userId: number) => {
    SoundFX.click();
    invitePlayer(userId);
  };

  return (
    <div className="game-panel !p-4 w-full select-none">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-emerald-300" />
          </span>
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 drop-shadow">
            Active Challengers Online ({onlineUsers.length})
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          Tap Token to Challenge
        </span>
      </div>

      <div className="game-inset p-3 flex items-center space-x-4 overflow-x-auto scrollbar-thin">
        {/* Current User Token */}
        {currentUser && (
          <div className="flex flex-col items-center flex-shrink-0 group">
            <div className="relative p-1 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-300 shadow-[0_3px_0_#451a03]">
              <div className="w-13 h-13 rounded-full bg-[#0d1322] flex items-center justify-center text-base font-black text-amber-300 uppercase border-2 border-[#1c2438]">
                {currentUser.username.slice(0, 2)}
              </div>
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0d1322] rounded-full" />
            </div>
            <span className="text-xs mt-1.5 font-black text-amber-300 max-w-[70px] truncate">
              You
            </span>
          </div>
        )}

        {/* Other Challengers Tokens */}
        {otherUsers.map((player) => (
          <button
            key={player.id}
            onClick={() => handleChallenge(player.id)}
            onMouseEnter={() => SoundFX.hover()}
            className="flex flex-col items-center flex-shrink-0 group focus:outline-none transition-transform active:scale-95 cursor-pointer"
            title={`Send duel challenge to ${player.username}`}
          >
            <div className="relative p-1 rounded-full bg-gradient-to-b from-indigo-500 to-indigo-800 border-2 border-indigo-400 shadow-[0_3px_0_#1e1b4b] group-hover:border-amber-400 transition-colors">
              <div className="w-13 h-13 rounded-full bg-[#0d1322] flex items-center justify-center text-base font-black text-indigo-300 uppercase border-2 border-[#1c2438] group-hover:bg-indigo-950/80 transition-colors">
                {player.username.slice(0, 2)}
              </div>
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0d1322] rounded-full" />
              {/* Crossed Swords hover overlay */}
              <div className="absolute inset-0 rounded-full bg-amber-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shadow-[0_0_12px_rgba(245,158,11,0.6)]">
                <SwordsIcon className="w-6 h-6 text-[#451a03] drop-shadow" />
              </div>
            </div>
            <span className="text-xs mt-1.5 font-black text-slate-300 group-hover:text-amber-300 max-w-[70px] truncate">
              {player.username}
            </span>
          </button>
        ))}

        {otherUsers.length === 0 && (
          <div className="text-xs font-bold text-slate-400 italic py-2 pl-2">
            No other challengers online right now. Find opponent via radar or invite a rival!
          </div>
        )}
      </div>
    </div>
  );
};
