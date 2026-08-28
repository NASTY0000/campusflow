export type StudentCsvRow = {
  matricNumber: string;
  firstName: string;
  lastName: string;
  otherNames: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  stateOfOrigin: string;
  programme: string;
  faculty: string;
  department: string;
  level: string;
  sessionAdmitted: string;
};

export const STUDENT_CSV_HEADERS = [
  "matricNumber",
  "firstName",
  "lastName",
  "otherNames",
  "email",
  "phone",
  "gender",
  "dateOfBirth",
  "stateOfOrigin",
  "programme",
  "faculty",
  "department",
  "level",
  "sessionAdmitted",
] as const;

export type CsvIssue = { row: number; field?: string; message: string };

export type ParsedCsv = {
  rows: StudentCsvRow[];
  issues: CsvIssue[];
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

function normalizeHeader(h: string): string {
  return h.replace(/^\uFEFF/, "").trim();
}

export function parseStudentCsv(text: string): ParsedCsv {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const issues: CsvIssue[] = [];
  if (lines.length === 0) {
    return { rows: [], issues: [{ row: 0, message: "CSV is empty" }] };
  }

  const headerCells = splitCsvLine(lines[0]).map(normalizeHeader);
  const missing = STUDENT_CSV_HEADERS.filter((h) => !headerCells.includes(h));
  if (missing.length) {
    issues.push({
      row: 1,
      message: `Missing required columns: ${missing.join(", ")}`,
    });
    return { rows: [], issues };
  }

  const index = Object.fromEntries(headerCells.map((h, i) => [h, i]));
  const rows: StudentCsvRow[] = [];
  const seenMatric = new Set<string>();
  const seenEmail = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const rowNum = i + 1;
    const get = (key: (typeof STUDENT_CSV_HEADERS)[number]) =>
      (cells[index[key]] ?? "").trim();

    const row: StudentCsvRow = {
      matricNumber: get("matricNumber"),
      firstName: get("firstName"),
      lastName: get("lastName"),
      otherNames: get("otherNames"),
      email: get("email").toLowerCase(),
      phone: get("phone"),
      gender: get("gender"),
      dateOfBirth: get("dateOfBirth"),
      stateOfOrigin: get("stateOfOrigin"),
      programme: get("programme"),
      faculty: get("faculty"),
      department: get("department"),
      level: get("level"),
      sessionAdmitted: get("sessionAdmitted"),
    };

    const required: (keyof StudentCsvRow)[] = [
      "matricNumber",
      "firstName",
      "lastName",
      "email",
      "gender",
      "programme",
      "faculty",
      "department",
      "level",
      "sessionAdmitted",
    ];
    for (const field of required) {
      if (!row[field]) {
        issues.push({ row: rowNum, field, message: `${field} is required` });
      }
    }

    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      issues.push({ row: rowNum, field: "email", message: "Invalid email" });
    }
    if (row.gender && !["Male", "Female", "M", "F"].includes(row.gender)) {
      issues.push({
        row: rowNum,
        field: "gender",
        message: "Gender must be Male or Female",
      });
    } else if (row.gender === "M") row.gender = "Male";
    else if (row.gender === "F") row.gender = "Female";

    if (row.level && !/^\d{3}$/.test(row.level)) {
      issues.push({
        row: rowNum,
        field: "level",
        message: "Level must be a 3-digit value such as 100",
      });
    }

    const matricKey = row.matricNumber.toUpperCase();
    if (matricKey && seenMatric.has(matricKey)) {
      issues.push({
        row: rowNum,
        field: "matricNumber",
        message: "Duplicate matric number in file",
      });
    }
    seenMatric.add(matricKey);

    if (row.email && seenEmail.has(row.email)) {
      issues.push({
        row: rowNum,
        field: "email",
        message: "Duplicate email in file",
      });
    }
    seenEmail.add(row.email);

    if (row.dateOfBirth && row.dateOfBirth.length > 0) {
      const d = new Date(row.dateOfBirth);
      if (Number.isNaN(d.getTime())) {
        issues.push({
          row: rowNum,
          field: "dateOfBirth",
          message: "dateOfBirth must be ISO (YYYY-MM-DD)",
        });
      }
    }

    rows.push(row);
  }

  return { rows, issues };
}

export function studentCsvTemplate(): string {
  return STUDENT_CSV_HEADERS.join(",") + "\n";
}
