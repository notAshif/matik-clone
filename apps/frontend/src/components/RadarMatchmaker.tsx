import React from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { RadarIcon } from "./icons";
import { GamePanel } from "../design-system/GamePanel";
import { GameButton } from "../design-system/GameButton";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="max-w-md w-full animate-game-pop">
        <GamePanel
          variant="gold"
          ribbonTitle="MATCHMAKING RADAR"
          ribbonColor="gold"
          className="flex flex-col items-center text-center pt-10!"
        >
          {/* Radar Bezel Display */}
          <div className="relative w-64 h-64 my-4 rounded-full border-4 border-[#3a4768] bg-[#070b14] flex items-center justify-center overflow-hidden shadow-[inset_0_0_25px_rgba(0,0,0,0.9),0_0_20px_rgba(16,185,129,0.2)]">
            {/* Concentric rings */}
            <div className="absolute w-48 h-48 rounded-full border border-emerald-500/25" />
            <div className="absolute w-32 h-32 rounded-full border border-emerald-500/25" />
            <div className="absolute w-16 h-16 rounded-full border border-emerald-500/25" />

            {/* Crosshairs */}
            <div className="absolute w-full h-px bg-emerald-500/20" />
            <div className="absolute h-full w-px bg-emerald-500/20" />

            {/* Radar Sweep Beam */}
            <div className="absolute inset-0 origin-center animate-radar-sweep pointer-events-none">
              <div className="w-1/2 h-1/2 bg-linear-to-br from-emerald-400/40 to-transparent [clip-path:polygon(0_0,100%_0,100%_100%)]" />
            </div>

            {/* Pulsing Target Dot */}
            <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_15px_#34d399] animate-ping" />
            <div className="absolute z-10 w-3 h-3 rounded-full bg-emerald-300" />

            {/* Radar Status Badge */}
            <div className="absolute bottom-3 text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400 flex items-center space-x-1.5 bg-[#0b101c]/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <RadarIcon className="w-3.5 h-3.5 animate-spin" />
              <span>SCANNING SECTOR...</span>
            </div>
          </div>

          {/* Status Text */}
          <h3 className="text-xl font-black text-white tracking-wide drop-shadow mt-1">
            Seeking Math Rival...
          </h3>
          <p className="text-xs font-bold text-slate-400 mt-1 max-w-xs leading-relaxed">
            Searching Matik queue for an equally matched challenger. Arena gates will open immediately upon match!
          </p>

          {/* Cancel Button */}
          <div className="mt-6 w-full max-w-xs">
            <GameButton
              variant="red"
              btnSize="md"
              onClick={handleCancel}
              className="w-full"
            >
              Cancel Search
            </GameButton>
          </div>
        </GamePanel>
      </div>
    </div>
  );
};
