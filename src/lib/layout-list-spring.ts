/**
 * Spring preset for Motion `layout` on compact horizontal lists (e.g. participant chips).
 * Tuned to match the feel of `durations.motion.normal` (~200ms) — springs have no fixed ms;
 * change values only here, not inline in components.
 */
export const layoutListSpring = {
  damping: 35,
  stiffness: 500,
  type: "spring" as const,
};
