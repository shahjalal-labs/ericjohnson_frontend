"use client";

import {
  LeaderBoardDataEvent,
  urlQueryParams,
  useWebSocket,
} from "@/utilities/websocket/WebSocketProvider";
import { BeautifulSpinner } from "@/components/ui/BeautifulSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { upsertPlayersByUserId } from "./CreateRoom";

const normalizeAvatarUrl = (url?: string) => {
  if (!url) return "/placeholder.svg";
  return url.replaceAll("%22", "").replaceAll('"', "");
};

type PartySprayPiece = {
  leftPct: number;
  delayMs: number;
  durationMs: number;
  driftPx: number;
  rotateDeg: number;
  sizePx: number;
  colorClass: string;
};

type LeaderboardPlayer = LeaderBoardDataEvent["players"][number];

const normalizePlayersByUserId = (players: LeaderboardPlayer[] = []) => {
  // Backend can emit duplicates; keep last-write-wins by userId.
  return upsertPlayersByUserId([], players);
};

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

const mergeLeaderboardForStorage = (
  base: LeaderBoardDataEvent | null,
  next: LeaderBoardDataEvent
): LeaderBoardDataEvent => {
  // Treat incoming WS payload as the authoritative snapshot.
  // This prevents sessionStorage from retaining stale players when the server
  // sends a full list (e.g., someone leaves, reconnects, or the game resets).
  return {
    type: "leader-board-data",
    gameId: next.gameId,
    ...(next.roomId || base?.roomId
      ? { roomId: next.roomId ?? base?.roomId }
      : {}),
    players: normalizePlayersByUserId(next.players ?? []),
  };
};

const PARTY_COLORS = [
  "bg-pink-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-400",
] as const;

