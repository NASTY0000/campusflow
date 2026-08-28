import { describe, expect, it } from "vitest";
import { parseStudentCsv, STUDENT_CSV_HEADERS } from "@/lib/csv";

const header = STUDENT_CSV_HEADERS.join(",");

describe("CSV student import", () => {
  it("parses a valid row", () => {
    const csv = `${header}
RUV/2025/CSC/099,Kelechi,Nwankwo,Ife,kelechi@ridgeview.edu.ng,0803,Male,2006-06-06,Imo,B.Sc. Computer Science,Science,Computer Science,100,2025/2026
`;
    const parsed = parseStudentCsv(csv);
    expect(parsed.issues).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].matricNumber).toBe("RUV/2025/CSC/099");
    expect(parsed.rows[0].email).toBe("kelechi@ridgeview.edu.ng");
    expect(parsed.rows[0].gender).toBe("Male");
  });

  it("normalizes M/F gender and lowercases email", () => {
    const csv = `${header}
RUV/1,Ada,Eze,,ADA@Ridgeview.EDU.NG,,F,,Lagos,Law,Law,Law,100,2025/2026
`;
    const parsed = parseStudentCsv(csv);
    expect(parsed.issues).toEqual([]);
    expect(parsed.rows[0].gender).toBe("Female");
    expect(parsed.rows[0].email).toBe("ada@ridgeview.edu.ng");
  });

  it("flags missing columns", () => {
    const parsed = parseStudentCsv("firstName,lastName\nAda,Eze");
    expect(parsed.rows).toHaveLength(0);
    expect(parsed.issues[0].message).toMatch(/Missing required columns/);
  });

  it("flags missing required fields and bad email", () => {
    const csv = `${header}
,First,Last,,not-an-email,,Male,,,,Science,CS,99,2025/2026
`;
    const parsed = parseStudentCsv(csv);
    expect(parsed.issues.length).toBeGreaterThan(0);
    expect(parsed.issues.some((i) => i.field === "matricNumber")).toBe(true);
    expect(parsed.issues.some((i) => i.field === "email")).toBe(true);
    expect(parsed.issues.some((i) => i.field === "level")).toBe(true);
  });

  it("detects duplicate matric numbers in the same file", () => {
    const row =
      "RUV/1,Ada,Eze,,ada@x.com,,Female,,Lagos,Law,Law,Law,100,2025/2026";
    const parsed = parseStudentCsv(`${header}\n${row}\n${row}`);
    expect(parsed.issues.some((i) => i.message.includes("Duplicate matric"))).toBe(true);
  });

  it("handles quoted commas in names", () => {
    const csv = `${header}
RUV/2,"Nwosu, Chioma",Okeke,,chioma@x.com,,Female,,Anambra,Law,Law,Law,100,2025/2026
`;
    const parsed = parseStudentCsv(csv);
    expect(parsed.issues).toEqual([]);
    expect(parsed.rows[0].firstName).toBe("Nwosu, Chioma");
  });
});
