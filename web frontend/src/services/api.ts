import axios from 'axios';
import {
  User,
  StudentProfile,
  ProfileAnalysis,
  CourseUnit,
  LearningPath,
  PathStep,
  Resource,
  ResourcePackage,
  Quiz,
  QuizAttempt,
  QuizAnalysis,
  ChatMessage,
  TutorResponse,
  ProgressOverview,
  AgentRun,
  SafetyFlag
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post<{ token: string; user: User }>('/auth/login', {
      username,
      password,
    });
    return response.data;
  },
};

export const courseApi = {
  getCourse: async () => {
    const response = await api.get('/python/course');
    return response.data;
  },

  getUnits: async () => {
    const response = await api.get<CourseUnit[]>('/python/units');
    return response.data;
  },

  getKnowledge: async () => {
    const response = await api.get('/python/knowledge');
    return response.data;
  },
};

export const profileApi = {
  getProfile: async () => {
    const response = await api.get<StudentProfile>('/python/profile');
    return response.data;
  },

  analyzeProfile: async (answers: Record<string, any>, freeText: string) => {
    const response = await api.post<ProfileAnalysis>('/python/profile/analyze', {
      answers,
      freeText,
    });
    return response.data;
  },
};

export const pathApi = {
  generatePath: async (profileId?: number, targetUnitIds?: number[]) => {
    const response = await api.post<{ path: LearningPath; steps: PathStep[] }>(
      '/python/path/generate',
      { profileId, targetUnitIds }
    );
    return response.data;
  },

  getCurrentPath: async () => {
    const response = await api.get<{ path: LearningPath; steps: PathStep[]; progress: any }>(
      '/python/path/current'
    );
    return response.data;
  },
};

export const resourceApi = {
  generateResources: async (unitId: number, resourceTypes: string[]) => {
    const response = await api.post<ResourcePackage>(
      '/python/resources/generate',
      { unitId, resourceTypes }
    );
    return response.data;
  },

  getResources: async (unitId?: number, type?: string) => {
    const params: any = {};
    if (unitId) params.unitId = unitId;
    if (type) params.type = type;
    const response = await api.get<Resource[]>('/python/resources', { params });
    return response.data;
  },
};

export const tutorApi = {
  chat: async (message: string, unitId?: number, sessionId?: string) => {
    const response = await api.post<TutorResponse>('/python/tutor/chat', {
      message,
      unitId,
      sessionId,
    });
    return response.data;
  },
};

export const quizApi = {
  generateQuiz: async (unitId: number, difficulty: string = 'medium', count: number = 5) => {
    const response = await api.post<Quiz>('/python/quiz/generate', {
      unitId,
      difficulty,
      count,
    });
    return response.data;
  },

  submitQuiz: async (quizId: number, answers: Record<string, any>) => {
    const response = await api.post<QuizAnalysis>('/python/quiz/submit', {
      quizId,
      answers,
    });
    return response.data;
  },
};

export const progressApi = {
  getOverview: async () => {
    const response = await api.get<ProgressOverview>('/python/progress/overview');
    return response.data;
  },
};

export const adminApi = {
  getAgentRuns: async () => {
    const response = await api.get<AgentRun[]>('/python/agents/runs');
    return response.data;
  },

  getSafetyFlags: async () => {
    const response = await api.get<SafetyFlag[]>('/python/safety/flags');
    return response.data;
  },
};

export default api;
