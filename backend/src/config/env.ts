import path from "path";
import dotenv from "dotenv";

export const backendRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config();

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  host: process.env.HOST ?? "0.0.0.0",
  port: toNumber(process.env.PORT, 3001),
  corsOrigin:
    process.env.CORS_ORIGIN ?? "http://127.0.0.1:5173,http://localhost:5173",
  dbPath: process.env.DB_PATH ?? path.resolve(backendRoot, "data/zhixuegongfang.sqlite"),
  sessionTtlHours: toNumber(process.env.SESSION_TTL_HOURS, 72),
};

