import { randomUUID } from "crypto";
import { recordPythonAgentRun } from "../agents/pythonAgentRuntime";
import { getDb } from "../db/connection";
import {
  PYTHON_COURSE_ID,
  PYTHON_COURSE_TITLE,
  defaultResourceTypesForStyle,
  pythonCourseUnits,
  pythonKnowledgeItems,
  pythonQuestionBank,
} from "../constants/pythonCourse";
import type { AuthenticatedUser } from "../types/contracts";
import type {
  PythonBaseLevel,
  PythonCourseUnit,
  PythonKnowledgeItem,
  PythonLearningPath,
  PythonLearningPathStep,
  PythonProfileAnalysisInput,
  PythonQuestionType,
  PythonQuizAnswer,
  PythonQuizItem,
  PythonQuizQuestion,
  PythonQuestionItem,
  PythonResourceItem,
  PythonResourceType,
  PythonSafetyResult,
  PythonStudentProfile,
  PythonLearningStyle,
} from "../types/pythonCourse";
import { assertPythonSafetyPassed, runPythonSafetyAudit } from "./pythonSafetyService";
import { HttpError } from "../utils/httpError";

interface PythonCourseUnitRow {
  id: string;
  title: string;
  summary: string;
  difficulty: string;
  order_index: number;
  estimated_minutes: number;
  objectives_json: string;
  prerequisites_json: string;
  common_mistakes_json: string;
  updated_at: string;
}

interface PythonKnowledgeItemRow {
  id: string;
  unit_id: string;
  item_type: string;
  title: string;
  content_markdown: string;
  source_label: string;
  source_ref: string;
  keywords_json: string;
  order_index: number;
  updated_at: string;
}

interface PythonQuestionRow {
  id: string;
  unit_id: string;
  question_type: string;
  difficulty: string;
  prompt: string;
  options_json: string;
  correct_index: number;
  explanation: string;
  answer_text: string;
  tags_json: string;
  updated_at: string;
}

interface PythonStudentProfileRow {
  user_id: string;
  major: string;
  goal: string;
  base_level: string;
  weekly_hours: number;
  learning_style: string;
  tags_json: string;
  weak_points_json: string;
  strong_points_json: string;
  preferred_formats_json: string;
  target_project: string;
  last_analyzed_text: string;
  current_focus_unit_id: string;
  created_at: string;
  updated_at: string;
}

interface PythonLearningPathRow {
  id: string;
  user_id: string;
  title: string;
  status: "active" | "archived" | "completed";
  base_level: string;
  target_goal: string;
  reason: string;
  current_step_order: number;
  created_at: string;
  updated_at: string;
}

interface PythonLearningPathStepRow {
  id: string;
  path_id: string;
  unit_id: string;
  step_order: number;
  title: string;
  description: string;
  estimated_minutes: number;
  resource_types_json: string;
  status: "available" | "locked" | "completed";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PythonResourceRow {
  id: string;
  user_id: string;
  unit_id: string;
  resource_type: string;
  title: string;
  content_markdown: string;
  metadata_json: string;
  safety_status: string;
  safety_report_json: string;
  created_at: string;
}

interface PythonQuizRow {
  id: string;
  user_id: string;
  unit_id: string;
  title: string;
  difficulty: string;
  questions_json: string;
  safety_status: string;
  safety_report_json: string;
  created_at: string;
}

interface PythonQuizAttemptRow {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  answers_json: string;
  analysis_json: string;
  created_at: string;
}

interface PythonMasteryRecordRow {
  user_id: string;
  unit_id: string;
  mastery_score: number;
  attempt_count: number;
  correct_count: number;
  weak_tags_json: string;
  last_score: number;
  updated_at: string;
}

interface PythonTutorSessionRow {
  id: string;
  user_id: string;
  unit_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

interface PythonTutorMessageRow {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  citations_json: string;
  created_at: string;
}

interface PythonAgentRunRow {
  id: string;
  user_id: string;
  agent_name: string;
  input_json: string;
  output_json: string;
  status: "ok" | "warning" | "error";
  latency_ms: number;
  created_at: string;
}

interface PythonSafetyFlagRow {
  id: string;
  user_id: string;
  agent_name: string;
  target_type: string;
  target_id: string;
  status: PythonSafetyResult["status"];
  issues_json: string;
  checked_payload_json: string;
  created_at: string;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。！？；：、,.!?:;'"`~()（）【】\[\]{}<>/\-_=+|\\]/g, "");
}

function parseStringArray(value: string | null | undefined, fallback: string[] = []) {
  if (!value) {
    return [...fallback];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    return [...fallback];
  }

  return [...fallback];
}

function parseResourceTypeArray(value: string | null | undefined, fallback: PythonResourceType[] = []) {
  return parseStringArray(value, fallback as string[]) as PythonResourceType[];
}

function parseObject<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.round(value)));
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function toPythonBaseLevel(value: unknown, fallback: PythonBaseLevel): PythonBaseLevel {
  return value === "beginner" || value === "intermediate" || value === "advanced"
    ? value
    : fallback;
}

function toPythonLearningStyle(value: unknown, fallback: PythonLearningStyle): PythonLearningStyle {
  return value === "visual" || value === "practice" || value === "mixed" || value === "project"
    ? value
    : fallback;
}

function extractKeywords(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return [];
  }

  const candidates = [
    "变量",
    "类型转换",
    "输入",
    "输出",
    "条件",
    "分支",
    "循环",
    "函数",
    "模块",
    "列表",
    "字典",
    "集合",
    "字符串",
    "文件",
    "异常",
    "类",
    "对象",
    "项目",
    "调试",
  ];

  return candidates.filter((keyword) => normalized.includes(normalizeText(keyword)));
}

function buildUnitMap(units: PythonCourseUnit[]) {
  return new Map(units.map((unit) => [unit.id, unit]));
}

function buildKeywordUnitMap(units: PythonCourseUnit[]) {
  const map = new Map<string, string>();
  const pairs: Array<[string[], string]> = [
    [["变量", "类型转换", "输入输出", "print", "input"], "py-1"],
    [["if", "for", "while", "range", "循环", "分支"], "py-2"],
    [["函数", "模块", "return", "import"], "py-3"],
    [["列表", "字典", "集合", "字符串"], "py-4"],
    [["文件", "异常", "with", "调试"], "py-5"],
    [["类", "对象", "self", "项目"], "py-6"],
  ];

  for (const [keywords, unitId] of pairs) {
    for (const keyword of keywords) {
      map.set(normalizeText(keyword), unitId);
    }
  }

  for (const unit of units) {
    map.set(normalizeText(unit.title), unit.id);
    for (const objective of unit.objectives) {
      const keywords = extractKeywords(objective);
      for (const keyword of keywords) {
        map.set(normalizeText(keyword), unit.id);
      }
    }
  }

  return map;
}

function scoreTextMatch(source: string, target: string) {
  const normalizedSource = normalizeText(source);
  const normalizedTarget = normalizeText(target);
  if (!normalizedSource || !normalizedTarget) {
    return 0;
  }

  if (normalizedSource === normalizedTarget) {
    return 2;
  }

  if (normalizedTarget.includes(normalizedSource) || normalizedSource.includes(normalizedTarget)) {
    return 1.5;
  }

  const sourceKeywords = extractKeywords(source);
  let score = 0;
  for (const keyword of sourceKeywords) {
    if (normalizedTarget.includes(normalizeText(keyword))) {
      score += 1;
    }
  }

  return score;
}

function getDefaultStepResourceTypes(style: PythonLearningStyle, difficulty: PythonBaseLevel) {
  if (difficulty === "advanced") {
    return ["lecture", "project_case", "code_example", "exercise", "review"] as PythonResourceType[];
  }

  if (style === "visual") {
    return ["lecture", "mindmap", "code_example", "exercise", "review"] as PythonResourceType[];
  }

  if (style === "practice") {
    return ["lecture", "exercise", "code_example", "review", "mindmap"] as PythonResourceType[];
  }

  if (style === "project") {
    return ["lecture", "project_case", "code_example", "mindmap", "exercise"] as PythonResourceType[];
  }

  return ["lecture", "mindmap", "code_example", "exercise", "review"] as PythonResourceType[];
}

async function recordAgentRun(
  userId: string,
  agentName: string,
  input: unknown,
  output: unknown,
  status: "ok" | "warning" | "error" = "ok",
  latencyMs = 0,
) {
  await recordPythonAgentRun({
    userId,
    agentName,
    input,
    output,
    status,
    latencyMs,
  });
}

