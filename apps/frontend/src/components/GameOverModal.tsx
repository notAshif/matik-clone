import React, { useState, useEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";
import { TrophyIcon } from "./icons";
import { useNavigate } from "react-router-dom";
import { GamePanel } from "../game-ui/GamePanel";
import { GameButton } from "../game-ui/GameButton";
import { SoundFX } from "../game-ui/sound";
import { EloPill } from "../game-ui/GameBadge";
import { PlayerAvatar } from "./PlayerAvatar";

interface GameOverModalProps {
  onSearchNext: () => void;
}

const RollingNumber: React.FC<{ from: number; to: number; duration?: number }> = ({
  from,
  to,
  duration = 900,
}) => {
  const [val, setVal] = useState(from);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * ease);
      setVal(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [from, to, duration]);

  return <span className="tabular-nums font-mono">{val.toLocaleString()}</span>;
};

export const GameOverModal: React.FC<GameOverModalProps> = ({ onSearchNext }) => {
  const { gameOver, activeGame, resetGame } = useWebSocket();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshProfile().catch(console.warn);
  }, [refreshProfile]);

  useEffect(() => {
    if (!gameOver || !user) return;
    if (gameOver.winnerId === user.id) {
      SoundFX.victory();
    } else if (gameOver.winnerId !== null) {
      SoundFX.defeat();
    }
  }, [gameOver, user]);

  if (!gameOver || !user || !activeGame) return null;

  const myId = user.id;
  const opponent = activeGame.opponent;
  const isWinner = gameOver.winnerId === myId;
  const isDraw = gameOver.winnerId === null;
  const myScore = gameOver.scores[myId] ?? 0;
  const opponentScore = gameOver.scores[opponent.id] ?? 0;

  const myRatingSummary = gameOver.ratings ? gameOver.ratings[myId] : undefined;
  const opponentRatingSummary = gameOver.ratings ? gameOver.ratings[opponent.id] : undefined;

  const ratingBefore = myRatingSummary?.ratingBefore ?? 1200;
  const ratingAfter = myRatingSummary?.ratingAfter ?? 1200;
  const ratingChange = myRatingSummary?.ratingChange ?? 0;

  const ribbonTitle = isWinner ? "VICTORY!" : isDraw ? "STALEMATE!" : "DEFEAT!";
  const ribbonColor = isWinner ? "gold" : isDraw ? "blue" : "red";

  const handleSearchNext = async () => {
    await refreshProfile();
    resetGame();
    onSearchNext();
  };

  const handleBackToDashboard = async () => {
    await refreshProfile();
    resetGame();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="max-w-md w-full animate-game-pop">
        <GamePanel
          variant="gold"
          ribbonTitle={ribbonTitle}
          ribbonColor={ribbonColor}
          className="text-center pt-10!"
        >
          {/* Outcome Emblem */}
          <div className="mx-auto w-18 h-18 rounded-2xl flex items-center justify-center mb-3">
            {isWinner ? (
              <div className="w-full h-full bg-linear-to-b from-amber-400 to-amber-600 border-3 border-amber-300 rounded-2xl flex items-center justify-center shadow-[0_4px_0_#451a03,0_0_20px_rgba(245,158,11,0.5)]">
                <TrophyIcon className="w-10 h-10 text-[#451a03] drop-shadow" />
              </div>
            ) : isDraw ? (
              <div className="w-full h-full bg-linear-to-b from-indigo-500 to-indigo-700 border-3 border-indigo-400 rounded-2xl flex items-center justify-center shadow-[0_4px_0_#1e1b4b] text-white text-3xl font-black">
                =
              </div>
            ) : (
              <div className="w-full h-full bg-linear-to-b from-rose-500 to-rose-700 border-3 border-rose-400 rounded-2xl flex items-center justify-center shadow-[0_4px_0_#450a0a] text-white text-3xl font-black">
                ✕
              </div>
            )}
          </div>

          <h2
            className="text-3xl font-black text-white drop-shadow-[0_2px_0_#000] tracking-wide"
            style={{ fontFamily: "var(--font-game)" }}
          >
            {isWinner ? "YOU PREVAILED!" : isDraw ? "HONORABLE DRAW" : "FALLEN IN BATTLE"}
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5">
            {gameOver.reason === "PLAYER_FORFEIT"
              ? "Opponent fled or surrendered the duel."
              : "Round timer expired."}
          </p>

          {/* Elo Adjustment Inset */}
          <div className="my-5 game-inset p-4 flex flex-col items-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 mb-1.5 drop-shadow">
              ELO RATING UPDATE
            </span>

            <div className="flex items-center space-x-3 text-2xl font-black text-white">
              <span className="text-slate-400 font-mono text-xl tabular-nums">
                {ratingBefore.toLocaleString()}
              </span>

              <span className="text-amber-400 text-sm">➔</span>

              <div className="text-white">
                <RollingNumber from={ratingBefore} to={ratingAfter} />
              </div>

              {/* Delta Badge */}
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-md font-mono border ${
                  ratingChange > 0
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : ratingChange < 0
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
              </span>
            </div>

            <div className="mt-2.5">
              <EloPill rating={ratingAfter} />
            </div>
          </div>

          {/* Match Score Comparison */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="game-inset p-3 text-left">
              <div className="flex items-center space-x-1.5 mb-1">
                <PlayerAvatar email={user.email} username={user.username} size="xs" variant="green" />
                <span className="text-[10px] font-black uppercase text-amber-400 block truncate">YOU</span>
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5 tabular-nums">
                {myScore}{" "}
                <span className="text-xs text-slate-400 font-sans font-bold">pts</span>
              </div>
              <span className="text-xs font-bold text-slate-300 mt-1 block">
                Solved: <b className="text-white">{Math.floor(myScore / 10)}</b>
              </span>
            </div>

            <div className="game-inset p-3 text-left">
              <div className="flex items-center space-x-1.5 mb-1">
                <PlayerAvatar email={opponent.email} username={opponent.username} size="xs" variant="indigo" />
                <span className="text-[10px] font-black uppercase text-indigo-400 block truncate">
                  {opponent.username}
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-400 font-mono mt-0.5 tabular-nums">
                {opponentScore}{" "}
                <span className="text-xs text-slate-400 font-sans font-bold">pts</span>
              </div>
              <span className="text-xs font-bold text-slate-300 mt-1 block">
                Solved: <b className="text-white">{Math.floor(opponentScore / 10)}</b>
                {opponentRatingSummary?.ratingChange ? (
                  <span className="text-[11px] text-slate-400 ml-1">
                    ({opponentRatingSummary.ratingChange > 0 ? "+" : ""}
                    {opponentRatingSummary.ratingChange})
                  </span>
                ) : null}
              </span>
            </div>
          </div>

          {/* 3D Action Buttons */}
          <div className="flex flex-col gap-3">
            <GameButton
              id="play-again-btn"
              variant="green"
              btnSize="md"
              onClick={handleSearchNext}
              className="w-full"
            >
              Play Again (Find Match)
            </GameButton>

            <GameButton
              id="back-to-dashboard-btn"
              variant="slate"
              btnSize="sm"
              onClick={handleBackToDashboard}
              className="w-full"
            >
              Return to Lobby
            </GameButton>
          </div>
        </GamePanel>
      </div>
    </div>
  );
};
