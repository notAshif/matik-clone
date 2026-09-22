import React from "react";

/**
 * Base game-style Skeleton element with animated tactile shimmer
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      className={`bg-[#080d1a] border border-[#1e293d] rounded-xl animate-shimmer ${className}`}
    />
  );
};

/**
 * Skeleton placeholder for the Online Story Bar
 */
export const StoryBarSkeleton: React.FC = () => {
  return (
    <div className="game-panel p-3! w-full select-none">
      <div className="game-inset p-3 flex items-center space-x-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center shrink-0 space-y-2">
            <Skeleton className="w-14! h-14! rounded-full! border-2 border-[#2b354d]" />
            <Skeleton className="w-12! h-3! rounded!" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton placeholder for Top Header HUD
 */
export const HeaderHUDSkeleton: React.FC = () => {
  return (
    <header className="game-panel rounded-none! border-x-0! border-t-0! border-b-3! p-3! sm:p-4! sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10! h-10! rounded-xl!" />
          <div className="space-y-1">
            <Skeleton className="w-24! h-5! rounded!" />
            <Skeleton className="w-16! h-2.5! rounded!" />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Skeleton className="w-24! h-8! rounded-full! hidden sm:block" />
          <Skeleton className="w-20! h-8! rounded-full!" />
          <Skeleton className="w-16! h-8! rounded-xl!" />
        </div>
      </div>
    </header>
  );
};

/**
 * Main contents skeleton for Dashboard / Arena
 */
export const DashboardMainSkeleton: React.FC = () => {
  return (
    <>
      <StoryBarSkeleton />

      <div className="max-w-3xl mx-auto w-full space-y-6">
        <div className="game-panel p-8! sm:p-10! pt-12! relative">
          {/* Top Ribbon skeleton */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <Skeleton className="w-44! h-7! rounded-lg!" />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="w-3/5! h-9! rounded-lg!" />
              <Skeleton className="w-full! h-4! rounded!" />
              <Skeleton className="w-4/5! h-4! rounded!" />
            </div>

            <div className="pt-2">
              <Skeleton className="w-56! h-14! rounded-2xl!" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Full page skeleton for Dashboard / Arena Entrance
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen game-bg text-slate-100 flex flex-col select-none">
      <HeaderHUDSkeleton />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        <DashboardMainSkeleton />
      </main>
    </div>
  );
};

/**
 * Main contents skeleton for Champion Profile
 */
export const ProfileMainSkeleton: React.FC = () => {
  return (
    <>
      <div className="flex items-center justify-between">
        <Skeleton className="w-32! h-8! rounded-xl!" />
        <Skeleton className="w-28! h-6! rounded-full!" />
      </div>

      {/* Hero Profile Card Skeleton */}
      <div className="game-panel p-6! sm:p-8! pt-10! relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Skeleton className="w-44! h-7! rounded-lg!" />
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Skeleton className="w-24! h-24! sm:w-28! sm:h-28! rounded-3xl! shrink-0" />

          <div className="flex-1 space-y-3 w-full sm:w-auto text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Skeleton className="w-48! h-8! rounded-lg!" />
              <Skeleton className="w-28! h-6! rounded-full!" />
            </div>
            <Skeleton className="w-56! h-4! rounded!" />
            <Skeleton className="w-40! h-6! rounded-full!" />
          </div>

          <Skeleton className="w-32! h-10! rounded-xl! shrink-0" />
        </div>

        {/* Performance Tablets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t-2 border-[#20293d]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="game-inset p-3.5 space-y-2">
              <Skeleton className="w-20! h-3! rounded! mx-auto" />
              <Skeleton className="w-14! h-7! rounded! mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Combat History Card Skeleton */}
      <div className="game-panel p-6! pt-8! relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Skeleton className="w-40! h-7! rounded-lg!" />
        </div>

        <div className="space-y-3 mt-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="game-inset p-3.5! flex items-center justify-between border-2 border-[#20293d]"
            >
              <div className="flex items-center space-x-3.5">
                <Skeleton className="w-10! h-10! rounded-xl! shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="w-32! h-4! rounded!" />
                  <Skeleton className="w-20! h-3! rounded!" />
                </div>
              </div>
              <Skeleton className="w-16! h-6! rounded!" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

/**
 * Full page skeleton for Champion Profile
 */
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen game-bg text-slate-100 flex flex-col select-none">
      <HeaderHUDSkeleton />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <ProfileMainSkeleton />
      </main>
    </div>
  );
};

/**
 * Question card skeleton inside Arena duel screen
 */
export const QuestionSkeleton: React.FC = () => {
  return (
    <div className="max-w-xl w-full mx-auto animate-game-pop">
      <div className="game-panel p-8! sm:p-12! text-center relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Skeleton className="w-36! h-7! rounded-lg!" />
        </div>
        <div className="game-inset p-8 sm:p-10 flex items-center justify-center space-x-4">
          <Skeleton className="w-20! h-14! sm:w-28! sm:h-20! rounded-2xl!" />
          <Skeleton className="w-10! h-10! sm:w-14! sm:h-14! rounded-xl!" />
          <Skeleton className="w-20! h-14! sm:w-28! sm:h-20! rounded-2xl!" />
          <span className="text-3xl sm:text-5xl font-black text-slate-600">=</span>
          <Skeleton className="w-12! h-14! sm:w-16! sm:h-20! rounded-2xl!" />
        </div>
      </div>
    </div>
  );
};
