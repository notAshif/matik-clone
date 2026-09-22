import { describe, expect, it } from "bun:test";
import { WebSocket } from "ws";
import { sign } from "jsonwebtoken";
import "../index.ts";

const JWT_SECRET = process.env.JWT_SECRET || "fdsjhkhjshsgfhgfjshgfjhdfg";
const WS_URL = "ws://localhost:4000";

describe("Real-Time Multiplayer Game Loop Integration", () => {
  it("completes full match lifecycle: handshake -> queue -> start -> answer -> forfeit", async () => {
    const token1 = sign({ userId: 8881, username: "PlayerOne" }, JWT_SECRET);
    const token2 = sign({ userId: 8882, username: "PlayerTwo" }, JWT_SECRET);

    const client1 = new WebSocket(`${WS_URL}?token=${token1}`);
    const client2 = new WebSocket(`${WS_URL}?token=${token2}`);

    const client1Messages: any[] = [];
    const client2Messages: any[] = [];

    await new Promise<void>((resolve) => {
      let openCount = 0;
      const checkOpen = () => {
        openCount++;
        if (openCount === 2) resolve();
      };
      client1.on("open", checkOpen);
      client2.on("open", checkOpen);
    });

    client1.on("message", (msg) => client1Messages.push(JSON.parse(msg.toString())));
    client2.on("message", (msg) => client2Messages.push(JSON.parse(msg.toString())));

    // Allow online users broadcast to arrive
    await new Promise((r) => setTimeout(r, 100));

    // Both should receive ONLINE_USERS
    const onlineEvent1 = client1Messages.find((m) => m.type === "ONLINE_USERS");
    expect(onlineEvent1).toBeDefined();
    expect(onlineEvent1.payload.users.some((u: any) => u.id === 8881)).toBe(true);
    expect(onlineEvent1.payload.users.some((u: any) => u.id === 8882)).toBe(true);

    // Player 1 joins queue
    client1.send(JSON.stringify({ type: "JOIN_QUEUE" }));
    await new Promise((r) => setTimeout(r, 50));

    // Player 2 joins queue -> Match should start!
    client2.send(JSON.stringify({ type: "JOIN_QUEUE" }));
    await new Promise((r) => setTimeout(r, 150));

    const startMsg1 = client1Messages.find((m) => m.type === "START_GAME");
    const startMsg2 = client2Messages.find((m) => m.type === "START_GAME");

    expect(startMsg1).toBeDefined();
    expect(startMsg2).toBeDefined();
    expect(startMsg1.payload.gameId).toBe(startMsg2.payload.gameId);
    expect(startMsg1.payload.opponent.id).toBe(8882);
    expect(startMsg2.payload.opponent.id).toBe(8881);

    // Verify first question is sanitized
    const q1 = startMsg1.payload.firstQuestion;
    expect(q1.correctAnswer).toBeUndefined();

    // Player 1 submits answer for first question
    client1.send(
      JSON.stringify({
        type: "SUBMIT_ANSWER",
        payload: {
          gameId: startMsg1.payload.gameId,
          questionId: q1.id,
          answer: 9999, // Intentional answer to check validation response
          timeTakenMs: 1200,
        },
      })
    );

    await new Promise((r) => setTimeout(r, 100));

    const answerResult = client1Messages.find((m) => m.type === "ANSWER_RESULT");
    expect(answerResult).toBeDefined();
    expect(answerResult.payload.questionId).toBe(q1.id);
    expect(answerResult.payload.nextQuestion).toBeDefined();

    // Verify live score broadcast was received
    const scoreUpdate = client1Messages.find((m) => m.type === "SCORE_UPDATE");
    expect(scoreUpdate).toBeDefined();

    // Player 2 disconnects -> triggers player forfeit for Player 1
    client2.close();
    await new Promise((r) => setTimeout(r, 150));

    const gameOver = client1Messages.find((m) => m.type === "GAME_OVER");
    expect(gameOver).toBeDefined();
    expect(gameOver.payload.winnerId).toBe(8881);
    expect(gameOver.payload.reason).toBe("PLAYER_FORFEIT");

    client1.close();
  });
});
