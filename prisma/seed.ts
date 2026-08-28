import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "CampusFlow!2026";

type FeeDef = {
  code: string;
  name: string;
  type: string;
  naira: number;
  session?: string;
  level?: string;
  programme?: string;
  description?: string;
};

const RIDGEVIEW_FEES: FeeDef[] = [
  { code: "ACC-2026", name: "Acceptance fee", type: "ACCEPTANCE", naira: 75000, session: "2025/2026", description: "One-time acceptance of admission" },
  { code: "ID-2026", name: "Student ID card", type: "ID_CARD", naira: 5000, session: "2025/2026", description: "Photo ID card issuance" },
  { code: "HST-M-2026", name: "Hostel — male hall", type: "HOSTEL", naira: 180000, session: "2025/2026", description: "Bed space, Akinkugbe Hall" },
  { code: "HST-F-2026", name: "Hostel — female hall", type: "HOSTEL", naira: 180000, session: "2025/2026", description: "Bed space, Moremi Hall" },
  { code: "TUI-CSC-100", name: "Tuition — B.Sc. Computer Science 100L", type: "TUITION", naira: 450000, session: "2025/2026", level: "100", programme: "B.Sc. Computer Science" },
  { code: "TUI-CSC-200", name: "Tuition — B.Sc. Computer Science 200L", type: "TUITION", naira: 430000, session: "2025/2026", level: "200", programme: "B.Sc. Computer Science" },
  { code: "TUI-LAW-100", name: "Tuition — LL.B. Law 100L", type: "TUITION", naira: 520000, session: "2025/2026", level: "100", programme: "LL.B. Law" },
  { code: "TUI-MED-100", name: "Tuition — MBBS 100L", type: "TUITION", naira: 850000, session: "2025/2026", level: "100", programme: "MBBS Medicine" },
  { code: "TUI-ACC-100", name: "Tuition — B.Sc. Accounting 100L", type: "TUITION", naira: 380000, session: "2025/2026", level: "100", programme: "B.Sc. Accounting" },
  { code: "TUI-ECO-200", name: "Tuition — B.Sc. Economics 200L", type: "TUITION", naira: 360000, session: "2025/2026", level: "200", programme: "B.Sc. Economics" },
  { code: "TUI-MCM-100", name: "Tuition — B.Sc. Mass Communication 100L", type: "TUITION", naira: 340000, session: "2025/2026", level: "100", programme: "B.Sc. Mass Communication" },
  { code: "TUI-ARC-100", name: "Tuition — B.Sc. Architecture 100L", type: "TUITION", naira: 480000, session: "2025/2026", level: "100", programme: "B.Sc. Architecture" },
  { code: "DEP-CSC", name: "Departmental levy — Computer Science", type: "DEPARTMENTAL", naira: 25000, programme: "B.Sc. Computer Science" },
  { code: "DEP-LAW", name: "Departmental levy — Law", type: "DEPARTMENTAL", naira: 30000, programme: "LL.B. Law" },
  { code: "DEP-MED", name: "Departmental levy — Medicine", type: "DEPARTMENTAL", naira: 45000, programme: "MBBS Medicine" },
  { code: "DEP-ACC", name: "Departmental levy — Accounting", type: "DEPARTMENTAL", naira: 20000, programme: "B.Sc. Accounting" },
  { code: "DEP-ECO", name: "Departmental levy — Economics", type: "DEPARTMENTAL", naira: 20000, programme: "B.Sc. Economics" },
  { code: "DEP-MCM", name: "Departmental levy — Mass Communication", type: "DEPARTMENTAL", naira: 22000, programme: "B.Sc. Mass Communication" },
  { code: "DEP-ARC", name: "Departmental levy — Architecture", type: "DEPARTMENTAL", naira: 28000, programme: "B.Sc. Architecture" },
];

type StudentDef = {
  matric: string;
  first: string;
  last: string;
  other?: string;
  email: string;
  phone: string;
  gender: "Male" | "Female";
  dob: string;
  state: string;
  programme: string;
  faculty: string;
  department: string;
  level: string;
  pay: "paid" | "unpaid" | "partial";
  hostel?: boolean;
};

