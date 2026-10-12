"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Cookies from "js-cookie";

/* ============================================================
   URL QUERY PARAMS (SAFE, CLIENT-ONLY)
============================================================ */

const LOCATION_CHANGE_EVENT = "playspark:locationchange";
let historyPatched = false;

const patchHistoryOnce = () => {
  if (typeof window === "undefined") return;
  if (historyPatched) return;
  historyPatched = true;

  let notifyScheduled = false;

  const notify = () => {
    // IMPORTANT:
    // Some libraries call history.pushState/replaceState during React's
    // useInsertionEffect phase. Dispatching synchronously can cause our
    // listeners to schedule React state updates during that phase, which React
    // warns about ("useInsertionEffect must not schedule updates").
    // Defer the event to a microtask and coalesce bursts.
    if (notifyScheduled) return;
    notifyScheduled = true;

    const fire = () => {
      notifyScheduled = false;
      try {
        window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
      } catch {
        // ignore
      }
    };

    if (typeof queueMicrotask === "function") {
      queueMicrotask(fire);
    } else {
      Promise.resolve().then(fire);
    }
  };

  const originalPush = window.history.pushState;
  const originalReplace = window.history.replaceState;

  window.history.pushState = function (...args) {
    const ret = originalPush.apply(this, args as any);
    notify();
    return ret;
  };

  window.history.replaceState = function (...args) {
    const ret = originalReplace.apply(this, args as any);
    notify();
    return ret;
  };
};

type UrlQueryParamsSnapshot = {
  queryParams: URLSearchParams;
  xToken: string | null;
  isApp: boolean;
  roomId: string | null;
  isHost: boolean;
  userId: string | null;
};

const readUrlQueryParams = (): UrlQueryParamsSnapshot => {
  const safeSearch =
    typeof window !== "undefined" ? window.location.search : "";
  const queryParams = new URLSearchParams(safeSearch);
  return {
    queryParams,
    xToken: queryParams.get("x-token"),
    isApp: queryParams.get("isApp") === "true",
    roomId: queryParams.get("roomId"),
    isHost: queryParams.get("isHost") === "true",
    userId: queryParams.get("userId"),
  };
};

// Backwards-compatible export that stays fresh across client navigations.
export const urlQueryParams = {
  get queryParams() {
    return readUrlQueryParams().queryParams;
  },
  get xToken() {
    return readUrlQueryParams().xToken;
  },
  get isApp() {
    return readUrlQueryParams().isApp;
  },
  get roomId() {
    return readUrlQueryParams().roomId;
  },
  get isHost() {
    return readUrlQueryParams().isHost;
  },
  get userId() {
    return readUrlQueryParams().userId;
  },
};

export const useUrlQueryParams = (): UrlQueryParamsSnapshot => {
  const [search, setSearch] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.location.search;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    patchHistoryOnce();

    const onChange = () => {
      setSearch(window.location.search);
    };

    window.addEventListener("popstate", onChange);
    window.addEventListener(LOCATION_CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener(LOCATION_CHANGE_EVENT, onChange);
    };
  }, []);

  return useMemo(() => {
    const queryParams = new URLSearchParams(search);
    return {
      queryParams,
      xToken: queryParams.get("x-token"),
      isApp: queryParams.get("isApp") === "true",
      roomId: queryParams.get("roomId"),
      isHost: queryParams.get("isHost") === "true",
      userId: queryParams.get("userId"),
    };
  }, [search]);
};

const sanitizeToken = (value?: string | null): string | null => {
  if (!value) return null;
  return value.replaceAll("%22", "").replaceAll('"', "").trim() || null;
};

