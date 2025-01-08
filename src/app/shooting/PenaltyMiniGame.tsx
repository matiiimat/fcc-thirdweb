"use client";

import React, { useRef, useState, useEffect } from "react";

const PenaltyMiniGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState({
    ball: { x: 150, y: 400, radius: 10 },
    goalkeeper: { x: 120, y: 50, width: 60, height: 10 },
    result: null as string | null,
  });
  const [startSwipe, setStartSwipe] = useState({ x: 0, y: 0 });

  const directions = ["left", "center", "right"];

  const resetGame = () => {
    setGameState({
      ball: { x: 150, y: 400, radius: 10 },
      goalkeeper: { x: 120, y: 50, width: 60, height: 10 },
      result: null,
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pitch
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw goal posts
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(70, 10, 160, 10); // Crossbar
    ctx.fillRect(70, 10, 10, 60); // Left post
    ctx.fillRect(220, 10, 10, 60); // Right post

    // Draw goalkeeper
    ctx.fillStyle = "#000000";
    const { x, y, width, height } = gameState.goalkeeper;
    ctx.fillRect(x, y, width, height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(
      gameState.ball.x,
      gameState.ball.y,
      gameState.ball.radius,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.closePath();
  };

  const handleSwipeEnd = (endX: number, endY: number) => {
    const swipeDirection = endX - startSwipe.x > 0 ? "right" : "left";
    const ballTargetY = 50;

    const randomKeeperPosition = Math.floor(Math.random() * directions.length);
    const goalkeeperDivesTo = directions[randomKeeperPosition];

    let ballTargetX = 150; // Default to center
    let goalkeeperX = 120; // Default to center

    if (goalkeeperDivesTo === "left") {
      goalkeeperX = 70; // Move goalkeeper left
    } else if (goalkeeperDivesTo === "right") {
      goalkeeperX = 170; // Move goalkeeper right
    }

    if (swipeDirection === "left") {
      ballTargetX = 100; // Move ball left
    } else if (swipeDirection === "right") {
      ballTargetX = 200; // Move ball right
    }

    // Determine result
    const ballDirection =
      directions[
        swipeDirection === "left" ? 0 : swipeDirection === "right" ? 2 : 1
      ];
    const result =
      goalkeeperDivesTo === ballDirection
        ? "Goalkeeper saved it!"
        : "It's a GOAL!";

    setGameState((prev) => ({
      ...prev,
      ball: { ...prev.ball, x: ballTargetX, y: ballTargetY },
      goalkeeper: { ...prev.goalkeeper, x: goalkeeperX },
      result,
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartSwipe({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    handleSwipeEnd(endX, endY);
  };

  useEffect(() => {
    draw();
  }, [gameState]);

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <style jsx global>{`
        body {
          margin: 0;
          overflow: hidden; /* Prevent scrolling */
        }
      `}</style>
      <h2>Penalty Mini Game</h2>
      <canvas
        ref={canvasRef}
        width={300}
        height={500}
        style={{
          border: "1px solid #000",
          backgroundColor: "#4CAF50",
          touchAction: "none", // Prevent scrolling
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {gameState.result && (
        <>
          <h3>{gameState.result}</h3>
          <button onClick={resetGame} style={{ marginTop: "20px" }}>
            Play Again
          </button>
        </>
      )}
    </div>
  );
};

export default PenaltyMiniGame;
