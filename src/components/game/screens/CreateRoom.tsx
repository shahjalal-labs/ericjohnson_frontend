"use client";

import {
  urlQueryParams,
  useWebSocket,
} from "@/utilities/websocket/WebSocketProvider";
import type { LeaderBoardDataEvent } from "@/utilities/websocket/WebSocketProvider";
import { BeautifulSpinner } from "@/components/ui/BeautifulSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { getUserIdFromToken, sanitizeToken } from "@/lib/jwt";

const normalizeAvatarUrl = (url?: string) => {
  if (!url) return "/placeholder.svg";
  return url.replaceAll("%22", "").replaceAll('"', "");
};

type LeaderboardPlayer = LeaderBoardDataEvent["players"][number];

const areLeaderboardsEqual = (
  a: LeaderBoardDataEvent | null,
  b: LeaderBoardDataEvent | null
) => {
  if (a === b) return true;
  if (!a || !b) return false;

  if ((a.roomId ?? null) !== (b.roomId ?? null)) return false;
  if (a.gameId !== b.gameId) return false;

  const aPlayers = a.players ?? [];
  const bPlayers = b.players ?? [];
  if (aPlayers.length !== bPlayers.length) return false;

  const bByUserId = new Map<string, LeaderboardPlayer>();
  for (const p of bPlayers) bByUserId.set(p.userId, p);

  for (const p of aPlayers) {
    const other = bByUserId.get(p.userId);
    if (!other) return false;

    if ((p.score ?? 0) !== (other.score ?? 0)) return false;
    if ((p.status ?? "") !== (other.status ?? "")) return false;
    if ((p.userName ?? "") !== (other.userName ?? "")) return false;
    if ((p.avatar ?? "") !== (other.avatar ?? "")) return false;
  }

  return true;
};

export const upsertPlayersByUserId = (
  existing: LeaderboardPlayer[] = [],
  incoming: LeaderboardPlayer[] = []
) => {
  const byUserId = new Map<string, LeaderboardPlayer>();

  for (const p of existing) {
    if (!p?.userId) continue;
    byUserId.set(p.userId, p);
  }

  // Apply incoming updates (last write wins)
  for (const p of incoming) {
    if (!p?.userId) continue;
    byUserId.set(p.userId, p);
  }

  return Array.from(byUserId.values());
};

const mergeLeaderboardForStorage = (
  base: LeaderBoardDataEvent | null,
  next: LeaderBoardDataEvent
): LeaderBoardDataEvent => {
  // If roomId changed, discard old state to avoid mixing rooms.
  if (base?.roomId && next.roomId && base.roomId !== next.roomId) {
    return {
      ...next,
      players: upsertPlayersByUserId([], next.players),
    };
  }

  return {
    type: "leader-board-data",
    gameId: next.gameId,
    ...(next.roomId || base?.roomId
      ? { roomId: next.roomId ?? base?.roomId }
      : {}),
    players: upsertPlayersByUserId(base?.players ?? [], next.players),
  };
};