const normalizeLeaderBoardDataEvent = (
  value: unknown
): LeaderBoardDataEvent | null => {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.type !== "leader-board-data") return null;

  const gameId = v.gameId;
  if (typeof gameId !== "string") return null;

  const roomId = typeof v.roomId === "string" ? v.roomId : undefined;
  const rawPlayers = Array.isArray(v.players) ? v.players : [];

  // Backend may emit duplicate entries for the same userId.
  // Store unique users only: add if missing, otherwise update (last one wins).
  const byUserId = new Map<string, LeaderBoardDataEvent["players"][number]>();
  for (const raw of rawPlayers) {
    if (typeof raw !== "object" || raw === null) continue;
    const p: any = raw;
    const userId = String(p.userId ?? "").trim();
    if (!userId) continue;
    byUserId.set(userId, {
      userId,
      hostId: String(p.hostId ?? ""),
      avatar: String(p.avatar ?? ""),
      userName: String(p.userName ?? ""),
      status: String(p.status ?? ""),
      score: Number(p.score ?? 0),
    });
  }

  const players = Array.from(byUserId.values());

  return {
    type: "leader-board-data",
    gameId,
    ...(roomId ? { roomId } : {}),
    players,
  };
};

const isGameStartedEvent = (
  value: unknown
): value is {
  type: "game-starting" | "start-game" | "game-started";
  gameId: string;
  roomId: string;
} => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (
    v.type !== "game-starting" &&
    v.type !== "start-game" &&
    v.type !== "game-started"
  ) {
    return false;
  }
  return typeof v.gameId === "string" && typeof v.roomId === "string";
};

/* ============================================================
   TYPES
============================================================ */

/* ---------- OUTGOING EVENTS ---------- */

export type WebSocketOutgoingEvent =
  | {
      type: "invite-player";
      gameId: string;
      userId: string;
      userIds: string[];
    }
  | {
      type: "leader-board-data";
      gameId: string;
      roomId?: string;
    }
  | {
      type: "user-ready";
      gameId: string;
      userId: string;
      roomId: string;
    }
  | {
      type: "start-game";
      gameId: string;
      userId: string;
      roomId: string;
    }
  | {
      type: "score-update";
      gameId: string;
      roomId: string;
      userId: string;
      score: number;
    }
  | {
      type: "leave-game";
      userId: string;
      gameId: string;
      roomId: string;
    }
  | {
      type: "get-invited-games";
      userId: string;
    };

/* ---------- INCOMING EVENTS ---------- */

export interface LeaderBoardDataEvent {
  type: "leader-board-data";
  gameId: string;
  roomId?: string;
  players: {
    userId: string;
    hostId: string;
    avatar: string;
    userName: string;
    status: string;
    score: number;
  }[];
}

export type WebSocketIncomingEvent =
  | LeaderBoardDataEvent
  | {
      type: "game-starting";
      gameId: string;
      roomId: string;
    }
  | {
      // Some backends emit this when the host presses Start Game
      type: "start-game";
      gameId: string;
      roomId: string;
    }
  | {
      // Common alternative naming
      type: "game-started";
      gameId: string;
      roomId: string;
    }
  | {
      type: Exclude<
        string,
        "leader-board-data" | "game-starting" | "congratulations" | "game-end"
      >;
      [key: string]: unknown;
    }
  | {
      type: "congratulations";
      message: string;
      gameId: string;
    }
  | {
      type: "invited-games";
      games: {
        gameId: string;
        hostId: string;
        hostName: string;
        inviteLink: string;
        invitedAt: string;
        roomId: string;
      }[];
    };

/* ============================================================
   CONTEXT
============================================================ */

