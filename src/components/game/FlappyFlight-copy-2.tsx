"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import Image from "next/image";

import GameGround from "@/assets/game/flappy-flight/game-ground.png";
import GameOverTxtImg from "@/assets/game/game-over.png";
import {
  urlQueryParams,
  useWebSocket,
} from "@/utilities/websocket/WebSocketProvider";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { getUserIdFromToken, sanitizeToken } from "@/lib/jwt";

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

function getRenderResolution() {
  // Boost canvas backing resolution to avoid blur when Phaser scales the canvas
  // (especially on high-DPI screens). Cap to prevent excessive GPU usage.
  if (typeof window === "undefined") return 1;
  const dpr = window.devicePixelRatio || 1;
  return Math.min(Math.max(1, dpr), 3);
}

function getAssetSrc(asset: unknown): string {
  if (typeof asset === "string") return asset;
  if (asset && typeof asset === "object" && "src" in asset) {
    const src = (asset as { src?: unknown }).src;
    if (typeof src === "string") return src;
  }
  throw new Error("Unsupported asset import shape");
}

const SVG_BG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="760" viewBox="0 0 520 760">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7dd3fc"/>
      <stop offset="0.55" stop-color="#38bdf8"/>
      <stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.25" cy="0.18" r="0.42">
      <stop offset="0" stop-color="#fff7b2"/>
      <stop offset="0.55" stop-color="#fde047"/>
      <stop offset="1" stop-color="#f59e0b" stop-opacity="0.95"/>
    </radialGradient>
    <linearGradient id="hill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22c55e" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#4ade80" stop-opacity="0.9"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="520" height="760" fill="url(#sky)"/>

  <!-- Sun + soft rays -->
  <circle cx="110" cy="130" r="84" fill="url(#sun)"/>
  <circle cx="110" cy="130" r="120" fill="#fde047" fill-opacity="0.2"/>
  <circle cx="110" cy="130" r="160" fill="#fde047" fill-opacity="0.12"/>

  <!-- Distant clouds (static) -->
  <g fill="#ffffff" fill-opacity="0.92">
    <path d="M350 120c16-26 56-28 72 0c24 0 42 18 42 40c0 22-18 40-40 40H336c-20 0-36-16-36-36c0-20 16-36 36-36c4 0 9 0 14 1z"/>
    <path d="M140 220c12-20 44-22 56 0c19 0 34 14 34 32c0 18-14 32-32 32H98c-16 0-29-13-29-29c0-16 13-29 29-29c3 0 7 0 11 1z"/>
  </g>

  <!-- Soft hills near horizon -->
  <path d="M0 520 C120 470, 190 520, 300 495 C380 477, 460 450, 520 465 L520 760 L0 760 Z" fill="url(#hill)" fill-opacity="0.35"/>
  <path d="M0 560 C120 520, 220 580, 320 555 C420 530, 470 520, 520 535 L520 760 L0 760 Z" fill="#22c55e" fill-opacity="0.22"/>
</svg>`;

const SVG_CLOUD = `<?xml version="1.0" encoding="utf-8"?>

<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">

<!-- License: Apache. Made by vaadin: https://github.com/vaadin/vaadin-icons -->
<svg width="260" height="170" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<path fill="#fff" d="M14 13c1.1 0 2-0.9 2-2s-0.9-2-2-2c0 0-0.1 0-0.1 0 0-0.3 0.1-0.6 0.1-1 0-2.2-1.8-4-4-4-0.8 0-1.5 0.2-2.2 0.6-0.3-0.9-1.2-1.6-2.3-1.6-1.4 0-2.5 1.1-2.5 2.5 0 0.6 0.2 1.1 0.6 1.6-0.2-0.1-0.4-0.1-0.6-0.1-1.7 0-3 1.3-3 3s1.3 3 3 3h11z" stroke="#0b1220" stroke-opacity="0.08" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"></path>
</svg>`;

const SVG_BIRD = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fdba74"/>
      <stop offset="1" stop-color="#f97316"/>
    </linearGradient>
    <linearGradient id="wing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#e0f2fe" stop-opacity="0.95"/>
    </linearGradient>
  </defs>

  <!-- wing (back) -->
  <path d="M42 64c-12-8-18-20-16-32c18 6 30 18 34 34c-7 3-13 3-18-2z" fill="url(#wing)"/>
  <path d="M42 64c-12-8-18-20-16-32c18 6 30 18 34 34c-7 3-13 3-18-2z" fill="none" stroke="#0b1220" stroke-opacity="0.18" stroke-width="4"/>

  <!-- body -->
  <circle cx="64" cy="62" r="30" fill="url(#body)"/>
  <circle cx="64" cy="62" r="30" fill="none" stroke="#7c2d12" stroke-opacity="0.50" stroke-width="6"/>

  <!-- beak -->
  <g transform="rotate(180 93 64)">
    <path d="M84 64 L102 58 L102 70 Z" fill="#fde047"/>
    <path d="M84 64 L102 58 L102 70 Z" fill="none" stroke="#7c2d12" stroke-opacity="0.25" stroke-width="4"/>
  </g>

  <!-- eye -->
  <circle cx="74" cy="54" r="6" fill="#0b1220" fill-opacity="0.9"/>
  <circle cx="76" cy="52" r="2" fill="#ffffff" fill-opacity="0.9"/>
</svg>`;

