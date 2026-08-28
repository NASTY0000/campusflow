export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

export function formatNGN(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(koboToNaira(kobo));
}

export function parseNairaInput(value: string): number {
  const cleaned = value.replace(/[,\s₦]/g, "");
  const naira = Number(cleaned);
  if (!Number.isFinite(naira) || naira < 0) {
    throw new Error("Enter a valid naira amount");
  }
  return nairaToKobo(naira);
}