const PartySpray = ({ seed }: { seed: number }) => {
  const pieces = useMemo<PartySprayPiece[]>(() => {
    // Seeded PRNG so we can re-generate a fresh spray on each popup open.
    let s = seed || 1;
    const random = () => {
      // Linear congruential generator
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };

    const rand = (min: number, max: number) => min + random() * (max - min);

    const next: PartySprayPiece[] = [];
    const count = 38;
    for (let i = 0; i < count; i++) {
      next.push({
        leftPct: rand(6, 94),
        delayMs: Math.floor(rand(0, 420)),
        durationMs: Math.floor(rand(1200, 1900)),
        driftPx: Math.floor(rand(-120, 120)),
        rotateDeg: Math.floor(rand(-540, 540)),
        sizePx: Math.floor(rand(6, 12)),
        colorClass: PARTY_COLORS[i % PARTY_COLORS.length],
      });
    }
    return next;
  }, [seed]);

  return (
    <div
      className="congrats-confetti pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* bursts */}
      <div
        className="congrats-burst text-amber-400"
        style={{ left: "10%", top: "18%" }}
      />
      <div
        className="congrats-burst text-violet-400"
        style={{ left: "68%", top: "22%", animationDelay: "120ms" }}
      />
      <div
        className="congrats-burst text-emerald-400"
        style={{ left: "42%", top: "6%", animationDelay: "220ms" }}
      />

      {/* confetti */}
      {pieces.map((p, idx) => (
        <div
          key={idx}
          className={cn(
            "congrats-confetti-piece",
            p.colorClass,
            idx % 3 === 0 ? "rounded-full" : "rounded-[2px]"
          )}
          style={
            {
              left: `${p.leftPct}%`,
              width: `${p.sizePx}px`,
              height: `${Math.max(8, Math.floor(p.sizePx * 1.4))}px`,
              animationDelay: `${p.delayMs}ms`,
              animationDuration: `${p.durationMs}ms`,
              // CSS vars used by keyframes
              ["--congrats-x" as unknown as string]: `${p.driftPx}px`,
              ["--congrats-r" as unknown as string]: `${p.rotateDeg}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

type CongratsModalProps = {
  open: boolean;
  message: string;
  players: Array<{
    userId: string;
    userName?: string;
    score?: number;
    status?: string;
  }>;
  partySeed: number;
  onClose: () => void;
};

const CongratsModal = ({
  open,
  message,
  players,
  partySeed,
  onClose,
}: CongratsModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    // Play exit animation before unmounting
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 260);
  };

  useEffect(() => {
    if (open) setIsClosing(false);
  }, [open]);

  if (!mounted) return null;
  if (!open && !isClosing) return null;

  const topPlayer = players[0] ?? null;

  return createPortal(
    <div className="lb-congrats-root" role="dialog" aria-modal="true">
      <div
        className={cn(
          "lb-congrats-overlay",
          open && !isClosing
            ? "lb-congrats-overlay-in"
            : "lb-congrats-overlay-out"
        )}
        onMouseDown={handleClose}
      />

      <div
        className={cn(
          "lb-congrats-modal",
          open && !isClosing ? "lb-congrats-modal-in" : "lb-congrats-modal-out"
        )}
      >
        <PartySpray key={partySeed} seed={partySeed} />

        <div className="congrats-modal-inner-pop relative z-10 space-y-4">
          <div className="space-y-1">
            <div className="text-2xl font-extrabold tracking-tight">
              Congratulations
            </div>
            <div className="text-sm text-white/80">{message}</div>
          </div>

          {topPlayer && (
            <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4">
              <div className="text-xs text-amber-200/90">Top Player</div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-lg font-bold text-amber-100">
                    {topPlayer.userName || "Unknown"}
                  </div>
                  <div className="text-sm text-white/70">
                    Score: {topPlayer.score ?? 0}
                  </div>
                </div>
                <div className="shrink-0 rounded-full border border-amber-300/60 bg-amber-400/20 px-3 py-1 text-sm font-semibold text-amber-100">
                  #1
                </div>
              </div>
            </div>
          )}

          {players.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-white/70">Leaderboard</div>
              <div className="max-h-52 space-y-2 overflow-auto pr-1">
                {players.map((p, idx) => (
                  <div
                    key={`${p.userId}-popup`}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md border p-2",
                      idx === 0
                        ? "border-amber-400/40 bg-amber-500/10"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {idx + 1}. {p.userName || "Unknown"}
                      </div>
                      {!!p.status && (
                        <div className="truncate text-xs text-white/60">
                          {p.status}
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        idx === 0 ? "text-amber-100" : "text-white"
                      )}
                    >
                      {p.score ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const LeaderBoard = () => {
  const { isConnected, leaderboard, roomId, getCongratulations } =
    useWebSocket();

  const [sessionStorageLoading, setSessionStorageLoading] = useState(true);
  const [restoredRoomId, setRestoredRoomId] = useState<string | null>(null);

  const [localLeaderboard, setLocalLeaderboard] =
    useState<LeaderBoardDataEvent | null>(null);

  const effectiveRoomIdForStorage =
    leaderboard?.roomId ??
    roomId ??
    urlQueryParams?.roomId ??
    restoredRoomId ??
    null;

  const storageKey = useMemo(() => {
    if (!effectiveRoomIdForStorage) return null;
    return `leaderboard:${effectiveRoomIdForStorage}`;
  }, [effectiveRoomIdForStorage]);

  // Restore last roomId on reload when URL/WS don't have one yet.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // If we already have a roomId from URL/WS, no need to restore.
    const existing = leaderboard?.roomId ?? roomId ?? urlQueryParams?.roomId;
    if (existing) {
      setSessionStorageLoading(false);
      return;
    }

    try {
      const last = window.sessionStorage?.getItem("leaderboard:lastRoomId");
      if (last) setRestoredRoomId(last);
    } catch {
      // ignore
    } finally {
      setSessionStorageLoading(false);
    }
  }, [leaderboard?.roomId, roomId]);

  // Load from sessionStorage (fast initial paint / reload support)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!storageKey) return;
    try {
      const stored = window.sessionStorage?.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as LeaderBoardDataEvent;
      // Ensure stored data is always unique by userId.
      setLocalLeaderboard({
        ...parsed,
        ...(parsed.roomId || effectiveRoomIdForStorage
          ? { roomId: parsed.roomId ?? effectiveRoomIdForStorage ?? undefined }
          : {}),
        players: upsertPlayersByUserId([], parsed.players ?? []),
      });
    } catch {
      setLocalLeaderboard(null);
    }
  }, [storageKey, effectiveRoomIdForStorage]);

  // Persist live updates into sessionStorage (idempotent merge; avoids loops)
  useEffect(() => {
    if (!leaderboard) return;

    setLocalLeaderboard((prev) => {
      const merged = mergeLeaderboardForStorage(prev, leaderboard);
      const withRoomId =
        merged.roomId || !effectiveRoomIdForStorage
          ? merged
          : { ...merged, roomId: effectiveRoomIdForStorage };

      return areLeaderboardsEqual(prev, withRoomId) ? prev : withRoomId;
    });
  }, [leaderboard, effectiveRoomIdForStorage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localLeaderboard) return;
    if (!storageKey) return;
    window.sessionStorage?.setItem(
      storageKey,
      JSON.stringify(localLeaderboard)
    );
  }, [localLeaderboard, storageKey]);

  // Remember last roomId so a reload can restore the correct snapshot.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!effectiveRoomIdForStorage) return;
    try {
      window.sessionStorage?.setItem(
        "leaderboard:lastRoomId",
        effectiveRoomIdForStorage
      );
    } catch {
      // ignore
    }
  }, [effectiveRoomIdForStorage]);

  const displayLeaderboard = useMemo(() => {
    if (leaderboard)
      return mergeLeaderboardForStorage(localLeaderboard, leaderboard);
    return localLeaderboard;
  }, [leaderboard, localLeaderboard]);

  const effectiveRoomId =
    displayLeaderboard?.roomId ?? roomId ?? urlQueryParams?.roomId ?? null;

  const players = useMemo(() => {
    const raw = displayLeaderboard?.players ?? [];

    // Backend can emit duplicates; ensure stable unique entries for React rendering.
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

    const list = Array.from(byUserId.values());

    const gameKey = String(displayLeaderboard?.gameId ?? "").toLowerCase();
    const isTimeBasedGame = gameKey.includes("memory");

    return list.sort((a, b) => {
      const as = a.score ?? 0;
      const bs = b.score ?? 0;
      return isTimeBasedGame ? as - bs : bs - as;
    });
  }, [displayLeaderboard?.gameId, displayLeaderboard?.players]);

  const [isCongratsOpen, setIsCongratsOpen] = useState(false);
  const [partySeed, setPartySeed] = useState(0);

  useEffect(() => {
    if (!getCongratulations) return;
    setIsCongratsOpen(true);
    setPartySeed((s) => s + 1);
  }, [getCongratulations]);

  const isLoading = sessionStorageLoading && players.length === 0;

  const topPlayer = players[0] ?? null;
  const congratsMessage =
    getCongratulations?.message ||
    (topPlayer
      ? `Congratulations, ${topPlayer.userName || "Winner"}!`
      : "Congratulations!");

  return (
    <div className="p-6 bg-black text-white min-h-screen w-full">
      <CongratsModal
        open={isCongratsOpen}
        message={congratsMessage}
        players={players}
        partySeed={partySeed}
        onClose={() => setIsCongratsOpen(false)}
      />

      <div className="max-w-lg space-y-10 mx-auto">
        {!isConnected && (
          <div className="text-white/80">Connecting to leaderboard...</div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center">
            <BeautifulSpinner
              size="md"
              variant="gradient"
              text="Loading leaderboard..."
            />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Leader Board
            </h2>

            <div className="space-y-4">
              {players.map((p) => {
                const name = p?.userName || "Unknown";
                const avatarSrc = normalizeAvatarUrl(p?.avatar);
                const status = p?.status || "";
                const score = p?.score ?? 0;
                const isTopPlayer = topPlayer?.userId === p?.userId;
                const isFinished =
                  String(status).trim().toLowerCase() === "finished";

                return (
                  <div
                    key={p?.userId}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-lg p-3",
                      isTopPlayer
                        ? "border border-amber-400/40 bg-amber-500/10"
                        : "border border-white/10 bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={avatarSrc} className="object-cover" />
                        <AvatarFallback>{name[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "truncate text-lg font-bold",
                            isTopPlayer && "text-amber-100"
                          )}
                        >
                          {name}
                          {isTopPlayer && (
                            <span className="ml-2 text-xs font-semibold text-amber-200">
                              #1
                            </span>
                          )}
                          {isTopPlayer && isFinished && (
                            <Badge
                              variant="secondary"
                              className="ml-2 border border-amber-400/40 bg-amber-500/10 text-amber-200"
                            >
                              ★ Winner
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm first-letter:uppercase text-muted-foreground">
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

            {effectiveRoomId && (
              <div className="text-xs text-muted-foreground">
                Room: {effectiveRoomId}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderBoard;