const PIPE_VIEWBOX_W = 120;
const PIPE_CAP_VIEWBOX_H = 56;

const SVG_PIPE_BODY = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="464" viewBox="0 56 120 464">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#16a34a"/>
      <stop offset="0.55" stop-color="#22c55e"/>
      <stop offset="1" stop-color="#86efac"/>
    </linearGradient>
  </defs>

  <!-- main tube -->
  <rect x="22" y="0" width="76" height="520" rx="18" fill="url(#g)"/>
  <rect x="18" y="28" width="84" height="18" rx="9" fill="#ffffff" fill-opacity="0.12"/>

  <!-- outline -->
  <rect x="22" y="0" width="76" height="520" rx="18" fill="none" stroke="#0b1220" stroke-opacity="0.6" stroke-width="6"/>
</svg>`;

const SVG_PIPE_CAP = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="56" viewBox="0 0 120 56">
  <defs>
    <linearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4ade80"/>
      <stop offset="1" stop-color="#16a34a"/>
    </linearGradient>
  </defs>
  <rect x="14" y="0" width="92" height="56" rx="18" fill="url(#cap)"/>
  <rect x="18" y="10" width="84" height="18" rx="9" fill="#ffffff" fill-opacity="0.24"/>
  <rect x="14" y="0" width="92" height="56" rx="18" fill="none" stroke="#0b1220" stroke-opacity="0.6" stroke-width="6"/>
</svg>`;

class BootScene extends Phaser.Scene {
  constructor() {
    super("ff_boot");
  }

  preload() {
    this.load.image("ff_bg", encodeSvg(SVG_BG));
    this.load.image("ff_cloud", encodeSvg(SVG_CLOUD));
    this.load.image("ff_bird", encodeSvg(SVG_BIRD));
    this.load.image("ff_pipe_body", encodeSvg(SVG_PIPE_BODY));
    this.load.image("ff_pipe_cap", encodeSvg(SVG_PIPE_CAP));
    this.load.image("ff_ground", getAssetSrc(GameGround));
  }

  create() {
    this.scene.start("ff_game");
  }
}

type PipePair = {
  top: Phaser.Physics.Arcade.Image;
  bottom: Phaser.Physics.Arcade.Image;
  topBody: Phaser.GameObjects.Image;
  topCap: Phaser.GameObjects.Image;
  bottomBody: Phaser.GameObjects.Image;
  bottomCap: Phaser.GameObjects.Image;
  passed: boolean;
};

class FlappyScene extends Phaser.Scene {
  private bird?: Phaser.Physics.Arcade.Image;
  private pipes: PipePair[] = [];
  private startHint?: Phaser.GameObjects.Text;
  private cloudSprites: Phaser.GameObjects.Image[] = [];
  private groundSprites: Phaser.GameObjects.Image[] = [];
  private groundCollider?: Phaser.GameObjects.Rectangle;

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

  private getPipeCapHeightPx() {
    return (PIPE_CAP_VIEWBOX_H / PIPE_VIEWBOX_W) * this.pipeWidth;
  }

