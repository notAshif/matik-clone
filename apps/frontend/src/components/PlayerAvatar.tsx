import React, { useState } from "react";
import { getGravatarUrl } from "../utils/avatar";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarBorderVariant = "gold" | "indigo" | "green" | "slate";

export interface PlayerAvatarProps {
  email?: string | null;
  username?: string | null;
  size?: AvatarSize;
  variant?: AvatarBorderVariant;
  shape?: "circle" | "rounded";
  showOnlineDot?: boolean;
  className?: string;
  alt?: string;
}

const SIZE_CONFIG: Record<
  AvatarSize,
  {
    container: string;
    imgSize: number;
    initialText: string;
    dot: string;
    borderWidth: string;
  }
> = {
  xs: {
    container: "w-7 h-7",
    imgSize: 64,
    initialText: "text-[10px] font-black",
    dot: "w-2 h-2 -bottom-0.5 -right-0.5",
    borderWidth: "border-[1.5px]",
  },
  sm: {
    container: "w-9 h-9",
    imgSize: 96,
    initialText: "text-xs font-black",
    dot: "w-2.5 h-2.5 bottom-0 right-0",
    borderWidth: "border-2",
  },
  md: {
    container: "w-11 h-11",
    imgSize: 128,
    initialText: "text-sm font-black",
    dot: "w-3 h-3 bottom-0 right-0",
    borderWidth: "border-2",
  },
  lg: {
    container: "w-13 h-13 sm:w-14 sm:h-14",
    imgSize: 160,
    initialText: "text-base sm:text-lg font-black",
    dot: "w-3.5 h-3.5 bottom-0.5 right-0.5",
    borderWidth: "border-2 sm:border-[2.5px]",
  },
  xl: {
    container: "w-24 h-24 sm:w-28 sm:h-28",
    imgSize: 256,
    initialText: "text-3xl sm:text-4xl font-black",
    dot: "w-5 h-5 bottom-1 right-1",
    borderWidth: "border-3 sm:border-4",
  },
};

const BORDER_STYLES: Record<AvatarBorderVariant, { border: string; bg: string; shadow: string }> = {
  gold: {
    border: "border-amber-400 group-hover:border-amber-300",
    bg: "from-amber-400 to-amber-600",
    shadow: "shadow-[0_2px_0_#451a03]",
  },
  indigo: {
    border: "border-indigo-400 group-hover:border-amber-400",
    bg: "from-indigo-500 to-indigo-800",
    shadow: "shadow-[0_2px_0_#1e1b4b]",
  },
  green: {
    border: "border-emerald-400 group-hover:border-emerald-300",
    bg: "from-emerald-400 to-emerald-700",
    shadow: "shadow-[0_2px_0_#022c22]",
  },
  slate: {
    border: "border-slate-500 group-hover:border-slate-400",
    bg: "from-slate-600 to-slate-800",
    shadow: "shadow-[0_2px_0_#020617]",
  },
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  email,
  username,
  size = "md",
  variant = "indigo",
  shape = "circle",
  showOnlineDot = false,
  className = "",
  alt,
}) => {
  const [imgError, setImgError] = useState(false);

  const initial = username
    ? username.slice(0, 2).toUpperCase()
    : email
    ? email.slice(0, 2).toUpperCase()
    : "P";

  const cfg = SIZE_CONFIG[size];
  const borderCfg = BORDER_STYLES[variant];
  const roundedClass = shape === "circle" ? "rounded-full" : "rounded-2xl";
  const avatarUrl = getGravatarUrl(email || username, cfg.imgSize);

  return (
    <div
      className={`relative shrink-0 select-none ${cfg.container} ${className}`}
      title={username ? `${username}${email ? ` (${email})` : ""}` : "Player Avatar"}
    >
      <div
        className={`w-full h-full ${roundedClass} ${cfg.borderWidth} ${borderCfg.border} ${borderCfg.shadow} overflow-hidden bg-[#0d1322] flex items-center justify-center transition-all duration-200`}
      >
        {!imgError ? (
          <img
            src={avatarUrl}
            alt={alt || username || "Avatar"}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover ${roundedClass} outline outline-1 outline-white/15`}
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-linear-to-b ${borderCfg.bg} text-white ${cfg.initialText} drop-shadow uppercase`}
          >
            {initial}
          </div>
        )}
      </div>

      {showOnlineDot && (
        <span
          className={`absolute ${cfg.dot} rounded-full bg-emerald-400 border-2 border-[#0b0f19] shadow-[0_0_8px_rgba(52,211,153,0.8)] z-10 pointer-events-none`}
        />
      )}
    </div>
  );
};
