import { type InputHTMLAttributes, forwardRef } from "react";

export interface GameInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
}

export const GameInput = forwardRef<HTMLInputElement, GameInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 drop-shadow">
            {label}
          </label>
        )}
        <input
          ref={ref}
          {...props}
          className={`game-input px-4 py-3 text-base placeholder:text-slate-600 ${
            error ? "border-rose-500! ring-2! ring-rose-500/20!" : ""
          } ${className}`}
        />
        {error && (
          <p className="mt-1.5 text-xs font-bold text-rose-400 flex items-center space-x-1 animate-shake">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

GameInput.displayName = "GameInput";
