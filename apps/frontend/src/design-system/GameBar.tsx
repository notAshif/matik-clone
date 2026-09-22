import React from "react";

export type GameBarColor = "green" | "indigo" | "gold" | "red";

export interface GameBarProps {
  value: number;
  max: number;
  color?: GameBarColor;
  label?: string;
  showValues?: boolean;
  className?: string;
}

export const GameBar: React.FC<GameBarProps> = ({
  value,
  max,
  color = "green",
  label,
  showValues = false,
  className = "",
}) => {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  const colorClass = `game-bar-${color}`;

  return (
    <div className={`w-full ${className}`}>
      {(label || showValues) && (
        <div className="flex justify-between items-center text-xs font-extrabold uppercase tracking-wider mb-1 px-1 text-slate-300">
          <span>{label}</span>
          {showValues && (
            <span className="font-mono text-white tabular-nums">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className="game-bar-track">
        <div
          className={`game-bar-fill ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