const RIDGEVIEW_STUDENTS: StudentDef[] = [
  { matric: "RUV/2025/CSC/001", first: "Adebayo", last: "Chukwuemeka", other: "Tosin", email: "adebayo.chukwuemeka@student.ridgeview.edu.ng", phone: "08031234501", gender: "Male", dob: "2006-03-12", state: "Lagos", programme: "B.Sc. Computer Science", faculty: "Science", department: "Computer Science", level: "100", pay: "paid", hostel: true },
  { matric: "RUV/2025/CSC/002", first: "Fatima", last: "Abdullahi", email: "fatima.abdullahi@student.ridgeview.edu.ng", phone: "08031234502", gender: "Female", dob: "2005-11-02", state: "Kano", programme: "B.Sc. Computer Science", faculty: "Science", department: "Computer Science", level: "100", pay: "unpaid" },
  { matric: "RUV/2024/CSC/014", first: "Chioma", last: "Okonkwo", other: "Grace", email: "chioma.okonkwo@student.ridgeview.edu.ng", phone: "08031234503", gender: "Female", dob: "2005-07-19", state: "Anambra", programme: "B.Sc. Computer Science", faculty: "Science", department: "Computer Science", level: "200", pay: "partial", hostel: true },
  { matric: "RUV/2025/LAW/007", first: "Ibrahim", last: "Musa", email: "ibrahim.musa@student.ridgeview.edu.ng", phone: "08031234504", gender: "Male", dob: "2004-01-30", state: "Kaduna", programme: "LL.B. Law", faculty: "Law", department: "Public Law", level: "100", pay: "paid" },
  { matric: "RUV/2025/LAW/008", first: "Yetunde", last: "Adeyemi", email: "yetunde.adeyemi@student.ridgeview.edu.ng", phone: "08031234505", gender: "Female", dob: "2006-05-08", state: "Oyo", programme: "LL.B. Law", faculty: "Law", department: "Private and Property Law", level: "100", pay: "unpaid", hostel: true },
  { matric: "RUV/2025/MED/003", first: "Emeka", last: "Nwosu", email: "emeka.nwosu@student.ridgeview.edu.ng", phone: "08031234506", gender: "Male", dob: "2005-09-14", state: "Imo", programme: "MBBS Medicine", faculty: "Health Sciences", department: "Medicine and Surgery", level: "100", pay: "paid", hostel: true },
  { matric: "RUV/2025/MED/004", first: "Aisha", last: "Bello", email: "aisha.bello@student.ridgeview.edu.ng", phone: "08031234507", gender: "Female", dob: "2005-12-21", state: "Niger", programme: "MBBS Medicine", faculty: "Health Sciences", department: "Medicine and Surgery", level: "100", pay: "unpaid" },
  { matric: "RUV/2025/ACC/011", first: "Tunde", last: "Bakare", email: "tunde.bakare@student.ridgeview.edu.ng", phone: "08031234508", gender: "Male", dob: "2006-02-04", state: "Ogun", programme: "B.Sc. Accounting", faculty: "Management Sciences", department: "Accounting", level: "100", pay: "partial" },
  { matric: "RUV/2025/ACC/012", first: "Ngozi", last: "Eze", email: "ngozi.eze@student.ridgeview.edu.ng", phone: "08031234509", gender: "Female", dob: "2005-08-17", state: "Enugu", programme: "B.Sc. Accounting", faculty: "Management Sciences", department: "Accounting", level: "100", pay: "paid", hostel: true },
  { matric: "RUV/2024/ECO/019", first: "Yusuf", last: "Lawal", email: "yusuf.lawal@student.ridgeview.edu.ng", phone: "08031234510", gender: "Male", dob: "2004-06-11", state: "Kwara", programme: "B.Sc. Economics", faculty: "Management Sciences", department: "Economics", level: "200", pay: "unpaid" },
  { matric: "RUV/2025/MCM/006", first: "Blessing", last: "Okoro", email: "blessing.okoro@student.ridgeview.edu.ng", phone: "08031234511", gender: "Female", dob: "2006-04-23", state: "Rivers", programme: "B.Sc. Mass Communication", faculty: "Arts", department: "Mass Communication", level: "100", pay: "paid" },
  { matric: "RUV/2025/MCM/009", first: "Chinedu", last: "Okafor", email: "chinedu.okafor@student.ridgeview.edu.ng", phone: "08031234512", gender: "Male", dob: "2005-10-05", state: "Delta", programme: "B.Sc. Mass Communication", faculty: "Arts", department: "Mass Communication", level: "100", pay: "unpaid", hostel: true },
  { matric: "RUV/2025/ARC/002", first: "Halima", last: "Suleiman", email: "halima.suleiman@student.ridgeview.edu.ng", phone: "08031234513", gender: "Female", dob: "2005-03-29", state: "Borno", programme: "B.Sc. Architecture", faculty: "Environmental Sciences", department: "Architecture", level: "100", pay: "partial" },
  { matric: "RUV/2025/ARC/005", first: "Kayode", last: "Fashola", email: "kayode.fashola@student.ridgeview.edu.ng", phone: "08031234514", gender: "Male", dob: "2004-12-09", state: "Lagos", programme: "B.Sc. Architecture", faculty: "Environmental Sciences", department: "Architecture", level: "100", pay: "paid", hostel: true },
  { matric: "RUV/2025/CSC/018", first: "Amara", last: "Ibe", email: "amara.ibe@student.ridgeview.edu.ng", phone: "08031234515", gender: "Female", dob: "2006-01-16", state: "Abia", programme: "B.Sc. Computer Science", faculty: "Science", department: "Computer Science", level: "100", pay: "unpaid" },
  { matric: "RUV/2025/LAW/021", first: "Seyi", last: "Ajayi", email: "seyi.ajayi@student.ridgeview.edu.ng", phone: "08031234516", gender: "Male", dob: "2005-07-07", state: "Osun", programme: "LL.B. Law", faculty: "Law", department: "Jurisprudence and International Law", level: "100", pay: "paid" },
  { matric: "RUV/2025/ECO/010", first: "Zainab", last: "Mohammed", email: "zainab.mohammed@student.ridgeview.edu.ng", phone: "08031234517", gender: "Female", dob: "2006-09-01", state: "Sokoto", programme: "B.Sc. Economics", faculty: "Management Sciences", department: "Economics", level: "100", pay: "unpaid", hostel: true },
  { matric: "RUV/2024/CSC/022", first: "Ifeanyi", last: "Uche", email: "ifeanyi.uche@student.ridgeview.edu.ng", phone: "08031234518", gender: "Male", dob: "2004-04-18", state: "Ebonyi", programme: "B.Sc. Computer Science", faculty: "Science", department: "Computer Science", level: "200", pay: "partial" },
  { matric: "RUV/2025/ACC/020", first: "Funke", last: "Adebisi", email: "funke.adebisi@student.ridgeview.edu.ng", phone: "08031234519", gender: "Female", dob: "2005-02-27", state: "Ekiti", programme: "B.Sc. Accounting", faculty: "Management Sciences", department: "Accounting", level: "100", pay: "paid", hostel: true },
  { matric: "RUV/2025/MED/015", first: "Daniel", last: "Okonkwo", email: "daniel.okonkwo@student.ridgeview.edu.ng", phone: "08031234520", gender: "Male", dob: "2005-11-11", state: "Anambra", programme: "MBBS Medicine", faculty: "Health Sciences", department: "Medicine and Surgery", level: "100", pay: "unpaid" },
];

