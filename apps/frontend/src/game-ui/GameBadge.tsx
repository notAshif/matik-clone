import React from "react";

export type RankTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export const getRankTier = (rating: number): { tier: RankTier; name: string; color: string; gem: string } => {
  if (rating >= 1700) return { tier: "diamond", name: "Diamond", color: "#818cf8", gem: "💎" };
  if (rating >= 1500) return { tier: "platinum", name: "Platinum", color: "#22d3ee", gem: "💠" };
  if (rating >= 1300) return { tier: "gold", name: "Gold", color: "#fbbf24", gem: "⭐" };
  if (rating >= 1100) return { tier: "silver", name: "Silver", color: "#cbd5e1", gem: "🛡️" };
  return { tier: "bronze", name: "Bronze", color: "#d97706", gem: "🥉" };
};

export interface EloPillProps {
  rating: number;
  showLabel?: boolean;
  className?: string;
}

export const EloPill: React.FC<EloPillProps> = ({ rating, showLabel = true, className = "" }) => {
  const { name, gem, color } = getRankTier(rating);

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#080c16] border-2 shadow-[0_2px_4px_rgba(0,0,0,0.6)] ${className}`}
      style={{ borderColor: color }}
    >
      <span className="text-sm leading-none drop-shadow">{gem}</span>
      {showLabel && (
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {name}:
        </span>
      )}
      <span
        className="font-mono text-xs font-black tracking-wide tabular-nums drop-shadow"
        style={{ color }}
      >
        {Math.round(rating).toLocaleString()}
      </span>
    </div>
  );
};

export interface GameBadgeProps {
  variant?: "green" | "gold" | "red" | "blue" | "slate";
  children: React.ReactNode;
  className?: string;
}

export const GameBadge: React.FC<GameBadgeProps> = ({
  variant = "gold",
  children,
  className = "",
}) => {
  const styles: Record<string, string> = {
    gold: "bg-amber-500/20 text-amber-300 border-amber-500/50",
    green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
    red: "bg-rose-500/20 text-rose-300 border-rose-500/50",
    blue: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
    slate: "bg-slate-800 text-slate-300 border-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
