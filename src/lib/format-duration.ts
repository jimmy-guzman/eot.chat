const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

export const formatDuration = (ms: number): string => {
  const hours = ms / HOUR_MS;

  if (Number.isInteger(hours) && hours >= 1) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  const minutes = Math.round(ms / MINUTE_MS);

  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
};
