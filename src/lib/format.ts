const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(n: number) {
  return usd.format(n);
}

export function time(at?: string) {
  if (!at) return "";
  const [h, m] = at.slice(11, 16).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function day(date: string) {
  const [y, mo, d] = date.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return `${DAYS[dt.getUTCDay()]} ${MONTHS[mo - 1]} ${d}`;
}

export function when(at: string, today: string) {
  return at.slice(0, 10) === today ? time(at) : `${day(at)}, ${time(at)}`;
}

export function boxes(n: number) {
  return `${n} ${Math.abs(n) === 1 ? "box" : "boxes"}`;
}
