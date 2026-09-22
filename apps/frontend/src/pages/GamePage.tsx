import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { GameOverModal } from "../components/GameOverModal";
import { RadarMatchmaker } from "../components/RadarMatchmaker";
import { TickIcon, CrossIcon, TimerIcon } from "../components/icons";
import { GamePanel } from "../design-system/GamePanel";
import { GameBar } from "../design-system/GameBar";
import { GameButton } from "../design-system/GameButton";
import { FloatingScore } from "../design-system/FloatingScore";
import { SoundFX } from "../design-system/sound";
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
  const [floatingScoreText, setFloatingScoreText] = useState<{ text: string; type: "positive" | "negative"; key: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showRadar, setShowRadar] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Redirect if no game session
  useEffect(() => {
    if (!activeGame && !gameOver) {
      navigate("/");
    }
  }, [activeGame, gameOver, navigate]);

  // Initial first question & fanfare on game start
  useEffect(() => {
    if (activeGame?.firstQuestion) {
      setCurrentQuestion(activeGame.firstQuestion);
      setTimeLeft(activeGame.timeLimit || 60);
      questionStartTimeRef.current = Date.now();
      SoundFX.matchStart();
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

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentQuestion, feedback]);

  // Answer result feedback & sounds
  useEffect(() => {
    if (!latestAnswerResult) return;

    if (latestAnswerResult.isCorrect) {
      setFeedback("correct");
      SoundFX.correct();
      setFloatingScoreText({
        text: "+10 PTS!",
        type: "positive",
        key: Date.now(),
      });
      setCurrentQuestion(latestAnswerResult.nextQuestion);
      setAnswerInput("");
      questionStartTimeRef.current = Date.now();
    } else {
      setFeedback("wrong");
      SoundFX.wrong();
      setFloatingScoreText({
        text: "RETRY!",
        type: "negative",
        key: Date.now(),
      });
      setAnswerInput("");
    }

    const timer = setTimeout(() => {
      setFeedback(null);
    }, 600);

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

  const myRating =
    user?.ratings && user.ratings.length > 0
      ? user.ratings[user.ratings.length - 1]?.ratingAfter
      : 1200;

  const opponentRating = opponent?.rating ?? 1200;

  return (
    <div className="min-h-screen game-bg text-white flex flex-col justify-between p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Game Over Modal */}
      {gameOver && (
        <GameOverModal
          onSearchNext={() => {
            setShowRadar(true);
            joinQueue();
          }}
        />
      )}

      {/* Radar searching modal */}
      {showRadar && (
        <RadarMatchmaker
          onCancel={() => {
            setShowRadar(false);
            leaveQueue();
            navigate("/");
          }}
        />
      )}

      {/* 1) TOP MATCH HUD: Player 1 (Left), Stopwatch Bezel (Center), Player 2 (Right) */}
      <header className="max-w-5xl w-full mx-auto grid grid-cols-3 items-center gap-3 sm:gap-6 z-10">
        {/* Left: Player 1 Card */}
        <div className="flex flex-col items-start">
          <div className="game-panel !p-3 w-full max-w-[240px]">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-700 border-2 border-emerald-300 shadow-[0_2px_0_#022c22] text-[#022c22] font-black text-sm flex items-center justify-center uppercase shrink-0">
                {user?.username ? user.username.slice(0, 2) : "ME"}
              </div>
              <div className="truncate">
                <div className="font-black text-xs sm:text-sm text-white truncate drop-shadow">
                  {user?.username ?? "You"}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono font-bold">
                  ⚡ {Math.round(myRating).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Solved Progress Bar */}
            <div className="mt-2">
              <GameBar
                value={mySolvedCount}
                max={15}
                color="green"
                label={`Solved: ${mySolvedCount}`}
                className="!text-[10px]"
              />
            </div>
          </div>
        </div>

        {/* Center: 2D Round Stopwatch Bezel */}
        <div className="flex flex-col items-center justify-center">
          <div
            className={`border-3 rounded-2xl px-5 py-2.5 flex items-center space-x-2.5 shadow-[0_4px_0_#000] backdrop-blur-md transition-all duration-200 ${
              timeLeft <= 10
                ? "border-rose-500 bg-rose-950/80 text-rose-300 animate-pulse ring-4 ring-rose-500/25"
                : "border-amber-400 bg-[#090e1a] text-white"
            }`}
          >
            <TimerIcon
              className={`w-5 h-5 ${timeLeft <= 10 ? "text-rose-400" : "text-amber-400"}`}
            />
            <span
              className="font-mono text-2xl sm:text-3xl font-black tracking-widest tabular-nums drop-shadow"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
              {String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mt-1 drop-shadow">
            ROUND TIMER
          </span>
        </div>

        {/* Right: Opponent Card */}
        <div className="flex flex-col items-end">
          <div className="game-panel !p-3 w-full max-w-[240px] text-right">
            <div className="flex items-center justify-end space-x-2.5">
              <div className="truncate">
                <div className="font-black text-xs sm:text-sm text-white truncate drop-shadow">
                  {opponent?.username ?? "Rival"}
                </div>
                <div className="text-[11px] text-indigo-400 font-mono font-bold">
                  ⚡ {Math.round(opponentRating).toLocaleString()}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-indigo-400 to-indigo-700 border-2 border-indigo-300 shadow-[0_2px_0_#1e1b4b] text-white font-black text-sm flex items-center justify-center uppercase shrink-0">
                {opponent?.username ? opponent.username.slice(0, 2) : "OP"}
              </div>
            </div>

            {/* Opponent Solved Progress Bar */}
            <div className="mt-2">
              <GameBar
                value={opponentSolvedCount}
                max={15}
                color="indigo"
                label={`Solved: ${opponentSolvedCount}`}
                className="!text-[10px]"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 2) CENTER ARENA: 2D Battle Tablet */}
      <main className="flex-1 flex flex-col items-center justify-center my-6 z-10 relative">
        {/* Floating Combat Popups */}
        {floatingScoreText && (
          <FloatingScore
            key={floatingScoreText.key}
            text={floatingScoreText.text}
            type={floatingScoreText.type}
          />
        )}

        {currentQuestion ? (
          <div className="w-full max-w-lg animate-game-pop">
            <GamePanel
              variant="gold"
              ribbonTitle={`PROBLEM #${currentQuestion.orderIndex + 1}`}
              ribbonColor="gold"
              className="!p-8 sm:!p-12 text-center"
            >
              <div className="game-inset p-8 sm:p-10 flex items-center justify-center space-x-3 sm:space-x-6 text-5xl sm:text-7xl font-black text-white tracking-wider select-none font-mono drop-shadow-[0_4px_0_#000]">
                <span className="text-slate-100">{currentQuestion.operand1}</span>
                <span className="text-amber-400 drop-shadow">{currentQuestion.operator}</span>
                <span className="text-slate-100">{currentQuestion.operand2}</span>
                <span className="text-slate-500">=</span>
                <span className="text-emerald-400 font-light animate-pulse">?</span>
              </div>
            </GamePanel>
          </div>
        ) : (
          <div className="game-ribbon game-ribbon-blue animate-pulse">
            SYNCHRONIZING BATTLE ARENA...
          </div>
        )}
      </main>

      {/* 3) BOTTOM CENTER: Tactile Answer Deck */}
      <footer className="max-w-md w-full mx-auto pb-4 z-10">
        <form onSubmit={handleSubmit} className="relative flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="number"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="Your answer"
              autoFocus
              className={`game-input py-4 pl-5 pr-12 text-center text-3xl font-mono font-black border-3 transition-all duration-150 focus:outline-none placeholder:text-slate-600 ${
                feedback === "correct"
                  ? "!border-emerald-500 !ring-4 !ring-emerald-500/25 !text-emerald-300 bg-emerald-950/30"
                  : feedback === "wrong"
                  ? "!border-rose-500 !ring-4 !ring-rose-500/25 !text-rose-300 bg-rose-950/30 animate-shake"
                  : "!border-[#334155] focus:!border-amber-400 text-white"
              }`}
            />

            {/* Answer Icon indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {feedback === "correct" && (
                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                  <TickIcon className="w-7 h-7" />
                </div>
              )}
              {feedback === "wrong" && (
                <div className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                  <CrossIcon className="w-7 h-7" />
                </div>
              )}
            </div>
          </div>

          {/* 3D Submit Button */}
          <GameButton
            type="submit"
            variant="green"
            btnSize="md"
            className="!py-4 !px-6 shrink-0"
          >
            Enter
          </GameButton>
        </form>

        <p className="text-center text-xs text-slate-400 mt-2.5 font-bold">
          Press <kbd className="px-1.5 py-0.5 bg-[#080c16] border border-[#2e3952] rounded text-amber-300 font-mono">Enter</kbd> to submit. Wrong answers can be retried instantly!
        </p>
      </footer>
    </div>
  );
};
