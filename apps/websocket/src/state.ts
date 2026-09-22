import type { ConnectedUser, PendingInvitation, ActiveGame } from "./types";

export const connectedUsers = new Map<number, ConnectedUser>(); // Key: userId
export const waitingQueue: ConnectedUser[] = [];
export const pendingInvitations = new Map<string, PendingInvitation>(); // Key: invitationId
export const activeGames = new Map<number, ActiveGame>(); // Key: gameId
