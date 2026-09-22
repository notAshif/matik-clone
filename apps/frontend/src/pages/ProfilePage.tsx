import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HeaderHUD } from "../components/HeaderHUD";
import { TrophyIcon, SwordsIcon, CrownIcon, ShieldIcon } from "../components/icons";
import { GamePanel } from "../design-system/GamePanel";
import { GameButton } from "../design-system/GameButton";
import { EloPill, getRankTier } from "../design-system/GameBadge";
import { ProfileMainSkeleton } from "../design-system/Skeleton";

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshProfile().catch(() => {});
  }, [refreshProfile]);

  const currentRating =
    user?.ratings && user.ratings.length > 0
      ? user.ratings[user.ratings.length - 1]?.ratingAfter
      : 1200;

  const initial = user?.username ? user.username.charAt(0).toUpperCase() : "P";
  const rankInfo = getRankTier(currentRating);

  const totalMatches = user?.gameMembers?.length ?? 0;
  const wins = user?.gameMembers?.filter((gm) => gm.isWinner).length ?? 0;
  const losses = totalMatches - wins;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const matchHistory = user?.gameMembers ? [...user.gameMembers].reverse() : [];

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Season 1";

  return (
    <div className="min-h-screen game-bg text-slate-100 flex flex-col select-none">
      {/* 2D Top Header HUD */}
      <HeaderHUD />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {isLoading || !user ? (
          <ProfileMainSkeleton />
        ) : (
          <>
            {/* Navigation Bar */}
            <div className="flex items-center justify-between">
              <GameButton
                variant="slate"
                btnSize="sm"
                onClick={() => navigate("/")}
                className="!px-3 !py-1.5"
              >
                ← Back to Arena
              </GameButton>

              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-[#080c16] px-3 py-1 rounded-full border border-amber-500/30">
                Player ID: #{user.id}
              </span>
            </div>

        {/* Hero Profile Card */}
        <GamePanel
          variant="gold"
          ribbonTitle="CHAMPION PROFILE"
          ribbonColor="gold"
          className="!p-6 sm:!p-8 !pt-10"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Big Avatar Crest */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-b from-indigo-500 via-indigo-700 to-indigo-950 border-4 border-amber-400 shadow-[0_6px_0_#451a03] flex items-center justify-center text-4xl sm:text-5xl font-black text-amber-300 drop-shadow-[0_2px_0_#000]">
                {initial}
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-3 border-[#0d1322] flex items-center justify-center text-xs" />
            </div>

            {/* Identity & Rank */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1
                  className="text-2xl sm:text-3xl font-black text-white drop-shadow tracking-wide"
                  style={{ fontFamily: "var(--font-game)" }}
                >
                  {user.username}
                </h1>
                <div className="inline-flex justify-center sm:justify-start">
                  <EloPill rating={currentRating} />
                </div>
              </div>

              <p className="text-xs font-bold text-slate-400">
                {user.email} • Member since: <span className="text-slate-300">{memberSince}</span>
              </p>

              {/* Tier Banner */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#080c16] border border-[#2b354d] text-xs font-black text-slate-300">
                  <span>League Division:</span>
                  <span style={{ color: rankInfo.color }}>
                    {rankInfo.gem} {rankInfo.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="shrink-0 flex items-center">
              <GameButton
                variant="green"
                btnSize="md"
                onClick={() => navigate("/")}
                className="w-full sm:w-auto"
              >
                <SwordsIcon className="w-5 h-5 mr-2" />
                <span>Duel Now</span>
              </GameButton>
            </div>
          </div>

          {/* Performance Stats Tablets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t-2 border-[#20293d]">
            <div className="game-inset p-3.5 text-center">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Current Elo
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-1 block tabular-nums">
                {Math.round(currentRating).toLocaleString()}
              </span>
            </div>

            <div className="game-inset p-3.5 text-center">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Win Rate
              </span>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <CrownIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                  {winRate}%
                </span>
              </div>
            </div>

            <div className="game-inset p-3.5 text-center">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Victories (W)
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block tabular-nums">
                {wins}
              </span>
            </div>

            <div className="game-inset p-3.5 text-center">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Defeats (L)
              </span>
              <span className="text-2xl font-black text-rose-400 font-mono mt-1 block tabular-nums">
                {losses}
              </span>
            </div>
          </div>
        </GamePanel>

        {/* Battle Record Chronicles */}
        <GamePanel
          ribbonTitle="COMBAT HISTORY"
          ribbonColor="blue"
          className="!pt-8"
        >
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#20293d]">
            <div className="flex items-center space-x-2">
              <ShieldIcon className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                All Recorded Matches
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {matchHistory.length} Total
            </span>
          </div>

          <div className="mt-4 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {matchHistory.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <TrophyIcon className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-400">No battle records found yet.</p>
                <p className="text-xs text-slate-500">Go to the Arena and challenge players to build your legacy!</p>
              </div>
            ) : (
              matchHistory.map((record, index) => {
                const isWin = record.isWinner;
                return (
                  <div
                    key={record.id ?? index}
                    className="game-inset !p-3.5 flex items-center justify-between border-2 hover:border-[#384869] transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 shadow-[0_2px_0_#000] ${
                          isWin
                            ? "bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300 text-[#451a03]"
                            : "bg-gradient-to-b from-rose-600 to-rose-800 border-rose-400 text-white"
                        }`}
                      >
                        {isWin ? "W" : "L"}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-black text-white">
                            Match #{record.game?.id ?? record.id}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              isWin
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {isWin ? "Victory" : "Defeat"}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">
                          Score: <span className="text-amber-300 font-bold">{record.score} pts</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-black font-mono px-2.5 py-1 rounded border ${
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
          </>
        )}
      </main>
    </div>
  );
};
