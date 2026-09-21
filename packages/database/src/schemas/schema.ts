import {
  pgTable,
  pgEnum,
  integer,
  varchar,
  timestamp,
  boolean,
  doublePrecision,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const gameStatusEnum = pgEnum("game_status", [
  "waiting",
  "in_progress",
  "completed",
  "abandoned",
]);

export const mathOperatorEnum = pgEnum("math_operator", [
  "+",
  "-",
  "*",
  "/",
]);

export const friendStatusEnum = pgEnum("friend_status", [
  "pending",
  "accepted",
  "rejected",
]);


export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  status: gameStatusEnum("status").default("waiting").notNull(),
  timeLimit: integer("time_limit").default(60).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const gameMembers = pgTable(
  "game_members",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").default(0).notNull(),
    rank: integer("rank"),
    isWinner: boolean("is_winner").default(false).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("game_members_game_user_idx").on(table.gameId, table.userId),
    index("game_members_user_idx").on(table.userId),
  ]
);

export const questions = pgTable(
  "questions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    operand1: integer("operand1").notNull(),
    operand2: integer("operand2").notNull(),
    operator: mathOperatorEnum("operator").notNull(),
    correctAnswer: integer("correct_answer").notNull(),
    orderIndex: integer("order_index").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("questions_game_order_idx").on(table.gameId, table.orderIndex),
  ]
);

export const questionAnswers = pgTable(
  "question_answers",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    submittedAnswer: integer("submitted_answer").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    timeTakenMs: integer("time_taken_ms"),
    answeredAt: timestamp("answered_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("question_answers_game_q_user_idx").on(table.gameId, table.questionId, table.userId),
    index("question_answers_user_idx").on(table.userId),
  ]
);

export const friends = pgTable(
  "friends",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: integer("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("friends_sender_receiver_idx").on(table.senderId, table.receiverId),
    index("friends_receiver_idx").on(table.receiverId),
    check("friends_not_self_check", sql`${table.senderId} != ${table.receiverId}`),
  ]
);

export const ratings = pgTable(
  "ratings",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    ratingBefore: doublePrecision("rating_before").notNull(),
    ratingAfter: doublePrecision("rating_after").notNull(),
    ratingChange: doublePrecision("rating_change").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ratings_user_created_idx").on(table.userId, table.createdAt),
    index("ratings_game_idx").on(table.gameId),
  ]
);

export const UsersTable = users;
export const GamesTable = games;


export const usersRelations = relations(users, ({ many }) => ({
  gameMembers: many(gameMembers),
  questionAnswers: many(questionAnswers),
  ratings: many(ratings),
  sentFriendRequests: many(friends, { relationName: "sentFriendRequests" }),
  receivedFriendRequests: many(friends, { relationName: "receivedFriendRequests" }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  gameMembers: many(gameMembers),
  questions: many(questions),
  questionAnswers: many(questionAnswers),
  ratings: many(ratings),
}));

export const gameMembersRelations = relations(gameMembers, ({ one }) => ({
  game: one(games, {
    fields: [gameMembers.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [gameMembers.userId],
    references: [users.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  game: one(games, {
    fields: [questions.gameId],
    references: [games.id],
  }),
  answers: many(questionAnswers),
}));

export const questionAnswersRelations = relations(questionAnswers, ({ one }) => ({
  game: one(games, {
    fields: [questionAnswers.gameId],
    references: [games.id],
  }),
  question: one(questions, {
    fields: [questionAnswers.questionId],
    references: [questions.id],
  }),
  user: one(users, {
    fields: [questionAnswers.userId],
    references: [users.id],
  }),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  sender: one(users, {
    fields: [friends.senderId],
    references: [users.id],
    relationName: "sentFriendRequests",
  }),
  receiver: one(users, {
    fields: [friends.receiverId],
    references: [users.id],
    relationName: "receivedFriendRequests",
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [ratings.gameId],
    references: [games.id],
  }),
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Game = InferSelectModel<typeof games>;
export type NewGame = InferInsertModel<typeof games>;

export type GameMember = InferSelectModel<typeof gameMembers>;
export type NewGameMember = InferInsertModel<typeof gameMembers>;

export type Question = InferSelectModel<typeof questions>;
export type NewQuestion = InferInsertModel<typeof questions>;

export type QuestionAnswer = InferSelectModel<typeof questionAnswers>;
export type NewQuestionAnswer = InferInsertModel<typeof questionAnswers>;

export type Friend = InferSelectModel<typeof friends>;
export type NewFriend = InferInsertModel<typeof friends>;

export type Rating = InferSelectModel<typeof ratings>;
export type NewRating = InferInsertModel<typeof ratings>;

export type GameStatus = (typeof gameStatusEnum.enumValues)[number];
export type MathOperator = (typeof mathOperatorEnum.enumValues)[number];
export type FriendStatus = (typeof friendStatusEnum.enumValues)[number];