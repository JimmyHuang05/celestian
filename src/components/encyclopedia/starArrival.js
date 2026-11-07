export const STAR_REVEAL_DURATION = 2800

// A fixed scattered order reveals individual stars without moving their positions.
export function starArrivalOpacity(index, time, startedAt) {
  if (startedAt == null) return 1
  const delay = ((index * .61803398875) % 1) * 2400
  const progress = Math.max(0, Math.min(1, (time - startedAt - delay) / 400))
  return progress * progress * (3 - 2 * progress)
}
