import { randomUUID } from "crypto";
import { getDb } from "../db/connection";

export type PythonAgentRunStatus = "ok" | "warning" | "error";

export interface RecordPythonAgentRunInput {
  userId: string;
  agentName: string;
  input: unknown;
  output: unknown;
  status?: PythonAgentRunStatus;
  latencyMs?: number;
}

export async function recordPythonAgentRun(input: RecordPythonAgentRunInput) {
  const db = await getDb();

  await db.run(
    `
      INSERT INTO python_agent_runs (
        id, user_id, agent_name, input_json, output_json, status, latency_ms, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    input.userId,
    input.agentName,
    JSON.stringify(input.input),
    JSON.stringify(input.output),
    input.status ?? "ok",
    input.latencyMs ?? 0,
    new Date().toISOString(),
  );
}
