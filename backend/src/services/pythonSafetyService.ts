import { randomUUID } from "crypto";
import { auditPythonAgentOutput, type PythonSafetyAuditInput } from "../agents/pythonSafetyAgent";
import { recordPythonAgentRun } from "../agents/pythonAgentRuntime";
import { getDb } from "../db/connection";
import type { PythonSafetyResult } from "../types/pythonCourse";
import { HttpError } from "../utils/httpError";

export interface RunPythonSafetyAuditInput extends PythonSafetyAuditInput {
  userId: string;
  targetType: string;
  targetId?: string;
}

function statusToAgentStatus(status: PythonSafetyResult["status"]) {
  return status === "blocked" ? "error" : status === "rewritten" ? "warning" : "ok";
}

export async function runPythonSafetyAudit(input: RunPythonSafetyAuditInput) {
  const result = auditPythonAgentOutput(input);
  const db = await getDb();

  await db.run(
    `
      INSERT INTO python_safety_flags (
        id, user_id, agent_name, target_type, target_id, status,
        issues_json, checked_payload_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    input.userId,
    input.agentName,
    input.targetType,
    input.targetId ?? "",
    result.status,
    JSON.stringify(result.issues),
    JSON.stringify({
      contentKind: input.contentKind,
      requiredKeys: input.requiredKeys ?? [],
      references: result.references,
    }),
    result.checkedAt,
  );

  await recordPythonAgentRun({
    userId: input.userId,
    agentName: "SafetyAgent",
    input: {
      sourceAgent: input.agentName,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      contentKind: input.contentKind,
    },
    output: result,
    status: statusToAgentStatus(result.status),
    latencyMs: 0,
  });

  return result;
}

export function assertPythonSafetyPassed(result: PythonSafetyResult) {
  if (result.status === "blocked") {
    throw new HttpError(422, "内容安全审核未通过，请调整输入后重试。");
  }
}
