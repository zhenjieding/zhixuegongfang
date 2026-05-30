import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  analyzePythonStudentProfile,
  generatePythonLearningPath,
  generatePythonQuiz,
  generatePythonResources,
  getPythonCourseOverview,
  getPythonLearningPath,
  getPythonProgressOverview,
  getPythonStudentProfile,
  listPythonAgentRuns,
  listPythonResources,
  listPythonSafetyFlags,
  searchPythonKnowledgeItems,
  submitPythonQuiz,
  tutorPythonQuestion,
} from "../services/pythonCourseService";
import type { PythonBaseLevel, PythonLearningStyle, PythonResourceType } from "../types/pythonCourse";
import { HttpError } from "../utils/httpError";

export const pythonRouter = Router();

pythonRouter.use(requireAuth);

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asPythonBaseLevel(value: unknown) {
  return value === "beginner" || value === "intermediate" || value === "advanced"
    ? (value as PythonBaseLevel)
    : undefined;
}

function asPythonLearningStyle(value: unknown) {
  return value === "visual" || value === "practice" || value === "mixed" || value === "project"
    ? (value as PythonLearningStyle)
    : undefined;
}

function asPythonResourceTypes(value: unknown) {
  const validTypes = new Set<PythonResourceType>([
    "lecture",
    "mindmap",
    "code_example",
    "exercise",
    "review",
    "project_case",
  ]);

  return asStringArray(value).filter((item): item is PythonResourceType => validTypes.has(item as PythonResourceType));
}

pythonRouter.get("/course", async (request, response, next) => {
  try {
    response.json(await getPythonCourseOverview(request.authUser!));
  } catch (error) {
    next(error);
  }
});

pythonRouter.get("/units", async (request, response, next) => {
  try {
    const overview = await getPythonCourseOverview(request.authUser!);
    response.json({ course: overview.course, units: overview.units });
  } catch (error) {
    next(error);
  }
});

pythonRouter.get("/knowledge", async (request, response, next) => {
  try {
    response.json(
      await searchPythonKnowledgeItems(request.authUser!, {
        unitId: asString(request.query.unitId) || undefined,
        query: asString(request.query.q) || undefined,
        limit: typeof request.query.limit === "string" ? Number(request.query.limit) : undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

pythonRouter.get("/profile", async (request, response, next) => {
  try {
    response.json(await getPythonStudentProfile(request.authUser!));
  } catch (error) {
    next(error);
  }
});

pythonRouter.post("/profile/analyze", async (request, response, next) => {
  try {
    const major = asString(request.body?.major);
    const goal = asString(request.body?.goal);

    if (!major || !goal) {
      throw new HttpError(400, "请填写专业和学习目标。");
    }

    response.json(
      await analyzePythonStudentProfile(request.authUser!, {
        major,
        goal,
        baseLevel: asPythonBaseLevel(request.body?.baseLevel),
        weeklyHours:
          typeof request.body?.weeklyHours === "number" ? request.body.weeklyHours : undefined,
        learningStyle: asPythonLearningStyle(request.body?.learningStyle),
        learningText: asString(request.body?.learningText),
        weakPoints: asStringArray(request.body?.weakPoints),
        strongPoints: asStringArray(request.body?.strongPoints),
        preferredFormats: asStringArray(request.body?.preferredFormats),
        targetProject: asString(request.body?.targetProject),
      }),
    );
  } catch (error) {
    next(error);
  }
});

pythonRouter.post("/path/generate", async (request, response, next) => {
  try {
    response.json(
      await generatePythonLearningPath(request.authUser!, {
        maxSteps:
          typeof request.body?.maxSteps === "number" ? request.body.maxSteps : undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

pythonRouter.get("/path/current", async (request, response, next) => {
  try {
    response.json(await getPythonLearningPath(request.authUser!));
  } catch (error) {
    next(error);
  }
});

pythonRouter.post("/resources/generate", async (request, response, next) => {
  try {
    const unitId = asString(request.body?.unitId);
    if (!unitId) {
      throw new HttpError(400, "请提供要生成资源的知识节点。");
    }

    response.json(
      await generatePythonResources(request.authUser!, {
        unitId,
        resourceTypes: asPythonResourceTypes(request.body?.resourceTypes),
      }),
    );
  } catch (error) {
    next(error);
  }
});

pythonRouter.get("/resources", async (request, response, next) => {
  try {
    const unitId = asString(request.query.unitId);
    response.json(await listPythonResources(request.authUser!, unitId || undefined));
  } catch (error) {
    next(error);
  }
});

pythonRouter.post("/tutor/chat", async (request, response, next) => {
  try {
    const message = asString(request.body?.message);
    if (!message) {
      throw new HttpError(400, "请提供学习问题。");
    }

    response.json(
      await tutorPythonQuestion(request.authUser!, {
        message,
        unitId: asString(request.body?.unitId) || undefined,
        sessionId: asString(request.body?.sessionId) || undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

pythonRouter.post("/quiz/generate", async (request, response, next) => {
  try {
    response.json(
      await generatePythonQuiz(request.authUser!, {
        unitId: asString(request.body?.unitId) || undefined,
        difficulty: asPythonBaseLevel(request.body?.difficulty),
        count:
          typeof request.body?.count === "number" ? request.body.count : undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

pythonRouter.post("/quiz/submit", async (request, response, next) => {
  try {
    const quizId = asString(request.body?.quizId);
    const rawAnswers = Array.isArray(request.body?.answers)
      ? (request.body.answers as Array<{
          questionId?: unknown;
          selectedIndex?: unknown;
        }>)
      : [];
    const answers = Array.isArray(request.body?.answers)
      ? rawAnswers
          .map((item) => ({
            questionId: asString(item?.questionId),
            selectedIndex:
              typeof item?.selectedIndex === "number" ? item.selectedIndex : Number.NaN,
          }))
          .filter((item) => item.questionId && Number.isInteger(item.selectedIndex))
      : [];

    if (!quizId || !answers.length) {
      throw new HttpError(400, "请提供测验编号和作答结果。");
    }

    response.json(
      await submitPythonQuiz(request.authUser!, {
        quizId,
        answers,
      }),
    );
  } catch (error) {
    next(error);
  }
});

pythonRouter.get("/progress/overview", async (request, response, next) => {
  try {
    response.json(await getPythonProgressOverview(request.authUser!));
  } catch (error) {
    next(error);
  }
});

pythonRouter.get("/agents/runs", async (request, response, next) => {
  try {
    response.json(
      await listPythonAgentRuns(
        request.authUser!,
        typeof request.query.limit === "string" ? Number(request.query.limit) : undefined,
      ),
    );
  } catch (error) {
    next(error);
  }
});

pythonRouter.get("/safety/flags", async (request, response, next) => {
  try {
    response.json(
      await listPythonSafetyFlags(
        request.authUser!,
        typeof request.query.limit === "string" ? Number(request.query.limit) : undefined,
      ),
    );
  } catch (error) {
    next(error);
  }
});
