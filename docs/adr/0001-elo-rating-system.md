# ADR 0001: Elo Rating System ($K=32$) for 1v1 Competitive Matches

## Context
Matik is a real-time competitive arithmetic platform. Players compete in timed 1v1 matches. Previously, ratings were not updated on game completion, leaving player progression static and unranked.

## Decision
We adopt the standard Elo rating calculation formula with $K=32$ applied on match conclusion:
1. **Expected Score**:
   $$E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}, \quad E_B = \frac{1}{1 + 10^{(R_A - R_B)/400}}$$
2. **Actual Score ($S$)**:
   - Win: $S = 1$
   - Loss: $S = 0$
   - Draw: $S = 0.5$
3. **Rating Update**:
   $$R'_A = \text{round}(R_A + 32 \times (S_A - E_A))$$
   $$R'_B = \text{round}(R_B + 32 \times (S_B - E_B))$$
4. **Rating Floor**: Ratings cannot drop below `100`.
5. **Forfeit & Disconnect**: If a player disconnects or forfeits, they receive $S = 0$ (loss) and the remaining opponent receives $S = 1$ (win).
6. **Persistence**: Rating transitions are persisted in the `ratings` database table (`rating_before`, `rating_after`, `rating_change`) and broadcast in the `GAME_OVER` event.

## Consequences
- Authentic skill tracking: upsets award more points; beating much lower-ranked opponents awards fewer points.
- Zero rating inflation compared to arbitrary fixed deltas ($\pm 25$).
- Historical auditability: every match outcome is linked to exact rating deltas.
