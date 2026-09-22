import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type {
  SafeUser,
  ServerEvent,
  ClientAction,
  StartGameEvent,
  AnswerResultEvent,
  GameOverEvent,
} from "@repo/common";
import { useAuth } from "./AuthContext";

interface WebSocketContextType {
  isConnected: boolean;
  onlineUsers: SafeUser[];
  queueStatus: "IDLE" | "WAITING" | "MATCHED";
  incomingInvite: { invitationId: string; from: SafeUser } | null;
  activeGame: StartGameEvent["payload"] | null;
  latestAnswerResult: AnswerResultEvent["payload"] | null;
  liveScores: Record<number, number>;
  gameOver: GameOverEvent["payload"] | null;
  joinQueue: () => void;
  leaveQueue: () => void;
  invitePlayer: (targetUserId: number) => void;
  acceptGame: (invitationId: string) => void;
  declineGame: (invitationId: string) => void;
  submitAnswer: (gameId: number, questionId: number, answer: number, timeTakenMs: number) => void;
  resetGame: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const WS_URL = "ws://localhost:4000";

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<SafeUser[]>([]);
  const [queueStatus, setQueueStatus] = useState<"IDLE" | "WAITING" | "MATCHED">("IDLE");
  const [incomingInvite, setIncomingInvite] = useState<{ invitationId: string; from: SafeUser } | null>(null);
  const [activeGame, setActiveGame] = useState<StartGameEvent["payload"] | null>(null);
  const [latestAnswerResult, setLatestAnswerResult] = useState<AnswerResultEvent["payload"] | null>(null);
  const [liveScores, setLiveScores] = useState<Record<number, number>>({});
  const [gameOver, setGameOver] = useState<GameOverEvent["payload"] | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      setOnlineUsers([]);
      return;
    }

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerEvent;
        handleServerEvent(data);
      } catch (err) {
        console.error("Failed to parse incoming WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
    };

    ws.onerror = (err) => {
      console.error("WebSocket encountered error:", err);
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [token]);

  const handleServerEvent = (event: ServerEvent) => {
    switch (event.type) {
      case "ONLINE_USERS":
        setOnlineUsers(event.payload.users);
        break;

      case "QUEUE_STATUS":
        setQueueStatus(event.payload.status === "WAITING" ? "WAITING" : "IDLE");
        break;

      case "GAME_INVITATION":
        setIncomingInvite(event.payload);
        break;

      case "INVITATION_DECLINED":
        alert(`${event.payload.by.username} declined your game challenge.`);
        break;

      case "START_GAME":
        setQueueStatus("MATCHED");
        setActiveGame(event.payload);
        setLatestAnswerResult(null);
        setGameOver(null);
        setLiveScores({
          [user?.id ?? 0]: 0,
          [event.payload.opponent.id]: 0,
        });
        break;

      case "ANSWER_RESULT":
        setLatestAnswerResult(event.payload);
        break;

      case "SCORE_UPDATE":
        setLiveScores(event.payload.scores);
        break;

      case "GAME_OVER":
        setGameOver(event.payload);
        setQueueStatus("IDLE");
        break;
    }
  };

  const sendAction = (action: ClientAction) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(action));
    }
  };

  const joinQueue = () => {
    setQueueStatus("WAITING");
    sendAction({ type: "JOIN_QUEUE", payload: {} });
  };

  const leaveQueue = () => {
    setQueueStatus("IDLE");
    sendAction({ type: "LEAVE_QUEUE", payload: {} });
  };

  const invitePlayer = (targetUserId: number) => {
    sendAction({
      type: "INVITE_PLAYER",
      payload: { targetUserId },
    });
  };

  const acceptGame = (invitationId: string) => {
    setIncomingInvite(null);
    sendAction({
      type: "ACCEPT_GAME",
      payload: { invitationId },
    });
  };

  const declineGame = (invitationId: string) => {
    setIncomingInvite(null);
    sendAction({
      type: "DECLINE_GAME",
      payload: { invitationId },
    });
  };

  const submitAnswer = (
    gameId: number,
    questionId: number,
    answer: number,
    timeTakenMs: number
  ) => {
    sendAction({
      type: "SUBMIT_ANSWER",
      payload: { gameId, questionId, answer, timeTakenMs },
    });
  };

  const resetGame = () => {
    setActiveGame(null);
    setLatestAnswerResult(null);
    setGameOver(null);
    setLiveScores({});
    setQueueStatus("IDLE");
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        onlineUsers,
        queueStatus,
        incomingInvite,
        activeGame,
        latestAnswerResult,
        liveScores,
        gameOver,
        joinQueue,
        leaveQueue,
        invitePlayer,
        acceptGame,
        declineGame,
        submitAnswer,
        resetGame,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
