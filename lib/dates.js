export const today = () => new Date().toISOString().slice(0, 10); // UTC day, same as the database
const key = d => d.toISOString().slice(0, 10);

// days: Set of 'YYYY-MM-DD' strings the user finished
export function streakFor(days) {
  const d = new Date();
  if (!days.has(key(d))) d.setUTCDate(d.getUTCDate() - 1);
  let s = 0;
  while (days.has(key(d))) { s++; d.setUTCDate(d.getUTCDate() - 1); }
  return s;
}
