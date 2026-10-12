"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";

type CardData = {
  id: string;
  emoji: string;
  matched: boolean;
  revealed: boolean;
  isBonus: boolean;
};

type CardGO = Phaser.GameObjects.Container & {
  card: CardData;
  back: Phaser.GameObjects.Image;
  front: Phaser.GameObjects.Container;
};

const STORAGE_KEY_BEST_SECONDS = "memoryMatch.bestSeconds";

const GRID_SIZE = 5;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const BONUS_CELLS = 1; // keep 5x5 (25) while still solvable
const PAIRS = (TOTAL_CELLS - BONUS_CELLS) / 2; // 12

const EMOJIS = [
  "🍎",
  "🍌",
  "🍓",
  "🍇",
  "🍉",
  "🍒",
  "🥝",
  "🍍",
  "🥑",
  "🍑",
  "🍋",
  "🍪",
];

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
    scene.time.delayedCall(10, onClick);
  });

  return c;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function safeReadBestSeconds(): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_BEST_SECONDS);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function safeWriteBestSeconds(seconds: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY_BEST_SECONDS, String(seconds));
  } catch {
    // ignore
  }
}

class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create() {
    // Card textures
    const g = this.add.graphics();

    // Back
    g.clear();
    g.fillStyle(0x1f2937, 1); // slate-ish; avoid hard-coded theme colors, but Phaser uses hex; keep neutral.
    g.fillRoundedRect(0, 0, 128, 128, 16);
    g.lineStyle(6, 0x0b1220, 0.9);
    g.strokeRoundedRect(0, 0, 128, 128, 16);
    g.generateTexture("mm_card_back", 128, 128);

    // Front
    g.clear();
    g.fillStyle(0xf8fafc, 1);
    g.fillRoundedRect(0, 0, 128, 128, 16);
    g.lineStyle(6, 0x0b1220, 0.25);
    g.strokeRoundedRect(0, 0, 128, 128, 16);
    g.generateTexture("mm_card_front", 128, 128);

    g.destroy();

    this.scene.start("menu");
  }
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.25, "Memory Match", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "42px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.35, "Tap to match all emojis", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "18px",
        color: "#e5e7eb",
      })
      .setOrigin(0.5);

    const best = safeReadBestSeconds();
    if (best !== null) {
      this.add
        .text(width / 2, height * 0.42, `Best: ${best}s`, {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: "18px",
          color: "#e5e7eb",
        })
        .setOrigin(0.5);
    }

    createRoundedButton({
      scene: this,
      x: width / 2,
      y: height * 0.6,
      label: "Start Game",
      onClick: () => {
        this.scene.start("game");
      },
    });

    // simple dark background
    this.cameras.main.setBackgroundColor("#0b1220");
  }
}

class EndScene extends Phaser.Scene {
  private seconds = 0;
  private bestSeconds: number | null = null;

  constructor() {
    super("end");
  }

  init(data: { seconds: number; bestSeconds: number | null }) {
    this.seconds = data.seconds;
    this.bestSeconds = data.bestSeconds;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0b1220");

    this.add
      .text(width / 2, height * 0.25, "Completed!", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "44px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.38, `Time: ${this.seconds}s`, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "24px",
        color: "#e5e7eb",
      })
      .setOrigin(0.5);

    if (this.bestSeconds !== null) {
      this.add
        .text(width / 2, height * 0.45, `Best: ${this.bestSeconds}s`, {
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
      onClick: () => {
        this.scene.start("game");
      },
    });
  }
}

class MemoryGameScene extends Phaser.Scene {
  private cards: CardGO[] = [];
  private firstPick: CardGO | null = null;
  private secondPick: CardGO | null = null;
  private busy = false;

  private gridStartX = 0;
  private gridStartY = 0;
  private cellSize = 0;
  private gap = 0;
  private gridWidth = 0;
  private gridHeight = 0;

  private seconds = 0;
  private timerText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private matchedNonBonus = 0;

