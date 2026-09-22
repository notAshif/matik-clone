import React from "react";
import { Link } from "react-router-dom";
import { useWebSocket } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";
import { SwordsIcon } from "./icons";
import { PlayerAvatar } from "./PlayerAvatar";
import { SoundFX } from "../game-ui/sound";

export const OnlineStoryBar: React.FC = () => {
  const { onlineUsers, invitePlayer, isConnected } = useWebSocket();
  const { user: currentUser } = useAuth();

  const otherUsers = onlineUsers.filter((u) => u.id !== currentUser?.id);

  const handleChallenge = (userId: number) => {
    SoundFX.click();
    invitePlayer(userId);
  };

  return (
    <div className="game-panel p-2.5! sm:p-3! w-full select-none">
      <div className="game-inset p-2.5 sm:p-3 flex items-center space-x-3.5 sm:space-x-4 overflow-x-auto scrollbar-thin">
        {/* Current User Token (links to profile) */}
        {currentUser ? (
          <Link
            to="/profile"
            className="flex flex-col items-center shrink-0 group cursor-pointer focus:outline-none transition-transform active:scale-95"
            title="View Your Profile"
          >
            <PlayerAvatar
              email={currentUser.email}
              username={currentUser.username}
              size="lg"
              variant="gold"
              showOnlineDot
              className="group-hover:scale-105 transition-transform"
            />
            <span className="text-xs mt-1.5 font-black text-amber-300 max-w-16 sm:max-w-18 truncate group-hover:underline">
              You
            </span>
          </Link>
        ) : (
          <div className="flex flex-col items-center shrink-0 space-y-1.5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#0d1322] border-2 border-amber-500/40 animate-shimmer" />
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
            <div className="relative group-hover:scale-105 transition-transform">
              <PlayerAvatar
                email={player.email}
                username={player.username}
                size="lg"
                variant="indigo"
                showOnlineDot
              />
              {/* Crossed Swords hover overlay */}
              <div className="absolute inset-0 rounded-full bg-amber-500/85 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shadow-[0_0_12px_rgba(245,158,11,0.6)] z-20">
                <SwordsIcon className="w-6 h-6 text-[#451a03] drop-shadow" />
              </div>
            </div>
            <span className="text-xs mt-1.5 font-black text-slate-300 group-hover:text-amber-300 max-w-16 sm:max-w-18 truncate">
              {player.username}
            </span>
          </button>
        ))}

        {!isConnected ? (
          <div className="flex items-center space-x-3 py-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center shrink-0 space-y-1.5 opacity-60">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#0d1322] border-2 border-[#1c2438] animate-shimmer" />
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
