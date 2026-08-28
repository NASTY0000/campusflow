import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

process.env.DATABASE_URL = "file:./test.db";
process.env.SESSION_SECRET = "test-session-secret-campusflow";
const prismaBin = path.join(process.cwd(), "node_modules", ".bin", "prisma");
if (fs.existsSync(prismaBin)) {
  execSync(`${prismaBin} db push --accept-data-loss --skip-generate`, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