  constructor() {
    super("ff_game");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#7dd3fc");

    this.time.removeAllEvents();
    this.tweens.killAll();

    // Background (poster-like sky)
    this.add
      .image(width / 2, height / 2, "ff_bg")
      .setDisplaySize(width, height)
      .setDepth(0);

    // Foreground clouds (subtle motion; purely visual)
    this.cloudSprites.forEach((c) => c.destroy());
    this.cloudSprites = [];
    const cloudCount = 6;
    for (let i = 0; i < cloudCount; i += 1) {
      const cloud = this.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(70, Math.floor(height * 0.36)),
        "ff_cloud"
      );
      const scale = Phaser.Math.FloatBetween(0.35, 0.62);
      cloud.setScale(scale);
      cloud.setAlpha(Phaser.Math.FloatBetween(0.75, 0.95));
      cloud.setDepth(2);
      this.cloudSprites.push(cloud);

      const duration = Phaser.Math.Between(16000, 24000);
      this.tweens.add({
        targets: cloud,
        x: -width * 0.4,
        duration,
        ease: "Linear",
        repeat: -1,
        onRepeat: () => {
          cloud.x = width + Phaser.Math.Between(40, 220);
          cloud.y = Phaser.Math.Between(70, Math.floor(height * 0.36));
          const nextScale = Phaser.Math.FloatBetween(0.35, 0.62);
          cloud.setScale(nextScale);
          cloud.setAlpha(Phaser.Math.FloatBetween(0.75, 0.95));
        },
      });
    }

    this.score = 0;
    this.started = false;
    this.ended = false;
    this.lastGapCenterY = null;

