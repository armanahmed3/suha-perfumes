export function formatPKR(n: number): string {
  return `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Math.round(n))}`;
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function cnNote(arr: string[] | undefined | null, fallback: string[]): string[] {
  if (arr && arr.length > 0) return arr;
  return fallback;
}
