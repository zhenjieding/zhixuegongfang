import { randomBytes } from "crypto";
import type { Database } from "sqlite";
import type { UserRole } from "../types/contracts";
import { hashPasswordForSeed } from "../services/authService";
import { seedPythonCourseData } from "./pythonCourseSeed";

async function seedUser(
  db: Database,
  input: {
    id: string;
    account: string;
    role: UserRole;
    displayName: string;
  },
) {
  const existing = await db.get<{ id: string }>(
    "SELECT id FROM users WHERE account = ?",
    input.account,
  );

  if (existing) {
    return;
  }

  const salt = randomBytes(16).toString("hex");
  const now = new Date().toISOString();
  await db.run(
    `
      INSERT INTO users (
        id, account, role, password_hash, password_salt, display_name,
        status, admin_note, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'active', '', ?, ?)
    `,
    input.id,
    input.account,
    input.role,
    hashPasswordForSeed("123456", salt),
    salt,
    input.displayName,
    now,
    now,
  );
}

export async function seedDatabase(db: Database) {
  await seedUser(db, {
    id: "stu-1",
    account: "student001",
    role: "student",
    displayName: "零基础学生",
  });
  await seedUser(db, {
    id: "stu-2",
    account: "student002",
    role: "student",
    displayName: "应试补弱学生",
  });
  await seedUser(db, {
    id: "stu-3",
    account: "student003",
    role: "student",
    displayName: "项目实践学生",
  });
  await seedUser(db, {
    id: "admin-1",
    account: "admin001",
    role: "admin",
    displayName: "管理员",
  });

  await seedPythonCourseData(db);
}
