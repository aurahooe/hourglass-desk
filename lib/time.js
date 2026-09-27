export function slotStart(d = new Date()) {
  const x = new Date(d);
  x.setUTCMinutes(0, 0, 0);
  return x.toISOString();
}

export function nextHour(d = new Date()) {
  const x = new Date(d);
  x.setMinutes(60, 0, 0);
  return x;
}
