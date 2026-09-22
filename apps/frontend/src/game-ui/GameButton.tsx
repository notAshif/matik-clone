import React, { type ButtonHTMLAttributes } from "react";
import { SoundFX } from "./sound";

export type GameButtonVariant = "green" | "gold" | "red" | "blue" | "cyan" | "slate";
export type GameButtonSize = "sm" | "md" | "lg" | "icon";

export interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant;
  btnSize?: GameButtonSize;
  playSound?: boolean;
}

export const GameButton: React.FC<GameButtonProps> = ({
  variant = "green",
  btnSize = "md",
  playSound = true,
  className = "",
  onClick,
  onMouseEnter,
  disabled,
  children,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && playSound) {
      SoundFX.click();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && playSound) {
      SoundFX.hover();
    }
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  const variantClass = `game-btn-${variant}`;
  const sizeClass = `game-btn-${btnSize}`;

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`game-btn ${variantClass} ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
};
