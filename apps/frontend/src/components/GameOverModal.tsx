import React from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";
import { TrophyIcon } from "./icons";
import { useNavigate } from "react-router-dom";

interface GameOverModalProps {
  onSearchNext: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onSearchNext }) => {
  const { gameOver, activeGame, invitePlayer, resetGame } = useWebSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!gameOver || !user || !activeGame) return null;

  const myId = user.id;
  const opponent = activeGame.opponent;
  const isWinner = gameOver.winnerId === myId;
  const isDraw = gameOver.winnerId === null;
  const myScore = gameOver.scores[myId] ?? 0;
  const opponentScore = gameOver.scores[opponent.id] ?? 0;

  const handleRematch = () => {
    resetGame();
    invitePlayer(opponent.id);
  };

  const handleSearchNext = () => {
    resetGame();
    onSearchNext();
  };

  const handleBackToDashboard = () => {
    resetGame();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl overflow-hidden">
        {/* Glow */}
        <div
          className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isWinner ? "bg-emerald-500/20" : isDraw ? "bg-indigo-500/20" : "bg-rose-500/20"
          }`}
        ></div>

        {/* Outcome Header */}
        <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-5 border shadow-inner">
          {isWinner ? (
            <div className="w-full h-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-2xl flex items-center justify-center">
              <TrophyIcon className="w-10 h-10 animate-bounce" />
            </div>
          ) : isDraw ? (
            <div className="w-full h-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 rounded-2xl flex items-center justify-center text-3xl font-black">
              =
            </div>
          ) : (
            <div className="w-full h-full bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-2xl flex items-center justify-center text-2xl font-black">
              X
            </div>
          )}
        </div>

        <h2 className="text-3xl font-black text-white tracking-wide">
          {isWinner ? "VICTORY!" : isDraw ? "IT'S A DRAW!" : "DEFEAT"}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {gameOver.reason === "PLAYER_FORFEIT"
            ? "Opponent disconnected / forfeited the match."
            : "60-second time limit expired."}
        </p>

        {/* Score comparison card */}
        <div className="grid grid-cols-2 gap-4 my-8 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              You
            </span>
            <span className="text-3xl font-black text-emerald-400 mt-1">{myScore} pts</span>
          </div>

          <div className="flex flex-col items-center border-l border-slate-800">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              {opponent.username}
            </span>
            <span className="text-3xl font-black text-indigo-400 mt-1">{opponentScore} pts</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleRematch}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            Rematch
          </button>

          <button
            onClick={handleSearchNext}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            Search Next Game
          </button>
        </div>

        <button
          onClick={handleBackToDashboard}
          className="mt-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
