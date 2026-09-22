import { WebSocket } from "ws";
import type { ServerEvent, SafeUser } from "@repo/common";
import type { ConnectedUser } from "./types";
import { connectedUsers } from "./state";

export function sendEvent(ws: WebSocket, event: ServerEvent): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event));
  }
}

export function toSafeUser(u: ConnectedUser | { id: number; username: string; email?: string }): SafeUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
  };
}

export function broadcastOnlineUsers(): void {
  const safeList: SafeUser[] = Array.from(connectedUsers.values()).map(toSafeUser);

  const event: ServerEvent = {
    type: "ONLINE_USERS",
    payload: { users: safeList },
  };

  const payload = JSON.stringify(event);
  for (const client of connectedUsers.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}
