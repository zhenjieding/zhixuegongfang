import type { Database } from "sqlite";

export async function createSchema(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      account TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      display_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      admin_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_course_units (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      estimated_minutes INTEGER NOT NULL,
      objectives_json TEXT NOT NULL DEFAULT '[]',
      prerequisites_json TEXT NOT NULL DEFAULT '[]',
      common_mistakes_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS python_knowledge_items (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      source_label TEXT NOT NULL DEFAULT '课程资料',
      source_ref TEXT NOT NULL DEFAULT '',
      keywords_json TEXT NOT NULL DEFAULT '[]',
      order_index INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (unit_id) REFERENCES python_course_units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_question_bank (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL,
      question_type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      prompt TEXT NOT NULL,
      options_json TEXT NOT NULL DEFAULT '[]',
      correct_index INTEGER NOT NULL DEFAULT 0,
      explanation TEXT NOT NULL,
      answer_text TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (unit_id) REFERENCES python_course_units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_student_profiles (
      user_id TEXT PRIMARY KEY,
      major TEXT NOT NULL DEFAULT '',
      goal TEXT NOT NULL DEFAULT '',
      base_level TEXT NOT NULL DEFAULT 'beginner',
      weekly_hours INTEGER NOT NULL DEFAULT 4,
      learning_style TEXT NOT NULL DEFAULT 'mixed',
      tags_json TEXT NOT NULL DEFAULT '[]',
      weak_points_json TEXT NOT NULL DEFAULT '[]',
      strong_points_json TEXT NOT NULL DEFAULT '[]',
      preferred_formats_json TEXT NOT NULL DEFAULT '[]',
      target_project TEXT NOT NULL DEFAULT '',
      last_analyzed_text TEXT NOT NULL DEFAULT '',
      current_focus_unit_id TEXT NOT NULL DEFAULT 'py-1',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_learning_paths (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      base_level TEXT NOT NULL,
      target_goal TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      current_step_order INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_learning_path_steps (
      id TEXT PRIMARY KEY,
      path_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      estimated_minutes INTEGER NOT NULL,
      resource_types_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'available',
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (path_id) REFERENCES python_learning_paths(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES python_course_units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_resources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      safety_status TEXT NOT NULL DEFAULT 'passed',
      safety_report_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES python_course_units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_quizzes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      questions_json TEXT NOT NULL,
      safety_status TEXT NOT NULL DEFAULT 'passed',
      safety_report_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES python_course_units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      answers_json TEXT NOT NULL,
      analysis_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quiz_id) REFERENCES python_quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_mastery_records (
      user_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      mastery_score INTEGER NOT NULL DEFAULT 0,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      weak_tags_json TEXT NOT NULL DEFAULT '[]',
      last_score INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, unit_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES python_course_units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_tutor_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      unit_id TEXT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES python_course_units(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS python_tutor_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      citations_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES python_tutor_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_agent_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      input_json TEXT NOT NULL,
      output_json TEXT NOT NULL,
      status TEXT NOT NULL,
      latency_ms INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS python_safety_flags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT '',
      target_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      issues_json TEXT NOT NULL DEFAULT '[]',
      checked_payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_python_knowledge_items_unit_id
      ON python_knowledge_items(unit_id);
    CREATE INDEX IF NOT EXISTS idx_python_question_bank_unit_id
      ON python_question_bank(unit_id);
    CREATE INDEX IF NOT EXISTS idx_python_resources_user_id
      ON python_resources(user_id);
    CREATE INDEX IF NOT EXISTS idx_python_learning_paths_user_status
      ON python_learning_paths(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_python_agent_runs_user_created
      ON python_agent_runs(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_python_safety_flags_user_created
      ON python_safety_flags(user_id, created_at);
  `);
}

