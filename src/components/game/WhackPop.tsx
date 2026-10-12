"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";

const STORAGE_KEY_BEST_SCORE = "whackPop.bestScore";

const GRID = 3;
const BASE_WIDTH = 520;
const BASE_HEIGHT = 760;
const START_LIVES = 3;

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
    // (QuotaExceededError, SecurityError, etc)
  }
}

function encodeSvg(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createRoundedButton(opts: {
  scene: Phaser.Scene;
  x: number;
  y: number;
  label: string;
  onClick: () => void;
}) {
  const { scene, x, y, label, onClick } = opts;

  const accent = 0x36ff8a;
  const width = 220;
  const height = 54;
  const radius = 18;

  const g = scene.add.graphics();
  const draw = (fillAlpha: number) => {
    g.clear();
    g.lineStyle(2, accent, 0.95);
    g.fillStyle(accent, fillAlpha);
    g.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    g.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  };

  draw(1);

  const t = scene.add
    .text(0, 0, label, {
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      fontSize: "22px",
      color: "#0b1220",
    })
    .setOrigin(0.5);

  const c = scene.add.container(x, y, [g, t]);
  c.setDepth(5);

  const hit = scene.add
    .zone(x, y, width, height)
    .setOrigin(0.5)
    .setDepth(c.depth + 1)
    .setInteractive({ useHandCursor: true });

  const press = () => {
    scene.tweens.killTweensOf(c);
    draw(0.9);
    scene.tweens.add({
      targets: c,
      scale: 0.96,
      duration: 70,
      ease: "Quad.Out",
    });
  };

  const release = () => {
    scene.tweens.killTweensOf(c);
    draw(1);
    scene.tweens.add({ targets: c, scale: 1, duration: 110, ease: "Quad.Out" });
  };

  hit.on("pointerdown", press);
  hit.on("pointerout", release);
  hit.on("pointerup", () => {
    release();
    scene.time.delayedCall(10, onClick);
  });

  return c;
}

type Hole = {
  x: number;
  y: number;
};

type Target = {
  kind: "good" | "bad";
  holeIndex: number;
  expiresAt: number;
  sprite: Phaser.GameObjects.Image;
};

const SVG_HOLE = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">
  <defs>
    <radialGradient id="g" cx="50%" cy="45%" r="65%">
      <stop offset="0" stop-color="#0b1220" stop-opacity="0.92"/>
      <stop offset="1" stop-color="#111827" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <ellipse cx="80" cy="70" rx="62" ry="34" fill="url(#g)"/>
  <ellipse cx="80" cy="70" rx="62" ry="34" fill="none" stroke="#36ff8a" stroke-opacity="0.25" stroke-width="4"/>
</svg>`;

const SVG_GOOD = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#36ff8a"/>
      <stop offset="1" stop-color="#a7f3d0"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="54" fill="url(#p)" fill-opacity="0.95"/>
  <circle cx="80" cy="80" r="54" fill="none" stroke="#0b1220" stroke-opacity="0.4" stroke-width="6"/>
  <path d="M60 84 L74 98 L104 64" fill="none" stroke="#0b1220" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SVG_BAD = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="r" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fb7185"/>
      <stop offset="1" stop-color="#fca5a5"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="54" fill="url(#r)" fill-opacity="0.95"/>
  <circle cx="80" cy="80" r="54" fill="none" stroke="#0b1220" stroke-opacity="0.4" stroke-width="6"/>
  <path d="M60 60 L100 100" stroke="#0b1220" stroke-width="10" stroke-linecap="round"/>
  <path d="M100 60 L60 100" stroke="#0b1220" stroke-width="10" stroke-linecap="round"/>
</svg>`;

class BootScene extends Phaser.Scene {
  constructor() {
    super("wp_boot");
  }

  preload() {
    this.load.image("wp_hole", encodeSvg(SVG_HOLE));
    this.load.image("wp_good", encodeSvg(SVG_GOOD));
    this.load.image("wp_bad", encodeSvg(SVG_BAD));
  }

  create() {
    this.scene.start("wp_menu");
  }
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super("wp_menu");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0b1220");

    this.add
      .text(width / 2, height * 0.24, "Whack Pop", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "46px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.36,
        "Tap green targets to score.\nRed targets cost a life.\nMiss a green target = lose a life.",
        {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: "18px",
          color: "#e5e7eb",
          align: "center",
        }
      )
      .setOrigin(0.5);

    const best = safeReadBestScore();
    if (best !== null) {
      this.add
        .text(width / 2, height * 0.45, `Best: ${best}`, {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: "18px",
          color: "#e5e7eb",
        })
        .setOrigin(0.5);
    }

    createRoundedButton({
      scene: this,
      x: width / 2,
      y: height * 0.62,
      label: "Start Game",
      onClick: () => this.scene.start("wp_game"),
    });
  }
}