async function getCourseUnits(): Promise<PythonCourseUnit[]> {
  const db = await getDb();
  const rows = await db.all<PythonCourseUnitRow[]>(
    `
      SELECT
        id, title, summary, difficulty, order_index, estimated_minutes,
        objectives_json, prerequisites_json, common_mistakes_json, updated_at
      FROM python_course_units
      ORDER BY order_index ASC
    `,
  );

  if (!rows.length) {
    return pythonCourseUnits;
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    difficulty: toPythonBaseLevel(row.difficulty, "beginner"),
    orderIndex: row.order_index,
    estimatedMinutes: row.estimated_minutes,
    objectives: parseStringArray(row.objectives_json),
    prerequisites: parseStringArray(row.prerequisites_json),
    commonMistakes: parseStringArray(row.common_mistakes_json),
    updatedAt: row.updated_at,
  }));
}

async function getKnowledgeItems(): Promise<PythonKnowledgeItem[]> {
  const db = await getDb();
  const rows = await db.all<PythonKnowledgeItemRow[]>(
    `
      SELECT
        id, unit_id, item_type, title, content_markdown, source_label,
        source_ref, keywords_json, order_index, updated_at
      FROM python_knowledge_items
      ORDER BY unit_id ASC, order_index ASC
    `,
  );

  if (!rows.length) {
    return pythonKnowledgeItems;
  }

  return rows.map((row) => ({
    id: row.id,
    unitId: row.unit_id,
    itemType: row.item_type as PythonKnowledgeItem["itemType"],
    title: row.title,
    contentMarkdown: row.content_markdown,
    sourceLabel: row.source_label,
    sourceRef: row.source_ref,
    keywords: parseStringArray(row.keywords_json),
    orderIndex: row.order_index,
    updatedAt: row.updated_at,
  }));
}

async function getQuestionBank(): Promise<PythonQuestionItem[]> {
  const db = await getDb();
  const rows = await db.all<PythonQuestionRow[]>(
    `
      SELECT
        id, unit_id, question_type, difficulty, prompt, options_json,
        correct_index, explanation, answer_text, tags_json, updated_at
      FROM python_question_bank
      ORDER BY unit_id ASC, id ASC
    `,
  );

  if (!rows.length) {
    return pythonQuestionBank;
  }

  return rows.map((row) => ({
    id: row.id,
    unitId: row.unit_id,
    questionType: row.question_type as PythonQuestionType,
    difficulty: toPythonBaseLevel(row.difficulty, "beginner"),
    prompt: row.prompt,
    options: parseStringArray(row.options_json),
    correctIndex: row.correct_index,
    explanation: row.explanation,
    answerText: row.answer_text,
    tags: parseStringArray(row.tags_json),
    updatedAt: row.updated_at,
  }));
}

async function getProfileRow(userId: string) {
  const db = await getDb();
  return db.get<PythonStudentProfileRow>(
    `
      SELECT
        user_id, major, goal, base_level, weekly_hours, learning_style,
        tags_json, weak_points_json, strong_points_json, preferred_formats_json,
        target_project, last_analyzed_text, current_focus_unit_id, created_at, updated_at
      FROM python_student_profiles
      WHERE user_id = ?
    `,
    userId,
  );
}

async function ensureProfile(userId: string) {
  const db = await getDb();
  const existing = await getProfileRow(userId);

  if (existing) {
    return existing;
  }

  const now = nowIso();
  await db.run(
    `
      INSERT INTO python_student_profiles (
        user_id, major, goal, base_level, weekly_hours, learning_style,
        tags_json, weak_points_json, strong_points_json, preferred_formats_json,
        target_project, last_analyzed_text, current_focus_unit_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    userId,
    "",
    "",
    "beginner",
    4,
    "mixed",
    JSON.stringify(["基础等级：入门", "学习方式：讲练结合", "当前重点：Python 入门"]),
    "[]",
    "[]",
    JSON.stringify(["lecture", "exercise"]),
    "",
    "",
    "py-1",
    now,
    now,
  );

  const inserted = await getProfileRow(userId);
  if (!inserted) {
    throw new HttpError(500, "无法初始化 Python 学习画像。");
  }

  return inserted;
}

function toProfile(row: PythonStudentProfileRow): PythonStudentProfile {
  return {
    userId: row.user_id,
    major: row.major,
    goal: row.goal,
    baseLevel: toPythonBaseLevel(row.base_level, "beginner"),
    weeklyHours: row.weekly_hours,
    learningStyle: toPythonLearningStyle(row.learning_style, "mixed"),
    tags: parseStringArray(row.tags_json),
    weakPoints: parseStringArray(row.weak_points_json),
    strongPoints: parseStringArray(row.strong_points_json),
    preferredFormats: parseStringArray(row.preferred_formats_json),
    targetProject: row.target_project,
    lastAnalyzedText: row.last_analyzed_text,
    currentFocusUnitId: row.current_focus_unit_id || "py-1",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function chooseBaseLevel(input: PythonProfileAnalysisInput): PythonBaseLevel {
  if (input.baseLevel) {
    return input.baseLevel;
  }

  const hint = `${input.goal ?? ""} ${input.learningText ?? ""}`;
  const normalized = normalizeText(hint);

  if (normalized.includes("基础") || normalized.includes("入门") || normalized.includes("零基础")) {
    return "beginner";
  }

  if (normalized.includes("项目") || normalized.includes("实战") || normalized.includes("应用")) {
    return "advanced";
  }

  return "intermediate";
}

function chooseLearningStyle(input: PythonProfileAnalysisInput): PythonLearningStyle {
  if (input.learningStyle) {
    return input.learningStyle;
  }

  const normalized = normalizeText(`${input.goal ?? ""} ${input.learningText ?? ""}`);
  if (normalized.includes("做项目") || normalized.includes("项目")) {
    return "project";
  }

  if (normalized.includes("刷题") || normalized.includes("练习")) {
    return "practice";
  }

  if (normalized.includes("图解") || normalized.includes("思维导图") || normalized.includes("看图")) {
    return "visual";
  }

  return "mixed";
}

function inferWeakPoints(input: PythonProfileAnalysisInput) {
  const text = normalizeText(`${input.goal ?? ""} ${input.learningText ?? ""}`);
  const mapping: Array<[string[], string]> = [
    [["变量", "类型转换", "输入输出"], "变量与类型转换"],
    [["if", "分支", "循环", "range"], "分支与循环"],
    [["函数", "参数", "返回值"], "函数设计"],
    [["列表", "字典", "集合", "字符串"], "容器操作"],
    [["文件", "异常", "调试"], "文件与异常"],
    [["类", "对象", "self", "项目"], "面向对象与项目"],
  ];

  const result: string[] = [];
  for (const [keywords, label] of mapping) {
    if (keywords.some((keyword) => text.includes(normalizeText(keyword)))) {
      result.push(label);
    }
  }

  return uniqueStrings(result);
}

function inferStrongPoints(input: PythonProfileAnalysisInput) {
  const strongPoints = input.strongPoints ?? [];
  const normalized = normalizeText(`${input.goal ?? ""} ${input.learningText ?? ""}`);

  if (normalized.includes("项目")) {
    strongPoints.push("项目实践");
  }
  if (normalized.includes("刷题")) {
    strongPoints.push("题目训练");
  }
  if (normalized.includes("代码")) {
    strongPoints.push("代码阅读");
  }

  return uniqueStrings(strongPoints);
}

function inferPreferredFormats(input: PythonProfileAnalysisInput, style: PythonLearningStyle) {
  if (input.preferredFormats?.length) {
    return uniqueStrings(input.preferredFormats);
  }

  return uniqueStrings(
    style === "project"
      ? ["project_case", "code_example", "mindmap"]
      : style === "practice"
        ? ["exercise", "review", "code_example"]
        : style === "visual"
          ? ["mindmap", "lecture", "review"]
          : ["lecture", "code_example", "exercise", "review"],
  );
}

function pickTargetProject(input: PythonProfileAnalysisInput, level: PythonBaseLevel) {
  if (input.targetProject?.trim()) {
    return input.targetProject.trim();
  }

  if (level === "advanced") {
    return "Python 学习助手小项目";
  }

  if (level === "beginner") {
    return "Python 入门练习册";
  }

  return "Python 课程作业强化包";
}

function baseLevelLabel(level: PythonBaseLevel) {
  return level === "beginner" ? "零基础/入门" : level === "intermediate" ? "进阶巩固" : "项目实践";
}

function learningStyleLabel(style: PythonLearningStyle) {
  if (style === "visual") {
    return "图示梳理型";
  }
  if (style === "practice") {
    return "练习强化型";
  }
  if (style === "project") {
    return "项目驱动型";
  }
  return "讲练结合型";
}

function buildProfileTags(profile: PythonStudentProfile, focusUnit?: PythonCourseUnit) {
  return uniqueStrings([
    `专业方向：${profile.major || "未填写"}`,
    `基础等级：${baseLevelLabel(profile.baseLevel)}`,
    `学习方式：${learningStyleLabel(profile.learningStyle)}`,
    `每周投入：${profile.weeklyHours} 小时`,
    `目标项目：${profile.targetProject || profile.goal || "Python 课程设计"}`,
    `薄弱点：${profile.weakPoints.length ? profile.weakPoints.join("、") : "待测验识别"}`,
    `优势点：${profile.strongPoints.length ? profile.strongPoints.join("、") : "待学习数据补充"}`,
    `资源偏好：${profile.preferredFormats.length ? profile.preferredFormats.join("、") : "讲义、练习、代码案例"}`,
    `当前重点：${focusUnit?.title ?? profile.currentFocusUnitId}`,
  ]);
}

function chooseFocusUnitId(units: PythonCourseUnit[], profile: PythonStudentProfile): string {
  const keywordMap = buildKeywordUnitMap(units);
  const weakText = uniqueStrings(profile.weakPoints).join(" ");
  const match = extractKeywords(weakText)
    .map((keyword) => keywordMap.get(normalizeText(keyword)))
    .find(Boolean);
  if (match) {
    return match;
  }

  const baseOrder: Record<PythonBaseLevel, string[]> = {
    beginner: ["py-1", "py-2", "py-3", "py-4", "py-5", "py-6"],
    intermediate: ["py-2", "py-3", "py-4", "py-5", "py-6", "py-1"],
    advanced: ["py-3", "py-4", "py-5", "py-6", "py-2", "py-1"],
  };

  const preferred = baseOrder[profile.baseLevel] ?? baseOrder.beginner;
  return preferred.find((unitId) => units.some((unit) => unit.id === unitId)) ?? "py-1";
}

function pickUnitsForPath(units: PythonCourseUnit[], profile: PythonStudentProfile, maxSteps = 5) {
  const baseOrder: Record<PythonBaseLevel, string[]> = {
    beginner: ["py-1", "py-2", "py-3", "py-4", "py-5", "py-6"],
    intermediate: ["py-2", "py-3", "py-4", "py-5", "py-6", "py-1"],
    advanced: ["py-3", "py-4", "py-5", "py-6", "py-2", "py-1"],
  };

  const unitMap = buildUnitMap(units);
  const weakMap = buildKeywordUnitMap(units);
  const scored = units.map((unit) => {
    const baseIndex = baseOrder[profile.baseLevel].indexOf(unit.id);
    const weakBoost = uniqueStrings(profile.weakPoints).reduce((score, weakPoint) => {
      const matchedUnit = weakMap.get(normalizeText(weakPoint));
      return matchedUnit === unit.id ? score + 3 : score;
    }, 0);
    const objectiveBoost = unit.objectives.reduce((score, objective) => score + scoreTextMatch(objective, profile.goal), 0);
    return {
      unit,
      score: baseIndex >= 0 ? baseIndex * 10 - weakBoost - objectiveBoost : 999,
    };
  });

  return scored
    .sort((left, right) => left.score - right.score)
    .map((item) => item.unit)
    .filter((unit) => unitMap.has(unit.id))
    .slice(0, maxSteps);
}

function makeLectureMarkdown(unit: PythonCourseUnit, profile: PythonStudentProfile) {
  return [
    `# ${unit.title}`,
    "",
    `**适配理由：** ${profile.goal || "根据当前学习状态生成"}。`,
    "",
    "## 学习目标",
    ...unit.objectives.map((item) => `- ${item}`),
    "",
    "## 核心知识",
    ...unit.commonMistakes.map((item) => `- 易错点：${item}`),
    "",
    "## 建议学法",
    profile.learningStyle === "practice"
      ? "- 先看例题，再做练习，最后回看错题。"
      : profile.learningStyle === "visual"
        ? "- 先看思维导图和讲义，再跟着代码示例理解结构。"
        : profile.learningStyle === "project"
          ? "- 先理解小项目目标，再拆成步骤完成。"
          : "- 讲义、例题和练习穿插进行，保证理解和迁移。",
  ].join("\n");
}