const COURSES: Record<string, { code: string; title: string; unit: number }[]> = {
  "B.Sc. Computer Science": [
    { code: "CSC101", title: "Introduction to Computer Science", unit: 3 },
    { code: "MTH101", title: "Elementary Mathematics I", unit: 3 },
    { code: "PHY101", title: "General Physics I", unit: 3 },
    { code: "GST101", title: "Use of English", unit: 2 },
    { code: "CSC102", title: "Introduction to Problem Solving", unit: 3 },
  ],
  "LL.B. Law": [
    { code: "LAW101", title: "Legal Methods", unit: 4 },
    { code: "LAW102", title: "Nigerian Legal System", unit: 4 },
    { code: "GST101", title: "Use of English", unit: 2 },
    { code: "POL101", title: "Introduction to Political Science", unit: 3 },
  ],
  "MBBS Medicine": [
    { code: "ANA101", title: "Gross Anatomy I", unit: 4 },
    { code: "PIO101", title: "Physiology I", unit: 4 },
    { code: "BCH101", title: "Medical Biochemistry I", unit: 3 },
    { code: "GST101", title: "Use of English", unit: 2 },
  ],
  "B.Sc. Accounting": [
    { code: "ACC101", title: "Principles of Accounting I", unit: 3 },
    { code: "ECO101", title: "Principles of Economics I", unit: 3 },
    { code: "BUS101", title: "Introduction to Business", unit: 3 },
    { code: "GST101", title: "Use of English", unit: 2 },
  ],
  "B.Sc. Economics": [
    { code: "ECO101", title: "Principles of Economics I", unit: 3 },
    { code: "ECO102", title: "Introduction to Statistics", unit: 3 },
    { code: "ACC101", title: "Principles of Accounting I", unit: 3 },
    { code: "GST101", title: "Use of English", unit: 2 },
  ],
  "B.Sc. Mass Communication": [
    { code: "MCM101", title: "Introduction to Mass Communication", unit: 3 },
    { code: "MCM102", title: "Writing for the Media", unit: 3 },
    { code: "GST101", title: "Use of English", unit: 2 },
    { code: "POL101", title: "Introduction to Political Science", unit: 3 },
  ],
  "B.Sc. Architecture": [
    { code: "ARC101", title: "Basic Design I", unit: 4 },
    { code: "ARC103", title: "Freehand Sketching", unit: 2 },
    { code: "MTH101", title: "Elementary Mathematics I", unit: 3 },
    { code: "GST101", title: "Use of English", unit: 2 },
  ],
};

