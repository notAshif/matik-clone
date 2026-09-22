import { describe, expect, it } from "bun:test";
import { clientActionSchema } from "@repo/common";

describe("Client Action Protocol Validation", () => {
  it("validates JOIN_QUEUE", () => {
    const res = clientActionSchema.safeParse({ type: "JOIN_QUEUE" });
    expect(res.success).toBe(true);
  });

  it("validates LEAVE_QUEUE", () => {
    const res = clientActionSchema.safeParse({ type: "LEAVE_QUEUE" });
    expect(res.success).toBe(true);
  });

  it("validates INVITE_PLAYER with targetUserId", () => {
    const valid = clientActionSchema.safeParse({
      type: "INVITE_PLAYER",
      payload: { targetUserId: 42 },
    });
    expect(valid.success).toBe(true);

    const invalid = clientActionSchema.safeParse({
      type: "INVITE_PLAYER",
      payload: {},
    });
    expect(invalid.success).toBe(false);
  });

  it("validates ACCEPT_GAME with invitationId", () => {
    const valid = clientActionSchema.safeParse({
      type: "ACCEPT_GAME",
      payload: { invitationId: "uuid-123" },
    });
    expect(valid.success).toBe(true);
  });

  it("validates DECLINE_GAME with invitationId", () => {
    const valid = clientActionSchema.safeParse({
      type: "DECLINE_GAME",
      payload: { invitationId: "uuid-123" },
    });
    expect(valid.success).toBe(true);
  });

  it("validates SUBMIT_ANSWER", () => {
    const valid = clientActionSchema.safeParse({
      type: "SUBMIT_ANSWER",
      payload: {
        gameId: 10,
        questionId: 1,
        answer: 24,
        timeTakenMs: 1420,
      },
    });
    expect(valid.success).toBe(true);

    const missingAnswer = clientActionSchema.safeParse({
      type: "SUBMIT_ANSWER",
      payload: {
        gameId: 10,
        questionId: 1,
      },
    });
    expect(missingAnswer.success).toBe(false);
  });

  it("rejects unknown action types", () => {
    const unknown = clientActionSchema.safeParse({
      type: "UNKNOWN_ACTION",
      payload: {},
    });
    expect(unknown.success).toBe(false);
  });
});
