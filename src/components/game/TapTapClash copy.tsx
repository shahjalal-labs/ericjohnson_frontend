"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";

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
    // subtle border + fill
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

  // Use a dedicated input Zone to avoid Container hit-area edge cases.
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
    scene.tweens.add({
      targets: c,
      scale: 1,
      duration: 110,
      ease: "Quad.Out",
    });
  };

  hit.on("pointerdown", press);
  hit.on("pointerout", release);
  hit.on("pointerup", () => {
    release();
    // small delay so the press feels responsive
    scene.time.delayedCall(10, onClick);
  });

  return c;
}

class BootScene extends Phaser.Scene {
  constructor() {
    super("ttc_boot");
  }

  create() {
    this.scene.start("ttc_menu");
  }
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super("ttc_menu");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0b1220");

    this.add
      .text(width / 2, height * 0.25, "Tap Tap Clash", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "44px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.37,
        "Tap the emojis to score\n(❤️ counts too) — 30 seconds!",
        {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: "18px",
          color: "#e5e7eb",
          align: "center",
        }
      )
      .setOrigin(0.5);

    createRoundedButton({
      scene: this,
      x: width / 2,
      y: height * 0.6,
      label: "Start Game",
      onClick: () => {
        this.scene.start("ttc_game");
      },
    });
  }
}

class EndScene extends Phaser.Scene {
  private score = 0;

  constructor() {
    super("ttc_end");
  }

  init(data: { score: number }) {
    this.score = data.score;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0b1220");

    this.add
      .text(width / 2, height * 0.25, "Time's Up!", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "46px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.4, `Score: ${this.score}`, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "28px",
        color: "#e5e7eb",
      })
      .setOrigin(0.5);

    createRoundedButton({
      scene: this,
      x: width / 2,
      y: height * 0.62,
      label: "Play Again",
      onClick: () => {
        this.scene.start("ttc_game");
      },
    });
  }
}

class TapTapClashScene extends Phaser.Scene {
  private score = 0;
  private scoreText?: Phaser.GameObjects.Text;
  private legendText?: Phaser.GameObjects.Text;

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
    this.emojis.forEach((e) => e.destroy());
    this.emojis = [];

    this.roundStartedAt = this.time.now;
    this.hasSpawnedElectric = false;

    // Drive the round duration off a fresh timer event each run.
    this.roundTimeout = this.time.delayedCall(ROUND_SECONDS * 1000, () => {
      this.finishRound();
    });

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

    this.scheduleNextSpawn();

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

    // Clean up lingering emojis quickly
    this.emojis.forEach((e) => {
      if (!e.scene) return;
      this.tweens.add({ targets: e, alpha: 0, duration: 120 });
      this.time.delayedCall(140, () => {
        if (!e.scene) return;
        e.destroy();
      });
    });
    this.emojis = [];

    const finalScore = this.score;
    console.log("[TapTapClash] Round complete. Final score:", finalScore);
    this.endHandle?.remove(false);
    this.endHandle = this.time.delayedCall(280, () => {
      this.scene.start("ttc_end", { score: finalScore });
    });
  }
}

const TapTapClash2: React.FC = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hostSize, setHostSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

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
      scene: [BootScene, MenuScene, TapTapClashScene, EndScene],
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
        aria-label="Tap Tap Clash Game"
      />
    </div>
  );
};

export default TapTapClash2;
