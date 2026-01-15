"use client";

import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  velocityX: number;
  velocityY: number;
  size: number;
}

interface ConfettiProps {
  /**
   * Trigger to start the animation
   */
  trigger: boolean;
  /**
   * Origin position relative to parent (0-1)
   */
  originX?: number;
  originY?: number;
  /**
   * Number of confetti pieces
   */
  count?: number;
  /**
   * Custom colors for confetti
   */
  colors?: string[];
  /**
   * Duration of animation in ms
   */
  duration?: number;
}

/**
 * Confetti animation component that creates a burst effect from a specific origin point.
 *
 * @param props - Component props
 * @param props.trigger - When true, triggers the animation
 * @param props.originX - Horizontal origin point (0-1, default 0.5)
 * @param props.originY - Vertical origin point (0-1, default 0.5)
 * @param props.count - Number of confetti pieces (default 15)
 * @param props.colors - Array of color strings (default colorful mix)
 * @param props.duration - Animation duration in ms (default 1000)
 */
export function Confetti({
  trigger,
  originX = 0.5,
  originY = 0.5,
  count = 15,
  colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#6c5ce7", "#a29bfe"],
  duration = 1000,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    // Generate confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const velocity = 2 + Math.random() * 2;

      return {
        id: i,
        x: originX * 100,
        y: originY * 100,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        rotation: Math.random() * 360,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity - 2, // Initial upward boost
        size: 4 + Math.random() * 4,
      };
    });

    setPieces(newPieces);
    setIsAnimating(true);

    // Animate confetti
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        setPieces((currentPieces) =>
          currentPieces.map((piece) => ({
            ...piece,
            x: piece.x + piece.velocityX,
            y: piece.y + piece.velocityY,
            rotation: piece.rotation + 5,
            velocityY: piece.velocityY + 0.15, // Gravity
          })),
        );
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setPieces([]);
      }
    };

    requestAnimationFrame(animate);
  }, [trigger, count, colors, duration, originX, originY]);

  if (!isAnimating || pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: "2px",
            opacity: Math.max(0, 1 - (piece.y / 100) * 0.5),
          }}
        />
      ))}
    </div>
  );
}