function makeMindmapMarkdown(unit: PythonCourseUnit) {
  return [
    "```mermaid",
    "mindmap",
    `  root((${unit.title}))`,
    "    学习目标",
    ...unit.objectives.map((item) => `      ${item}`),
    "    常见错误",
    ...unit.commonMistakes.map((item) => `      ${item}`),
    "```",
  ].join("\n");
}

function makeReviewMarkdown(unit: PythonCourseUnit) {
  return [
    `### ${unit.title} 复习卡`,
    "",
    `- 关键目标：${unit.objectives[0] ?? unit.summary}`,
    `- 最容易丢分：${unit.commonMistakes[0] ?? "注意基础细节"}`,
    `- 复习建议：先理解概念，再做 3 道专项题。`,
  ].join("\n");
}

function makeProjectCaseMarkdown(unit: PythonCourseUnit, profile: PythonStudentProfile) {
  return [
    `### ${unit.title} 项目化练习`,
    "",
    `- 推荐项目：${profile.targetProject || "Python 学习助手小项目"}`,
    "- 实现数据录入、资源生成、答题反馈和学习进度四个核心模块。",
    "- 如果你想展示答辩效果，可以把资源和错题页做成卡片式列表。",
  ].join("\n");
}

function pickResourceTypes(
  profile: PythonStudentProfile,
  requestedTypes?: PythonResourceType[],
  unit?: PythonCourseUnit,
) {
  const baseTypes = requestedTypes?.length
    ? requestedTypes
    : defaultResourceTypesForStyle(profile.learningStyle);

  const difficultyTypes =
    unit?.difficulty === "advanced"
      ? (["project_case", "review"] as PythonResourceType[])
      : [];

  const requiredMinimum = ["lecture", "code_example", "exercise", "review", "mindmap"] as PythonResourceType[];
  return uniqueStrings([...baseTypes, ...difficultyTypes, ...requiredMinimum]).slice(0, 6) as PythonResourceType[];
}

