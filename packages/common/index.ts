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
    status: "WAITING" | "MATCHED";
  };
};

export type GameInvitationEvent = {
  type: "GAME_INVITATION";
  payload: {
    invitationId: string;
    from: SafeUser;
  };
};

export type InvitationDeclinedEvent = {
  type: "INVITATION_DECLINED";
  payload: {
    invitationId: string;
    by: SafeUser;
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

export type GameOverEvent = {
  type: "GAME_OVER";
  payload: {
    gameId: number;
    winnerId: number | null;
    scores: Record<number, number>;
    reason: "TIME_UP" | "PLAYER_FORFEIT";
  };
};

export type ServerEvent =
  | OnlineUsersEvent
  | QueueStatusEvent
  | GameInvitationEvent
  | InvitationDeclinedEvent
  | StartGameEvent
  | AnswerResultEvent
  | ScoreUpdateEvent
  | GameOverEvent;