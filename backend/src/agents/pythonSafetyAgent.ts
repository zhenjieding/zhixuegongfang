import type { PythonSafetyIssue, PythonSafetyResult } from "../types/pythonCourse";

export interface PythonSafetyAuditInput {
  agentName: string;
  contentKind: "profile" | "path" | "resource" | "tutor" | "quiz" | "evaluation" | "system";
  output: unknown;
  references?: string[];
  requiredKeys?: string[];
}

const blockedPatterns: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /违法|犯罪|诈骗|赌博|色情|暴恐|极端主义|仇恨/i, label: "敏感或违规内容" },
  { pattern: /攻击服务器|入侵系统|窃取密码|绕过认证|恶意代码/i, label: "网络安全违规请求" },
];

function collectText(value: unknown, depth = 0): string[] {
  if (depth > 8 || value === null || value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectText(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      collectText(item, depth + 1),
    );
  }

  return [];
}

function hasRequiredKeys(output: unknown, requiredKeys: string[]) {
  if (!requiredKeys.length) {
    return true;
  }

  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return false;
  }

  const record = output as Record<string, unknown>;
  return requiredKeys.every((key) => key in record);
}

export function auditPythonAgentOutput(input: PythonSafetyAuditInput): PythonSafetyResult {
  const issues: PythonSafetyIssue[] = [];
  const text = collectText(input.output).join("\n");
  const references = [...new Set((input.references ?? []).map((item) => item.trim()).filter(Boolean))];

  for (const rule of blockedPatterns) {
    if (rule.pattern.test(text)) {
      issues.push({
        code: "blocked_content",
        severity: "block",
        message: `输出包含${rule.label}，需要拦截或重写。`,
      });
    }
  }

  if (!hasRequiredKeys(input.output, input.requiredKeys ?? [])) {
    issues.push({
      code: "format_missing_key",
      severity: "warn",
      message: `输出缺少结构化字段：${(input.requiredKeys ?? []).join("、")}。`,
    });
  }

  if ((input.contentKind === "resource" || input.contentKind === "tutor") && !references.length) {
    issues.push({
      code: "missing_reference",
      severity: "warn",
      message: "学习资源或答疑内容缺少课程资料引用依据。",
    });
  }

  const status = issues.some((issue) => issue.severity === "block")
    ? "blocked"
    : issues.length
      ? "rewritten"
      : "passed";

  return {
    status,
    issues,
    references,
    checkedAt: new Date().toISOString(),
    summary:
      status === "passed"
        ? "安全审核通过，结构化输出可展示。"
        : status === "rewritten"
          ? "安全审核发现轻微格式或引用问题，建议前端提示或后续补充。"
          : "安全审核未通过，内容已被拦截。",
  };
}
