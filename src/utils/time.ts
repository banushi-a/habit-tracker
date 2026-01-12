/**
 * Calculate the current moon phase based on date.
 * Returns a number between 0 and 1 representing the moon phase.
 * 0 = New Moon, 0.25 = First Quarter, 0.5 = Full Moon, 0.75 = Last Quarter
 */
function getMoonPhase(): number {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Reference: known new moon on January 6, 2000
  const knownNewMoon = new Date(2000, 0, 6, 18, 14);
  const lunarCycle = 29.53058867; // days in a lunar cycle

  const currentDate = new Date(year, month - 1, day);
  const daysSinceKnownNewMoon =
    (currentDate.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);

  const phase = (daysSinceKnownNewMoon % lunarCycle) / lunarCycle;
  return phase;
}

/**
 * Get the appropriate moon emoji based on the current moon phase.
 */
function getMoonEmoji(): string {
  const phase = getMoonPhase();

  if (phase < 0.0625 || phase >= 0.9375) {
    return "🌑"; // New Moon
  } else if (phase < 0.1875) {
    return "🌒"; // Waxing Crescent
  } else if (phase < 0.3125) {
    return "🌓"; // First Quarter
  } else if (phase < 0.4375) {
    return "🌔"; // Waxing Gibbous
  } else if (phase < 0.5625) {
    return "🌕"; // Full Moon
  } else if (phase < 0.6875) {
    return "🌖"; // Waning Gibbous
  } else if (phase < 0.8125) {
    return "🌗"; // Last Quarter
  } else {
    return "🌘"; // Waning Crescent
  }
}

export function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return { emoji: "☀️", text: "Good morning" };
  } else if (hour < 18) {
    return { emoji: "🌤️", text: "Good afternoon" };
  } else {
    return { emoji: getMoonEmoji(), text: "Good evening" };
  }
}
