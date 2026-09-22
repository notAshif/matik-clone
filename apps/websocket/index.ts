import { WebSocketServer, WebSocket } from "ws";
import { users, games, db, eq } from "@repo/database";
import {verify, type JwtPayload} from "jsonwebtoken"


export type User = {
    id: number,
    username: string,
    ws: WebSocket,
}

const wss = new WebSocketServer({ port: 4000 });
const JWT_SECRET = import.meta.env.JWT_SECRET!;

const onlineUser: Map<string, User> = new Map();

wss.on("connection", async (ws, req) => {
    const token = req.url?.split("?token=")[1]

    if (!token) {
        ws.close()
        return;
    }

    const decode = verify(token, JWT_SECRET) as JwtPayload;

    if (!decode) ws.close();

    const user = await db.query.users.findFirst({
        where: eq(users.id, decode.userId)
    })

    if (!user) {
        ws.close()
        return;
    }

    onlineUser.set(decode.id, {
        id: user.id,
        ws,
        username: user.username,
    })

    wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(
                JSON.stringify({
                    type: "ONLINE_USER",
                    payload: {
                        user: Array.from(onlineUser.entries())
                    }
                })
            )
        }
    })
});
