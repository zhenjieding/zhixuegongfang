export type PythonBaseLevel = "beginner" | "intermediate" | "advanced";
export type PythonLearningStyle = "visual" | "practice" | "mixed" | "project";
export type PythonResourceType =
  | "lecture"
  | "mindmap"
  | "code_example"
  | "exercise"
  | "review"
  | "project_case";
export type PythonQuestionType = "single_choice" | "code_reading" | "fill_blank";
export type PythonSafetyStatus = "passed" | "rewritten" | "blocked";

export interface PythonSafetyIssue {
  code: string;
  severity: "info" | "warn" | "block";
  message: string;
}

export interface PythonSafetyResult {
  status: PythonSafetyStatus;
  issues: PythonSafetyIssue[];
  references: string[];
  checkedAt: string;
  summary: string;
}

export interface PythonProfileAnalysisInput {
  major: string;
  goal: string;
  baseLevel?: PythonBaseLevel;
  weeklyHours?: number;
  learningStyle?: PythonLearningStyle;
  learningText?: string;
  weakPoints?: string[];
  strongPoints?: string[];
  preferredFormats?: string[];
  targetProject?: string;
}

export interface PythonStudentProfile {
  userId: string;
  major: string;
  goal: string;
  baseLevel: PythonBaseLevel;
  weeklyHours: number;
  learningStyle: PythonLearningStyle;
  tags: string[];
  weakPoints: string[];
  strongPoints: string[];
  preferredFormats: string[];
  targetProject: string;
  lastAnalyzedText: string;
  currentFocusUnitId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PythonCourseUnit {
  id: string;
  title: string;
  summary: string;
  difficulty: PythonBaseLevel;
  orderIndex: number;
  estimatedMinutes: number;
  objectives: string[];
  prerequisites: string[];
  commonMistakes: string[];
  updatedAt: string;
}

export interface PythonKnowledgeItem {
  id: string;
  unitId: string;
  itemType: "lecture" | "mindmap" | "code_example" | "exercise" | "review" | "project_case";
  title: string;
  contentMarkdown: string;
  sourceLabel: string;
  sourceRef: string;
  keywords: string[];
  orderIndex: number;
  updatedAt: string;
}

export interface PythonQuestionItem {
  id: string;
  unitId: string;
  questionType: PythonQuestionType;
  difficulty: PythonBaseLevel;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  answerText: string;
  tags: string[];
  updatedAt: string;
}

export interface PythonLearningPathStep {
  id: string;
  pathId: string;
  unitId: string;
  stepOrder: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  resourceTypes: PythonResourceType[];
  status: "available" | "locked" | "completed";
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PythonLearningPath {
  id: string;
  userId: string;
  title: string;
  status: "active" | "archived" | "completed";
  baseLevel: PythonBaseLevel;
  targetGoal: string;
  reason: string;
  currentStepOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PythonResourceItem {
  id: string;
  userId: string;
  unitId: string;
  resourceType: PythonResourceType;
  title: string;
  contentMarkdown: string;
  metadata: Record<string, unknown>;
  safetyStatus?: PythonSafetyStatus;
  safetyReport?: PythonSafetyResult;
  createdAt: string;
}

export interface PythonQuizQuestion {
  id: string;
  unitId: string;
  questionType: PythonQuestionType;
  prompt: string;
  options: string[];
  correctIndex?: number;
  answerText?: string;
  explanation: string;
  tags: string[];
}

export interface PythonQuizItem {
  id: string;
  userId: string;
  unitId: string;
  title: string;
  difficulty: PythonBaseLevel;
  questions: PythonQuizQuestion[];
  createdAt: string;
}

export interface PythonQuizAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface PythonQuizAttemptItem {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: PythonQuizAnswer[];
  analysis: Array<{
    questionId: string;
    correctIndex: number;
    selectedIndex: number;
    isCorrect: boolean;
    explanation: string;
    tags: string[];
  }>;
  createdAt: string;
}

export interface PythonMasteryRecord {
  userId: string;
  unitId: string;
  masteryScore: number;
  attemptCount: number;
  correctCount: number;
  weakTags: string[];
  lastScore: number;
  updatedAt: string;
}

export interface PythonTutorSession {
  id: string;
  userId: string;
  unitId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface PythonTutorMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  citations: Array<{
    itemId: string;
    title: string;
    sourceRef: string;
  }>;
  createdAt: string;
}

export interface PythonAgentRun {
  id: string;
  userId: string;
  agentName: string;
  input: unknown;
  output: unknown;
  status: "ok" | "warning" | "error";
  latencyMs: number;
  createdAt: string;
}
