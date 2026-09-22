import type { WebSocket } from "ws";
import type { InternalQuestion } from "@repo/common";

export interface ConnectedUser {
  id: number;
  username: string;
  email?: string;
  ws: WebSocket;
}

export interface PlayerAnswerRecord {
  gameId: number;
  questionId: number;
  userId: number;
  submittedAnswer: number;
  isCorrect: boolean;
  timeTakenMs: number;
}

export interface ActiveGame {
  id: number;
  players: [ConnectedUser, ConnectedUser];
  scores: Record<number, number>; // userId -> score
  userQuestionIndex: Record<number, number>; // userId -> index in questions array
  questions: InternalQuestion[];
  answeredRecords: PlayerAnswerRecord[];
  startTime: Date;
  timeLimit: number;
  timer: ReturnType<typeof setTimeout>;
  isSettled: boolean;
}

export interface PendingInvitation {
  id: string;
  fromUser: ConnectedUser;
  toUser: ConnectedUser;
  timeout: ReturnType<typeof setTimeout>;
}
