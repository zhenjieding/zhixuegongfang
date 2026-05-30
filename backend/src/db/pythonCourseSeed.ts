import type { Database } from "sqlite";
import {
  pythonCourseUnits,
  pythonDemoStudents,
  pythonKnowledgeItems,
  pythonQuestionBank,
} from "../constants/pythonCourse";

async function insertIfMissing(
  db: Database,
  tableName: string,
  idField: string,
  idValue: string,
  sql: string,
  params: unknown[],
) {
  const existing = await db.get<{ id: string }>(
    `SELECT id FROM ${tableName} WHERE ${idField} = ?`,
    idValue,
  );

  if (!existing) {
    await db.run(sql, ...params);
  }
}

export async function seedPythonCourseData(db: Database) {
  for (const unit of pythonCourseUnits) {
    await insertIfMissing(
      db,
      "python_course_units",
      "id",
      unit.id,
      `
        INSERT INTO python_course_units (
          id, title, summary, difficulty, order_index, estimated_minutes,
          objectives_json, prerequisites_json, common_mistakes_json, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        unit.id,
        unit.title,
        unit.summary,
        unit.difficulty,
        unit.orderIndex,
        unit.estimatedMinutes,
        JSON.stringify(unit.objectives),
        JSON.stringify(unit.prerequisites),
        JSON.stringify(unit.commonMistakes),
        unit.updatedAt,
      ],
    );
  }

  for (const item of pythonKnowledgeItems) {
    await insertIfMissing(
      db,
      "python_knowledge_items",
      "id",
      item.id,
      `
        INSERT INTO python_knowledge_items (
          id, unit_id, item_type, title, content_markdown,
          source_label, source_ref, keywords_json, order_index, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        item.id,
        item.unitId,
        item.itemType,
        item.title,
        item.contentMarkdown,
        item.sourceLabel,
        item.sourceRef,
        JSON.stringify(item.keywords),
        item.orderIndex,
        item.updatedAt,
      ],
    );
  }

  for (const item of pythonQuestionBank) {
    await insertIfMissing(
      db,
      "python_question_bank",
      "id",
      item.id,
      `
        INSERT INTO python_question_bank (
          id, unit_id, question_type, difficulty, prompt, options_json,
          correct_index, explanation, answer_text, tags_json, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        item.id,
        item.unitId,
        item.questionType,
        item.difficulty,
        item.prompt,
        JSON.stringify(item.options),
        item.correctIndex,
        item.explanation,
        item.answerText,
        JSON.stringify(item.tags),
        item.updatedAt,
      ],
    );
  }

  for (const [index, student] of pythonDemoStudents.entries()) {
    const userId = `stu-${index + 1}`;
    const existing = await db.get<{ user_id: string }>(
      "SELECT user_id FROM python_student_profiles WHERE user_id = ?",
      userId,
    );

    if (!existing) {
      const now = new Date().toISOString();
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
        "软件工程",
        student.targetProject,
        student.baseLevel,
        student.baseLevel === "beginner" ? 4 : student.baseLevel === "intermediate" ? 6 : 8,
        student.learningStyle,
        JSON.stringify([
          `画像类型：${student.label}`,
          `基础等级：${student.baseLevel}`,
          `学习方式：${student.learningStyle}`,
          `薄弱点：${student.weakPoints.join("、")}`,
          `资源偏好：${student.preferredFormats.join("、")}`,
          `目标项目：${student.targetProject}`,
        ]),
        JSON.stringify(student.weakPoints),
        JSON.stringify(["Python 基础知识"]),
        JSON.stringify(student.preferredFormats),
        student.targetProject,
        "seeded demo profile",
        student.baseLevel === "beginner" ? "py-1" : student.baseLevel === "intermediate" ? "py-3" : "py-6",
        now,
        now,
      );
    }
  }

  const seedLog = await db.get<{ id: string }>(
    "SELECT id FROM python_agent_runs WHERE id = ?",
    "seed-python-course-data",
  );

  if (!seedLog) {
    await db.run(
      `
        INSERT INTO python_agent_runs (
          id, user_id, agent_name, input_json, output_json, status, latency_ms, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      "seed-python-course-data",
      "stu-1",
      "system-seed",
      JSON.stringify({ courseId: "python-programming" }),
      JSON.stringify({ status: "ready" }),
      "ok",
      0,
      new Date().toISOString(),
    );
  }
}
