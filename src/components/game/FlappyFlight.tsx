"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";

const STORAGE_KEY_BEST_SCORE = "flappyFlight.bestScore";

const BASE_WIDTH = 520;
const BASE_HEIGHT = 760;

function safeReadBestScore(): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_BEST_SCORE);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function safeWriteBestScore(score: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY_BEST_SCORE, String(score));
  } catch {
    // ignore
  }
}

function encodeSvg(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SVG_BIRD = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#36ff8a"/>
      <stop offset="1" stop-color="#a7f3d0"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="34" fill="url(#b)"/>
  <circle cx="60" cy="60" r="34" fill="none" stroke="#0b1220" stroke-opacity="0.35" stroke-width="6"/>
  <circle cx="72" cy="52" r="5" fill="#0b1220" fill-opacity="0.85"/>
  <path d="M44 66 C36 60, 36 50, 46 48 C52 48, 58 55, 58 63 C56 72, 50 74, 44 66 Z" fill="#0b1220" fill-opacity="0.18"/>
</svg>`;

const SVG_PIPE = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="520" viewBox="0 0 120 520">
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#36ff8a" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#a7f3d0" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect x="18" y="0" width="84" height="520" rx="18" fill="url(#p)"/>
  <rect x="14" y="22" width="92" height="40" rx="16" fill="#0b1220" fill-opacity="0.14"/>
  <rect x="18" y="0" width="84" height="520" rx="18" fill="none" stroke="#0b1220" stroke-opacity="0.25" stroke-width="6"/>
</svg>`;

class BootScene extends Phaser.Scene {
  constructor() {
    super("ff_boot");
  }

  preload() {
    this.load.image("ff_bird", encodeSvg(SVG_BIRD));
    this.load.image("ff_pipe", encodeSvg(SVG_PIPE));
  }

  create() {
    this.scene.start("ff_game");
  }
}

type PipePair = {
  top: Phaser.Physics.Arcade.Image;
  bottom: Phaser.Physics.Arcade.Image;
  passed: boolean;
};

class FlappyScene extends Phaser.Scene {
  private bird?: Phaser.Physics.Arcade.Image;
  private pipes: PipePair[] = [];
  private startHint?: Phaser.GameObjects.Text;

  private groundY = 0;

  private lastGapCenterY: number | null = null;

  private score = 0;
  private scoreText?: Phaser.GameObjects.Text;

  private started = false;
  private ended = false;

  private readonly pipeSpeed = -220;
  private readonly pipeSpacing = 220;
  private readonly pipeWidth = 78;
  private readonly gapSize = 190;

  constructor() {
    super("ff_game");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0b1220");

    this.time.removeAllEvents();
    this.tweens.killAll();

    this.score = 0;
    this.started = false;
    this.ended = false;
    this.lastGapCenterY = null;

    this.scoreText?.destroy();
    this.scoreText = this.add
      .text(18, 18, "Score: 0", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "22px",
        color: "#e5e7eb",
      })
      .setDepth(10);

    this.startHint?.destroy();
    this.startHint = this.add
      .text(width / 2, height * 0.22, "Tap / Space to Start", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "26px",
        color: "#e5e7eb",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(10);

    // Physics
    this.physics.world.setBounds(0, 0, width, height);

    // Ground line (visual)
    this.groundY = height - 90;
    const ground = this.add.graphics().setDepth(1);
    ground.lineStyle(2, 0x36ff8a, 0.15);
    ground.lineBetween(0, this.groundY, width, this.groundY);

    this.bird?.destroy();
    this.bird = this.physics.add.image(width * 0.32, height * 0.46, "ff_bird");
    this.bird.setDisplaySize(64, 64);
    this.bird.setCircle(26, (64 - 52) / 2, (64 - 52) / 2);
    this.bird.setCollideWorldBounds(false);
    // Bird uses world gravity; no per-body override needed.

    this.physics.world.gravity.y = 950;

    // Build initial pipe pairs
    this.pipes.forEach((p) => {
      p.top.destroy();
      p.bottom.destroy();
    });
    this.pipes = [];

    // Build pipes immediately.
    const firstX = width * 0.85;
    for (let i = 0; i < 3; i += 1) {
      const x = firstX + i * this.pipeSpacing;
      this.pipes.push(this.createPipePair(x));
    }

    // Wait for user input to start.
    const birdBody = this.bird.body as Phaser.Physics.Arcade.Body | null;
    birdBody?.setAllowGravity(false);
    this.pipes.forEach((p) => {
      p.top.setVelocityX(0);
      p.bottom.setVelocityX(0);
    });

    // Colliders
    const pipeBodies = this.pipes.flatMap((p) => [p.top, p.bottom]);
    this.physics.add.collider(this.bird, pipeBodies, () => this.endGame());

    const flap = () => {
      if (this.ended) return;
      if (!this.bird) return;

      this.bird.setVelocityY(-330);
      this.bird.setAngle(-15);

      this.time.delayedCall(120, () => {
        if (!this.bird || !this.bird.scene) return;
        this.bird.setAngle(0);
      });
    };

    const startGame = () => {
      if (this.ended) return;
      if (this.started) return;
      this.started = true;
      this.startHint?.destroy();
      this.startHint = undefined;

      const body = this.bird?.body as Phaser.Physics.Arcade.Body | null;
      body?.setAllowGravity(true);
      this.pipes.forEach((p) => {
        p.top.setVelocityX(this.pipeSpeed);
        p.bottom.setVelocityX(this.pipeSpeed);
      });

      flap();
    };

    const handleUserAction = () => {
      if (this.ended) return;
      if (!this.started) {
        startGame();
        return;
      }
      flap();
    };

    // Tap input
    this.input.removeAllListeners("pointerdown");
    this.input.on("pointerdown", handleUserAction);

    // Keyboard input (Spacebar)
    // Use a capture-phase window listener so this still works even if another
    // global keydown handler calls preventDefault on Space.
    const onWindowKeyDown = (evt: KeyboardEvent & { repeat?: boolean }) => {
      if (evt.code !== "Space") return;
      if (evt.repeat) return;
      evt.preventDefault();
      evt.stopImmediatePropagation();
      handleUserAction();
    };

    window.addEventListener("keydown", onWindowKeyDown, true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("keydown", onWindowKeyDown, true);
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      window.removeEventListener("keydown", onWindowKeyDown, true);
    });

    this.input.mouse?.disableContextMenu();
  }

  private createPipePair(x: number): PipePair {
    const { height } = this.scale;

    const playableHeight = this.groundY > 0 ? this.groundY : height;
    const { centerY, topHeight, bottomY, bottomHeight } =
      this.computeGapLayout(playableHeight);

    const top = this.physics.add.image(x, topHeight / 2, "ff_pipe");
    top.setOrigin(0.5, 0.5);
    top.setImmovable(true);
    (top.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    top.setVelocityX(0);
    top.setFlipY(true);
    top.setDisplaySize(this.pipeWidth, Math.max(60, topHeight));

    const bottom = this.physics.add.image(
      x,
      bottomY + bottomHeight / 2,
      "ff_pipe"
    );
    bottom.setOrigin(0.5, 0.5);
    bottom.setImmovable(true);
    (bottom.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    bottom.setVelocityX(0);
    bottom.setDisplaySize(this.pipeWidth, Math.max(80, bottomHeight));

    // Keep pipes rendered below UI but above background
    top.setDepth(3);
    bottom.setDepth(3);

    // Ensure pipes stay within world bounds even if physics tries to cull
    top.setCollideWorldBounds(false);
    bottom.setCollideWorldBounds(false);

    // keep last center for smoother difficulty
    this.lastGapCenterY = centerY;

    return { top, bottom, passed: false };
  }

  update() {
    if (this.ended) return;
    if (!this.started) return;
    if (!this.bird) return;

    const { width, height } = this.scale;

    // Lose conditions
    if (this.bird.y < -40 || this.bird.y > height + 40) {
      this.endGame();
      return;
    }

    // Tilt down as falling
    const body = this.bird.body;
    if (!body) return;
    const vy = body.velocity.y;
    const targetAngle = Phaser.Math.Clamp(vy / 18, -20, 55);
    this.bird.setAngle(targetAngle);

    // Pipes scroll + recycle
    const rightMostX = Math.max(...this.pipes.map((p) => p.top.x));

    for (const pair of this.pipes) {
      // scoring
      if (!pair.passed && pair.top.x + this.pipeWidth / 2 < this.bird.x) {
        pair.passed = true;
        this.score += 1;
        this.scoreText?.setText(`Score: ${this.score}`);
        console.log("[FlappyFlight] score:", this.score);
      }

      // recycle
      if (pair.top.x + this.pipeWidth < -20) {
        const nextX = Math.max(rightMostX, width) + this.pipeSpacing;
        this.resetPipePair(pair, nextX);
      }
    }
  }

  private resetPipePair(pair: PipePair, x: number) {
    const { height } = this.scale;

    const playableHeight = this.groundY > 0 ? this.groundY : height;
    const { centerY, topHeight, bottomY, bottomHeight } =
      this.computeGapLayout(playableHeight);

    pair.passed = false;

    pair.top.setPosition(x, topHeight / 2);
    pair.top.setDisplaySize(this.pipeWidth, Math.max(60, topHeight));
    pair.top.setVelocityX(this.pipeSpeed);

    pair.bottom.setPosition(x, bottomY + bottomHeight / 2);
    pair.bottom.setDisplaySize(this.pipeWidth, Math.max(80, bottomHeight));
    pair.bottom.setVelocityX(this.pipeSpeed);

    this.lastGapCenterY = centerY;
  }

  private computeGapLayout(playableHeight: number) {
    // Keep gaps away from extremes so they are always reachable.
    const marginTop = 150;
    const padding = 34;

    const minCenter = marginTop + this.gapSize / 2 + padding;
    const maxCenter = playableHeight - this.gapSize / 2 - padding;

    // If the screen is too small, fall back to a safe center.
    if (maxCenter <= minCenter) {
      const centerY = Math.max(minCenter, playableHeight * 0.5);
      const topHeight = Math.max(60, centerY - this.gapSize / 2);
      const bottomY = centerY + this.gapSize / 2;
      const bottomHeight = Math.max(80, playableHeight - bottomY);
      return { centerY, topHeight, bottomY, bottomHeight };
    }

    const rawCenter = Phaser.Math.Between(
      Math.floor(minCenter),
      Math.floor(maxCenter)
    );

    // Prevent huge vertical jumps between consecutive gaps.
    const maxDelta = 120;
    const centerY =
      this.lastGapCenterY === null
        ? rawCenter
        : Phaser.Math.Clamp(
            rawCenter,
            this.lastGapCenterY - maxDelta,
            this.lastGapCenterY + maxDelta
          );

    const topHeight = centerY - this.gapSize / 2;
    const bottomY = centerY + this.gapSize / 2;
    // Bottom pipe should fill from the bottom (ground line) upward.
    const bottomHeight = playableHeight - bottomY;

    return { centerY, topHeight, bottomY, bottomHeight };
  }

  private endGame() {
    if (this.ended) return;
    this.ended = true;

    // Stop movement
    this.pipes.forEach((p) => {
      p.top.setVelocityX(0);
      p.bottom.setVelocityX(0);
    });

    if (this.bird) {
      this.bird.setVelocity(0, 0);
    }

    const finalScore = this.score;
    console.log("[FlappyFlight] endgame:", finalScore);
    const prevBest = safeReadBestScore();
    const nextBest =
      prevBest === null ? finalScore : Math.max(prevBest, finalScore);
    if (prevBest === null || finalScore > prevBest)
      safeWriteBestScore(nextBest);

    this.input.enabled = false;
    this.scene.pause();
  }
}

const FlappyFlight: React.FC = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hostSize, setHostSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
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
      fps: { target: 60, min: 30 },
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
      physics: {
        default: "arcade",
        arcade: {
          debug: false,
          gravity: { x: 0, y: 950 },
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BootScene, FlappyScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

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
      <div
        ref={hostRef}
        style={{
          width: hostSize.width,
          height: hostSize.height,
          touchAction: "none",
        }}
        aria-label="Flappy Flight Game"
      />
    </div>
  );
};

export default FlappyFlight;
