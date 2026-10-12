"use client";

import React, { useEffect, useRef } from "react";
import * as Phaser from "phaser";

class MainScene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private stars?: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText?: Phaser.GameObjects.Text;

  preload() {
    this.load.image("sky", "/assets/sky.avif");
    this.load.image("ground", "/assets/ground.png");
    this.load.image("star", "/assets/star.png");
    this.load.spritesheet("dude", "/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    this.add.image(400, 300, "sky");

    const platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, "ground").setScale(2).refreshBody();
    platforms.create(600, 400, "ground");
    platforms.create(50, 250, "ground");
    platforms.create(750, 220, "ground");

    this.player = this.physics.add.sprite(100, 450, "dude");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.cursors = this.input.keyboard?.createCursorKeys();

    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate((child) => {
      const star = child as Phaser.Physics.Arcade.Image;
      star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      return true;
    });

    this.physics.add.collider(this.player, platforms);
    this.physics.add.collider(this.stars, platforms);
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      undefined,
      this
    );

    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
      color: "#000",
    });
  }

  update() {
    if (!this.cursors || !this.player) return;
    if (!this.player.body) return;

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play("left", true);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("turn");
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.cursors.up?.isDown && body.blocked.down) {
      this.player.setVelocityY(-330);
    }
  }

  private collectStar: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _playerObj,
    starObj
  ) => {
    // Overlap callbacks can receive bodies/tiles; only handle collectible game objects.
    if (
      !starObj ||
      typeof starObj !== "object" ||
      !("disableBody" in starObj)
    ) {
      return;
    }

    const star = starObj as Phaser.Physics.Arcade.Image;
    star.disableBody(true, true);

    this.score += 10;
    this.scoreText?.setText(`Score: ${this.score}`);
  };
}

const Game: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    // Game config
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 300 },
          debug: false,
        },
      },
      scene: MainScene,
    };

    // Create Phaser game
    const game = new Phaser.Game(config);

    // Cleanup on component unmount
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameRef}></div>;
};

export default Game;
