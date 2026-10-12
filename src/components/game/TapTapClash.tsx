"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import Image from "next/image";
import GameOverTxtImg from "@/assets/game/game-over.png";
import {
  urlQueryParams,
  useWebSocket,
} from "@/utilities/websocket/WebSocketProvider";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { getUserIdFromToken, sanitizeToken } from "@/lib/jwt";

type SpawnedEmoji = Phaser.GameObjects.Text & {
  ttc?: {
    kind: "normal" | "heart" | "electric";
    points: number;
    expiresAt: number;
  };
};

const ROUND_SECONDS = 30;
const POINTS_PER_TAP = 10;
const HEART_POINTS_PER_TAP = 20;
const ELECTRIC_POINTS_PER_TAP = 30;

const NORMAL_EMOJIS = ["⭐", "🌹", "🌻"];
const HEART_EMOJI = "❤️";
const ELECTRIC_EMOJI = "⚡";

class BootScene extends Phaser.Scene {
  constructor() {
    super("ttc_boot");
  }

  create() {
    this.scene.start("ttc_game");
  }
}

class TapTapClashScene extends Phaser.Scene {
  private score = 0;
  private scoreText?: Phaser.GameObjects.Text;
  private legendText?: Phaser.GameObjects.Text;

  private started = false;
  private startHint?: Phaser.GameObjects.Text;

  private roundStartedAt = 0;
  private ended = false;

  private roundTimeout?: Phaser.Time.TimerEvent;

  private hasSpawnedElectric = false;

  private timerRing?: Phaser.GameObjects.Graphics;
  private timerBg?: Phaser.GameObjects.Graphics;
  private timerLabel?: Phaser.GameObjects.Text;

  private emojis: SpawnedEmoji[] = [];
  private spawnHandle?: Phaser.Time.TimerEvent;
  private endHandle?: Phaser.Time.TimerEvent;

