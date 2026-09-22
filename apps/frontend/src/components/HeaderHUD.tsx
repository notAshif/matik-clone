import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { SwordsIcon, LogoutIcon, SoundOnIcon, SoundOffIcon } from "./icons";
import { EloPill } from "../design-system/GameBadge";
import { GameButton } from "../design-system/GameButton";
import { isSoundMuted, toggleSoundMute, subscribeSoundMute } from "../design-system/sound";

interface HeaderHUDProps {
  compact?: boolean;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({ compact = false }) => {
  const { user, logout } = useAuth();
  const [muted, setMuted] = useState(isSoundMuted());

  useEffect(() => {
    return subscribeSoundMute((val) => setMuted(val));
  }, []);

  if (!user) return null;

  const currentRating =
    user.ratings && user.ratings.length > 0
      ? user.ratings[user.ratings.length - 1]?.ratingAfter
      : 1200;

  const initial = user.username ? user.username.charAt(0).toUpperCase() : "P";

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d1322] border-b-4 border-[#040711] shadow-[0_4px_16px_rgba(0,0,0,0.7)] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Crest */}
        <div className="flex items-center space-x-3.5">
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-300 shadow-[0_3px_0_#451a03] flex items-center justify-center">
            <SwordsIcon className="w-6 h-6 text-[#451a03] drop-shadow" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="font-black text-xl tracking-wider text-white drop-shadow-[0_2px_0_#000]"
                style={{ fontFamily: "var(--font-game)" }}
              >
                MATIK
              </span>
              <span className="game-ribbon game-ribbon-green !text-[9px] !py-0.5 !px-2">
                ARENA 1v1
              </span>
            </div>
            {!compact && (
              <p className="text-[11px] font-bold text-slate-400 tracking-wide hidden sm:block">
                Speed Math League
              </p>
            )}
          </div>
        </div>

        {/* HUD Status Cluster */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Live Elo Gem Pill */}
          <EloPill rating={currentRating} />

          {/* Sound FX Toggle Button */}
          <button
            onClick={() => toggleSoundMute()}
            title={muted ? "Unmute Audio FX" : "Mute Audio FX"}
            className="p-2 rounded-xl bg-[#141b2d] border-2 border-[#2b354d] text-slate-300 hover:text-amber-400 hover:border-amber-500/50 shadow-[0_2px_0_#060913] active:translate-y-0.5 transition-transform cursor-pointer"
          >
            {muted ? (
              <SoundOffIcon className="w-5 h-5 text-rose-400" />
            ) : (
              <SoundOnIcon className="w-5 h-5 text-emerald-400" />
            )}
          </button>

          {/* Player Avatar Crest */}
          <div className="flex items-center space-x-2.5 pl-2 border-l-2 border-[#1e273d]">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-indigo-500 to-indigo-800 border-2 border-amber-400 shadow-[0_2px_0_#000] text-white font-black text-sm flex items-center justify-center">
                {initial}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-black text-white leading-tight drop-shadow truncate max-w-[120px]">
                {user.username}
              </p>
              <p className="text-[10px] font-bold text-slate-400 leading-none truncate max-w-[120px]">
                {user.email}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <GameButton
            id="logout-btn"
            variant="slate"
            btnSize="sm"
            onClick={logout}
            title="Leave Arena"
            className="!px-2.5 !py-2"
          >
            <LogoutIcon className="w-4 h-4 text-rose-300" />
          </GameButton>
        </div>
      </div>
    </header>
  );
};
