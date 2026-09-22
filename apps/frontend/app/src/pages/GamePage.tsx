import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { GameOverModal } from "../components/GameOverModal";
import { RadarMatchmaker } from "../components/RadarMatchmaker";
import { TickIcon, CrossIcon, TimerIcon } from "../components/icons";
import type { PublicQuestion } from "@repo/common";

export const GamePage: React.FC = () => {
  const { user } = useAuth();
  const {
    activeGame,
    latestAnswerResult,
    liveScores,
    gameOver,
    submitAnswer,
    leaveQueue,
    joinQueue,
  } = useWebSocket();

  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState<PublicQuestion | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showRadar, setShowRadar] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Redirect to dashboard if there is no active game session
  useEffect(() => {
    if (!activeGame && !gameOver) {
      navigate("/");
    }
  }, [activeGame, gameOver, navigate]);

  // Set initial first question on match start
  useEffect(() => {
    if (activeGame?.firstQuestion) {
      setCurrentQuestion(activeGame.firstQuestion);
      setTimeLeft(activeGame.timeLimit || 60);
      questionStartTimeRef.current = Date.now();
    }
  }, [activeGame]);

  // 60-second countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, gameOver]);

  // Always keep input focused
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentQuestion]);

  // React to answer results
  useEffect(() => {
    if (!latestAnswerResult) return;

    if (latestAnswerResult.isCorrect) {
      setFeedback("correct");
      setCurrentQuestion(latestAnswerResult.nextQuestion);
      setAnswerInput("");
      questionStartTimeRef.current = Date.now();
    } else {
      setFeedback("wrong");
      // Keep on same question so user can retry!
    }

    const timer = setTimeout(() => {
      setFeedback(null);
    }, 800);

    return () => clearTimeout(timer);
  }, [latestAnswerResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || !currentQuestion || !activeGame || !user) return;

    const numericAnswer = Number(answerInput.trim());
    if (isNaN(numericAnswer)) return;

    const timeTakenMs = Date.now() - questionStartTimeRef.current;
    submitAnswer(activeGame.gameId, currentQuestion.id, numericAnswer, timeTakenMs);
  };

  const myId = user?.id ?? 0;
  const opponent = activeGame?.opponent;
  const mySolvedCount = Math.floor((liveScores[myId] ?? 0) / 10);
  const opponentSolvedCount = opponent ? Math.floor((liveScores[opponent.id] ?? 0) / 10) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Background Lighting */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Game Over Modal */}
      {gameOver && (
        <GameOverModal
          onSearchNext={() => {
            setShowRadar(true);
            joinQueue();
          }}
        />
      )}

      {/* Radar searching modal when user chooses search next game from modal */}
      {showRadar && (
        <RadarMatchmaker
          onCancel={() => {
            setShowRadar(false);
            leaveQueue();
            navigate("/");
          }}
        />
      )}

      {/* 4.1) TOP HUD: Left Player, Center Timer, Right Player */}
      <header className="max-w-5xl w-full mx-auto grid grid-cols-3 items-center gap-4">
        {/* Left: Current Player Component */}
        <div className="flex flex-col items-start">
          <div className="bg-slate-900 border border-slate-800 rounded-md p-3 sm:p-4 flex items-center space-x-3 w-full max-w-[240px] shadow-lg">
            <div className="w-12 h-12 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-lg flex items-center justify-center uppercase">
              {user?.username ? user.username.slice(0, 2) : "ME"}
            </div>
            <div className="truncate">
              <div className="font-bold text-sm sm:text-base text-white truncate">
                {user?.username ?? "You"}
              </div>
              <div className="text-xs text-emerald-400 font-mono font-semibold">
                Rating: 1200
              </div>
            </div>
          </div>
          {/* Solved Question Counter */}
          <div className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
            Solved: <span className="text-emerald-400 font-mono text-sm">{mySolvedCount}</span>
          </div>
        </div>

        {/* Center: Timer Component in rounded-md border */}
        <div className="flex flex-col items-center justify-center">
          <div
            className={`border rounded-md px-5 py-2.5 flex items-center space-x-2 shadow-lg backdrop-blur-md transition-colors ${
              timeLeft <= 10
                ? "border-rose-500 bg-rose-500/10 text-rose-400 animate-pulse"
                : "border-slate-700 bg-slate-900/80 text-white"
            }`}
          >
            <TimerIcon className={`w-5 h-5 ${timeLeft <= 10 ? "text-rose-400" : "text-emerald-400"}`} />
            <span className="font-mono text-xl sm:text-2xl font-black tracking-widest">
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
              {String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
            ROUND TIMER
          </span>
        </div>

        {/* Right: Opponent Player Component */}
        <div className="flex flex-col items-end">
          <div className="bg-slate-900 border border-slate-800 rounded-md p-3 sm:p-4 flex items-center justify-end space-x-3 w-full max-w-[240px] shadow-lg text-right">
            <div className="truncate">
              <div className="font-bold text-sm sm:text-base text-white truncate">
                {opponent?.username ?? "Opponent"}
              </div>
              <div className="text-xs text-indigo-400 font-mono font-semibold">
                Rating: 1200
              </div>
            </div>
            <div className="w-12 h-12 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-bold text-lg flex items-center justify-center uppercase">
              {opponent?.username ? opponent.username.slice(0, 2) : "OP"}
            </div>
          </div>
          {/* Solved Question Counter */}
          <div className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400 pr-1">
            Solved: <span className="text-indigo-400 font-mono text-sm">{opponentSolvedCount}</span>
          </div>
        </div>
      </header>

      {/* 4.2) CENTER: Large Arithmetic Question Box */}
      <main className="flex-1 flex flex-col items-center justify-center my-8">
        {currentQuestion ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-14 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">
              QUESTION #{currentQuestion.orderIndex + 1}
            </span>

            <div className="flex items-center space-x-4 sm:space-x-8 text-5xl sm:text-7xl font-black text-white tracking-wider font-mono">
              <span className="text-slate-100">{currentQuestion.operand1}</span>
              <span className="text-emerald-400">{currentQuestion.operator}</span>
              <span className="text-slate-100">{currentQuestion.operand2}</span>
              <span className="text-slate-500">=</span>
              <span className="text-slate-400 font-light">?</span>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 animate-pulse text-lg font-mono">Loading Question...</div>
        )}
      </main>

      {/* 4.3) BOTTOM CENTER: Answer Input with Tick & Cross Indicators */}
      <footer className="max-w-md w-full mx-auto pb-6">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            ref={inputRef}
            type="number"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            placeholder="Type answer & press Enter"
            className={`w-full py-4 pl-6 pr-14 text-center text-2xl sm:text-3xl font-mono font-bold bg-slate-900 rounded-2xl border-2 transition-all duration-200 focus:outline-none shadow-2xl placeholder:text-slate-600 ${
              feedback === "correct"
                ? "border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-950/20 text-emerald-300"
                : feedback === "wrong"
                ? "border-rose-500 ring-4 ring-rose-500/20 bg-rose-950/20 text-rose-300 animate-shake"
                : "border-slate-700 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
            }`}
          />

          {/* Right indicator: Green tick on correct, Red cross on wrong */}
          <div className="absolute right-4 flex items-center pointer-events-none">
            {feedback === "correct" && (
              <div className="p-1.5 bg-emerald-500/20 rounded-full text-emerald-400 animate-in zoom-in">
                <TickIcon className="w-7 h-7" />
              </div>
            )}
            {feedback === "wrong" && (
              <div className="p-1.5 bg-rose-500/20 rounded-full text-rose-400 animate-in zoom-in">
                <CrossIcon className="w-7 h-7" />
              </div>
            )}
          </div>
        </form>

        <p className="text-center text-xs text-slate-500 mt-3 font-medium">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Enter</kbd> to submit. If incorrect, you can retry!
        </p>
      </footer>
    </div>
  );
};
