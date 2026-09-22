import React from "react";
import { Link } from "react-router-dom";
import { useWebSocket } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";
import { SwordsIcon } from "./icons";
import { SoundFX } from "../design-system/sound";

export const OnlineStoryBar: React.FC = () => {
  const { onlineUsers, invitePlayer, isConnected } = useWebSocket();
  const { user: currentUser } = useAuth();

  const otherUsers = onlineUsers.filter((u) => u.id !== currentUser?.id);

  const handleChallenge = (userId: number) => {
    SoundFX.click();
    invitePlayer(userId);
  };

  return (
    <div className="game-panel p-3! w-full select-none">
      <div className="game-inset p-3 flex items-center space-x-4 overflow-x-auto scrollbar-thin">
        {/* Current User Token (links to profile) */}
        {currentUser ? (
          <Link
            to="/profile"
            className="flex flex-col items-center shrink-0 group cursor-pointer focus:outline-none transition-transform active:scale-95"
            title="View Profile"
          >
            <div className="relative p-1 rounded-full bg-linear-to-b from-amber-400 to-amber-600 border-2 border-amber-300 shadow-[0_3px_0_#451a03] group-hover:scale-105 transition-transform">
              <div className="w-13 h-13 rounded-full bg-[#0d1322] flex items-center justify-center text-base font-black text-amber-300 uppercase border-2 border-[#1c2438]">
                {currentUser.username.slice(0, 2)}
              </div>
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0d1322] rounded-full" />
            </div>
            <span className="text-xs mt-1.5 font-black text-amber-300 max-w-17.5 truncate group-hover:underline">
              You
            </span>
          </Link>
        ) : (
          <div className="flex flex-col items-center shrink-0 space-y-1.5">
            <div className="w-13 h-13 rounded-full bg-[#0d1322] border-2 border-amber-500/40 animate-shimmer" />
            <div className="w-10 h-2.5 rounded bg-[#1c2438] animate-shimmer" />
          </div>
        )}

        {/* Other Active Human Players */}
        {otherUsers.map((player) => (
          <button
            key={player.id}
            onClick={() => handleChallenge(player.id)}
            onMouseEnter={() => SoundFX.hover()}
            className="flex flex-col items-center shrink-0 group focus:outline-none transition-transform active:scale-95 cursor-pointer"
            title={`Send duel challenge to ${player.username}`}
          >
            <div className="relative p-1 rounded-full bg-linear-to-b from-indigo-500 to-indigo-800 border-2 border-indigo-400 shadow-[0_3px_0_#1e1b4b] group-hover:border-amber-400 transition-colors">
              <div className="w-13 h-13 rounded-full bg-[#0d1322] flex items-center justify-center text-base font-black text-indigo-300 uppercase border-2 border-[#1c2438] group-hover:bg-[#11192e] transition-colors">
                {player.username.slice(0, 2)}
              </div>
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0d1322] rounded-full" />
              {/* Crossed Swords hover overlay */}
              <div className="absolute inset-0 rounded-full bg-amber-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shadow-[0_0_12px_rgba(245,158,11,0.6)]">
                <SwordsIcon className="w-6 h-6 text-[#451a03] drop-shadow" />
              </div>
            </div>
            <span className="text-xs mt-1.5 font-black text-slate-300 group-hover:text-amber-300 max-w-17.5 truncate">
              {player.username}
            </span>
          </button>
        ))}

        {!isConnected ? (
          <div className="flex items-center space-x-3 py-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center shrink-0 space-y-1.5 opacity-60">
                <div className="w-13 h-13 rounded-full bg-[#0d1322] border-2 border-[#1c2438] animate-shimmer" />
                <div className="w-10 h-2.5 rounded bg-[#1c2438] animate-shimmer" />
              </div>
            ))}
          </div>
        ) : otherUsers.length === 0 ? (
          <div className="text-xs font-bold text-slate-400 italic py-2 pl-2">
            No other players online. Click "FIND OPPONENT" to queue for battle!
          </div>
        ) : null}
      </div>
    </div>
  );
};
