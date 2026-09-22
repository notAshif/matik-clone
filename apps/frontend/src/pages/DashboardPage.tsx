import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { HeaderHUD } from "../components/HeaderHUD";
import { OnlineStoryBar } from "../components/OnlineStoryBar";
import { RadarMatchmaker } from "../components/RadarMatchmaker";
import { InvitationToast } from "../components/InvitationToast";
import { TrophyIcon, TimerIcon, SwordsIcon, ShieldIcon, CrownIcon } from "../components/icons";
import { GamePanel } from "../design-system/GamePanel";
import { GameButton } from "../design-system/GameButton";
import { getRankTier } from "../design-system/GameBadge";

export const DashboardPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { queueStatus, activeGame, joinQueue, leaveQueue } = useWebSocket();
  const [showRadar, setShowRadar] = useState(false);
  const navigate = useNavigate();

  // Transition to arena when match forms
  useEffect(() => {
    if (activeGame) {
      setShowRadar(false);
      navigate("/game");
    }
  }, [activeGame, navigate]);

  // Keep radar modal in sync with voluntary queue status
  useEffect(() => {
    if (queueStatus === "WAITING") {
      setShowRadar(true);
    } else if (queueStatus === "IDLE") {
      setShowRadar(false);
    }
  }, [queueStatus]);

  // Refresh profile on landing
  useEffect(() => {
    refreshProfile().catch(() => {});
  }, []);

  const handleStartGameClick = () => {
    setShowRadar(true);
    joinQueue();
  };

  const handleCancelRadar = () => {
    setShowRadar(false);
    leaveQueue();
  };

  // Derive player stats
  const currentRating =
    user?.ratings && user.ratings.length > 0
      ? user.ratings[user.ratings.length - 1]?.ratingAfter
      : 1200;

  const totalMatches = user?.gameMembers?.length ?? 0;
  const wins = user?.gameMembers?.filter((gm) => gm.isWinner).length ?? 0;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const rankInfo = getRankTier(currentRating);

  const matchHistory = user?.gameMembers ? [...user.gameMembers].reverse() : [];

  return (
    <div className="min-h-screen game-bg text-slate-100 flex flex-col select-none">
      {/* 2D Game Header HUD */}
      <HeaderHUD />

      {/* Main Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Active Online Players Bar */}
        <section aria-label="Online Players">
          <OnlineStoryBar />
        </section>

        {/* 2D Game Hub Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Hero Play Hub (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Arena Hero Launchpad */}
            <GamePanel
              variant="gold"
              ribbonTitle="RANKED BATTLEGROUND"
              ribbonColor="gold"
              className="!p-7 !pt-10"
            >
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#080c16] border-2 border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Synchronized 1v1 Arena</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-400 bg-[#080c16] px-3 py-1 rounded-full border border-amber-500/30">
                    60s Round Timer
                  </div>
                </div>

                <div>
                  <h1
                    className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_0_#000] tracking-wider leading-tight"
                    style={{ fontFamily: "var(--font-game)" }}
                  >
                    Speed Math Duel
                  </h1>
                  <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed font-semibold max-w-xl">
                    Out-calculate your opponent under extreme 60-second pressure.
                    Solve arithmetic expressions rapidly to score points and elevate your competitive Elo rank.
                  </p>
                </div>

                {/* Performance Stat Tablets */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="game-inset p-3 text-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Rating
                    </p>
                    <div className="flex items-center justify-center space-x-1 mt-1">
                      <span className="text-base leading-none">{rankInfo.gem}</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tabular-nums">
                        {Math.round(currentRating).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="game-inset p-3 text-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Win Rate
                    </p>
                    <div className="flex items-center justify-center space-x-1 mt-1">
                      <CrownIcon className="w-4 h-4 text-emerald-400" />
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tabular-nums">
                        {winRate}%
                      </span>
                    </div>
                  </div>

                  <div className="game-inset p-3 text-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Battles
                    </p>
                    <div className="flex items-center justify-center space-x-1 mt-1">
                      <SwordsIcon className="w-4 h-4 text-indigo-400" />
                      <span className="text-xl sm:text-2xl font-black text-indigo-400 font-mono tabular-nums">
                        {totalMatches}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Massive 3D Duel Button */}
                <div className="pt-2">
                  <GameButton
                    id="find-match-btn"
                    variant="green"
                    btnSize="lg"
                    onClick={handleStartGameClick}
                    className="w-full sm:w-auto !py-4 !px-8 text-lg"
                  >
                    <SwordsIcon className="w-6 h-6 mr-3 drop-shadow" />
                    <span>FIND OPPONENT</span>
                  </GameButton>
                </div>
              </div>
            </GamePanel>

            {/* Quick Rules Tablets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GamePanel className="!p-4 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-black text-sm uppercase tracking-wider">
                  <TimerIcon className="w-5 h-5 text-indigo-400" />
                  <span>60s Blitz Duel</span>
                </div>
                <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                  Both combatants receive the exact same arithmetic questions in real time. Clock counts down together.
                </p>
              </GamePanel>

              <GamePanel className="!p-4 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-black text-sm uppercase tracking-wider">
                  <ShieldIcon className="w-5 h-5 text-amber-400" />
                  <span>Ranked Elo Stakes</span>
                </div>
                <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                  Every victory claims Elo points from your rival. Ties yield minimal change. K=32 calibration.
                </p>
              </GamePanel>
            </div>
          </div>

          {/* Sidebar Column: Recent Battles Feed (1 Column) */}
          <div>
            <GamePanel
              ribbonTitle="BATTLE CHRONICLES"
              ribbonColor="blue"
              className="flex flex-col h-full min-h-[460px] !pt-8"
            >
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#20293d]">
                <div className="flex items-center space-x-2">
                  <TrophyIcon className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Past Duels
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {matchHistory.length} Logged
                </span>
              </div>

              {/* Match History List */}
              <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[520px] pr-1">
                {matchHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#080c16] border-2 border-[#20293d] flex items-center justify-center">
                      <SwordsIcon className="w-7 h-7 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-300">No Battles Recorded</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        Enter the arena to etch your first victory in the chronicles!
                      </p>
                    </div>
                  </div>
                ) : (
                  matchHistory.map((record, index) => {
                    const isWin = record.isWinner;
                    return (
                      <div
                        key={record.id ?? index}
                        className="game-inset !p-3 flex items-center justify-between border-2 hover:border-[#384869] transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {/* 2D Medal */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border-2 shadow-[0_2px_0_#000] ${
                              isWin
                                ? "bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300 text-[#451a03]"
                                : "bg-gradient-to-b from-rose-600 to-rose-800 border-rose-400 text-white"
                            }`}
                          >
                            {isWin ? "W" : "L"}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-black text-white">
                                Match #{record.game?.id ?? record.id}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded ${
                                  isWin
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/20 text-rose-400"
                                }`}
                              >
                                {isWin ? "Victory" : "Defeat"}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                              Score: <span className="text-amber-300">{record.score} pts</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xs font-black font-mono px-2 py-0.5 rounded border ${
                              isWin
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            }`}
                          >
                            {isWin ? "+Elo" : "-Elo"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </GamePanel>
          </div>
        </div>
      </main>

      {/* Voluntary Radar Matchmaking Modal */}
      {showRadar && <RadarMatchmaker onCancel={handleCancelRadar} />}

      {/* Incoming Duel Invites */}
      <InvitationToast />
    </div>
  );
};
