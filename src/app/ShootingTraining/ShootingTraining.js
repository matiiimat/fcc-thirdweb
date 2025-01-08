'use client';

import Phaser from 'phaser';
import { useEffect, useRef } from 'react';

export default function ShootingTraining() {
  const gameRef = useRef(null);

  useEffect(() => {
    let game;
    let score = 0;
    let shotsLeft = 5;
    const playerId = '123'; // Replace with dynamic player data
    const gameId = 'penalty';

    const config = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      scene: {
        preload,
        create,
        update,
      },
    };

    function preload() {
      this.load.image('ball', '/assets/ball.png');
      this.load.image('goal', '/assets/goal.png');
      this.load.image('goalkeeper', '/assets/goalkeeper.png');
    }

    function create() {
      const goal = this.add.image(400, 100, 'goal').setScale(0.5);
      const goalkeeper = this.add.image(400, 150, 'goalkeeper').setScale(0.5);
      const ball = this.add.image(400, 500, 'ball').setScale(0.1);

      // Goalkeeper movement
      this.tweens.add({
        targets: goalkeeper,
        x: { from: 200, to: 600 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
      });

      // Track swipe input
      let swipeStart = null;

      this.input.on('pointerdown', (pointer) => {
        swipeStart = { x: pointer.x, y: pointer.y };
      });

      this.input.on('pointerup', (pointer) => {
        if (swipeStart && shotsLeft > 0) {
          const swipeEnd = { x: pointer.x, y: pointer.y };

          // Calculate swipe direction
          const swipeVector = {
            x: swipeEnd.x - swipeStart.x,
            y: swipeEnd.y - swipeStart.y,
          };

          // Normalize swipe strength
          const magnitude = Math.sqrt(swipeVector.x ** 2 + swipeVector.y ** 2);
          const normalized = { x: swipeVector.x / magnitude, y: swipeVector.y / magnitude };

          // Shoot the ball
          this.tweens.add({
            targets: ball,
            x: ball.x + normalized.x * 200,
            y: ball.y + normalized.y * 200,
            duration: 800,
            onComplete: () => {
              if (
                ball.y < goalkeeper.y + 50 &&
                ball.x > goalkeeper.x - 50 &&
                ball.x < goalkeeper.x + 50
              ) {
                console.log('Goalkeeper saved the shot!');
              } else if (ball.y < goal.y + 50 && ball.x > goal.x - 100 && ball.x < goal.x + 100) {
                console.log('Goal!');
                score++;
              }

              // Reset ball position and decrement shots
              ball.x = 400;
              ball.y = 500;
              shotsLeft--;

              if (shotsLeft === 0) {
                this.add.text(300, 300, `Game Over! Score: ${score}`, {
                  fontSize: '32px',
                  color: '#ffffff',
                });

                // Send results to server
                fetch('/api/saveScore', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ playerId, gameId, score }),
                });
              }
            },
          });
        }
      });
    }

    function update() {
      // Game loop logic if needed
    }

    // Initialize the Phaser game
    game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameRef}></div>;
}
