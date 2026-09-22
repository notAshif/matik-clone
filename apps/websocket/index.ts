import { WebSocketServer, WebSocket } from "ws";
import { users, db, eq } from "@repo/database";
import { verify, type JwtPayload } from "jsonwebtoken";
import { clientActionSchema, type ClientAction } from "@repo/common";
import type { ConnectedUser } from "./src/types";
import { connectedUsers } from "./src/state";
import { sendEvent, broadcastOnlineUsers } from "./src/events";
import { handleAction, cleanupUser } from "./src/handlers";

// Re-export domain modules for external consumers and testing
export * from "./src/types";
export * from "./src/state";
export * from "./src/events";
export * from "./src/game";
export * from "./src/handlers";

const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (typeof import.meta !== "undefined" && import.meta.env?.JWT_SECRET) ||
  "fdsjhkhjshsgfhgfjshgfjhdfg";

const wss = new WebSocketServer({ port: PORT });
console.log(`[WebSocket] Server listening on port ${PORT}`);

wss.on("connection", (ws: WebSocket, req) => {
  const earlyMessageQueue: (string | Buffer)[] = [];
  let isReady = false;
  let actionHandler: ((action: ClientAction) => Promise<void>) | null = null;

  // 1. Immediately attach listener to avoid dropping early incoming packets
  ws.on("message", (data) => {
    if (!isReady || !actionHandler) {
      earlyMessageQueue.push(data as string | Buffer);
      return;
    }
    processMessage(data);
  });

  const processMessage = async (data: string | Buffer | ArrayBuffer | Buffer[]) => {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(data.toString());
    } catch {
      return;
    }

    const validation = clientActionSchema.safeParse(parsedJson);
    if (!validation.success) {
      console.warn(`[WebSocket] Invalid message:`, validation.error.message);
      return;
    }

    if (actionHandler) {
      await actionHandler(validation.data);
    }
  };

  (async () => {
    const token = req.url?.split("token=")[1]?.split("&")[0];

    if (!token) {
      ws.close(1008, "Token missing");
      return;
    }

    let decode: JwtPayload;
    try {
      decode = verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      ws.close(1008, "Invalid token");
      return;
    }

    const userId = Number(decode.userId ?? decode.id);
    if (!userId || isNaN(userId)) {
      ws.close(1008, "Invalid user ID in token");
      return;
    }

    let username = decode.username as string | undefined;
    let email = decode.email as string | undefined;
    try {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      if (dbUser) {
        username = dbUser.username;
        email = dbUser.email;
      }
    } catch (err) {
      console.warn(`[WebSocket] Could not query user #${userId} from db:`, err);
    }

    if (!username) {
      username = `Player_${userId}`;
    }

    const existingConn = connectedUsers.get(userId);
    if (existingConn && existingConn.ws !== ws && existingConn.ws.readyState === WebSocket.OPEN) {
      try {
        existingConn.ws.close(1000, "Replaced by newer session");
      } catch {}
    }

    const connectedUser: ConnectedUser = {
      id: userId,
      username,
      email,
      ws,
    };
    connectedUsers.set(userId, connectedUser);
    broadcastOnlineUsers();

    sendEvent(ws, {
      type: "QUEUE_STATUS",
      payload: { status: "IDLE" },
    });

    actionHandler = async (action: ClientAction) => {
      await handleAction(connectedUser, action);
    };

    ws.on("close", () => {
      if (connectedUsers.get(userId)?.ws === ws) {
        cleanupUser(userId);
      }
    });

    ws.on("error", (err) => {
      console.error(`[WebSocket] Error on client #${userId}:`, err);
      if (connectedUsers.get(userId)?.ws === ws) {
        cleanupUser(userId);
      }
    });

    // 2. Mark ready and flush any buffered actions
    isReady = true;
    while (earlyMessageQueue.length > 0) {
      const earlyMsg = earlyMessageQueue.shift()!;
      await processMessage(earlyMsg);
    }
  })().catch((err) => {
    console.error("[WebSocket] Unhandled error in connection initialization:", err);
    ws.close(1011, "Internal server error");
  });
});