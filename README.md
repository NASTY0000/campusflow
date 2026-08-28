# CampusFlow

Cloud student-information system and institutional fee payments for schools in Nigeria and West Africa. Currency is **NGN**. The product covers the registry file and the bursary ledger — not an LMS, timetable, or exam platform.

The seeded campus is **Ridgeview University, Lagos**, a fictional institution. CampusFlow does not impersonate any real university.

A second fictional tenant, **Cedar Hall College, Accra**, is seeded so multi-tenant isolation can be demonstrated and tested.

## What it does

- Email/password auth with roles: **admin**, **registrar**, **finance** (bursary), **student**
- Students: create, search, profile, enrolment, academic records (course/grade file)
- CSV bulk import (tenant-scoped; duplicates skipped)
- Fee catalogue: tuition, acceptance, hostel, departmental levies, ID cards
- Invoices, demo payments (no live Paystack/Stripe), receipts, outstanding balances
- Double-entry ledger (accounts receivable + cash) that stays consistent with invoice balances
- Audit log of logins and mutations
- Responsive UI with dark mode

Every query is scoped by `tenantId`. A Ridgeview officer cannot see Cedar Hall students, invoices, or payments.

## How to run

Requires Node.js 20+. From this directory:

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The app listens on **http://localhost:3001**.

`package.json` already contains the Prisma seed command (`tsx prisma/seed.ts`). `migrate dev` applies the SQLite schema; `db seed` loads Ridgeview + Cedar Hall demo data.

Other scripts:

```bash
npm test          # vitest: tenant isolation, CSV import, ledger, roles
npm run build     # production build
npm start         # serve the production build on port 3001
```

Environment (`.env` is included for local demo):

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="change-me-in-production"
```

## Demo logins

Password for every seeded account:

```
CampusFlow!2026
```

| Role | Email | Notes |
| --- | --- | --- |
| Administrator | `admin@ridgeview.edu.ng` | Full access, Ridgeview |
| Registrar | `registrar@ridgeview.edu.ng` | Students, enrolment, records |
| Finance / bursary | `finance@ridgeview.edu.ng` | Fees, invoices, payments, ledger |
| Student (paid) | `adebayo.chukwuemeka@student.ridgeview.edu.ng` | Settled 2025/2026 invoice |
| Student (unpaid) | `fatima.abdullahi@student.ridgeview.edu.ng` | Open balance — try the demo pay flow |
| Other tenant | `admin@cedarhall.edu.gh` | Cedar Hall College; cannot see Ridgeview data |

Twenty Ridgeview students are seeded with mixed **paid / partial / unpaid** invoices, hostel flags, and first-semester records.

## Demo payments

The pay form posts immediately as `SUCCESS`, writes a receipt, credits receivables, and debits cash. There is no live card or bank integration. Methods: card (demo), bank transfer (demo), cash, POS.

## CSV format

See `public/sample-students.csv`. Columns:

`matricNumber, firstName, lastName, otherNames, email, phone, gender, dateOfBirth, stateOfOrigin, programme, faculty, department, level, sessionAdmitted`

Import is available to admin and registrar at `/students/import`.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite.