  private foregroundDots: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super("ttc_game");
  }

  create() {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor("#0b1220");

    // If the scene is restarted quickly, make sure nothing from the previous run
    // can fire (like delayed scene transitions or pending spawns).
    this.spawnHandle?.remove(false);
    this.spawnHandle = undefined;
    this.endHandle?.remove(false);
    this.endHandle = undefined;
    this.roundTimeout?.remove(false);
    this.roundTimeout = undefined;
    this.time.removeAllEvents();
    this.tweens.killAll();

    this.score = 0;
    this.ended = false;
    this.started = false;
    this.emojis.forEach((e) => e.destroy());
    this.emojis = [];

    this.roundStartedAt = 0;
    this.hasSpawnedElectric = false;

    this.createAmbientForeground();

    // Score (live update)
    this.scoreText = this.add
      .text(18, 18, "Score: 0", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "22px",
        color: "#e5e7eb",
      })
      .setDepth(1);

    // Points legend (under score)
    this.legendText?.destroy();
    const normalLines = NORMAL_EMOJIS.map((e) => `${e} = +${POINTS_PER_TAP}`);
    this.legendText = this.add
      .text(
        18,
        48,
        [
          ...normalLines,
          `${HEART_EMOJI} = +${HEART_POINTS_PER_TAP}`,
          `${ELECTRIC_EMOJI} = +${ELECTRIC_POINTS_PER_TAP}`,
        ].join("\n"),
        {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: "14px",
          color: "#a7f3d0",
          lineSpacing: 4,
        }
      )
      .setDepth(1);

    // Rounded timer (top center)
    const timerX = width / 2;
    const timerY = 40;
    const outerR = 28;
    const innerR = 22;

    this.timerBg?.destroy();
    this.timerRing?.destroy();
    this.timerLabel?.destroy();

    this.timerBg = this.add.graphics().setDepth(2);
    this.timerRing = this.add.graphics().setDepth(3);
    this.timerLabel = this.add
      .text(timerX, timerY, `${ROUND_SECONDS}`, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "16px",
        color: "#e5e7eb",
      })
      .setOrigin(0.5)
      .setDepth(4);

    // Base background ring + inner cutout
    this.timerBg.fillStyle(0x111827, 0.9);
    this.timerBg.fillCircle(timerX, timerY, outerR);
    this.timerBg.fillStyle(0x0b1220, 1);
    this.timerBg.fillCircle(timerX, timerY, innerR);

    // Ensure the timer visibly starts at 30 every run.
    this.renderTimer(ROUND_SECONDS * 1000);

    this.startHint?.destroy();
    this.startHint = this.add
      .text(width / 2, this.scale.height * 0.22, "Tap / Space to Start", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "26px",
        color: "#e5e7eb",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6);

    const startGame = () => {
      if (this.ended) return;
      if (this.started) return;

      this.started = true;
      this.startHint?.destroy();
      this.startHint = undefined;

      this.roundStartedAt = this.time.now;
      this.hasSpawnedElectric = false;

      this.roundTimeout?.remove(false);
      this.roundTimeout = this.time.delayedCall(ROUND_SECONDS * 1000, () => {
        this.finishRound();
      });

      this.renderTimer(ROUND_SECONDS * 1000);
      this.scheduleNextSpawn();
    };

    this.input.removeAllListeners("pointerdown");
    this.input.on("pointerdown", () => {
      if (!this.started) startGame();
    });

    // Keyboard input (Spacebar)
    // Use a capture-phase window listener so this still works even if another
    // global keydown handler calls preventDefault on Space.
    const onWindowKeyDown = (evt: KeyboardEvent & { repeat?: boolean }) => {
      if (evt.code !== "Space") return;
      if (evt.repeat) return;
      evt.preventDefault();
      evt.stopImmediatePropagation();
      startGame();
    };

    window.addEventListener("keydown", onWindowKeyDown, true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("keydown", onWindowKeyDown, true);
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      window.removeEventListener("keydown", onWindowKeyDown, true);
    });

    // Prevent browser scrolling on touch
    this.input.mouse?.disableContextMenu();
  }

  private createAmbientForeground() {
    this.foregroundDots.forEach((d) => d.destroy());
    this.foregroundDots = [];

    const { width, height } = this.scale;
    const dotColor = 0x36ff8a; // light greenish
    const alpha = 0.1;

    for (let i = 0; i < 10; i += 1) {
      const x = Phaser.Math.Between(0, Math.floor(width));
      const y = Phaser.Math.Between(80, Math.floor(height));
      const r = Phaser.Math.Between(12, 32);
      const dot = this.add.circle(x, y, r, dotColor, alpha).setDepth(0);
      this.foregroundDots.push(dot);

      this.tweens.add({
        targets: dot,
        x: x + Phaser.Math.Between(-28, 28),
        y: y + Phaser.Math.Between(-18, 18),
        duration: Phaser.Math.Between(2600, 4200),
        ease: "Sine.InOut",
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private scheduleNextSpawn() {
    this.spawnHandle?.remove(false);
    if (this.ended) return;
    if (!this.started) return;

    const nextDelay = Phaser.Math.Between(220, 520);
    this.spawnHandle = this.time.addEvent({
      delay: nextDelay,
      callback: () => {
        if (this.ended) return;
        this.spawnEmoji();
        this.scheduleNextSpawn();
      },
    });
  }

  private spawnEmoji() {
    const { width, height } = this.scale;
    if (this.emojis.length >= 14) return;

    const roll = Phaser.Math.Between(0, 9);
    const isHeart = roll === 0; // ~10%
    const isElectric = roll === 1; // ~10%

    let kind: NonNullable<SpawnedEmoji["ttc"]>["kind"] = isHeart
      ? "heart"
      : isElectric
      ? "electric"
      : "normal";

    // Make sure ⚡ actually shows up during a round (users may miss a 10% roll).
    if (!this.hasSpawnedElectric && !isHeart) {
      const elapsed = this.time.now - this.roundStartedAt;
      if (elapsed >= 2500) kind = "electric";
    }

    const emoji =
      kind === "heart"
        ? HEART_EMOJI
        : kind === "electric"
        ? ELECTRIC_EMOJI
        : NORMAL_EMOJIS[Phaser.Math.Between(0, NORMAL_EMOJIS.length - 1)];

    // Keep clear of UI
    const margin = 22;
    const topSafe = 86;
    const x = Phaser.Math.Between(margin, Math.floor(width - margin));
    const y = Phaser.Math.Between(topSafe, Math.floor(height - margin));

    const size = 36;
    const text = this.add
      .text(x, y, emoji, {
        fontFamily:
          "system-ui, -apple-system, Segoe UI Emoji, Apple Color Emoji",
        fontSize: `${size}px`,
        color: kind === "electric" ? "#36ff8a" : "#f8fafc",
      })
      .setOrigin(0.5)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    if (kind === "electric") {
      this.hasSpawnedElectric = true;
      text.setShadow(0, 0, "#36ff8a", 12, true, true);
    }

    const ttl = Phaser.Math.Between(1000, 3000);
    const expiresAt = this.time.now + ttl;
    const points =
      kind === "electric"
        ? ELECTRIC_POINTS_PER_TAP
        : kind === "heart"
        ? HEART_POINTS_PER_TAP
        : POINTS_PER_TAP;
    (text as SpawnedEmoji).ttc = { kind, points, expiresAt };

    text.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.ended) return;
      const p = (text as SpawnedEmoji).ttc?.points ?? POINTS_PER_TAP;
      this.score += p;
      this.scoreText?.setText(`Score: ${this.score}`);
      console.log("[TapTapClash] score:", this.score);

      try {
        this.game?.events?.emit("ttc_score", { score: this.score });
      } catch {
        // ignore
      }

      const tapX = pointer.worldX ?? text.x;
      const tapY = pointer.worldY ?? text.y;
      this.spawnTapEffect(tapX, tapY);
      this.spawnScorePopup(tapX, tapY - 14, p);

      // little pop feedback (but keep tappable)
      this.tweens.add({
        targets: text,
        scale: 1.18,
        duration: 80,
        yoyo: true,
        ease: "Quad.Out",
      });
    });

    this.emojis.push(text as SpawnedEmoji);

    // Fade out near end of life
    const fadeDelay = Math.max(0, ttl - 220);
    this.time.delayedCall(fadeDelay, () => {
      if (!text.scene) return;
      this.tweens.add({
        targets: text,
        alpha: 0,
        duration: 220,
        ease: "Cubic.Out",
      });
    });

    // Destroy at expiry
    this.time.delayedCall(ttl, () => {
      if (!text.scene) return;
      this.removeEmoji(text as SpawnedEmoji);
    });
  }

  private removeEmoji(text: SpawnedEmoji) {
    const idx = this.emojis.indexOf(text);
    if (idx >= 0) this.emojis.splice(idx, 1);
    text.destroy();
  }

  private spawnTapEffect(x: number, y: number) {
    const startRadius = 7;
    const endRadius = 15;
    const g = this.add.graphics();
    g.setDepth(10_000);

    const state = { r: startRadius, a: 0.55 };
    const color = 0x36ff8a;

    const redraw = () => {
      g.clear();
      g.fillStyle(color, state.a);
      g.fillCircle(x, y, state.r);
    };

    redraw();
    this.tweens.add({
      targets: state,
      r: endRadius,
      a: 0,
      duration: 220,
      ease: "Cubic.Out",
      onUpdate: redraw,
      onComplete: () => g.destroy(),
    });
  }

  private spawnScorePopup(x: number, y: number, points: number) {
    const popup = this.add
      .text(x, y, `+${points}`, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "20px",
        color: "#36ff8a",
      })
      .setOrigin(0.5)
      .setDepth(10_001);

    popup.setShadow(0, 0, "#36ff8a", 10, true, true);

    this.tweens.add({
      targets: popup,
      y: y - 48,
      alpha: 0,
      duration: 950,
      ease: "Cubic.Out",
      onComplete: () => popup.destroy(),
    });
  }

  private renderTimer(remainingMs: number) {
    const clampedMs = Math.max(0, remainingMs);
    const remainingSec = Math.ceil(clampedMs / 1000);

    // Label
    this.timerLabel?.setText(`${remainingSec}`);

    // Progress ring
    if (!this.timerRing) return;

    const { width } = this.scale;
    const timerX = width / 2;
    const timerY = 40;
    const radius = 28;

    const progress = Phaser.Math.Clamp(
      clampedMs / (ROUND_SECONDS * 1000),
      0,
      1
    );
    const startAngle = Phaser.Math.DegToRad(-90);
    const endAngle = startAngle + Phaser.Math.DegToRad(360 * progress);

    this.timerRing.clear();
    this.timerRing.lineStyle(5, 0x36ff8a, 0.95);
    this.timerRing.beginPath();
    this.timerRing.arc(timerX, timerY, radius - 2, startAngle, endAngle, false);
    this.timerRing.strokePath();
  }

  update() {
    if (this.ended) return;

    if (!this.started) {
      this.renderTimer(ROUND_SECONDS * 1000);
      return;
    }

    const remainingMs = this.roundTimeout?.getRemaining() ?? 0;
    this.renderTimer(remainingMs);

    if (remainingMs <= 0) {
      this.finishRound();
    }
  }

  private finishRound() {
    if (this.ended) return;
    this.ended = true;

    this.roundTimeout?.remove(false);
    this.roundTimeout = undefined;

    this.spawnHandle?.remove(false);
    this.spawnHandle = undefined;

    // Clean up lingering emojis immediately (we're pausing the screen in-place).
    this.emojis.forEach((e) => e.destroy());
    this.emojis = [];

    const finalScore = this.score;
    console.log("[TapTapClash] endgame:", finalScore);

    try {
      this.game?.events?.emit("ttc_game_over", { score: finalScore });
    } catch {
      // ignore
    }
    this.endHandle?.remove(false);
    this.endHandle = undefined;

    this.input.enabled = false;
    this.scene.pause();
  }
}