type WebSocketContextType = {
  isConnected: boolean;
  leaderboard: LeaderBoardDataEvent | null;
  roomId: string | null;
  isGameStarted: {
    gameId: string;
    roomId: string;
    type: "game-starting";
  } | null;
  getCongratulations: {
    type: "congratulations";
    message: string;
    gameId: string;
    roomId: string;
  } | null;
  otherInvitedGames: {
    type: "invited-games";
    games: {
      gameId: string;
      hostId: string;
      hostName: string;
      inviteLink: string;
      invitedAt: string;
      roomId: string;
    }[];
  } | null;
  newInvitation: {
    gameId: string;
    hostId: string;
    hostName: string;
    inviteLink: string;
    invitedAt: string;
    roomId: string;
    type: "invite-link";
  } | null;
  error: { type: "error"; message: string } | null;
  sendEvent: (event: WebSocketOutgoingEvent) => void;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

/* ============================================================
   PROVIDER
============================================================ */

export const WebSocketProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const socketRef = useRef<WebSocket | null>(null);
  const pendingEventsRef = useRef<WebSocketOutgoingEvent[]>([]);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);
  const activeAuthTokenRef = useRef<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderBoardDataEvent | null>(
    null
  );
  const [getCongratulations, setGetCongratulations] = useState<{
    type: "congratulations";
    message: string;
    gameId: string;
    roomId: string;
  } | null>(null);
  const [otherInvitedGames, setOtherInvitedGames] = useState<{
    type: "invited-games";
    games: {
      gameId: string;
      hostId: string;
      hostName: string;
      inviteLink: string;
      invitedAt: string;
      roomId: string;
    }[];
  } | null>(null);
  const [newInvitation, setNewInvitation] = useState<{
    gameId: string;
    hostId: string;
    hostName: string;
    inviteLink: string;
    invitedAt: string;
    roomId: string;
    type: "invite-link";
  } | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState<{
    gameId: string;
    roomId: string;
    type: "game-starting";
  } | null>(null);
  const [error, setErrorData] = useState<{
    type: "error";
    message: string;
  } | null>(null);

  const token = Cookies.get("accessToken");

  const qp = useUrlQueryParams();

  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.location.pathname;
  });

  // Track client-side navigations so we can clear stale game state when leaving /game/*.
  useEffect(() => {
    if (typeof window === "undefined") return;
    patchHistoryOnce();

    const onChange = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", onChange);
    window.addEventListener(LOCATION_CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener(LOCATION_CHANGE_EVENT, onChange);
    };
  }, []);

  useEffect(() => {
    // If we are not on a game route, drop any previous leaderboard snapshot.
    // Otherwise, navigating back into a game screen can re-persist stale data.
    const inGameRoute = pathname.startsWith("/game/");
    if (inGameRoute) return;

    setLeaderboard(null);
    setGetCongratulations(null);
    setIsGameStarted(null);
    setRoomId(null);
  }, [pathname]);

  /* ============================================================
     AUTH TOKEN (COOKIE → QUERY)
  ============================================================ */

  const authToken = useMemo(() => {
    if (typeof window === "undefined") return null;

    const queryToken = sanitizeToken(qp.xToken) || sanitizeToken(token);

    return queryToken;
  }, [qp.xToken, token]);

  /* 
  ============================================================
     SEND EVENT
  ============================================================ 
  */

  const sendEvent = useCallback((event: WebSocketOutgoingEvent) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      pendingEventsRef.current.push(event);
      console.warn("⚠️ WS not ready, event queued:", event);
      return;
    }

    socket.send(JSON.stringify(event));
    console.log("➡️ WS sent:", event);
  }, []);

  const connect = useCallback(() => {
    if (!authToken) return;

    // If auth token changed, the WS URL changes. Force a clean reconnect.
    if (
      activeAuthTokenRef.current &&
      activeAuthTokenRef.current !== authToken
    ) {
      try {
        shouldReconnectRef.current = false;
        socketRef.current?.close();
      } catch {
        // ignore
      } finally {
        shouldReconnectRef.current = true;
        socketRef.current = null;
        pendingEventsRef.current = [];
      }
    }

    const existing = socketRef.current;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = `wss://playspark.smtsigma.com?x-token=${authToken}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    activeAuthTokenRef.current = authToken;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      reconnectAttemptRef.current = 0;
      setIsConnected(true);

      const pending = pendingEventsRef.current;
      if (pending.length > 0) {
        console.log(
          "➡️ WS flushing queued events:",
          pending.map((e) => e.type)
        );
        for (const evt of pending) {
          try {
            socket.send(JSON.stringify(evt));
          } catch (err) {
            console.error("🚨 WS flush send failed", err, evt);
          }
        }
        pendingEventsRef.current = [];
      }
    };

    socket.onerror = (error) => {
      console.error("🔥 WebSocket error", error);
    };

    socket.onclose = (event) => {
      console.log("❌ WebSocket closed", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });

      setIsConnected(false);
      setIsGameStarted(null);
      setRoomId(null);

      if (!shouldReconnectRef.current) return;

      // Exponential backoff (cap at 10s)
      const attempt = (reconnectAttemptRef.current += 1);
      const delayMs = Math.min(10000, 500 * Math.pow(2, attempt - 1));
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, delayMs);
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsed: unknown = JSON.parse(event.data);

        if (
          typeof parsed !== "object" ||
          parsed === null ||
          !("type" in parsed)
        ) {
          console.info("ℹ️ Invalid WS message", parsed);
          return;
        }

        const data = parsed as WebSocketIncomingEvent;

        switch (data?.type) {
          case "leader-board-data":
            {
              const normalized = normalizeLeaderBoardDataEvent(data);
              if (normalized) {
                setLeaderboard(normalized);

                // // Persist immediately so navigation/unmounts don't lose the latest leaderboard.
                // if (typeof window !== "undefined") {
                //   try {
                //     window.sessionStorage?.setItem(
                //       String(normalized.roomId),
                //       JSON.stringify(normalized)
                //     );
                //   } catch {
                //     // ignore storage/quota errors
                //   }
                // }
              } else {
                console.info("ℹ️ Invalid leader-board-data payload", data);
              }
            }
            break;

          case "invite-link":
            console.log("🔗 Invite link event received:", data);
            setNewInvitation(
              data as {
                type: "invite-link";
                gameId: string;
                hostId: string;
                hostName: string;
                inviteLink: string;
                invitedAt: string;
                roomId: string;
              }
            );
            break;

          case "invited-games":
            console.log("🎮 Invited games event received:", data);
            setOtherInvitedGames(
              data as {
                type: "invited-games";
                games: {
                  gameId: string;
                  hostId: string;
                  hostName: string;
                  inviteLink: string;
                  invitedAt: string;
                  roomId: string;
                }[];
              }
            );
            break;

          case "game-starting":
          case "start-game":
          case "game-started":
            if (isGameStartedEvent(data)) {
              setRoomId(data.roomId);
              setIsGameStarted({
                gameId: data.gameId,
                roomId: data.roomId,
                type: "game-starting",
              });
            } else {
              console.info("ℹ️ Invalid game-started payload", data);
            }
            break;
          case "game-end":
            console.log("🏁 Game end event received:", data);
            break;

          case "congratulations":
            console.log("🎉 Congratulations event received:", data);
            setGetCongratulations(
              data as {
                type: "congratulations";
                message: string;
                gameId: string;
                roomId: string;
              }
            );
            break;

          case "error":
            console.log("🚨 WebSocket error event received:", data);
            setErrorData(data as { type: "error"; message: string });
            break;

          default:
            console.info("ℹ️ Unhandled WS event:", data?.type);
        }
      } catch (err) {
        console.error("🚨 WS parse error", err);
      }
    };
  }, [authToken]);

  /* ============================================================
     SOCKET LIFECYCLE (ONE TIME ONLY)
  ============================================================ */

  useEffect(() => {
    if (!authToken) return;

    shouldReconnectRef.current = true;
    connect();

    /* ✅ CLOSE ONLY ON REAL PAGE UNLOAD */
    const handleUnload = () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      // ❌ DO NOT socket.close() here
    };
  }, [authToken, connect]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        leaderboard,
        roomId,
        isGameStarted,
        getCongratulations,
        otherInvitedGames,
        newInvitation,
        error,
        sendEvent,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

/* ============================================================
   HOOK
============================================================ */

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error("useWebSocket must be used inside WebSocketProvider");
  }

  return context;
};
