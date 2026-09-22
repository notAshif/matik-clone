import z, { ZodError } from "zod";


export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password is short."),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password is short."),
});

export const ZodErrorMessage = ({ error }: { error: ZodError }) => {
  return error.issues
    .map((er) => `path:${er.path.join(".")}, message:${er.message}`)
    .join(",");
};


export const mathOperatorSchema = z.enum(["+", "-", "*", "/"]);
export type MathOperator = z.infer<typeof mathOperatorSchema>;

export const safeUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().optional(),
  rating: z.number().optional(),
});
export type SafeUser = z.infer<typeof safeUserSchema>;

export const publicQuestionSchema = z.object({
  id: z.number(),
  orderIndex: z.number(),
  operand1: z.number(),
  operand2: z.number(),
  operator: mathOperatorSchema,
});
export type PublicQuestion = z.infer<typeof publicQuestionSchema>;

export interface InternalQuestion extends PublicQuestion {
  correctAnswer: number;
}


export const joinQueueSchema = z.object({
  type: z.literal("JOIN_QUEUE"),
  payload: z.record(z.string(), z.any()).optional().default({}),
});

export const leaveQueueSchema = z.object({
  type: z.literal("LEAVE_QUEUE"),
  payload: z.record(z.string(), z.any()).optional().default({}),
});

export const invitePlayerSchema = z.object({
  type: z.literal("INVITE_PLAYER"),
  payload: z.object({
    targetUserId: z.number(),
  }),
});

export const acceptGameSchema = z.object({
  type: z.literal("ACCEPT_GAME"),
  payload: z.object({
    invitationId: z.string(),
  }),
});

export const declineGameSchema = z.object({
  type: z.literal("DECLINE_GAME"),
  payload: z.object({
    invitationId: z.string(),
  }),
});

export const cancelInvitationSchema = z.object({
  type: z.literal("CANCEL_INVITATION"),
  payload: z.object({
    invitationId: z.string().optional(),
  }).optional().default({}),
});

export const submitAnswerSchema = z.object({
  type: z.literal("SUBMIT_ANSWER"),
  payload: z.object({
    gameId: z.number(),
    questionId: z.number(),
    answer: z.number(),
    timeTakenMs: z.number().optional().default(0),
  }),
});

export const clientActionSchema = z.discriminatedUnion("type", [
  joinQueueSchema,
  leaveQueueSchema,
  invitePlayerSchema,
  acceptGameSchema,
  declineGameSchema,
  cancelInvitationSchema,
  submitAnswerSchema,
]);

export type ClientAction = z.infer<typeof clientActionSchema>;

export type OnlineUsersEvent = {
  type: "ONLINE_USERS";
  payload: {
    users: SafeUser[];
  };
};

export type QueueStatusEvent = {
  type: "QUEUE_STATUS";
  payload: {
    status: "IDLE" | "WAITING" | "MATCHED";
  };
};

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";

export type InvitationEvent = {
  type: "INVITATION";
  payload: {
    invitationId: string;
    status: InvitationStatus;
    sender: SafeUser;
    recipient: SafeUser;
    role: "CHALLENGER" | "RECIPIENT";
    reason?: string;
  };
};

export type StartGameEvent = {
  type: "START_GAME";
  payload: {
    gameId: number;
    timeLimit: number;
    opponent: SafeUser;
    firstQuestion: PublicQuestion;
  };
};

export type AnswerResultEvent = {
  type: "ANSWER_RESULT";
  payload: {
    questionId: number;
    isCorrect: boolean;
    correctAnswer: number;
    myScore: number;
    nextQuestion: PublicQuestion;
  };
};

export type ScoreUpdateEvent = {
  type: "SCORE_UPDATE";
  payload: {
    scores: Record<number, number>;
  };
};

export type PlayerRatingSummary = {
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
};

export function calculateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  k = 32
): { newRatingA: number; deltaA: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const rawDeltaA = Math.round(k * (scoreA - expectedA));
  const newRatingA = Math.max(100, Math.round(ratingA + rawDeltaA));
  const deltaA = newRatingA - ratingA;
  return { newRatingA, deltaA };
}

export type GameOverEvent = {
  type: "GAME_OVER";
  payload: {
    gameId: number;
    winnerId: number | null;
    scores: Record<number, number>;
    reason: "TIME_UP" | "PLAYER_FORFEIT";
    ratings?: Record<number, PlayerRatingSummary>;
  };
};

export type ServerEvent =
  | OnlineUsersEvent
  | QueueStatusEvent
  | InvitationEvent
  | StartGameEvent
  | AnswerResultEvent
  | ScoreUpdateEvent
  | GameOverEvent;