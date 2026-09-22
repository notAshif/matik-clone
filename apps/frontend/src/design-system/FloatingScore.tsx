import React, { useEffect, useState } from "react";

export interface FloatingScoreProps {
  text: string;
  type?: "positive" | "negative";
  onComplete?: () => void;
}

export const FloatingScore: React.FC<FloatingScoreProps> = ({
  text,
  type = "positive",
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 900);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`absolute z-30 pointer-events-none font-black text-2xl tracking-wider select-none animate-float-score ${
        type === "positive"
          ? "text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.8)]"
          : "text-rose-400 drop-shadow-[0_2px_8px_rgba(239,68,68,0.8)]"
      }`}
      style={{
        fontFamily: "var(--font-arcade)",
        WebkitTextStroke: "1px #000",
      }}
    >
      {text}
    </div>
  );
};
