import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GamePanel } from "../design-system/GamePanel";
import { GameInput } from "../design-system/GameInput";
import { GameButton } from "../design-system/GameButton";
import logoImg from "../assets/logo.png";

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerSuccess } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to register");
      }

      // Automatically sign in upon registration
      const loginRes = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();

      if (loginData.data?.token) {
        await registerSuccess(loginData.data.token);
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen game-bg flex flex-col justify-center items-center px-4 select-none relative">
      <div className="max-w-md w-full animate-game-pop">
        <GamePanel
          variant="gold"
          ribbonTitle="NEW CHALLENGER"
          ribbonColor="gold"
          className="!p-8 !pt-12"
        >
          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-[#0e1626] border-3 border-amber-400/90 shadow-[0_4px_0_#060a12] flex items-center justify-center mb-3 p-2">
              <img
                src={logoImg}
                alt="MATIK"
                className="w-full h-full object-contain filter drop-shadow"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <h1
              className="text-3xl font-bold text-white drop-shadow-[0_2px_0_#000] tracking-wider game-logo-text"
              style={{ fontFamily: "var(--font-logo)" }}
            >
              FORGE ACCOUNT
            </h1>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-1">
              Join the Competitive Arithmetic League
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <GameInput
              label="Player Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@matik.com"
            />

            <GameInput
              label="Secret Key (min 8 characters)"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              error={error}
            />

            <div className="pt-2">
              <GameButton
                type="submit"
                variant="green"
                btnSize="lg"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Forging Account..." : "Forge Account & Enter"}
              </GameButton>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t-2 border-[#20293d] text-center">
            <p className="text-xs font-bold text-slate-400">
              Already a Challenger?{" "}
              <Link
                to="/login"
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2 font-black ml-1 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </GamePanel>
      </div>
    </div>
  );
};