    this.scoreText?.destroy();
    this.scoreText = this.add
      .text(18, 18, "Score: 0", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "22px",
        color: "#ffffff",
      })
      .setStroke("#0b1220", 6)
      .setShadow(0, 6, "#0b1220", 8, true, false)
      .setDepth(10);

    this.startHint?.destroy();
    this.startHint = this.add
      .text(width / 2, height * 0.22, "Tap / Space to Start", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "26px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5)
      .setStroke("#0b1220", 8)
      .setShadow(0, 10, "#0b1220", 10, true, false)
      .setDepth(10);

    // Physics
    this.physics.world.setBounds(0, 0, width, height);

    // Ground (visual; gameplay uses groundY only for pipe layout)
    // Replace the previous drawn ground with the provided PNG (1500x300).
    this.groundSprites.forEach((g) => g.destroy());
    this.groundSprites = [];
    this.groundCollider?.destroy();
    this.groundCollider = undefined;

    const groundTex = this.textures.get("ff_ground");
    const groundSource = groundTex.getSourceImage() as HTMLImageElement;
    const groundNativeW = groundSource?.width || 1500;
    const groundNativeH = groundSource?.height || 300;
    const groundScale = width / groundNativeW;
    const groundDisplayH = groundNativeH * groundScale;
    this.groundY = Math.round(height - groundDisplayH);

    // Two sprites that scroll forever (no texture wrap requirements).
    const groundYCenter = height - groundDisplayH / 2;
    const ground1 = this.add
      .image(width / 2, groundYCenter, "ff_ground")
      .setDisplaySize(width, groundDisplayH)
      .setDepth(1);
    const ground2 = this.add
      .image(width / 2 + width, groundYCenter, "ff_ground")
      .setDisplaySize(width, groundDisplayH)
      .setDepth(1);
    this.groundSprites.push(ground1, ground2);

    // Invisible collider so touching the ground ends the game.
    const colliderH = Math.max(1, height - this.groundY);
    this.groundCollider = this.add
      .rectangle(
        width / 2,
        this.groundY + colliderH / 2,
        width,
        colliderH,
        0,
        0
      )
      .setDepth(0);
    this.physics.add.existing(this.groundCollider, true);

    this.bird?.destroy();
    this.bird = this.physics.add.image(width * 0.32, height * 0.46, "ff_bird");
    this.bird.setDisplaySize(64, 64);
    this.bird.setCircle(26, (64 - 52) / 2, (64 - 52) / 2);
    this.bird.setCollideWorldBounds(false);
    this.bird.setDepth(5);
    // Bird uses world gravity; no per-body override needed.

    this.physics.world.gravity.y = 950;

    if (this.groundCollider) {
      this.physics.add.collider(
        this.bird,
        this.groundCollider as unknown as Phaser.GameObjects.GameObject,
        () => this.endGame()
      );
    }

    // Build initial pipe pairs
    this.pipes.forEach((p) => {
      p.top.destroy();
      p.bottom.destroy();
      p.topBody.destroy();
      p.topCap.destroy();
      p.bottomBody.destroy();
      p.bottomCap.destroy();
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

    // Physics bodies (invisible) - keep collisions exactly as before.
    const top = this.physics.add.image(x, topHeight / 2, "ff_pipe_body");
    top.setOrigin(0.5, 0.5);
    top.setImmovable(true);
    (top.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    top.setVelocityX(0);
    top.setFlipY(true);
    top.setDisplaySize(this.pipeWidth, Math.max(60, topHeight));
    top.setAlpha(0);

    const bottom = this.physics.add.image(
      x,
      bottomY + bottomHeight / 2,
      "ff_pipe_body"
    );
    bottom.setOrigin(0.5, 0.5);
    bottom.setImmovable(true);
    (bottom.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    bottom.setVelocityX(0);
    bottom.setDisplaySize(this.pipeWidth, Math.max(80, bottomHeight));
    bottom.setAlpha(0);

    // Visual pipe layers (cap fixed height; body stretches)
    const topBody = this.add.image(x, 0, "ff_pipe_body").setDepth(3);
    const topCap = this.add.image(x, 0, "ff_pipe_cap").setDepth(4);
    topBody.setFlipY(true);
    topCap.setFlipY(true);

    const bottomBodyObj = this.add.image(x, 0, "ff_pipe_body").setDepth(3);
    const bottomCap = this.add.image(x, 0, "ff_pipe_cap").setDepth(4);

    // initial layout sync
    const pair: PipePair = {
      top,
      bottom,
      topBody,
      topCap,
      bottomBody: bottomBodyObj,
      bottomCap,
      passed: false,
    };

    this.syncPipeVisuals(pair);

    // Ensure pipes stay within world bounds even if physics tries to cull
    top.setCollideWorldBounds(false);
    bottom.setCollideWorldBounds(false);

    // keep last center for smoother difficulty
    this.lastGapCenterY = centerY;

    return pair;
  }

  private syncPipeVisuals(pair: PipePair) {
    const capH = this.getPipeCapHeightPx();
    // Tiny overlap so the cap cleanly covers the tube edge (avoids AA seams).
    const overlap = 2;

    // Top pipe: its top edge is at top.y - h/2
    const topH = pair.top.displayHeight;
    const topTopY = pair.top.y - topH / 2;
    const topBodyH = Math.max(0, Math.min(topH, topH - capH + overlap));
    pair.topBody.setPosition(pair.top.x, topTopY + topBodyH / 2);
    pair.topBody.setDisplaySize(this.pipeWidth, topBodyH);
    pair.topCap.setPosition(pair.top.x, topTopY + topH - capH / 2);
    pair.topCap.setDisplaySize(this.pipeWidth, capH);

    // Bottom pipe: its top edge is at bottom.y - h/2
    const bottomH = pair.bottom.displayHeight;
    const bottomTopY = pair.bottom.y - bottomH / 2;
    const bottomBodyH = Math.max(
      0,
      Math.min(bottomH, bottomH - capH + overlap)
    );
    pair.bottomCap.setPosition(pair.bottom.x, bottomTopY + capH / 2);
    pair.bottomCap.setDisplaySize(this.pipeWidth, capH);
    // Start the body slightly under the cap so the cap hides the edge.
    const bottomBodyTopY = bottomTopY + capH - overlap;
    pair.bottomBody.setPosition(
      pair.bottom.x,
      bottomBodyTopY + bottomBodyH / 2
    );
    pair.bottomBody.setDisplaySize(this.pipeWidth, bottomBodyH);
  }

  update(_time: number, delta: number) {
    if (this.ended) return;

    // Keep the start screen static.
    if (!this.started) return;
    if (!this.bird) return;

    // Ground scroll (visual only)
    if (this.groundSprites.length === 2) {
      const scrollSpeed = Math.abs(this.pipeSpeed);
      const dx = scrollSpeed * (delta / 1000);
      const [g1, g2] = this.groundSprites;
      g1.x -= dx;
      g2.x -= dx;

      const w = g1.displayWidth;
      if (g1.x <= -w / 2) g1.x = g2.x + w;
      if (g2.x <= -w / 2) g2.x = g1.x + w;
    }

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
      // keep visuals attached to physics bodies
      this.syncPipeVisuals(pair);

      // scoring
      if (!pair.passed && pair.top.x + this.pipeWidth / 2 < this.bird.x) {
        pair.passed = true;
        this.score += 1;
        this.scoreText?.setText(`Score: ${this.score}`);
        console.log("[FlappyFlight] score:", this.score);

        // Inform the React host about score updates (realtime).
        this.game.events.emit("ff_score", { score: this.score });
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

    this.syncPipeVisuals(pair);

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

    // Inform the React host about game end.
    // React is responsible for UI overlay + WS score update + navigation.
    this.game.events.emit("ff_game_over", { score: finalScore });

    const prevBest = safeReadBestScore();
    const nextBest =
      prevBest === null ? finalScore : Math.max(prevBest, finalScore);
    if (prevBest === null || finalScore > prevBest)
      safeWriteBestScore(nextBest);

    this.input.enabled = false;
    this.scene.pause();
  }
}

type FlappyFlight3Props = {
  setGameState: React.Dispatch<
    React.SetStateAction<"playing" | "loading" | "createRoom" | "leaderboard">
  >;
  gameId: string;
  roomId: string;
};

const FlappyFlight3: React.FC<FlappyFlight3Props> = ({
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
  const { sendEvent, isConnected, leaderboard } = useWebSocket();

  console.log(leaderboard);

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
      console.warn("[FlappyFlight] skip leave-game (missing ids)", {
        gameId: gid,
        roomId: rid,
      });
      return;
    }

    didSendLeaveRef.current = true;
    // sendEvent({ type: "leave-game", gameId: gid, userId, roomId: rid });
    console.log("[FlappyFlight] sent leave-game", { gameId: gid, roomId: rid });
  }, []);

  const sendScoreUpdate = React.useCallback(
    (score: number) => {
      const gid = gameIdRef.current;
      const rid = roomIdRef.current;
      if (!gid || !rid) {
        console.warn("[FlappyFlight] skip score-update (missing ids)", {
          gameId: gid,
          roomId: rid,
          score,
        });
        return;
      }
      if (!userId) {
        console.warn("[FlappyFlight] skip score-update (missing userId)", {
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
        console.log("[FlappyFlight] sent score-update", finalScore);
      }

      if (!didSendLeaveRef.current) {
        sendLeaveGameOnce();
      }

      pendingEndScoreRef.current = null;
    },
    [sendLeaveGameOnce, sendScoreUpdate]
  );

  // Keep stable refs so the Phaser init effect does not re-run (and cleanup
  // does not fire) just because websocket callbacks / ids change identity.
  const sendLeaveGameOnceRef = useRef(sendLeaveGameOnce);
  const flushEndgameEventsRef = useRef(flushEndgameEvents);

  useEffect(() => {
    sendLeaveGameOnceRef.current = sendLeaveGameOnce;
  }, [sendLeaveGameOnce]);

  useEffect(() => {
    flushEndgameEventsRef.current = flushEndgameEvents;
  }, [flushEndgameEvents]);

  // Keep prop "used" so TS doesn't warn when this component is embedded in a larger flow.
  // useEffect(() => {
  //   void setGameState;
  // }, [setGameState]);

  useEffect(() => {
    const PADDING = 0;
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
        width: Math.round(BASE_WIDTH * scale),
        height: Math.round(BASE_HEIGHT * scale),
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

    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: hostRef.current,
      backgroundColor: "#7dd3fc",
      // This game doesn't use audio; disable WebAudio entirely to avoid
      // "Cannot suspend a closed AudioContext" warnings during teardown.
      audio: { noAudio: true },
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

      // Note: some Phaser type bundles don't include `resolution` even though
      // Phaser supports it at runtime. We set it via an `any` cast to keep TS happy.
    };

    (gameConfig as any).resolution = getRenderResolution();
    gameRef.current = new Phaser.Game(gameConfig as any);

    const handleGameOver = (payload: unknown) => {
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("score" in payload) ||
        typeof (payload as { score?: unknown }).score !== "number"
      ) {
        console.warn("[FlappyFlight] Invalid ff_game_over payload", payload);
        return;
      }

      const score = (payload as { score: number }).score;
      setGameOverScore(score);
      setCountdown(5);

      // Send endgame events immediately so we don't miss them if the user
      // navigates away before React effects run.
      flushEndgameEventsRef.current(score);
    };

    const handleScore = (payload: unknown) => {
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("score" in payload) ||
        typeof (payload as { score?: unknown }).score !== "number"
      ) {
        console.warn("[FlappyFlight] Invalid ff_score payload", payload);
        return;
      }

      const score = (payload as { score: number }).score;
      setLiveScore(score);
    };

    gameRef.current.events.on("ff_game_over", handleGameOver);
    gameRef.current.events.on("ff_score", handleScore);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Ensure we always leave the room if the user navigates away
      // (dashboard, home, leaderboard transition, etc.).
      sendLeaveGameOnceRef.current();

      gameRef.current?.events.off("ff_game_over", handleGameOver);
      gameRef.current?.events.off("ff_score", handleScore);
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
    gameOverScore,
    sendEvent,
    gameId,
    roomId,
    userId,
    setGameState,
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
          aria-label="Flappy Flight Game"
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

export default FlappyFlight3;
