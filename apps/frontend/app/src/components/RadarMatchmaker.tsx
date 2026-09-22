import React from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { RadarIcon } from "./icons";

interface RadarMatchmakerProps {
  onCancel: () => void;
}

export const RadarMatchmaker: React.FC<RadarMatchmakerProps> = ({ onCancel }) => {
  const { leaveQueue } = useWebSocket();

  const handleCancel = () => {
    leaveQueue();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden text-center">
        {/* Radar Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Radar Display Screen */}
        <div className="relative w-64 h-64 my-6 rounded-full border-2 border-emerald-500/40 bg-slate-950 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)]">
          {/* Concentric rings */}
          <div className="absolute w-48 h-48 rounded-full border border-emerald-500/20"></div>
          <div className="absolute w-32 h-32 rounded-full border border-emerald-500/20"></div>
          <div className="absolute w-16 h-16 rounded-full border border-emerald-500/20"></div>

          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-emerald-500/20"></div>
          <div className="absolute h-full w-[1px] bg-emerald-500/20"></div>

          {/* Rotating Radar Sweep Beam */}
          <div className="absolute inset-0 origin-center animate-[spin_3s_linear_infinite] pointer-events-none">
            <div className="w-1/2 h-1/2 bg-gradient-to-br from-emerald-400/40 to-transparent [clip-path:polygon(0_0,100%_0,100%_100%)]"></div>
          </div>

          {/* Pulsing Target Dot */}
          <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_15px_#34d399] animate-pulse"></div>

          {/* Radar Icon badge */}
          <div className="absolute bottom-3 text-[10px] uppercase font-mono tracking-widest text-emerald-400/60 flex items-center space-x-1">
            <RadarIcon className="w-3.5 h-3.5 animate-spin" />
            <span>SONAR ACTIVE</span>
          </div>
        </div>

        {/* Status Text */}
        <h3 className="text-xl font-extrabold text-white tracking-wide">
          Searching For Opponent...
        </h3>
        <p className="text-sm text-slate-400 mt-2">
          Scanning Matik servers for a live math challenger. Match will start automatically.
        </p>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="mt-8 px-6 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 font-semibold hover:bg-rose-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        >
          Cancel Search
        </button>
      </div>
    </div>
  );
};