function makePracticeItems(
  questions: PythonQuestionItem[],
  answerMode = false,
) {
  return questions.map((question, index) => {
    const options = question.options
      .map((option, optionIndex) => `${optionIndex + 1}. ${option}`)
      .join("\n");

    const body = [
      `#### 练习 ${index + 1}`,
      "",
      question.prompt,
      "",
      options ? `\n${options}` : "",
      answerMode ? `\n**参考答案：** ${question.options[question.correctIndex] ?? question.answerText}` : "",
      answerMode ? `\n**解析：** ${question.explanation}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return body;
  });
}

function buildResourceMetadata(
  unit: PythonCourseUnit,
  profile: PythonStudentProfile,
  resourceType: PythonResourceType,
  extra: Record<string, unknown> = {},
) {
  return {
    courseId: PYTHON_COURSE_ID,
    courseTitle: PYTHON_COURSE_TITLE,
    unitId: unit.id,
    unitTitle: unit.title,
    baseLevel: profile.baseLevel,
    learningStyle: profile.learningStyle,
    weakPoints: profile.weakPoints,
    ...extra,
    resourceType,
  };
}

function buildResourcePackage(
  unit: PythonCourseUnit,
  profile: PythonStudentProfile,
  resources: PythonResourceItem[],
  safety?: PythonSafetyResult,
) {
  const byType = new Map(resources.map((resource) => [resource.resourceType, resource]));
  return {
    title: `${unit.title} 个性化学习包`,
    unitId: unit.id,
    profileReason: `适配画像标签：${profile.tags.slice(0, 4).join("；")}。`,
    lectureMarkdown: byType.get("lecture")?.contentMarkdown ?? "",
    codeExamples: resources
      .filter((resource) => resource.resourceType === "code_example" || resource.resourceType === "project_case")
      .map((resource) => ({
        title: resource.title,
        code: resource.contentMarkdown,
        explanation: resource.metadata.sourceItemId ? "来自课程资料代码案例。" : "由课程知识点自动生成。",
      })),
    exercises: resources
      .filter((resource) => resource.resourceType === "exercise")
      .map((resource) => ({
        title: resource.title,
        contentMarkdown: resource.contentMarkdown,
      })),
    mindmapMermaid: byType.get("mindmap")?.contentMarkdown ?? "",
    reviewCards: unit.objectives.map((objective, index) => ({
      question: `复习 ${index + 1}：${objective}`,
      answer: unit.commonMistakes[index % unit.commonMistakes.length] ?? unit.summary,
    })),
    safetyStatus: safety?.status ?? "passed",
  };
}

async function getLatestActivePath(userId: string) {
  const db = await getDb();
  return db.get<PythonLearningPathRow>(
    `
      SELECT
        id, user_id, title, status, base_level, target_goal, reason,
        current_step_order, created_at, updated_at
      FROM python_learning_paths
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    userId,
  );
}

async function getPathSteps(pathId: string) {
  const db = await getDb();
  return db.all<PythonLearningPathStepRow[]>(
    `
      SELECT
        id, path_id, unit_id, step_order, title, description, estimated_minutes,
        resource_types_json, status, completed_at, created_at, updated_at
      FROM python_learning_path_steps
      WHERE path_id = ?
      ORDER BY step_order ASC
    `,
    pathId,
  );
}

async function getLatestQuiz(userId: string) {
  const db = await getDb();
  return db.get<PythonQuizRow>(
    `
      SELECT id, user_id, unit_id, title, difficulty, questions_json, created_at
      FROM python_quizzes
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    userId,
  );
}

async function getQuizById(userId: string, quizId: string) {
  const db = await getDb();
  return db.get<PythonQuizRow>(
    `
      SELECT id, user_id, unit_id, title, difficulty, questions_json, created_at
      FROM python_quizzes
      WHERE user_id = ? AND id = ?
    `,
    userId,
    quizId,
  );
}

async function getMasteryRows(userId: string) {
  const db = await getDb();
  return db.all<PythonMasteryRecordRow[]>(
    `
      SELECT
        user_id, unit_id, mastery_score, attempt_count, correct_count,
        weak_tags_json, last_score, updated_at
      FROM python_mastery_records
      WHERE user_id = ?
    `,
    userId,
  );
}

async function updateFocusUnit(userId: string, unitId: string) {
  const db = await getDb();
  await db.run(
    `
      UPDATE python_student_profiles
      SET current_focus_unit_id = ?, updated_at = ?
      WHERE user_id = ?
    `,
    unitId,
    nowIso(),
    userId,
  );
}

async function advancePathAfterQuiz(userId: string, unitId: string, score: number) {
  if (score < 80) {
    await updateFocusUnit(userId, unitId);
    return;
  }

  const db = await getDb();
  const activePath = await getLatestActivePath(userId);
  if (!activePath) {
    return;
  }

  const steps = await getPathSteps(activePath.id);
  const currentStep = steps.find((step) => step.unit_id === unitId);
  if (!currentStep) {
    return;
  }

  const now = nowIso();
  await db.run(
    `
      UPDATE python_learning_path_steps
      SET status = 'completed', completed_at = ?, updated_at = ?
      WHERE id = ?
    `,
    now,
    now,
    currentStep.id,
  );

  const nextStep = steps.find((step) => step.step_order === currentStep.step_order + 1);
  if (nextStep) {
    await db.run(
      `
        UPDATE python_learning_path_steps
        SET status = 'available', updated_at = ?
        WHERE id = ?
      `,
      now,
      nextStep.id,
    );

    await db.run(
      `
        UPDATE python_learning_paths
        SET current_step_order = ?, updated_at = ?
        WHERE id = ?
      `,
      nextStep.step_order,
      now,
      activePath.id,
    );

    await updateFocusUnit(userId, nextStep.unit_id);
  } else {
    await db.run(
      `
        UPDATE python_learning_paths
        SET status = 'completed', current_step_order = ?, updated_at = ?
        WHERE id = ?
      `,
      currentStep.step_order,
      now,
      activePath.id,
    );
    await updateFocusUnit(userId, currentStep.unit_id);
  }
}

export async function getPythonCourseOverview(user: AuthenticatedUser) {
  const [profileRow, units, knowledgeItems, path, masteryRows, latestQuiz] = await Promise.all([
    ensureProfile(user.id),
    getCourseUnits(),
    getKnowledgeItems(),
    getLatestActivePath(user.id),
    getMasteryRows(user.id),
    getLatestQuiz(user.id),
  ]);

  const profile = toProfile(profileRow);
  const masteryMap = new Map(masteryRows.map((row) => [row.unit_id, row]));
  const activePathSteps = path ? await getPathSteps(path.id) : [];

  return {
    course: {
      id: PYTHON_COURSE_ID,
      title: PYTHON_COURSE_TITLE,
      unitCount: units.length,
      knowledgeItemCount: knowledgeItems.length,
    },
    profile,
    overview: {
      currentPath: path ? {
        id: path.id,
        title: path.title,
        status: path.status,
        currentStepOrder: path.current_step_order,
        reason: path.reason,
        targetGoal: path.target_goal,
      } : null,
      currentFocusUnit: units.find((unit) => unit.id === profile.currentFocusUnitId) ?? units[0] ?? null,
      recentQuizId: latestQuiz?.id ?? null,
      masteredUnits: masteryMap.size,
    },
    units: units.map((unit) => {
      const mastery = masteryMap.get(unit.id);
      return {
        ...unit,
        masteryScore: mastery?.mastery_score ?? 0,
        status:
          mastery?.mastery_score && mastery.mastery_score >= 80
            ? "mastered"
            : profile.currentFocusUnitId === unit.id
              ? "current"
              : "pending",
      };
    }),
    currentPathSteps: activePathSteps.map((step) => ({
      id: step.id,
      unitId: step.unit_id,
      stepOrder: step.step_order,
      title: step.title,
      description: step.description,
      estimatedMinutes: step.estimated_minutes,
      resourceTypes: parseResourceTypeArray(step.resource_types_json),
      status: step.status,
      completedAt: step.completed_at,
    })),
  };
}

export async function getPythonStudentProfile(user: AuthenticatedUser) {
  const profile = toProfile(await ensureProfile(user.id));
  if (profile.tags.length) {
    return profile;
  }

  const units = await getCourseUnits();
  return {
    ...profile,
    tags: buildProfileTags(
      profile,
      units.find((unit) => unit.id === profile.currentFocusUnitId),
    ),
  };
}

export async function analyzePythonStudentProfile(
  user: AuthenticatedUser,
  input: PythonProfileAnalysisInput,
) {
  const profileRow = await ensureProfile(user.id);
  const units = await getCourseUnits();
  const baseLevel = toPythonBaseLevel(input.baseLevel, chooseBaseLevel(input));
  const learningStyle = toPythonLearningStyle(input.learningStyle, chooseLearningStyle(input));
  const weakPoints = uniqueStrings(
    input.weakPoints?.length ? input.weakPoints : inferWeakPoints(input),
  );
  const strongPoints = uniqueStrings(
    input.strongPoints?.length ? input.strongPoints : inferStrongPoints(input),
  );
  const preferredFormats = inferPreferredFormats(input, learningStyle);
  const targetProject = pickTargetProject(input, baseLevel);
  const weeklyHours = clampInt(input.weeklyHours, baseLevel === "beginner" ? 4 : baseLevel === "intermediate" ? 6 : 8, 1, 20);
  const currentFocusUnitId = chooseFocusUnitId(units, {
    ...toProfile(profileRow),
    major: input.major.trim(),
    goal: input.goal.trim(),
    baseLevel,
    weeklyHours,
    learningStyle,
    weakPoints,
    strongPoints,
    preferredFormats,
    targetProject,
    lastAnalyzedText: input.learningText?.trim() ?? "",
    currentFocusUnitId: profileRow.current_focus_unit_id || "py-1",
    createdAt: profileRow.created_at,
    updatedAt: profileRow.updated_at,
  });
  const profile: PythonStudentProfile = {
    userId: user.id,
    major: input.major.trim(),
    goal: input.goal.trim(),
    baseLevel,
    weeklyHours,
    learningStyle,
    tags: [],
    weakPoints,
    strongPoints,
    preferredFormats,
    targetProject,
    lastAnalyzedText: input.learningText?.trim() ?? "",
    currentFocusUnitId,
    createdAt: profileRow.created_at,
    updatedAt: nowIso(),
  };
  profile.tags = buildProfileTags(
    profile,
    units.find((unit) => unit.id === profile.currentFocusUnitId),
  );

  const db = await getDb();
  const now = nowIso();
  await db.run(
    `
      UPDATE python_student_profiles
      SET major = ?, goal = ?, base_level = ?, weekly_hours = ?, learning_style = ?,
          tags_json = ?, weak_points_json = ?, strong_points_json = ?, preferred_formats_json = ?,
          target_project = ?, last_analyzed_text = ?, current_focus_unit_id = ?, updated_at = ?
      WHERE user_id = ?
    `,
    profile.major,
    profile.goal,
    profile.baseLevel,
    profile.weeklyHours,
    profile.learningStyle,
    JSON.stringify(profile.tags),
    JSON.stringify(profile.weakPoints),
    JSON.stringify(profile.strongPoints),
    JSON.stringify(profile.preferredFormats),
    profile.targetProject,
    profile.lastAnalyzedText,
    profile.currentFocusUnitId,
    now,
    user.id,
  );

  const recommendedUnits = pickUnitsForPath(units, profile, 4);
  const output = {
    profile,
    recommendedUnits: recommendedUnits.map((unit) => ({
      id: unit.id,
      title: unit.title,
      summary: unit.summary,
      difficulty: unit.difficulty,
    })),
    nextActions: [
      "生成个性化学习路径",
      "为当前重点知识点生成资源包",
      "开始第一轮小测验",
    ],
  };

  const safety = await runPythonSafetyAudit({
    userId: user.id,
    agentName: "ProfileAgent",
    targetType: "student_profile",
    targetId: user.id,
    contentKind: "profile",
    output,
    requiredKeys: ["profile", "recommendedUnits", "nextActions"],
  });
  assertPythonSafetyPassed(safety);

  const safeOutput = { ...output, safety };
  await recordAgentRun(user.id, "ProfileAgent", input, safeOutput, "ok", 0);

  return safeOutput;
}

function buildPathReason(profile: PythonStudentProfile) {
  const weakText = profile.weakPoints.join("、") || "基础知识";
  const styleText =
    profile.learningStyle === "practice"
      ? "以练习和错题巩固为主"
      : profile.learningStyle === "visual"
        ? "以讲解和图示梳理为主"
        : profile.learningStyle === "project"
          ? "以项目拆解和综合实践为主"
          : "讲练结合，逐步推进";

  return `系统根据当前画像识别出薄弱点：${weakText}；学习方式建议为：${styleText}。`;
}

export async function generatePythonLearningPath(
  user: AuthenticatedUser,
  input?: { maxSteps?: number },
) {
  const db = await getDb();
  const profile = toProfile(await ensureProfile(user.id));
  const units = await getCourseUnits();
  const selectedUnits = pickUnitsForPath(units, profile, clampInt(input?.maxSteps, 5, 3, 6));

  const now = nowIso();
  await db.run(
    `
      UPDATE python_learning_paths
      SET status = 'archived', updated_at = ?
      WHERE user_id = ? AND status = 'active'
    `,
    now,
    user.id,
  );

  const pathId = randomUUID();
  const reason = buildPathReason(profile);
  await db.run(
    `
      INSERT INTO python_learning_paths (
        id, user_id, title, status, base_level, target_goal, reason,
        current_step_order, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    pathId,
    user.id,
    "《Python程序设计》个性化学习路径",
    "active",
    profile.baseLevel,
    profile.targetProject || profile.goal,
    reason,
    1,
    now,
    now,
  );

  const steps: PythonLearningPathStep[] = [];
  for (const [index, unit] of selectedUnits.entries()) {
    const resourceTypes = getDefaultStepResourceTypes(profile.learningStyle, unit.difficulty);
    const status = index === 0 ? "available" : "locked";
    const stepId = randomUUID();
    await db.run(
      `
        INSERT INTO python_learning_path_steps (
          id, path_id, unit_id, step_order, title, description, estimated_minutes,
          resource_types_json, status, completed_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
      `,
      stepId,
      pathId,
      unit.id,
      index + 1,
      unit.title,
      unit.summary,
      unit.estimatedMinutes,
      JSON.stringify(resourceTypes),
      status,
      now,
      now,
    );

    steps.push({
      id: stepId,
      pathId,
      unitId: unit.id,
      stepOrder: index + 1,
      title: unit.title,
      description: unit.summary,
      estimatedMinutes: unit.estimatedMinutes,
      resourceTypes,
      status,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  await updateFocusUnit(user.id, selectedUnits[0]?.id ?? profile.currentFocusUnitId);

  const output = {
    path: {
      id: pathId,
      userId: user.id,
      title: "《Python程序设计》个性化学习路径",
      status: "active" as const,
      baseLevel: profile.baseLevel,
      targetGoal: profile.targetProject || profile.goal,
      reason,
      currentStepOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    steps,
    currentUnit: selectedUnits[0] ?? null,
  };

  const safety = await runPythonSafetyAudit({
    userId: user.id,
    agentName: "PlannerAgent",
    targetType: "learning_path",
    targetId: pathId,
    contentKind: "path",
    output,
    requiredKeys: ["path", "steps", "currentUnit"],
  });
  assertPythonSafetyPassed(safety);

  const safeOutput = { ...output, safety };
  await recordAgentRun(user.id, "PlannerAgent", input ?? {}, safeOutput, "ok", 0);
  return safeOutput;
}

export async function getPythonLearningPath(user: AuthenticatedUser) {
  const path = await getLatestActivePath(user.id);
  if (!path) {
    return null;
  }

  const steps = await getPathSteps(path.id);
  return {
    path: {
      id: path.id,
      userId: path.user_id,
      title: path.title,
      status: path.status,
      baseLevel: toPythonBaseLevel(path.base_level, "beginner"),
      targetGoal: path.target_goal,
      reason: path.reason,
      currentStepOrder: path.current_step_order,
      createdAt: path.created_at,
      updatedAt: path.updated_at,
    },
    steps: steps.map((step) => ({
      id: step.id,
      pathId: step.path_id,
      unitId: step.unit_id,
      stepOrder: step.step_order,
      title: step.title,
      description: step.description,
      estimatedMinutes: step.estimated_minutes,
      resourceTypes: parseResourceTypeArray(step.resource_types_json),
      status: step.status,
      completedAt: step.completed_at,
      createdAt: step.created_at,
      updatedAt: step.updated_at,
    })),
  };
}

export async function generatePythonResources(
  user: AuthenticatedUser,
  input: {
    unitId: string;
    resourceTypes?: PythonResourceType[];
  },
) {
  const db = await getDb();
  const profile = toProfile(await ensureProfile(user.id));
  const units = await getCourseUnits();
  const unit = units.find((item) => item.id === input.unitId);
  if (!unit) {
    throw new HttpError(404, "未找到对应的 Python 知识节点。");
  }

  const questionBank = await getQuestionBank();
  const unitQuestions = questionBank.filter((question) => question.unitId === unit.id);
  const resourceTypes = pickResourceTypes(profile, input.resourceTypes, unit);
  const resources: PythonResourceItem[] = [];
  const now = nowIso();

  for (const resourceType of resourceTypes) {
    let title = "";
    let contentMarkdown = "";
    let metadata: Record<string, unknown> = {};

    if (resourceType === "lecture") {
      title = `${unit.title} 讲义`;
      contentMarkdown = makeLectureMarkdown(unit, profile);
      metadata = buildResourceMetadata(unit, profile, resourceType, {
        objectives: unit.objectives,
        prerequisites: unit.prerequisites,
      });
    }

    if (resourceType === "mindmap") {
      title = `${unit.title} 思维导图`;
      contentMarkdown = makeMindmapMarkdown(unit);
      metadata = buildResourceMetadata(unit, profile, resourceType, {
        format: "mermaid",
      });
    }

    if (resourceType === "code_example") {
      const exampleItem = pythonKnowledgeItems.find(
        (item) => item.unitId === unit.id && item.itemType === "code_example",
      );
      title = `${unit.title} 代码示例`;
      contentMarkdown =
        exampleItem?.contentMarkdown ??
        "```python\n# 此处由后端根据知识节点自动生成示例\n```";
      metadata = buildResourceMetadata(unit, profile, resourceType, {
        sourceItemId: exampleItem?.id ?? null,
      });
    }

    if (resourceType === "exercise") {
      title = `${unit.title} 练习题`;
      const selectedQuestions = unitQuestions.slice(0, 3);
      contentMarkdown = makePracticeItems(selectedQuestions).join("\n\n");
      metadata = buildResourceMetadata(unit, profile, resourceType, {
        questionIds: selectedQuestions.map((question) => question.id),
      });
    }

    if (resourceType === "review") {
      title = `${unit.title} 复习卡`;
      contentMarkdown = makeReviewMarkdown(unit);
      metadata = buildResourceMetadata(unit, profile, resourceType, {
        summary: unit.summary,
      });
    }

    if (resourceType === "project_case") {
      title = `${unit.title} 项目案例`;
      contentMarkdown = makeProjectCaseMarkdown(unit, profile);
      metadata = buildResourceMetadata(unit, profile, resourceType, {
        projectName: profile.targetProject || "Python 学习助手小项目",
      });
    }

    const resourceId = randomUUID();
    await db.run(
      `
        INSERT INTO python_resources (
          id, user_id, unit_id, resource_type, title, content_markdown, metadata_json, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      resourceId,
      user.id,
      unit.id,
      resourceType,
      title,
      contentMarkdown,
      JSON.stringify(metadata),
      now,
    );

    resources.push({
      id: resourceId,
      userId: user.id,
      unitId: unit.id,
      resourceType,
      title,
      contentMarkdown,
      metadata,
      createdAt: now,
    });
  }

  const output = {
    unit,
    resources,
    resourcePackage: buildResourcePackage(unit, profile, resources),
    suggestion: "资源已经按照当前学习画像生成，建议先浏览讲义，再做题目和代码示例。",
  };

  const safety = await runPythonSafetyAudit({
    userId: user.id,
    agentName: "ResourceAgent",
    targetType: "resource_package",
    targetId: unit.id,
    contentKind: "resource",
    output,
    references: resources.flatMap((resource) => {
      const sourceRef = resource.metadata.sourceRef;
      const sourceItemId = resource.metadata.sourceItemId;
      return [typeof sourceRef === "string" ? sourceRef : "", typeof sourceItemId === "string" ? sourceItemId : ""];
    }),
    requiredKeys: ["unit", "resources", "resourcePackage", "suggestion"],
  });
  assertPythonSafetyPassed(safety);

  const safeResources = resources.map((resource) => ({
    ...resource,
    metadata: {
      ...resource.metadata,
      safetyStatus: safety.status,
      safetySummary: safety.summary,
    },
    safetyStatus: safety.status,
    safetyReport: safety,
  }));

  for (const resource of safeResources) {
    await db.run(
      `
        UPDATE python_resources
        SET metadata_json = ?, safety_status = ?, safety_report_json = ?
        WHERE id = ? AND user_id = ?
      `,
      JSON.stringify(resource.metadata),
      safety.status,
      JSON.stringify(safety),
      resource.id,
      user.id,
    );
  }

  const safeOutput = {
    ...output,
    resources: safeResources,
    resourcePackage: buildResourcePackage(unit, profile, safeResources, safety),
    safety,
  };

  await recordAgentRun(user.id, "ResourceAgent", input, safeOutput, "ok", 0);
  return safeOutput;
}

export async function listPythonResources(user: AuthenticatedUser, unitId?: string) {
  const db = await getDb();
  const rows = unitId
    ? await db.all<PythonResourceRow[]>(
        `
          SELECT
            id, user_id, unit_id, resource_type, title, content_markdown,
            metadata_json, safety_status, safety_report_json, created_at
          FROM python_resources
          WHERE user_id = ? AND unit_id = ?
          ORDER BY created_at DESC
          LIMIT 50
        `,
        user.id,
        unitId,
      )
    : await db.all<PythonResourceRow[]>(
        `
          SELECT
            id, user_id, unit_id, resource_type, title, content_markdown,
            metadata_json, safety_status, safety_report_json, created_at
          FROM python_resources
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 50
        `,
        user.id,
      );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    unitId: row.unit_id,
    resourceType: row.resource_type as PythonResourceType,
    title: row.title,
    contentMarkdown: row.content_markdown,
    metadata: parseObject<Record<string, unknown>>(row.metadata_json, {}),
    safetyStatus: row.safety_status as PythonResourceItem["safetyStatus"],
    safetyReport: parseObject<PythonSafetyResult | undefined>(row.safety_report_json, undefined),
    createdAt: row.created_at,
  }));
}

function pickBestKnowledgeItems(
  message: string,
  unit: PythonCourseUnit,
  knowledgeItems: PythonKnowledgeItem[],
) {
  return knowledgeItems
    .filter((item) => item.unitId === unit.id)
    .map((item) => ({
      item,
      score:
        scoreTextMatch(message, item.title) +
        item.keywords.reduce((total, keyword) => total + (normalizeText(message).includes(normalizeText(keyword)) ? 1 : 0), 0) +
        scoreTextMatch(message, item.contentMarkdown),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => entry.item);
}

function buildTutorMarkdown(
  message: string,
  unit: PythonCourseUnit,
  profile: PythonStudentProfile,
  citations: PythonKnowledgeItem[],
) {
  const styleIntro =
    profile.learningStyle === "practice"
      ? "我先给你一个可以直接做题的版本，再补充概念解释。"
      : profile.learningStyle === "visual"
        ? "我先用结构化方式帮你看清楚知识关系。"
        : profile.learningStyle === "project"
          ? "我先从项目视角拆给你看，再落到代码实现。"
          : "我先把概念讲清楚，再给出示例和练习。";

  const citationsText = citations.length
    ? citations
        .map((item) => `- ${item.title}（${item.sourceRef || item.sourceLabel}）`)
        .join("\n")
    : "- 当前问题可直接结合课程知识点理解。";

  const commonMistakes = unit.commonMistakes.length
    ? unit.commonMistakes.map((item) => `- ${item}`).join("\n")
    : "- 注意变量命名和缩进。";

  return [
    `### ${unit.title} 学习答疑`,
    "",
    styleIntro,
    "",
    `**你的问题：** ${message}`,
    "",
    "## 先讲结论",
    `你问的问题和 **${unit.title}** 高度相关，核心是把知识点拆成“概念 -> 代码 -> 练习”三步。`,
    "",
    "## 常见易错点",
    commonMistakes,
    "",
    "## 可以直接参考的资料",
    citationsText,
    "",
    "## 下一步建议",
    profile.learningStyle === "practice"
      ? "- 我建议你现在就做两道专项练习，再回头看代码。"
      : profile.learningStyle === "project"
        ? "- 我建议你把这个知识点放进一个小项目里练一遍。"
        : "- 我建议你先读讲义，再对照代码示例理解。",
  ].join("\n");
}

export async function tutorPythonQuestion(
  user: AuthenticatedUser,
  input: {
    message: string;
    unitId?: string;
    sessionId?: string;
  },
) {
  const db = await getDb();
  const profile = toProfile(await ensureProfile(user.id));
  const units = await getCourseUnits();
  const knowledgeItems = await getKnowledgeItems();
  const unit =
    units.find((item) => item.id === input.unitId) ??
    units.find((item) => item.id === profile.currentFocusUnitId) ??
    units[0];

  if (!unit) {
    throw new HttpError(404, "尚未配置 Python 课程知识节点。");
  }

  const session = input.sessionId
    ? await db.get<PythonTutorSessionRow>(
        `
          SELECT id, user_id, unit_id, title, created_at, updated_at
          FROM python_tutor_sessions
          WHERE id = ? AND user_id = ?
        `,
        input.sessionId,
        user.id,
      )
    : null;

  const sessionId = session?.id ?? randomUUID();
  const now = nowIso();
  if (!session) {
    await db.run(
      `
        INSERT INTO python_tutor_sessions (
          id, user_id, unit_id, title, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      sessionId,
      user.id,
      unit.id,
      `${unit.title} 问答会话`,
      now,
      now,
    );
  }

  const citations = pickBestKnowledgeItems(input.message, unit, knowledgeItems);
  const replyMarkdown = buildTutorMarkdown(input.message, unit, profile, citations);

  await db.run(
    `
      INSERT INTO python_tutor_messages (
        id, session_id, role, content, citations_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    sessionId,
    "user",
    input.message,
    "[]",
    now,
  );

  await db.run(
    `
      INSERT INTO python_tutor_messages (
        id, session_id, role, content, citations_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    sessionId,
    "assistant",
    replyMarkdown,
    JSON.stringify(
      citations.map((item) => ({
        itemId: item.id,
        title: item.title,
        sourceRef: item.sourceRef,
      })),
    ),
    now,
  );

  const output = {
    sessionId,
    unitId: unit.id,
    replyMarkdown,
    citations: citations.map((item) => ({
      itemId: item.id,
      title: item.title,
      sourceRef: item.sourceRef,
      sourceLabel: item.sourceLabel,
      itemType: item.itemType,
    })),
    suggestions: [
      "再给我一个相关例子",
      "帮我出两道同类题",
      "把这部分整理成复习卡",
    ],
  };

  const safety = await runPythonSafetyAudit({
    userId: user.id,
    agentName: "TutorAgent",
    targetType: "tutor_session",
    targetId: sessionId,
    contentKind: "tutor",
    output,
    references: citations.map((item) => item.sourceRef || item.sourceLabel),
    requiredKeys: ["sessionId", "unitId", "replyMarkdown", "citations", "suggestions"],
  });
  assertPythonSafetyPassed(safety);

  const safeOutput = { ...output, safety };

  await db.run(
    `
      UPDATE python_tutor_sessions
      SET unit_id = ?, updated_at = ?
      WHERE id = ?
    `,
    unit.id,
    now,
    sessionId,
  );

  await recordAgentRun(user.id, "TutorAgent", input, safeOutput, "ok", 0);
  return safeOutput;
}

function selectQuizQuestions(
  bank: PythonQuestionItem[],
  unit: PythonCourseUnit,
  difficulty: PythonBaseLevel,
  count: number,
) {
  const filtered = bank.filter(
    (question) => question.unitId === unit.id && question.difficulty === difficulty,
  );

  const fallback = bank.filter((question) => question.unitId === unit.id);
  const source = filtered.length ? filtered : fallback;
  return source.slice(0, count);
}

export async function generatePythonQuiz(
  user: AuthenticatedUser,
  input?: {
    unitId?: string;
    difficulty?: PythonBaseLevel;
    count?: number;
  },
) {
  const db = await getDb();
  const profile = toProfile(await ensureProfile(user.id));
  const units = await getCourseUnits();
  const bank = await getQuestionBank();
  const unit =
    units.find((item) => item.id === input?.unitId) ??
    units.find((item) => item.id === profile.currentFocusUnitId) ??
    units[0];

  if (!unit) {
    throw new HttpError(404, "未找到可用于出题的 Python 知识节点。");
  }

  const difficulty = toPythonBaseLevel(input?.difficulty, profile.baseLevel);
  const count = clampInt(input?.count, 5, 3, 8);
  const questions = selectQuizQuestions(bank, unit, difficulty, count);

  const quizId = randomUUID();
  const now = nowIso();
  await db.run(
    `
      INSERT INTO python_quizzes (
        id, user_id, unit_id, title, difficulty, questions_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    quizId,
    user.id,
    unit.id,
    `${unit.title} 小测验`,
    difficulty,
    JSON.stringify(questions),
    now,
  );

  const output = {
    quizId,
    title: `${unit.title} 小测验`,
    unit: {
      id: unit.id,
      title: unit.title,
      summary: unit.summary,
    },
    difficulty,
    questions: questions.map((question) => ({
      id: question.id,
      unitId: question.unitId,
      questionType: question.questionType,
      prompt: question.prompt,
      options: question.options,
      explanation: question.explanation,
      tags: question.tags,
    })),
  };

  const safety = await runPythonSafetyAudit({
    userId: user.id,
    agentName: "ExerciseAgent",
    targetType: "quiz",
    targetId: quizId,
    contentKind: "quiz",
    output,
    references: questions.map((question) => `${question.unitId}:${question.id}`),
    requiredKeys: ["quizId", "title", "unit", "difficulty", "questions"],
  });
  assertPythonSafetyPassed(safety);

  await db.run(
    `
      UPDATE python_quizzes
      SET safety_status = ?, safety_report_json = ?
      WHERE id = ? AND user_id = ?
    `,
    safety.status,
    JSON.stringify(safety),
    quizId,
    user.id,
  );

  const safeOutput = { ...output, safety };
  await recordAgentRun(user.id, "ExerciseAgent", input ?? {}, safeOutput, "ok", 0);
  return safeOutput;
}

export async function submitPythonQuiz(
  user: AuthenticatedUser,
  input: {
    quizId: string;
    answers: PythonQuizAnswer[];
  },
) {
  const db = await getDb();
  const quiz = await getQuizById(user.id, input.quizId);
  if (!quiz) {
    throw new HttpError(404, "未找到对应的小测验。");
  }

  let questions: PythonQuestionItem[] = [];
  try {
    questions = parseObject<PythonQuestionItem[]>(quiz.questions_json, []);
  } catch {
    questions = [];
  }

  const answerMap = new Map(input.answers.map((answer) => [answer.questionId, answer.selectedIndex]));
  let correctCount = 0;
  const analysis = questions.map((question) => {
    const selectedIndex = answerMap.get(question.id);
    const isCorrect = typeof selectedIndex === "number" && selectedIndex === question.correctIndex;
    if (isCorrect) {
      correctCount += 1;
    }

    return {
      questionId: question.id,
      correctIndex: question.correctIndex,
      selectedIndex: typeof selectedIndex === "number" ? selectedIndex : -1,
      isCorrect,
      explanation: question.explanation,
      tags: question.tags,
    };
  });

  const total = questions.length || 1;
  const score = Math.round((correctCount / total) * 100);
  const unitId = quiz.unit_id;
  const weakTags = uniqueStrings(
    analysis
      .filter((item) => !item.isCorrect)
      .flatMap((item) => item.tags),
  );

  await db.run(
    `
      INSERT INTO python_quiz_attempts (
        id, quiz_id, user_id, score, answers_json, analysis_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    quiz.id,
    user.id,
    score,
    JSON.stringify(input.answers),
    JSON.stringify(analysis),
    nowIso(),
  );

  const existingMastery = await db.get<PythonMasteryRecordRow>(
    `
      SELECT user_id, unit_id, mastery_score, attempt_count, correct_count,
             weak_tags_json, last_score, updated_at
      FROM python_mastery_records
      WHERE user_id = ? AND unit_id = ?
    `,
    user.id,
    unitId,
  );

  const updatedAttemptCount = (existingMastery?.attempt_count ?? 0) + 1;
  const updatedCorrectCount = (existingMastery?.correct_count ?? 0) + correctCount;
  const updatedMastery = Math.min(
    100,
    Math.round((existingMastery?.mastery_score ?? 0) * 0.45 + score * 0.55),
  );

  await db.run(
    `
      INSERT INTO python_mastery_records (
        user_id, unit_id, mastery_score, attempt_count, correct_count,
        weak_tags_json, last_score, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, unit_id) DO UPDATE SET
        mastery_score = excluded.mastery_score,
        attempt_count = excluded.attempt_count,
        correct_count = excluded.correct_count,
        weak_tags_json = excluded.weak_tags_json,
        last_score = excluded.last_score,
        updated_at = excluded.updated_at
    `,
    user.id,
    unitId,
    updatedMastery,
    updatedAttemptCount,
    updatedCorrectCount,
    JSON.stringify(weakTags),
    score,
    nowIso(),
  );

  await advancePathAfterQuiz(user.id, unitId, score);

  const refreshedProfileRow = await ensureProfile(user.id);
  const refreshedProfile = toProfile(refreshedProfileRow);
  const patchedWeakPoints =
    score >= 80
      ? refreshedProfile.weakPoints.filter((weakPoint) => !weakTags.includes(weakPoint))
      : uniqueStrings([...refreshedProfile.weakPoints, ...weakTags]).slice(0, 10);
  const units = await getCourseUnits();
  const patchedProfile: PythonStudentProfile = {
    ...refreshedProfile,
    weakPoints: patchedWeakPoints,
    tags: [],
    updatedAt: nowIso(),
  };
  patchedProfile.tags = buildProfileTags(
    patchedProfile,
    units.find((unit) => unit.id === patchedProfile.currentFocusUnitId),
  );

  await db.run(
    `
      UPDATE python_student_profiles
      SET weak_points_json = ?, tags_json = ?, updated_at = ?
      WHERE user_id = ?
    `,
    JSON.stringify(patchedProfile.weakPoints),
    JSON.stringify(patchedProfile.tags),
    patchedProfile.updatedAt,
    user.id,
  );

  const recommendation =
    score >= 80
      ? "当前知识点掌握较好，建议进入下一单元并生成新资源。"
      : weakTags.length
        ? `建议优先回看这些薄弱标签：${weakTags.join("、")}。`
      : "建议继续复习并重新做一次同类题。";

  const remedialResources = weakTags.map((tag) => ({
    tag,
    action: `回看“${tag}”相关讲义，再生成一次练习题和复习卡。`,
    resourceTypes: ["review", "exercise", "code_example"] as PythonResourceType[],
  }));

  const output = {
    quizId: quiz.id,
    unitId,
    score,
    correctCount,
    totalCount: questions.length,
    mastery: {
      masteryScore: updatedMastery,
      attemptCount: updatedAttemptCount,
      correctCount: updatedCorrectCount,
      weakTags,
    },
    analysis,
    remedialResources,
    profilePatch: {
      weakPoints: patchedProfile.weakPoints,
      tags: patchedProfile.tags,
      currentFocusUnitId: patchedProfile.currentFocusUnitId,
      reason: score >= 80 ? "测验通过，减少当前薄弱标签并推进路径。" : "测验暴露薄弱标签，画像已更新。",
    },
    recommendation,
  };

  const safety = await runPythonSafetyAudit({
    userId: user.id,
    agentName: "EvaluatorAgent",
    targetType: "quiz_attempt",
    targetId: quiz.id,
    contentKind: "evaluation",
    output,
    references: questions.map((question) => `${question.unitId}:${question.id}`),
    requiredKeys: ["quizId", "unitId", "score", "analysis", "profilePatch", "recommendation"],
  });
  assertPythonSafetyPassed(safety);

  const safeOutput = { ...output, safety };
  await recordAgentRun(user.id, "EvaluatorAgent", input, safeOutput, "ok", 0);
  return safeOutput;
}

export async function getPythonProgressOverview(user: AuthenticatedUser) {
  const [profileRow, units, masteryRows, activePath, latestQuiz, resources] = await Promise.all([
    ensureProfile(user.id),
    getCourseUnits(),
    getMasteryRows(user.id),
    getLatestActivePath(user.id),
    getLatestQuiz(user.id),
    listPythonResources(user),
  ]);

  const profile = toProfile(profileRow);
  const masteryMap = new Map(masteryRows.map((row) => [row.unit_id, row]));
  const completedUnits = masteryRows.filter((row) => row.mastery_score >= 80).length;
  const averageScore = masteryRows.length
    ? Math.round(
        masteryRows.reduce((total, row) => total + row.last_score, 0) / masteryRows.length,
      )
    : 0;
  const path = activePath ? await getPythonLearningPath(user) : null;

  const orderedUnits = units.map((unit) => {
    const mastery = masteryMap.get(unit.id);
    return {
      id: unit.id,
      title: unit.title,
      summary: unit.summary,
      difficulty: unit.difficulty,
      masteryScore: mastery?.mastery_score ?? 0,
      attemptCount: mastery?.attempt_count ?? 0,
      weakTags: parseStringArray(mastery?.weak_tags_json),
      status:
        mastery?.mastery_score && mastery.mastery_score >= 80
          ? "mastered"
          : profile.currentFocusUnitId === unit.id
            ? "current"
            : "pending",
    };
  });

  const nextUnit =
    units.find((unit) => unit.id === profile.currentFocusUnitId) ??
    units.find((unit) => !(masteryMap.get(unit.id)?.mastery_score ?? 0) || (masteryMap.get(unit.id)?.mastery_score ?? 0) < 80) ??
    units[0] ??
    null;

  return {
    course: {
      id: PYTHON_COURSE_ID,
      title: PYTHON_COURSE_TITLE,
    },
    profile,
    statistics: {
      unitCount: units.length,
      completedUnits,
      masteryUnits: masteryRows.length,
      averageScore,
      resourceCount: resources.length,
      hasActivePath: Boolean(activePath),
      latestQuizId: latestQuiz?.id ?? null,
    },
    activePath: path,
    nextAction: activePath
      ? {
          type: "continue_path",
          unitId: nextUnit?.id ?? null,
          title: nextUnit?.title ?? "继续当前学习路径",
          reason:
            nextUnit && profile.currentFocusUnitId === nextUnit.id
              ? "当前单元仍处于重点复习阶段。"
              : "继续推进个性化学习路径。",
        }
      : {
          type: "generate_path",
          unitId: nextUnit?.id ?? null,
          title: "生成学习路径",
          reason: "你还没有创建学习路径，建议先完成画像分析和路径生成。",
        },
    units: orderedUnits,
    resources: resources.slice(0, 12),
  };
}

export async function searchPythonKnowledgeItems(
  user: AuthenticatedUser,
  input?: {
    unitId?: string;
    query?: string;
    limit?: number;
  },
) {
  const items = await getKnowledgeItems();
  const normalizedQuery = normalizeText(input?.query ?? "");
  const limit = clampInt(input?.limit, 30, 5, 100);
  const filtered = items
    .filter((item) => !input?.unitId || item.unitId === input.unitId)
    .map((item) => ({
      item,
      score: normalizedQuery
        ? scoreTextMatch(input?.query ?? "", item.title) +
          scoreTextMatch(input?.query ?? "", item.contentMarkdown) +
          item.keywords.reduce(
            (total, keyword) => total + (normalizeText(keyword).includes(normalizedQuery) ? 1 : 0),
            0,
          )
        : 1,
    }))
    .filter((entry) => !normalizedQuery || entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.item);

  await recordAgentRun(
    user.id,
    "KnowledgeRetriever",
    input ?? {},
    { count: filtered.length, unitId: input?.unitId ?? null },
    "ok",
    0,
  );

  return { items: filtered };
}

export async function listPythonAgentRuns(user: AuthenticatedUser, limit = 30) {
  const db = await getDb();
  const safeLimit = clampInt(limit, 30, 5, 100);
  const isPrivileged = user.role === "admin" || user.role === "teacher";
  const rows = isPrivileged
    ? await db.all<PythonAgentRunRow[]>(
        `
          SELECT id, user_id, agent_name, input_json, output_json, status, latency_ms, created_at
          FROM python_agent_runs
          ORDER BY created_at DESC
          LIMIT ?
        `,
        safeLimit,
      )
    : await db.all<PythonAgentRunRow[]>(
        `
          SELECT id, user_id, agent_name, input_json, output_json, status, latency_ms, created_at
          FROM python_agent_runs
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `,
        user.id,
        safeLimit,
      );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    agentName: row.agent_name,
    input: parseObject<unknown>(row.input_json, {}),
    output: parseObject<unknown>(row.output_json, {}),
    status: row.status,
    latencyMs: row.latency_ms,
    createdAt: row.created_at,
  }));
}

export async function listPythonSafetyFlags(user: AuthenticatedUser, limit = 30) {
  const db = await getDb();
  const safeLimit = clampInt(limit, 30, 5, 100);
  const isPrivileged = user.role === "admin" || user.role === "teacher";
  const rows = isPrivileged
    ? await db.all<PythonSafetyFlagRow[]>(
        `
          SELECT
            id, user_id, agent_name, target_type, target_id, status,
            issues_json, checked_payload_json, created_at
          FROM python_safety_flags
          ORDER BY created_at DESC
          LIMIT ?
        `,
        safeLimit,
      )
    : await db.all<PythonSafetyFlagRow[]>(
        `
          SELECT
            id, user_id, agent_name, target_type, target_id, status,
            issues_json, checked_payload_json, created_at
          FROM python_safety_flags
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `,
        user.id,
        safeLimit,
      );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    agentName: row.agent_name,
    targetType: row.target_type,
    targetId: row.target_id,
    status: row.status,
    issues: parseObject(row.issues_json, []),
    checkedPayload: parseObject(row.checked_payload_json, {}),
    createdAt: row.created_at,
  }));
}