const CreateRoom = ({
  gameId,
  setGameState,
  setPlayClicked,
  playClicked = false,
}: {
  gameId: string;
  setGameState: React.Dispatch<
    React.SetStateAction<"loading" | "createRoom" | "playing" | "leaderboard">
  >;
  setPlayClicked: React.Dispatch<React.SetStateAction<boolean>>;
  playClicked: boolean;
}) => {
  const { isConnected, leaderboard, roomId, error, sendEvent } = useWebSocket();
  const [isInviting, setIsInviting] = useState(false);
  const [sessionStorageLoading, setSessionStorageLoading] = useState(true);
  const isHost = urlQueryParams?.isHost;
  const token = Cookies.get("accessToken");

  const userId =
    getUserIdFromToken(sanitizeToken(urlQueryParams?.xToken)) ??
    getUserIdFromToken(sanitizeToken(token));

  // console.log(userId, "from CreateRoom 118");

  const didInviteRef = useRef(false);
  const requestedLeaderboardRoomIdRef = useRef<string | null>(null);
  const restoredRoomIdRequestRef = useRef<string | null>(null);
  const didRestoreFromStorageRef = useRef(false);
  const [localLeaderboard, setLocalLeaderboard] =
    useState<LeaderBoardDataEvent | null>(null);

  const [restoredRoomId, setRestoredRoomId] = useState<string | null>(null);

  const lastRoomKey = useMemo(() => {
    return `leaderboard:lastRoomId:${gameId}`;
  }, [gameId]);

  const roomIdForStorage =
    localLeaderboard?.roomId ??
    leaderboard?.roomId ??
    roomId ??
    urlQueryParams?.roomId ??
    restoredRoomId ??
    null;

  const storageKey = useMemo(() => {
    if (!roomIdForStorage) return null;
    return `leaderboard:${roomIdForStorage}`;
  }, [roomIdForStorage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // On host reload there is often no roomId from URL/WS yet.
    // Restore the last known roomId for this game, then load its snapshot.
    setSessionStorageLoading(true);

    const urlRoomId = urlQueryParams?.roomId;
    const candidateRoomId = urlRoomId ?? restoredRoomId;

    if (!candidateRoomId) {
      try {
        const last = window.sessionStorage?.getItem(lastRoomKey);
        if (last) {
          didRestoreFromStorageRef.current = true;
          setRestoredRoomId(last);
          return; // re-run with restoredRoomId
        }
      } catch {
        // ignore
      } finally {
        setSessionStorageLoading(false);
      }
      return;
    }

    const key = `leaderboard:${candidateRoomId}`;
    try {
      const stored = window.sessionStorage?.getItem(key);
      if (!stored) return;
      const parsed = JSON.parse(stored) as LeaderBoardDataEvent;
      // Ensure stored data is always unique by userId.
      setLocalLeaderboard({
        ...parsed,
        ...(parsed.roomId || candidateRoomId
          ? { roomId: parsed.roomId ?? candidateRoomId ?? undefined }
          : {}),
        players: upsertPlayersByUserId([], parsed.players ?? []),
      });
    } catch {
      setLocalLeaderboard(null);
    } finally {
      setSessionStorageLoading(false);
    }
  }, [lastRoomKey, restoredRoomId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      localLeaderboard &&
      localLeaderboard.players.length > 0 &&
      localLeaderboard.players?.find(
        (p) =>
          p.userId === userId &&
          (p.status === "leave" || p.status === "finished")
      )
    ) {
      setGameState("leaderboard");
      return;
    }
  }, [localLeaderboard, setGameState, playClicked, userId]);
  const effectiveRoomId =
    localLeaderboard?.roomId ??
    leaderboard?.roomId ??
    roomId ??
    urlQueryParams?.roomId ??
    restoredRoomId ??
    null;
  const [displayLeaderboard, setDisplayLeaderboard] =
    useState<LeaderBoardDataEvent | null>(null);
  const displayPlayers = useMemo(() => {
    const raw = localLeaderboard?.players ?? displayLeaderboard?.players ?? [];

    // Backend can emit duplicates; ensure unique keys for React rendering.
    const byUserId = new Map<string, (typeof raw)[number]>();
    for (const player of raw) {
      const existing = byUserId.get(player.userId);
      if (!existing) {
        byUserId.set(player.userId, player);
        continue;
      }

      const existingScore = existing.score ?? 0;
      const nextScore = player.score ?? 0;
      if (nextScore >= existingScore) byUserId.set(player.userId, player);
    }

    return Array.from(byUserId.values());
  }, [displayLeaderboard?.players, localLeaderboard?.players]);

  useEffect(() => {
    if (!leaderboard) return;

    // Keep sessionStorage canonical + deduped by userId.
    // IMPORTANT: make this idempotent so it doesn't create a localLeaderboard -> effect -> setState loop.
    setLocalLeaderboard((prev) => {
      const merged = mergeLeaderboardForStorage(prev, leaderboard);
      const withRoomId =
        merged.roomId || !roomIdForStorage
          ? merged
          : { ...merged, roomId: roomIdForStorage };
      return areLeaderboardsEqual(prev, withRoomId) ? prev : withRoomId;
    });
    setIsInviting(false);
  }, [leaderboard, roomIdForStorage]);

  useEffect(() => {
    // Derive what we show from live WS data when available; otherwise use stored.
    if (leaderboard) {
      setDisplayLeaderboard(
        mergeLeaderboardForStorage(localLeaderboard, leaderboard)
      );
      setIsInviting(false);
      return;
    }

    if (localLeaderboard) {
      setDisplayLeaderboard(localLeaderboard);
      setIsInviting(false);
    }
  }, [leaderboard, localLeaderboard]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localLeaderboard) {
      return;
    } else {
      if (!storageKey) return;
      sessionStorage.setItem(storageKey, JSON.stringify(localLeaderboard));

      // Pointer used for host reload when no roomId is available yet.
      if (localLeaderboard.roomId) {
        try {
          sessionStorage.setItem(lastRoomKey, localLeaderboard.roomId);
          // Global fallback used by LeaderBoard.tsx (it does not receive gameId)
          sessionStorage.setItem(
            "leaderboard:lastRoomId",
            localLeaderboard.roomId
          );
        } catch {
          // ignore
        }
      }
    }
  }, [localLeaderboard, storageKey, lastRoomKey]);

  const isRoomMissingError = (message?: string | null) => {
    if (!message) return false;
    const m = message.toLowerCase();
    return (
      m.includes("room") &&
      (m.includes("not found") ||
        m.includes("does not exist") ||
        m.includes("invalid") ||
        m.includes("expired"))
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!error?.message) return;

    // If we tried to restore a room from sessionStorage and backend says it's missing,
    // clear stale state so the host can create a new room.
    if (!didRestoreFromStorageRef.current) return;
    if (!isRoomMissingError(error.message)) return;

    const staleRoomId = restoredRoomIdRequestRef.current ?? restoredRoomId;
    if (!staleRoomId) return;

    try {
      window.sessionStorage?.removeItem(`leaderboard:${staleRoomId}`);
      window.sessionStorage?.removeItem(lastRoomKey);
    } catch {
      // ignore
    }

    restoredRoomIdRequestRef.current = null;
    didRestoreFromStorageRef.current = false;
    setRestoredRoomId(null);
    setLocalLeaderboard(null);
  }, [error?.message, lastRoomKey, restoredRoomId]);

  useEffect(() => {
    if (!leaderboard) return;
    console.log("🏆 leader-board-data:", leaderboard);
    setIsInviting(false);
  }, [effectiveRoomId, leaderboard]);

  useEffect(() => {
    // If we restored from storage and the room exists, switch to leaderboard view.
    if (!leaderboard) return;
    if (!didRestoreFromStorageRef.current) return;

    const wantedRoomId = restoredRoomIdRequestRef.current ?? restoredRoomId;
    if (wantedRoomId && leaderboard.roomId === wantedRoomId) {
      didRestoreFromStorageRef.current = false;
      restoredRoomIdRequestRef.current = null;
      setGameState("leaderboard");
    }
  }, [leaderboard, restoredRoomId, setGameState]);

  useEffect(() => {
    if (!isConnected) return;
    if (didInviteRef.current) return;

    if (!userId) {
      console.warn(
        "⚠️ invite flow blocked: missing userId (token decode failed)",
        {
          hasQueryToken: Boolean(urlQueryParams?.xToken),
          hasCookieToken: Boolean(token),
        }
      );
      return;
    }

    const urlRoomId = urlQueryParams?.roomId;
    const joinRoomId = urlRoomId ?? leaderboard?.roomId ?? roomId;

    const rawUserIds =
      urlQueryParams?.queryParams?.get("userIds") ?? urlQueryParams?.userId;

    const userIds =
      (rawUserIds ?? "")
        ?.replace("[", "")
        ?.replace("]", "")
        ?.split(",")
        ?.map((id) => id?.trim())
        ?.filter(Boolean) ?? [];

    if (userIds.length === 0 && isHost) {
      // console.warn("⚠️ invite-player not sent: userIds empty", { rawUserIds });
      return;
    }

    // Host create flow (no roomId in URL) OR join flow (roomId in URL)
    if (isHost && !urlQueryParams?.roomId) {
      if (!joinRoomId) {
        // Wait until we've checked sessionStorage so we don't accidentally
        // skip invite-player due to initial render timing.
        if (sessionStorageLoading) {
          setIsInviting(true);
          return;
        }

        // If we already have a stored leaderboard, no need to invite again.
        if (localLeaderboard && localLeaderboard.players.length > 0) {
          return;
        } else {
          setIsInviting(true);
          console.log("working 1")
          didInviteRef.current = true;
          sendEvent({
            type: "invite-player",
            gameId,
            userId: userId,
            userIds,
          });
          console.log("sent invite-player", {type: "invite-player", gameId, userId, userIds } );
        }
      } else {
        // Join/Reload with roomId (but no stored leaderboard): request it.
        setIsInviting(true);
        didInviteRef.current = true;
        console.log("working 2")
        // sendEvent({
        //   type: "leader-board-data",
        //   gameId,
        //   roomId: joinRoomId,
        // });
      }
    } else {
      // Player/join link: send user-ready only once per room per session.
      if (!joinRoomId) {
        console.warn("⚠️ join flow: roomId missing");
        setIsInviting(true);
        return;
      }

      setIsInviting(true);
      didInviteRef.current = true;
      sendEvent({
        type: "user-ready",
        gameId,
        userId: userId,
        roomId: joinRoomId,
      });

      // sendEvent({
      //   type: "leader-board-data",
      //   gameId,
      //   roomId: joinRoomId,
      // });
    }
  }, [
    effectiveRoomId,
    gameId,
    isConnected,
    isHost,
    sendEvent,
    leaderboard?.roomId,
    roomId,
    sessionStorageLoading,
    localLeaderboard,
    userId,
    token,
  ]);

  useEffect(() => {
    // Whenever a real roomId becomes available, request leaderboard (once per roomId).
    if (!isConnected) return;
    if (!effectiveRoomId) return;

    if (requestedLeaderboardRoomIdRef.current === effectiveRoomId) return;

    requestedLeaderboardRoomIdRef.current = effectiveRoomId;

    // Track that we're validating a restored room so we can react to "room missing" errors.
    if (didRestoreFromStorageRef.current && !restoredRoomIdRequestRef.current) {
      restoredRoomIdRequestRef.current = effectiveRoomId;
    }

    console.log("📊 leader-board-data: requesting (roomId available)", {
      gameId,
      roomId: effectiveRoomId,
      isConnected,
    });
    // sendEvent({
    //   type: "leader-board-data",
    //   gameId,
    //   roomId: effectiveRoomId,
    // });
  }, [effectiveRoomId, gameId, isConnected, sendEvent]);

  return (
    <div className="p-6 bg-black text-white min-h-screen w-full">
      <div className="max-w-lg space-y-10 mx-auto">
        {isInviting && !displayLeaderboard && (
          <div className="flex items-center justify-center">
            <BeautifulSpinner
              size="md"
              variant="gradient"
              text={
                sessionStorageLoading
                  ? "Loading..."
                  : isHost
                  ? "Inviting player..."
                  : "Waiting for host..."
              }
            />
          </div>
        )}

        {!isInviting && displayLeaderboard && (
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Leader Board
            </h2>

            <div className="space-y-4">
              {displayPlayers.map((p) => {
                const name = p.userName || "Unknown";
                const avatarSrc = normalizeAvatarUrl(p.avatar);
                const status = p.status || "";
                const score = p.score ?? 0;

                return (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={avatarSrc} className="object-cover" />
                        <AvatarFallback>{name[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-lg font-bold">{name}</div>
                        <div className="text-sm text-muted-foreground">
                          {status}
                        </div>
                      </div>
                    </div>

                    <div className="text-base font-semibold">
                      Score: {score}
                    </div>
                  </div>
                );
              })}
            </div>
            {urlQueryParams?.isHost && (
              <Button
                type="button"
                onClick={() => {
                  // setGameState("playing");
                  if (!userId) return;
                  if (!effectiveRoomId) return;
                  sendEvent({
                    type: "start-game",
                    gameId,
                    userId: userId,
                    roomId: effectiveRoomId,
                  });
                  setPlayClicked(true);
                }}
                className="rounded-xl w-full text-xl py-5 font-semibold !mt-10 px-8"
                disabled={!isConnected || !effectiveRoomId || !userId}
              >
                Start Game
              </Button>
            )}

            {roomId && (
              <div className="text-xs text-muted-foreground">
                Room: {roomId}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRoom;
