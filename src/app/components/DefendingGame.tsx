"use client";

import { useEffect, useRef, useState } from "react";

interface Ball {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  width: number;
  height: number;
  bounceCount: number;
}

interface Props {
  onGameComplete: (success: boolean) => void;
}

export default function DefendingGame({ onGameComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ball, setBall] = useState<Ball | null>(null);
  const [gameActive, setGameActive] = useState(true);
  const [hasAttempted, setHasAttempted] = useState(false);
  const requestRef = useRef<number>();
  const [debug, setDebug] = useState<string>("Initializing...");
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const ballImageRef = useRef<HTMLImageElement | null>(null);

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setDebug("Canvas not found");
      return;
    }

    setDebug("Loading images...");

    const backgroundImage = new Image();
    const ballImage = new Image();

    let imagesLoaded = 0;
    const totalImages = 2;

    const startGame = () => {
      setDebug("Starting game...");
      const ballSize = 50;

      const positions = ["left", "right"];
      const startPosition =
        positions[Math.floor(Math.random() * positions.length)];

      const speedMultiplier = 4 + Math.random() * 2;

      // Calculate middle third boundaries
      const thirdHeight = canvas.height / 3;
      const middleThirdStart = thirdHeight;
      const middleThirdEnd = thirdHeight * 2;

      // Get random Y position within middle third
      const y =
        middleThirdStart + Math.random() * (middleThirdEnd - middleThirdStart);

      let x: number, speedX: number, speedY: number;
      const baseSpeed = (canvas.width / 500) * speedMultiplier;

      if (startPosition === "right") {
        x = canvas.width + ballSize;
        speedX = -baseSpeed;
      } else {
        // left
        x = -ballSize;
        speedX = baseSpeed;
      }

      // Add slight vertical movement
      speedY = (Math.random() - 0.5) * baseSpeed * 0.3; // Reduced vertical speed

      console.log(
        `Game Started: Ball coming from ${startPosition} at ${speedMultiplier.toFixed(
          2
        )}x speed, y: ${Math.round(y)}`
      );

      setBall({
        x,
        y,
        speedX,
        speedY,
        width: ballSize,
        height: ballSize,
        bounceCount: 0,
      });
    };

    const checkImagesLoaded = () => {
      imagesLoaded++;
      setDebug(`Loaded ${imagesLoaded}/${totalImages} images`);
      if (imagesLoaded === totalImages) {
        startGame();
      }
    };

    backgroundImage.onload = () => {
      setDebug((prev) => prev + "\nBackground loaded");
      backgroundImageRef.current = backgroundImage;
      checkImagesLoaded();
    };

    ballImage.onload = () => {
      setDebug((prev) => prev + "\nBall loaded");
      ballImageRef.current = ballImage;
      checkImagesLoaded();
    };

    backgroundImage.onerror = (e) => {
      setDebug((prev) => prev + "\nBackground load error: " + e);
    };

    ballImage.onerror = (e) => {
      setDebug((prev) => prev + "\nBall load error: " + e);
    };

    backgroundImage.src = "/images/pitch.png";
    ballImage.src = "/images/ball.png";

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Handle animation
  useEffect(() => {
    if (
      !ball ||
      !gameActive ||
      !backgroundImageRef.current ||
      !ballImageRef.current
    )
      return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      if (backgroundImageRef.current) {
        ctx.drawImage(
          backgroundImageRef.current,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      // Update ball position
      const newX = ball.x + ball.speedX;
      const newY = ball.y + ball.speedY;

      // Draw ball
      if (ballImageRef.current) {
        ctx.save();
        ctx.translate(newX, newY);
        ctx.rotate((newX + newY) * 0.01);
        ctx.drawImage(
          ballImageRef.current,
          -ball.width / 2,
          -ball.height / 2,
          ball.width,
          ball.height
        );
        ctx.restore();
      }

      // Check if ball is out of bounds
      if (newX < -ball.width || newX > canvas.width + ball.width) {
        setGameActive(false);
        onGameComplete(false);
        console.log("Game Result: Goal scored! Ball was too fast!");
        return;
      }

      // Update ball state
      setBall((prevBall) => {
        if (!prevBall) return null;

        let newSpeedX = prevBall.speedX;
        let newSpeedY = prevBall.speedY;
        let newBounceCount = prevBall.bounceCount;

        // Bounce off walls with some randomization
        const bounceDamping = 0.8;
        const bounceRandomization = 0.3;

        // Calculate middle third boundaries
        const thirdHeight = canvas.height / 3;
        const middleThirdStart = thirdHeight;
        const middleThirdEnd = thirdHeight * 2;

        // Only bounce if going outside middle third
        if (newY < middleThirdStart || newY > middleThirdEnd) {
          if (newBounceCount < 2) {
            newSpeedY = -newSpeedY * bounceDamping;
            newSpeedX =
              newSpeedX * (1 + (Math.random() - 0.5) * bounceRandomization);
            newBounceCount++;
            console.log("Ball bounced!", { newSpeedX, newSpeedY });
          }
        }

        return {
          ...prevBall,
          x: newX,
          y: newY,
          speedX: newSpeedX,
          speedY: newSpeedY,
          bounceCount: newBounceCount,
        };
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [ball, gameActive, onGameComplete]);

  const handleInteraction = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!gameActive || !ball || hasAttempted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Scale coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;

    const dx = scaledX - ball.x;
    const dy = scaledY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    setDebug(
      `Tap at (${Math.round(scaledX)}, ${Math.round(
        scaledY
      )}), distance: ${Math.round(distance)}`
    );
    setHasAttempted(true);

    if (distance < ball.width) {
      setGameActive(false);
      onGameComplete(true);
      console.log("Game Result: Successful defense! Ball was caught!");
    } else {
      setGameActive(false);
      onGameComplete(false);
      console.log("Game Result: Missed! Only one attempt allowed.");
    }
  };

  return (
    <div className="relative w-full max-w-[360px] aspect-[9/16]">
      <canvas
        ref={canvasRef}
        width={360}
        height={640}
        className="w-full h-full rounded-lg bg-green-900"
      />
      <div
        className="absolute inset-0 touch-none"
        onClick={handleInteraction}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleInteraction(e);
        }}
      />
      <div className="absolute top-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded whitespace-pre-line">
        {debug}
      </div>
      {!gameActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-2xl font-bold bg-black bg-opacity-50 px-6 py-3 rounded text-center">
            {hasAttempted
              ? ball &&
                Math.sqrt(
                  Math.pow(ball.x - 180, 2) + Math.pow(ball.y - 320, 2)
                ) < ball.width
                ? "Saved!"
                : "Missed!"
              : "Goal!"}
          </div>
        </div>
      )}
    </div>
  );
}
