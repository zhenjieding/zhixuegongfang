export interface User {
  id: number;
  username: string;
  role: 'student' | 'admin';
}

export interface StudentProfile {
  id: number;
  user_id: number;
  major: string;
  goal: string;
  base_level: string;
  preferences: string;
  weaknesses_json: string;
  tags_json: string;
  updated_at: string;
}

export interface ProfileAnalysis {
  profile: {
    major: string;
    goal: string;
    base_level: string;
    preferences: string;
  };
  tags: string[];
  weaknesses: string[];
}

export interface CourseUnit {
  id: number;
  title: string;
  order_index: number;
  description: string;
  difficulty: string;
  prerequisites_json: string;
}

export interface LearningPath {
  id: number;
  user_id: number;
  profile_version: string;
  status: string;
  created_at: string;
}

export interface PathStep {
  id: number;
  path_id: number;
  unit_id: number;
  step_order: number;
  goal: string;
  estimated_minutes: number;
  reason: string;
  unit?: CourseUnit;
}

export interface Resource {
  id: number;
  user_id: number;
  unit_id: number;
  type: string;
  title: string;
  content_markdown: string;
  metadata_json: string;
  created_at: string;
}

export interface ResourcePackage {
  title: string;
  unitId: string;
  profileReason: string;
  lectureMarkdown: string;
  codeExamples: Array<{
    title: string;
    code: string;
    explanation: string;
  }>;
  exercises: Array<{
    type: string;
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
  }>;
  mindmapMermaid?: string;
  reviewCards: Array<{
    question: string;
    answer: string;
  }>;
  safetyStatus: string;
}

export interface Quiz {
  id: number;
  unit_id: number;
  title: string;
  difficulty: string;
  questions_json: string;
}

export interface QuizQuestion {
  type: 'choice' | 'fill' | 'code';
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  quiz_id: number;
  answers_json: string;
  score: number;
  analysis_json: string;
  created_at: string;
}

export interface QuizAnalysis {
  score: number;
  analysis: {
    correctAnswers: number;
    totalQuestions: number;
    wrongQuestions: Array<{
      questionIndex: number;
      userAnswer: string;
      correctAnswer: string;
      reason: string;
      suggestion: string;
    }>;
  };
  profilePatch: any;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  session_id: string;
  role: 'user' | 'agent';
  content: string;
  related_unit_id?: number;
  created_at: string;
}

export interface TutorResponse {
  reply: string;
  citations?: Array<{
    title: string;
    source_ref: string;
  }>;
  suggestions?: string[];
}

export interface ProgressOverview {
  mastery: Array<{
    unit_id: number;
    unit_title: string;
    mastery_score: number;
  }>;
  recentActivities: Array<{
    type: string;
    title: string;
    time: string;
  }>;
  nextActions: Array<{
    type: string;
    title: string;
    description: string;
  }>;
}

export interface AgentRun {
  id: number;
  user_id: number;
  agent_name: string;
  input_json: string;
  output_json: string;
  status: string;
  latency_ms: number;
  created_at: string;
}

export interface SafetyFlag {
  id: number;
  user_id: number;
  agent_name: string;
  content_type: string;
  check_result: string;
  original_content?: string;
  rewritten_content?: string;
  created_at: string;
}