class EndScene extends Phaser.Scene {
  private score = 0;
  private bestScore: number | null = null;

  constructor() {
    super("wp_end");
  }

  init(data: { score: number; bestScore: number | null }) {
    this.score = data.score;
    this.bestScore = data.bestScore;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0b1220");

    this.add
      .text(width / 2, height * 0.24, "Round Over", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "46px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.38, `Score: ${this.score}`, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "28px",
        color: "#e5e7eb",
      })
      .setOrigin(0.5);

    if (this.bestScore !== null) {
      this.add
        .text(width / 2, height * 0.45, `Best: ${this.bestScore}`, {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: "20px",
          color: "#e5e7eb",
        })
        .setOrigin(0.5);
    }

    createRoundedButton({
      scene: this,
      x: width / 2,
      y: height * 0.62,
      label: "Start Game",
      onClick: () => this.scene.start("wp_game"),
    });
  }
}

class WhackPopScene extends Phaser.Scene {
  private score = 0;
  private scoreText?: Phaser.GameObjects.Text;

  private lives = START_LIVES;
  private livesText?: Phaser.GameObjects.Text;

  private spawnHandle?: Phaser.Time.TimerEvent;
  private ended = false;

  private holes: Hole[] = [];
  private holeSprites: Phaser.GameObjects.Image[] = [];

  private activeTarget: Target | null = null;

  constructor() {
    super("wp_game");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0b1220");

    // Safety cleanup if restarted fast
    this.time.removeAllEvents();
    this.tweens.killAll();

    this.score = 0;
    this.lives = START_LIVES;
    this.ended = false;

    this.activeTarget?.sprite.destroy();
    this.activeTarget = null;

    this.holes = [];
    this.holeSprites.forEach((h) => h.destroy());
    this.holeSprites = [];

    this.scoreText?.destroy();
    this.scoreText = this.add
      .text(18, 18, "Score: 0", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "22px",
        color: "#e5e7eb",
      })
      .setDepth(5);