  constructor() {
    super("game");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0b1220");

    const { width, height } = this.scale;
    this.seconds = 0;
    this.matchedNonBonus = 0;
    this.cards = [];
    this.firstPick = null;
    this.secondPick = null;
    this.busy = false;

    this.timerText = this.add.text(16, 14, "Time: 0s", {
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      fontSize: "22px",
      color: "#ffffff",
    });

    this.timerEvent?.remove(false);
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.seconds += 1;
        this.timerText?.setText(`Time: ${this.seconds}s`);
      },
    });

    const allCards: CardData[] = [];
    const emojiPool = EMOJIS.slice(0, PAIRS);

    for (let i = 0; i < emojiPool.length; i += 1) {
      const emoji = emojiPool[i];
      allCards.push({
        id: `${i}-a`,
        emoji,
        matched: false,
        revealed: false,
        isBonus: false,
      });
      allCards.push({
        id: `${i}-b`,
        emoji,
        matched: false,
        revealed: false,
        isBonus: false,
      });
    }

    allCards.push({
      id: "bonus",
      emoji: "⭐",
      matched: false,
      revealed: false,
      isBonus: true,
    });
    shuffleInPlace(allCards);

    const marginX = 18;
    const topY = 58;
    const availableWidth = width - marginX * 2;
    const availableHeight = height - topY - 18;

    const gap = 10;
    const cellSize = Math.floor(
      Math.min(
        (availableWidth - gap * (GRID_SIZE - 1)) / GRID_SIZE,
        (availableHeight - gap * (GRID_SIZE - 1)) / GRID_SIZE
      )
    );

    const gridWidth = cellSize * GRID_SIZE + gap * (GRID_SIZE - 1);
    const gridHeight = cellSize * GRID_SIZE + gap * (GRID_SIZE - 1);
    const startX = (width - gridWidth) / 2;
    const startY = topY + (availableHeight - gridHeight) / 2;

    this.gridStartX = startX;
    this.gridStartY = startY;
    this.cellSize = cellSize;
    this.gap = gap;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;

    for (let idx = 0; idx < allCards.length; idx += 1) {
      const row = Math.floor(idx / GRID_SIZE);
      const col = idx % GRID_SIZE;
      const x = startX + col * (cellSize + gap) + cellSize / 2;
      const y = startY + row * (cellSize + gap) + cellSize / 2;
      const card = allCards[idx];

      const cardGO = this.createCard(x, y, cellSize, card);
      this.cards.push(cardGO);
    }

    this.input.removeAllListeners("pointerdown");
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const p = pointer.positionToCamera(
        this.cameras.main
      ) as Phaser.Math.Vector2;

      const localX = p.x - this.gridStartX;
      const localY = p.y - this.gridStartY;
      if (localX < 0 || localY < 0) return;
      if (localX > this.gridWidth || localY > this.gridHeight) return;

      const step = this.cellSize + this.gap;
      const col = Math.floor(localX / step);
      const row = Math.floor(localY / step);
      if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return;

      const inCellX = localX - col * step;
      const inCellY = localY - row * step;
      if (inCellX > this.cellSize || inCellY > this.cellSize) return;

      const index = row * GRID_SIZE + col;
      const cardGO = this.cards[index];
      if (!cardGO) return;

      this.spawnTapEffect(p.x, p.y);
      this.onCardPressed(cardGO);
    });
  }

  private spawnTapEffect(x: number, y: number) {
    const startRadius = 8;
    const endRadius = 12;
    const g = this.add.graphics();
    g.setDepth(10_000);

    const state = { r: startRadius, a: 0.6 };

    const redraw = () => {
      g.clear();
      g.setAlpha(1);

      g.fillStyle(0xffffff, state.a);
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
      onComplete: () => {
        g.destroy();
      },
    });
  }

  private createCard(
    x: number,
    y: number,
    size: number,
    card: CardData
  ): CardGO {
    const container = this.add.container(x, y) as CardGO;
    container.card = card;

    // Back
    const back = this.add.image(0, 0, "mm_card_back");
    back.setDisplaySize(size, size);
    container.back = back;

    const backIcon = this.add.text(0, 0, "❓", {
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      fontSize: `${Math.max(20, Math.floor(size * 0.42))}px`,
      color: "#ffffff",
    });
    backIcon.setOrigin(0.5);

    // Front
    const frontContainer = this.add.container(0, 0);
    const frontBg = this.add.image(0, 0, "mm_card_front");
    frontBg.setDisplaySize(size, size);

    const emojiText = this.add.text(0, 0, card.emoji, {
      fontFamily: "system-ui, -apple-system, Segoe UI Emoji, Apple Color Emoji",
      fontSize: `${Math.max(22, Math.floor(size * 0.5))}px`,
      color: "#111827",
    });
    emojiText.setOrigin(0.5);
    frontContainer.add([frontBg, emojiText]);
    container.front = frontContainer;

    container.add([frontContainer, back, backIcon]);

    // Initial visibility
    this.applyCardVisibility(container);

    return container;
  }

  private applyCardVisibility(cardGO: CardGO) {
    const showFront = cardGO.card.revealed || cardGO.card.matched;
    cardGO.front.setVisible(showFront);
    cardGO.back.setVisible(!showFront);
    // backIcon is always the last added child; keep it in sync with back
    const backIcon = cardGO.list[2] as Phaser.GameObjects.Text | undefined;
    backIcon?.setVisible(!showFront);
  }

  private onCardPressed(cardGO: CardGO) {
    if (this.busy) return;
    if (cardGO.card.matched) return;
    if (cardGO.card.revealed) return;

    if (cardGO.card.isBonus) {
      this.busy = true;
      cardGO.card.revealed = true;
      this.applyCardVisibility(cardGO);

      this.time.delayedCall(500, () => {
        cardGO.card.revealed = false;
        this.applyCardVisibility(cardGO);
        this.busy = false;
      });
      return;
    }

    cardGO.card.revealed = true;
    this.applyCardVisibility(cardGO);

    if (!this.firstPick) {
      this.firstPick = cardGO;
      return;
    }

    this.secondPick = cardGO;
    this.busy = true;

    const first = this.firstPick;
    const second = this.secondPick;

    if (first.card.emoji === second.card.emoji) {
      first.card.matched = true;
      second.card.matched = true;
      this.matchedNonBonus += 2;

      this.firstPick = null;
      this.secondPick = null;
      this.busy = false;

      this.checkWin();
      return;
    }

    this.time.delayedCall(650, () => {
      first.card.revealed = false;
      second.card.revealed = false;
      this.applyCardVisibility(first);
      this.applyCardVisibility(second);
      this.firstPick = null;
      this.secondPick = null;
      this.busy = false;
    });
  }

  private checkWin() {
    const target = TOTAL_CELLS - BONUS_CELLS;
    if (this.matchedNonBonus !== target) return;

    this.timerEvent?.remove(false);
    const seconds = this.seconds;

    const previousBest = safeReadBestSeconds();
    const nextBest =
      previousBest === null ? seconds : Math.min(previousBest, seconds);
    if (previousBest === null || seconds < previousBest) {
      safeWriteBestSeconds(nextBest);
    }

    console.log("[MemoryMatch] Completed", {
      seconds,
      bestSeconds: nextBest,
    });

    this.time.delayedCall(500, () => {
      this.scene.start("end", { seconds, bestSeconds: nextBest });
    });
  }
}

const MemoryMatch2: React.FC = () => {
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
        touch: {
          capture: true,
        },
        mouse: {
          preventDefaultDown: true,
        },
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
      scene: [BootScene, MenuScene, MemoryGameScene, EndScene],
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
        aria-label="Memory Match Game"
      />
    </div>
  );
};

export default MemoryMatch2;
