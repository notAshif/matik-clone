import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { OnlineStoryBar } from "../components/OnlineStoryBar";
import { RadarMatchmaker } from "../components/RadarMatchmaker";
import { InvitationToast } from "../components/InvitationToast";
import {
  BrainIcon,
  TrophyIcon,
  UsersIcon,
  TimerIcon,
  SwordsIcon,
  LogoutIcon,
} from "../components/icons";

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { queueStatus, activeGame, joinQueue, leaveQueue } = useWebSocket();
  const [showRadar, setShowRadar] = useState(false);
  const navigate = useNavigate();

  // If a match starts, immediately transition to the game screen!
  useEffect(() => {
    if (activeGame) {
      setShowRadar(false);
      navigate("/game");
    }
  }, [activeGame, navigate]);

  // Sync radar modal with queue state
  useEffect(() => {
    if (queueStatus === "WAITING") {
      setShowRadar(true);
    }
  }, [queueStatus]);

  const handleStartGameClick = () => {
    setShowRadar(true);
    joinQueue();
  };

  const handleCancelRadar = () => {
    setShowRadar(false);
    leaveQueue();
  };

  // Compute profile stats
  const latestRating =
    user?.ratings && user.ratings.length > 0
      ? user.ratings[user.ratings.length - 1]?.ratingAfter
      : 1200;

  const totalMatches = user?.gameMembers?.length ?? 0;
  const wins = user?.gameMembers?.filter((gm) => gm.isWinner).length ?? 0;
  const lastGame = user?.gameMembers && user.gameMembers.length > 0
    ? user.gameMembers[user.gameMembers.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Challenge Toast Notification */}
      <InvitationToast />

      {/* Radar Matchmaking Overlay */}
      {showRadar && <RadarMatchmaker onCancel={handleCancelRadar} />}

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <BrainIcon className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              MATIK
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs">
              <span className="text-slate-400">Rating:</span>
              <span className="font-bold text-emerald-400">{Math.round(latestRating)}</span>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogoutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-8">
        {/* 2) Top Category/Story Component for Online Users */}
        <section>
          <OnlineStoryBar />
        </section>

        {/* Grid: Left Profile Card + Right Game Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 1) User Profile Sidebar Card */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

              {/* Avatar & Username */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-2xl font-black text-slate-950 uppercase shadow-lg shadow-emerald-500/20">
                  {user?.username ? user.username.slice(0, 2) : "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">
                    {user?.username ?? "Player"}
                  </h2>
                  <p className="text-xs text-slate-400 truncate max-w-[180px]">{user?.email}</p>
                </div>
              </div>

              {/* Key Metrics: Rating, Friends, Win Rate */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/50 flex flex-col items-center text-center">
                  <TrophyIcon className="w-5 h-5 text-amber-400 mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-400">Rating</span>
                  <span className="text-base font-extrabold text-white mt-0.5">
                    {Math.round(latestRating)}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/50 flex flex-col items-center text-center">
                  <UsersIcon className="w-5 h-5 text-indigo-400 mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-400">Friends</span>
                  <span className="text-base font-extrabold text-white mt-0.5">0</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/50 flex flex-col items-center text-center">
                  <SwordsIcon className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-400">Wins</span>
                  <span className="text-base font-extrabold text-white mt-0.5">{wins}/{totalMatches}</span>
                </div>
              </div>

              {/* Last Game Played Details */}
              <div className="mt-6 bg-slate-950/40 rounded-2xl p-4 border border-slate-800/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Last Game Played
                </h4>
                {lastGame ? (
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          lastGame.isWinner
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {lastGame.isWinner ? "VICTORY" : "DEFEAT"}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">Score: {lastGame.score} pts</p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(lastGame.game?.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No games played yet. Jump into a match!</p>
                )}
              </div>
            </div>
          </aside>

          {/* 3) Game Card & Arena Lobby */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>RANKED MULTIPLAYER ARENA</span>
                </span>

                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-4">
                  60-Second Arithmetic Battle
                </h1>
                <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl">
                  Test your mental speed against real opponents in real time. Race through arithmetic questions, earn points, and climb the global leaderboard.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
                  <div className="flex items-center space-x-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                    <TimerIcon className="w-6 h-6 text-indigo-400" />
                    <div>
                      <div className="text-xs text-slate-400">Time Limit</div>
                      <div className="text-sm font-bold text-white">60 Seconds</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                    <BrainIcon className="w-6 h-6 text-emerald-400" />
                    <div>
                      <div className="text-xs text-slate-400">Operations</div>
                      <div className="text-sm font-bold text-white">+ , - , * , /</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
                    <SwordsIcon className="w-6 h-6 text-purple-400" />
                    <div>
                      <div className="text-xs text-slate-400">Format</div>
                      <div className="text-sm font-bold text-white">1v1 Speed Sprint</div>
                    </div>
                  </div>
                </div>

                {/* Main Action Trigger */}
                <button
                  onClick={handleStartGameClick}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/25 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-3"
                >
                  <SwordsIcon className="w-6 h-6" />
                  <span>START GAME (RADAR SEARCH)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
