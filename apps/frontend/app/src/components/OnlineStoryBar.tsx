import React from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";
import { SwordsIcon } from "./icons";

export const OnlineStoryBar: React.FC = () => {
  const { onlineUsers, invitePlayer } = useWebSocket();
  const { user: currentUser } = useAuth();

  // Filter out the current logged-in user from the challengeable list
  const otherUsers = onlineUsers.filter((u) => u.id !== currentUser?.id);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Active Players Online ({onlineUsers.length})
          </h3>
        </div>
        <span className="text-xs text-slate-500">Click avatar to challenge</span>
      </div>

      <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        {/* Current User item */}
        {currentUser && (
          <div className="flex flex-col items-center flex-shrink-0 group cursor-default">
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500">
              <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-lg font-bold text-emerald-400 uppercase border-2 border-slate-900">
                {currentUser.username.slice(0, 2)}
              </div>
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            <span className="text-xs mt-1.5 font-medium text-slate-300 max-w-[70px] truncate">
              You
            </span>
          </div>
        )}

        {/* Other online players */}
        {otherUsers.map((player) => (
          <button
            key={player.id}
            onClick={() => invitePlayer(player.id)}
            className="flex flex-col items-center flex-shrink-0 group focus:outline-none transition-transform active:scale-95"
            title={`Challenge ${player.username}`}
          >
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 group-hover:scale-105 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-lg font-bold text-indigo-300 uppercase border-2 border-slate-900 group-hover:bg-indigo-950/70 transition-colors">
                {player.username.slice(0, 2)}
              </div>
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              <div className="absolute inset-0 rounded-full bg-indigo-600/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <SwordsIcon className="w-6 h-6 text-white drop-shadow-md" />
              </div>
            </div>
            <span className="text-xs mt-1.5 font-medium text-slate-300 group-hover:text-white max-w-[70px] truncate">
              {player.username}
            </span>
          </button>
        ))}

        {otherUsers.length === 0 && (
          <div className="text-xs text-slate-500 italic py-3 pl-2">
            No other players online right now. Invite a friend or start matchmaking!
          </div>
        )}
      </div>
    </div>
  );
};
