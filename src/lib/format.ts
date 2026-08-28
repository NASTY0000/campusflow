export function fullName(s: {
  firstName: string;
  lastName: string;
  otherNames?: string | null;
}) {
  return [s.firstName, s.otherNames, s.lastName].filter(Boolean).join(" ");
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dt);
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

export function methodLabel(method: string) {
  switch (method) {
    case "CARD_DEMO":
      return "Card (demo)";
    case "BANK_TRANSFER_DEMO":
      return "Bank transfer (demo)";
    case "CASH":
      return "Cash";
    case "POS":
      return "POS";
    default:
      return method;
  }
}

export function invoiceStatusLabel(status: string) {
  switch (status) {
    case "ISSUED":
      return "Issued";
    case "PARTIAL":
      return "Partial";
    case "PAID":
      return "Paid";
    case "VOID":
      return "Void";
    case "DRAFT":
      return "Draft";
    default:
      return status;
  }
}

export function feeTypeLabel(type: string) {
  switch (type) {
    case "TUITION":
      return "Tuition";
    case "ACCEPTANCE":
      return "Acceptance";
    case "HOSTEL":
      return "Hostel";
    case "DEPARTMENTAL":
      return "Departmental levy";
    case "ID_CARD":
      return "ID card";
    default:
      return type;
  }
}

export function gradePointFromLetter(grade: string): number {
  switch (grade.toUpperCase()) {
    case "A":
      return 5;
    case "B":
      return 4;
    case "C":
      return 3;
    case "D":
      return 2;
    case "E":
      return 1;
    case "F":
      return 0;
    default:
      return 0;
  }
}

export function computeGpa(
  records: { creditUnit: number; gradePoint: number }[]
): number | null {
  const credits = records.reduce((s, r) => s + r.creditUnit, 0);
  if (!credits) return null;
  const points = records.reduce((s, r) => s + r.creditUnit * r.gradePoint, 0);
  return Math.round((points / credits) * 100) / 100;
}
