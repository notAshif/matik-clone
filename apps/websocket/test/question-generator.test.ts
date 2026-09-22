import { describe, expect, it } from "bun:test";
import { generateQuestion, toPublicQuestion, generateQuestionBatch } from "../index.ts";

describe("Question Generator & Public Sanitizer", () => {
  it("generates a question with precomputed correct answer matching operands and operator", () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion(i);
      expect(q.id).toBe(i + 1);
      expect(q.orderIndex).toBe(i);
      expect(["+", "-", "*", "/"]).toContain(q.operator);

      switch (q.operator) {
        case "+":
          expect(q.correctAnswer).toBe(q.operand1 + q.operand2);
          break;
        case "-":
          expect(q.correctAnswer).toBe(q.operand1 - q.operand2);
          break;
        case "*":
          expect(q.correctAnswer).toBe(q.operand1 * q.operand2);
          break;
        case "/":
          expect(q.correctAnswer).toBe(q.operand1 / q.operand2);
          expect(Number.isInteger(q.correctAnswer)).toBe(true);
          break;
      }
    }
  });

  it("toPublicQuestion completely omits correctAnswer", () => {
    const internal = generateQuestion(0);
    const pub = toPublicQuestion(internal);

    expect(pub.id).toBe(internal.id);
    expect(pub.orderIndex).toBe(internal.orderIndex);
    expect(pub.operand1).toBe(internal.operand1);
    expect(pub.operand2).toBe(internal.operand2);
    expect(pub.operator).toBe(internal.operator);
    expect((pub as any).correctAnswer).toBeUndefined();
  });

  it("generateQuestionBatch creates the requested count of unique ordered questions", () => {
    const batch = generateQuestionBatch(25);
    expect(batch.length).toBe(25);
    expect(batch[0]?.orderIndex).toBe(0);
    expect(batch[24]?.orderIndex).toBe(24);
  });
});
