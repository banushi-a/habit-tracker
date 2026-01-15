"use client";

import { useEffect, useState } from "react";
import { Confetti } from "./confetti";

interface HabitCellCelebrationProps {
  /**
   * Whether the goal is met (triggers animation)
   */
  isGoalMet: boolean;
  /**
   * Previous goal met state (to detect when goal is newly achieved)
   */
  wasGoalMet?: boolean;
  /**
   * Habit color for themed confetti
   */
  habitColor?: string;
  /**
   * Origin X position (0-1)
   */
  originX?: number;
  /**
   * Origin Y position (0-1)
   */
  originY?: number;
}

/**
 * Celebration component for habit cells that triggers confetti when a goal is achieved.
 *
 * Only plays animation when transitioning from not-met to met state,
 * preventing animations on initial render or page load.
 *
 * @param props - Component props
 * @param props.isGoalMet - Current goal met status
 * @param props.wasGoalMet - Previous goal met status
 * @param props.habitColor - Optional habit color for themed confetti
 */
export function HabitCellCelebration({
  isGoalMet,
  wasGoalMet = false,
  habitColor,
  originX = 0.5,
  originY = 0.5,
}: HabitCellCelebrationProps) {
  const [shouldCelebrate, setShouldCelebrate] = useState(false);

  useEffect(() => {
    // Only celebrate if we just reached the goal (transition from false to true)
    if (isGoalMet && !wasGoalMet) {
      setShouldCelebrate(true);
      // Reset after animation completes
      const timeout = setTimeout(() => setShouldCelebrate(false), 1100);
      return () => clearTimeout(timeout);
    }
  }, [isGoalMet, wasGoalMet]);

  // Generate colors based on habit color if provided
  const getConfettiColors = () => {
    if (!habitColor) {
      return [
        "#ff6b6b",
        "#4ecdc4",
        "#45b7d1",
        "#f9ca24",
        "#6c5ce7",
        "#a29bfe",
      ];
    }

    // Parse habit color and create variations
    const baseColor = habitColor.startsWith("#")
      ? habitColor
      : `#${habitColor}`;

    return [
      baseColor,
      "#ffd93d",
      "#6bcf7f",
      "#4d96ff",
      "#ff6b9d",
      "#c44569",
    ];
  };

  return (
    <Confetti
      trigger={shouldCelebrate}
      originX={originX}
      originY={originY}
      count={12}
      colors={getConfettiColors()}
      duration={1000}
    />
  );
}
