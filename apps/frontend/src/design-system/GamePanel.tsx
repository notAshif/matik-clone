import React, { type HTMLAttributes } from "react";

export type GamePanelVariant = "default" | "gold";
export type GameRibbonColor = "gold" | "green" | "red" | "blue";

export interface GamePanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GamePanelVariant;
  ribbonTitle?: string;
  ribbonColor?: GameRibbonColor;
  withInset?: boolean;
}

export const GamePanel: React.FC<GamePanelProps> = ({
  variant = "default",
  ribbonTitle,
  ribbonColor = "gold",
  withInset = false,
  className = "",
  children,
  ...props
}) => {
  const panelClass = variant === "gold" ? "game-panel-gold" : "game-panel";
  const ribbonClass = `game-ribbon-${ribbonColor}`;

  return (
    <div
      {...props}
      className={`game-panel ${panelClass} p-6 relative ${className}`}
    >
      {/* Decorative Corner Rivets */}
      <span className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full bg-slate-500/50 border border-slate-700 shadow-inner pointer-events-none" />
      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-slate-500/50 border border-slate-700 shadow-inner pointer-events-none" />
      <span className="absolute bottom-2.5 left-2.5 w-2 h-2 rounded-full bg-slate-500/50 border border-slate-700 shadow-inner pointer-events-none" />
      <span className="absolute bottom-2.5 right-2.5 w-2 h-2 rounded-full bg-slate-500/50 border border-slate-700 shadow-inner pointer-events-none" />

      {/* Header Ribbon Plaque */}
      {ribbonTitle && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
          <div className={`game-ribbon ${ribbonClass}`}>
            {ribbonTitle}
          </div>
        </div>
      )}

      {/* Content wrapper */}
      {withInset ? (
        <div className="game-inset p-4 sm:p-6 w-full h-full">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};
