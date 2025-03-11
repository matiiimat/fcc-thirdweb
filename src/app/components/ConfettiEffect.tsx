"use client";

import { useEffect, useRef } from "react";
import styles from "./ConfettiEffect.module.css";

interface ConfettiEffectProps {
  trigger: boolean;
}

const ConfettiEffect = ({ trigger }: ConfettiEffectProps) => {
  const confettiContainerRef = useRef<HTMLDivElement>(null);
  const piecesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!trigger || !confettiContainerRef.current) return;

    // Clear previous confetti immediately
    piecesRef.current.forEach((piece) => piece.remove());
    piecesRef.current = [];

    // Generate 100 confetti pieces with slower physics
    const container = confettiContainerRef.current;
    const colors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];

    for (let i = 0; i < 100; i++) {
      const piece = document.createElement("div");
      piece.className = styles.confetti;

      // Adjusted for slower motion
      const angle = Math.random() * Math.PI * 2;
      const velocity = 5 + Math.random() * 3; // Reduced speed
      const rotationSpeed = (Math.random() - 0.5) * 15; // Slower rotation
      const color = colors[Math.floor(Math.random() * colors.length)];

      piece.style.cssText = `
        --x: ${Math.random() * 100}%;
        --angle: ${angle}rad;
        --velocity: ${velocity};
        --rotation-speed: ${rotationSpeed}deg;
        --hue: ${color};
        left: var(--x);
      `;

      container.appendChild(piece);
      piecesRef.current.push(piece);
    }

    // Extended removal timeout
    const timer = setTimeout(() => {
      piecesRef.current.forEach((piece) => piece.remove());
      piecesRef.current = [];
    }, 3000); // Matches animation duration

    return () => {
      clearTimeout(timer);
      piecesRef.current.forEach((piece) => piece.remove());
      piecesRef.current = [];
    };
  }, [trigger]);

  return (
    <div ref={confettiContainerRef} className={styles.confettiContainer} />
  );
};

export default ConfettiEffect;