const GRADES = ["A", "B", "B", "C", "A", "C", "D"] as const;
const GRADE_POINT: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

function naira(n: number) {
  return Math.round(n * 100);
}

function pad(n: number, w = 5) {
  return String(n).padStart(w, "0");
}

async function seed() {
  console.log("Seeding CampusFlow…");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.auditLog.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.academicRecord.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.student.deleteMany();
  await prisma.feeItem.deleteMany();
  await prisma.tenant.deleteMany();

  const ridgeview = await prisma.tenant.create({
    data: {
      slug: "ridgeview",
      name: "Ridgeview University",
      city: "Lagos",
      country: "Nigeria",
      currency: "NGN",
      motto: "Knowledge with character",
    },
  });

  const cedar = await prisma.tenant.create({
    data: {
      slug: "cedarhall",
      name: "Cedar Hall College",
      city: "Accra",
      country: "Ghana",
      currency: "NGN",
      motto: "Steady and true",
    },
  });

  const admin = await prisma.user.create({
    data: {
      tenantId: ridgeview.id,
      email: "admin@ridgeview.edu.ng",
      passwordHash,
      name: "Adaeze Okonkwo",
      role: "ADMIN",
    },
  });
  const registrar = await prisma.user.create({
    data: {
      tenantId: ridgeview.id,
      email: "registrar@ridgeview.edu.ng",
      passwordHash,
      name: "Olumide Adesina",
      role: "REGISTRAR",
    },
  });
  const finance = await prisma.user.create({
    data: {
      tenantId: ridgeview.id,
      email: "finance@ridgeview.edu.ng",
      passwordHash,
      name: "Hadiza Bello",
      role: "FINANCE",
    },
  });

  await prisma.user.create({
    data: {
      tenantId: cedar.id,
      email: "admin@cedarhall.edu.gh",
      passwordHash,
      name: "Kwame Mensah",
      role: "ADMIN",
    },
  });

  const feeByCode = new Map<string, { id: string; amountKobo: number; name: string }>();
  for (const f of RIDGEVIEW_FEES) {
    const item = await prisma.feeItem.create({
      data: {
        tenantId: ridgeview.id,
        code: f.code,
        name: f.name,
        type: f.type,
        amountKobo: naira(f.naira),
        session: f.session ?? null,
        level: f.level ?? null,
        programme: f.programme ?? null,
        description: f.description ?? null,
      },
    });
    feeByCode.set(f.code, { id: item.id, amountKobo: item.amountKobo, name: item.name });
  }

  await prisma.feeItem.create({
    data: {
      tenantId: cedar.id,
      code: "TUI-GEN",
      name: "General tuition",
      type: "TUITION",
      amountKobo: naira(200000),
      session: "2025/2026",
    },
  });

  let invSeq = 0;
  let paySeq = 0;
  let rctSeq = 0;

  for (const s of RIDGEVIEW_STUDENTS) {
    const student = await prisma.student.create({
      data: {
        tenantId: ridgeview.id,
        matricNumber: s.matric,
        firstName: s.first,
        lastName: s.last,
        otherNames: s.other ?? null,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        dateOfBirth: new Date(s.dob),
        nationality: "Nigerian",
        stateOfOrigin: s.state,
        address: `${s.state} State, Nigeria`,
        programme: s.programme,
        faculty: s.faculty,
        department: s.department,
        level: s.level,
        sessionAdmitted: s.level === "200" ? "2024/2025" : "2025/2026",
        status: "ACTIVE",
      },
    });

    await prisma.user.create({
      data: {
        tenantId: ridgeview.id,
        email: s.email,
        passwordHash,
        name: `${s.first} ${s.last}`,
        role: "STUDENT",
        studentId: student.id,
      },
    });

    await prisma.enrollment.create({
      data: {
        tenantId: ridgeview.id,
        studentId: student.id,
        session: "2025/2026",
        semester: "First",
        programme: s.programme,
        level: s.level,
        status: "ENROLLED",
      },
    });

    const catalog = COURSES[s.programme] ?? COURSES["B.Sc. Computer Science"];
    let gi = (s.matric.charCodeAt(s.matric.length - 1) + s.first.length) % GRADES.length;
    for (const c of catalog) {
      const grade = GRADES[gi % GRADES.length];
      gi++;
      await prisma.academicRecord.create({
        data: {
          tenantId: ridgeview.id,
          studentId: student.id,
          session: "2025/2026",
          semester: "First",
          courseCode: c.code,
          courseTitle: c.title,
          creditUnit: c.unit,
          grade,
          gradePoint: GRADE_POINT[grade],
        },
      });
    }

    const tuitionCode =
      s.programme === "B.Sc. Computer Science" && s.level === "200"
        ? "TUI-CSC-200"
        : s.programme === "B.Sc. Computer Science"
          ? "TUI-CSC-100"
          : s.programme === "LL.B. Law"
            ? "TUI-LAW-100"
            : s.programme === "MBBS Medicine"
              ? "TUI-MED-100"
              : s.programme === "B.Sc. Accounting"
                ? "TUI-ACC-100"
                : s.programme === "B.Sc. Economics" && s.level === "200"
                  ? "TUI-ECO-200"
                  : s.programme === "B.Sc. Mass Communication"
                    ? "TUI-MCM-100"
                    : s.programme === "B.Sc. Architecture"
                      ? "TUI-ARC-100"
                      : "TUI-CSC-100";

    const depCode =
      s.programme === "B.Sc. Computer Science"
        ? "DEP-CSC"
        : s.programme === "LL.B. Law"
          ? "DEP-LAW"
          : s.programme === "MBBS Medicine"
            ? "DEP-MED"
            : s.programme === "B.Sc. Accounting"
              ? "DEP-ACC"
              : s.programme === "B.Sc. Economics"
                ? "DEP-ECO"
                : s.programme === "B.Sc. Mass Communication"
                  ? "DEP-MCM"
                  : "DEP-ARC";

    const lineFees = ["ACC-2026", "ID-2026", tuitionCode, depCode];
    if (s.hostel) {
      lineFees.push(s.gender === "Female" ? "HST-F-2026" : "HST-M-2026");
    }

    const items = lineFees
      .map((code) => feeByCode.get(code))
      .filter((x): x is { id: string; amountKobo: number; name: string } => Boolean(x));

    const totalKobo = items.reduce((sum, i) => sum + i.amountKobo, 0);
    invSeq += 1;
    const invoiceNumber = `INV-2026-${pad(invSeq)}`;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: ridgeview.id,
        studentId: student.id,
        invoiceNumber,
        session: "2025/2026",
        semester: "First",
        status: "ISSUED",
        totalKobo,
        paidKobo: 0,
        dueDate: new Date("2026-10-31"),
        notes: "2025/2026 first semester compulsory charges",
        items: {
          create: items.map((i) => ({
            tenantId: ridgeview.id,
            feeItemId: i.id,
            description: i.name,
            quantity: 1,
            amountKobo: i.amountKobo,
          })),
        },
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        tenantId: ridgeview.id,
        studentId: student.id,
        invoiceId: invoice.id,
        type: "DEBIT",
        account: "ACCOUNTS_RECEIVABLE",
        amountKobo: totalKobo,
        description: `Invoice ${invoiceNumber} issued`,
        createdById: finance.id,
      },
    });

    let payAmount = 0;
    if (s.pay === "paid") payAmount = totalKobo;
    else if (s.pay === "partial") payAmount = Math.round(totalKobo * 0.45);

    if (payAmount > 0) {
      paySeq += 1;
      rctSeq += 1;
      const reference = `PAY-DEMO-2026-${pad(paySeq)}`;
      const payment = await prisma.payment.create({
        data: {
          tenantId: ridgeview.id,
          invoiceId: invoice.id,
          studentId: student.id,
          amountKobo: payAmount,
          method: s.pay === "paid" ? "BANK_TRANSFER_DEMO" : "CARD_DEMO",
          reference,
          status: "SUCCESS",
          receivedById: finance.id,
          notes: "Seeded demo payment — no live processor",
        },
      });
      await prisma.receipt.create({
        data: {
          tenantId: ridgeview.id,
          paymentId: payment.id,
          receiptNumber: `RCT-2026-${pad(rctSeq)}`,
        },
      });
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidKobo: payAmount,
          status: payAmount >= totalKobo ? "PAID" : "PARTIAL",
        },
      });
      await prisma.ledgerEntry.create({
        data: {
          tenantId: ridgeview.id,
          studentId: student.id,
          invoiceId: invoice.id,
          paymentId: payment.id,
          type: "CREDIT",
          account: "ACCOUNTS_RECEIVABLE",
          amountKobo: payAmount,
          description: `Payment ${reference} on ${invoiceNumber}`,
          createdById: finance.id,
        },
      });
      await prisma.ledgerEntry.create({
        data: {
          tenantId: ridgeview.id,
          studentId: student.id,
          invoiceId: invoice.id,
          paymentId: payment.id,
          type: "DEBIT",
          account: "CASH",
          amountKobo: payAmount,
          description: `Cash received ${reference}`,
          createdById: finance.id,
        },
      });
    }
  }

  const cedarStudent = await prisma.student.create({
    data: {
      tenantId: cedar.id,
      matricNumber: "CHC/2025/001",
      firstName: "Ama",
      lastName: "Boateng",
      email: "ama.boateng@student.cedarhall.edu.gh",
      phone: "0244111000",
      gender: "Female",
      dateOfBirth: new Date("2005-05-05"),
      nationality: "Ghanaian",
      stateOfOrigin: "Greater Accra",
      programme: "B.Sc. Business Administration",
      faculty: "Business",
      department: "Business Administration",
      level: "100",
      sessionAdmitted: "2025/2026",
      status: "ACTIVE",
    },
  });
  await prisma.user.create({
    data: {
      tenantId: cedar.id,
      email: cedarStudent.email,
      passwordHash,
      name: "Ama Boateng",
      role: "STUDENT",
      studentId: cedarStudent.id,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: ridgeview.id,
        userId: admin.id,
        action: "TENANT_SEEDED",
        entity: "Tenant",
        entityId: ridgeview.id,
        metadata: JSON.stringify({ students: RIDGEVIEW_STUDENTS.length }),
      },
      {
        tenantId: ridgeview.id,
        userId: registrar.id,
        action: "STUDENTS_IMPORTED",
        entity: "Student",
        metadata: JSON.stringify({ source: "seed", count: RIDGEVIEW_STUDENTS.length }),
      },
      {
        tenantId: ridgeview.id,
        userId: finance.id,
        action: "FEES_SEEDED",
        entity: "FeeItem",
        metadata: JSON.stringify({ count: RIDGEVIEW_FEES.length }),
      },
    ],
  });

  console.log("Seed complete.");
  console.log("  Ridgeview University (Lagos) — 20 students, mixed invoices");
  console.log("  Cedar Hall College (Accra) — isolation tenant");
  console.log("Demo password for all accounts: CampusFlow!2026");
  console.log("  admin@ridgeview.edu.ng");
  console.log("  registrar@ridgeview.edu.ng");
  console.log("  finance@ridgeview.edu.ng");
  console.log("  adebayo.chukwuemeka@student.ridgeview.edu.ng  (paid)");
  console.log("  fatima.abdullahi@student.ridgeview.edu.ng     (unpaid)");
  console.log("  admin@cedarhall.edu.gh  (other tenant)");
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