    this.livesText?.destroy();
    this.livesText = this.add
      .text(width - 18, 18, `Lives: ${this.lives}`, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "22px",
        color: "#e5e7eb",
      })
      .setOrigin(1, 0)
      .setDepth(5);

    // Lay out 3x3 holes
    const topY = 90;
    const marginX = 24;
    const gap = 26;

    const availableWidth = width - marginX * 2;
    const holeW = Math.floor((availableWidth - gap * (GRID - 1)) / GRID);
    const holeH = Math.floor(holeW * 0.7);

    const gridWidth = holeW * GRID + gap * (GRID - 1);
    const startX = (width - gridWidth) / 2;

    const availableHeight = height - topY - 120;
    const rowGap = Math.min(
      48,
      Math.floor((availableHeight - holeH * GRID) / Math.max(1, GRID - 1))
    );

    for (let r = 0; r < GRID; r += 1) {
      for (let c = 0; c < GRID; c += 1) {
        const x = startX + c * (holeW + gap) + holeW / 2;
        const y = topY + r * (holeH + rowGap) + holeH / 2;
        this.holes.push({ x, y });

        const hole = this.add.image(x, y, "wp_hole");
        hole.setDisplaySize(holeW, holeH);
        hole.setDepth(1);
        this.holeSprites.push(hole);
      }
    }

    this.scheduleNextSpawn(120);
    this.input.mouse?.disableContextMenu();
  }

  update() {
    // endless until lives run out
  }

  private scheduleNextSpawn(minDelay: number) {
    this.spawnHandle?.remove(false);
    if (this.ended) return;

    // Speed up as the score grows
    const difficulty = Phaser.Math.Clamp(this.score / 200, 0, 1);
    const base = Phaser.Math.Linear(560, 260, difficulty);
    const jitter = Phaser.Math.Between(-70, 70);
    const delay = Math.max(minDelay, Math.floor(base + jitter));

    this.spawnHandle = this.time.delayedCall(delay, () => {
      if (this.ended) return;
      this.spawnTarget();
    });
  }

  private spawnTarget() {
    if (this.ended) return;

    // Clear existing target if it overstayed
    if (this.activeTarget) {
      if (this.time.now < this.activeTarget.expiresAt) {
        this.scheduleNextSpawn(120);
        return;
      }
      this.despawnTarget(false, true);
    }

    const holeIndex = Phaser.Math.Between(0, this.holes.length - 1);
    const hole = this.holes[holeIndex];

    const roll = Phaser.Math.Between(0, 9);
    const kind: Target["kind"] = roll === 0 ? "bad" : "good"; // ~10% bad

    const tex = kind === "good" ? "wp_good" : "wp_bad";
    const sprite = this.add.image(hole.x, hole.y - 10, tex);

    // Size relative to hole
    const holeSprite = this.holeSprites[holeIndex];
    const targetSize = Math.floor((holeSprite.displayWidth ?? 120) * 0.72);
    sprite.setDisplaySize(targetSize, targetSize);

    sprite.setDepth(4);
    sprite.setScale(0.8);
    sprite.setAlpha(0);
    sprite.setInteractive({ useHandCursor: true });

    sprite.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.ended) return;

      const isBad = kind === "bad";
      if (isBad) {
        this.loseLife();
      } else {
        this.addScore(10);
      }

      this.spawnTapEffect(
        pointer.worldX ?? sprite.x,
        pointer.worldY ?? sprite.y,
        isBad
      );
      this.despawnTarget(true, false);
    });

    // Pop animation
    this.tweens.add({
      targets: sprite,
      alpha: 1,
      duration: 90,
      ease: "Quad.Out",
    });
    this.tweens.add({
      targets: sprite,
      scale: 1,
      duration: 130,
      ease: "Back.Out",
    });

    const ttl = kind === "bad" ? 650 : 900;
    const expiresAt = this.time.now + ttl;
    this.activeTarget = { kind, holeIndex, expiresAt, sprite };

    // Auto-despawn
    this.time.delayedCall(ttl, () => {
      if (!sprite.scene) return;
      if (this.activeTarget?.sprite !== sprite) return;
      this.despawnTarget(false, true);
    });
  }

  private despawnTarget(fromHit: boolean, wasMiss: boolean) {
    const target = this.activeTarget;
    if (!target) {
      this.scheduleNextSpawn(120);
      return;
    }

    if (!fromHit && wasMiss && target.kind === "good") {
      this.loseLife();
    }

    this.activeTarget = null;
    const sprite = target.sprite;

    this.tweens.killTweensOf(sprite);

    if (fromHit) {
      this.tweens.add({
        targets: sprite,
        scale: 1.18,
        duration: 70,
        yoyo: true,
        ease: "Quad.Out",
      });
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        duration: 160,
        ease: "Cubic.Out",
        onComplete: () => sprite.destroy(),
      });
    } else {
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        duration: 160,
        ease: "Cubic.Out",
        onComplete: () => sprite.destroy(),
      });
    }

    this.scheduleNextSpawn(120);
  }

  private addScore(amount: number) {
    this.score += amount;
    this.scoreText?.setText(`Score: ${this.score}`);
  }

  private loseLife() {
    if (this.ended) return;
    this.lives -= 1;
    this.livesText?.setText(`Lives: ${this.lives}`);

    this.cameras.main.flash(80, 251, 113, 133);
    if (this.lives <= 0) this.finishRound();
  }

  private spawnTapEffect(x: number, y: number, isBad: boolean) {
    const startRadius = 7;
    const endRadius = 16;
    const g = this.add.graphics();
    g.setDepth(10_000);

    const state = { r: startRadius, a: 0.55 };
    const color = isBad ? 0xfb7185 : 0x36ff8a;

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

  private finishRound() {
    if (this.ended) return;
    this.ended = true;

    this.spawnHandle?.remove(false);
    this.spawnHandle = undefined;

    const finalScore = this.score;
    const prevBest = safeReadBestScore();
    const nextBest =
      prevBest === null ? finalScore : Math.max(prevBest, finalScore);
    if (prevBest === null || finalScore > prevBest)
      safeWriteBestScore(nextBest);

    console.log("[WhackPop] endgame:", {
      score: finalScore,
      bestScore: nextBest,
    });

    this.activeTarget?.sprite.destroy();
    this.activeTarget = null;

    this.time.delayedCall(200, () => {
      this.scene.start("wp_end", { score: finalScore, bestScore: nextBest });
    });
  }
}

const WhackPop: React.FC = () => {
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
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BootScene, MenuScene, WhackPopScene, EndScene],
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
        aria-label="Whack Pop Game"
      />
    </div>
  );
};

export default WhackPop;
