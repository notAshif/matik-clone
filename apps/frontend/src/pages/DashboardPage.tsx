import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { HeaderHUD } from "../components/HeaderHUD";
import { OnlineStoryBar } from "../components/OnlineStoryBar";
import { SwordsIcon } from "../components/icons";
import { GamePanel } from "../design-system/GamePanel";
import { GameButton } from "../design-system/GameButton";

export const DashboardPage: React.FC = () => {
  const { refreshProfile } = useAuth();
  const { queueStatus, activeGame, joinQueue, leaveQueue } = useWebSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeGame) {
      navigate("/game");
    }
  }, [activeGame, navigate]);

  useEffect(() => {
    refreshProfile().catch(() => {});
  }, []);

  const handleStartGameClick = () => {
    joinQueue();
  };

  const handleCancelSearch = () => {
    leaveQueue();
  };

  const isSearching = queueStatus === "WAITING";

  return (
    <div className="min-h-screen game-bg text-slate-100 flex flex-col select-none">
      {/* 2D Game Header HUD */}
      <HeaderHUD />

      {/* Main Stage */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Active Online Players Bar */}
        <section aria-label="Online Players">
          <OnlineStoryBar />
        </section>

        {/* 2D Game Hub - Centered Ranked Battleground */}
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {/* Arena Hero Launchpad */}
          <GamePanel
            variant="gold"
            ribbonTitle="RANKED BATTLEGROUND"
            ribbonColor="gold"
            className="p-8! sm:p-10! pt-12!"
          >
            <div className="space-y-6">
              <div>
                <h1
                  className="text-3xl sm:text-4xl font-bold text-white drop-shadow-[0_3px_0_#000] tracking-wider leading-tight game-logo-text"
                  style={{ fontFamily: "var(--font-logo)" }}
                >
                  Speed Math Duel
                </h1>
                <p className="mt-2.5 text-slate-300 text-sm sm:text-base leading-relaxed font-semibold max-w-xl">
                  Out-calculate your opponent under extreme 60-second pressure.
                  Solve arithmetic expressions rapidly to score points and elevate your competitive Elo rank.
                </p>
              </div>

              {/* Matchmaking Queue Status */}
              <div className="pt-2">
                {isSearching ? (
                  <div className="game-inset p-4! flex flex-col sm:flex-row items-center justify-between gap-3 border-2 border-amber-500/50 bg-[#070b14] animate-game-pop">
                    <div className="flex items-center space-x-3 text-center sm:text-left">
                      <span className="relative flex h-3.5 w-3.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-amber-300">
                        Searching for an active challenger in the queue...
                      </span>
                    </div>
                    <GameButton
                      variant="red"
                      btnSize="sm"
                      onClick={handleCancelSearch}
                      className="shrink-0"
                    >
                      Cancel
                    </GameButton>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <GameButton
                      id="find-match-btn"
                      variant="green"
                      btnSize="lg"
                      onClick={handleStartGameClick}
                      className="w-full sm:w-auto py-4! px-8! text-lg"
                    >
                      <SwordsIcon className="w-6 h-6 mr-3 drop-shadow" />
                      <span>FIND OPPONENT</span>
                    </GameButton>
                    <span className="text-xs font-bold text-slate-400">
                      Or click an online player in the bar above for a direct duel!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </GamePanel>
        </div>
      </main>
    </div>
  );
};