type TapTapClashProps = {
  setGameState: React.Dispatch<
    React.SetStateAction<"playing" | "loading" | "createRoom" | "leaderboard">
  >;
  gameId: string;
  roomId: string;
};

const TapTapClash: React.FC<TapTapClashProps> = ({
  setGameState,
  gameId,
  roomId,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hostSize, setHostSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const { sendEvent, isConnected } = useWebSocket();

  const [gameOverScore, setGameOverScore] = useState<number | null>(null);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(5);
  const intervalRef = useRef<number | null>(null);
  const didSendScoreRef = useRef(false);
  const didSendLeaveRef = useRef(false);
  const lastSentLiveScoreRef = useRef<number>(0);

  const isConnectedRef = useRef(isConnected);
  const pendingEndScoreRef = useRef<number | null>(null);
  const gameIdRef = useRef(gameId);
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    gameIdRef.current = gameId;
    roomIdRef.current = roomId;
  }, [gameId, roomId]);
  const token = Cookies.get("accessToken");

  const userId =
    getUserIdFromToken(sanitizeToken(urlQueryParams?.xToken)) ??
    getUserIdFromToken(sanitizeToken(token));

  const sendLeaveGameOnce = React.useCallback(() => {
    if (didSendLeaveRef.current) return;

    const gid = gameIdRef.current;
    const rid = roomIdRef.current;
    if (!gid || !rid) {
      // Don't lock the ref if we don't have identifiers yet.
      console.warn("[TapTapClash] skip leave-game (missing ids)", {
        gameId: gid,
        roomId: rid,
      });
      return;
    }

    didSendLeaveRef.current = true;
    // sendEvent({ type: "leave-game", gameId: gid, userId, roomId: rid });
    console.log("[TapTapClash] sent leave-game", { gameId: gid, roomId: rid });
  }, []);

  const sendScoreUpdate = React.useCallback(
    (score: number) => {
      const gid = gameIdRef.current;
      const rid = roomIdRef.current;
      if (!gid || !rid) {
        console.warn("[TapTapClash] skip score-update (missing ids)", {
          gameId: gid,
          roomId: rid,
          score,
        });
        return;
      }
      if (!userId) {
        console.warn("[TapTapClash] skip score-update (missing userId)", {
          gameId: gid,
          roomId: rid,
          score,
        });
        return;
      }
      sendEvent({
        type: "score-update",
        gameId: gid,
        roomId: rid,
        userId,
        score,
      });
    },
    [sendEvent, userId]
  );

  const flushEndgameEvents = React.useCallback(
    (finalScore: number) => {
      if (!isConnectedRef.current) {
        pendingEndScoreRef.current = finalScore;
        return;
      }

      if (!didSendScoreRef.current) {
        didSendScoreRef.current = true;
        sendScoreUpdate(finalScore);
        console.log("[TapTapClash] sent score-update", finalScore);
      }

      if (!didSendLeaveRef.current) {
        sendLeaveGameOnce();
      }

      pendingEndScoreRef.current = null;
    },
    [sendLeaveGameOnce, sendScoreUpdate]
  );

  // Keep stable refs so the Phaser init effect does not re-run (and cleanup
  // does not fire) just because websocket callbacks change identity.
  const sendLeaveGameOnceRef = useRef(sendLeaveGameOnce);
  const flushEndgameEventsRef = useRef(flushEndgameEvents);

  useEffect(() => {
    sendLeaveGameOnceRef.current = sendLeaveGameOnce;
  }, [sendLeaveGameOnce]);

  useEffect(() => {
    flushEndgameEventsRef.current = flushEndgameEvents;
  }, [flushEndgameEvents]);

  useEffect(() => {
    const BASE_WIDTH = 520;
    const BASE_HEIGHT = 760;
    const PADDING = 12;
    const MAX_WIDTH = 720;

    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const availableWidth = Math.max(0, Math.min(MAX_WIDTH, vw - PADDING * 2));
      const availableHeight = Math.max(0, vh - PADDING * 2);
      const scale = Math.max(
        0,
        Math.min(availableWidth / BASE_WIDTH, availableHeight / BASE_HEIGHT)
      );

      setHostSize({
        width: Math.floor(BASE_WIDTH * scale),
        height: Math.floor(BASE_HEIGHT * scale),
      });

      gameRef.current?.scale.refresh();
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!hostRef.current) return;
    if (gameRef.current) return;

    // Reset session-local refs/state (important if the user re-enters this game).
    didSendLeaveRef.current = false;
    didSendScoreRef.current = false;
    lastSentLiveScoreRef.current = 0;
    pendingEndScoreRef.current = null;
    setLiveScore(0);
    setGameOverScore(null);
    setCountdown(5);

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      backgroundColor: "#0b1220",
      input: {
        activePointers: 1,
        touch: { capture: true },
        mouse: { preventDefaultDown: true },
      },
      render: {
        antialias: true,
        antialiasGL: true,
        pixelArt: false,
        roundPixels: true,
        powerPreference: "high-performance",
      },
      fps: {
        target: 60,
        min: 30,
      },
      width: 520,
      height: 760,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BootScene, TapTapClashScene],
    });

    const handleGameOver = (payload: unknown) => {
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("score" in payload) ||
        typeof (payload as { score?: unknown }).score !== "number"
      ) {
        console.warn("[TapTapClash] Invalid ttc_game_over payload", payload);
        return;
      }

      const score = (payload as { score: number }).score;
      setGameOverScore(score);
      setCountdown(5);
      flushEndgameEventsRef.current(score);
    };

    const handleScore = (payload: unknown) => {
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("score" in payload) ||
        typeof (payload as { score?: unknown }).score !== "number"
      ) {
        console.warn("[TapTapClash] Invalid ttc_score payload", payload);
        return;
      }

      const score = (payload as { score: number }).score;
      setLiveScore(score);
    };

    gameRef.current.events.on("ttc_game_over", handleGameOver);
    gameRef.current.events.on("ttc_score", handleScore);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Ensure we always leave the room if the user navigates away
      // (dashboard, home, leaderboard transition, etc.).
      sendLeaveGameOnceRef.current();

      gameRef.current?.events.off("ttc_game_over", handleGameOver);
      gameRef.current?.events.off("ttc_score", handleScore);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Send realtime score updates (only when WS is connected).
  useEffect(() => {
    if (!isConnected) return;
    if (gameOverScore !== null) return;
    if (liveScore <= 0) return;
    if (liveScore <= lastSentLiveScoreRef.current) return;

    lastSentLiveScoreRef.current = liveScore;
    sendScoreUpdate(liveScore);
  }, [isConnected, liveScore, gameOverScore, sendScoreUpdate]);

  // Ensure endgame events are sent once WS is ready (flush if game ended while disconnected).
  useEffect(() => {
    if (!isConnected) return;
    const scoreToSend = pendingEndScoreRef.current ?? gameOverScore;
    if (scoreToSend === null) return;
    flushEndgameEvents(scoreToSend);
  }, [isConnected, gameOverScore, flushEndgameEvents]);

  useEffect(() => {
    if (gameOverScore === null) return;

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [gameOverScore]);

  useEffect(() => {
    if (gameOverScore === null) return;
    if (countdown !== 0) return;
    if (!userId) return;
    sendEvent({ type: "leave-game", gameId: gameId, userId, roomId: roomId });
    setGameState("leaderboard");
  }, [
    countdown,
    gameId,
    gameOverScore,
    roomId,
    sendEvent,
    sendLeaveGameOnce,
    setGameState,
    userId,
  ]);

  const goToLeaderboard = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!userId) return;
    sendEvent({ type: "leave-game", gameId: gameId, userId, roomId: roomId });
    setGameState("leaderboard");
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "relative" }}>
        <div
          ref={hostRef}
          style={{
            width: hostSize.width,
            height: hostSize.height,
            touchAction: "none",
          }}
          aria-label="Tap Tap Clash Game"
        />

        {gameOverScore !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

            <div className="relative z-10 w-[min(92%,420px)] rounded-lg border bg-background p-6 text-center">
              <div className="mx-auto mb-4 flex justify-center">
                <Image
                  src={GameOverTxtImg}
                  alt="Game Over"
                  className="h-auto w-[220px] max-w-full"
                  priority
                />
              </div>

              <div className="text-lg font-semibold">
                Score: {gameOverScore}
              </div>
              <div className="mt-1 text-sm text-black">
                Going to leaderboard in {countdown}s
              </div>

              <div className="mt-5">
                <Button className="w-full" onClick={goToLeaderboard}>
                  go to leaderboard
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TapTapClash;
