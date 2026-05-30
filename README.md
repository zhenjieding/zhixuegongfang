# 智学工坊

基于大模型的《Python程序设计》个性化学习资源生成与学习多智能体系统。

本仓库是软件杯 A3 赛题项目代码，当前重点完成后端主闭环：学生画像、课程知识库、学习路径、资源生成、智能答疑、测验评估、安全审核和智能体运行日志。

## 项目结构

```text
backend/                 # Express + TypeScript + SQLite 后端
  src/agents/            # Profile/Planner/Resource/Tutor/Evaluator/Safety 等智能体运行支撑
  src/constants/         # Python 程序设计课程 seed 数据
  src/db/                # 数据库连接、建表、seed
  src/routes/            # auth 与 python API
  src/services/          # 画像、路径、资源、答疑、测验、安全审核服务
  src/types/             # 后端数据类型
docs/                    # 项目实施框架文档
```

## 本地运行

```bash
npm install
npm --prefix backend install
npm run dev
```

默认后端地址：

```text
http://127.0.0.1:3001
```

健康检查：

```text
GET /api/health
```

## 演示账号

```text
student001 / 123456
student002 / 123456
student003 / 123456
admin001   / 123456
```

## 核心接口

```text
POST /api/auth/login
GET  /api/python/course
GET  /api/python/units
GET  /api/python/knowledge
GET  /api/python/profile
POST /api/python/profile/analyze
POST /api/python/path/generate
GET  /api/python/path/current
POST /api/python/resources/generate
GET  /api/python/resources
POST /api/python/tutor/chat
POST /api/python/quiz/generate
POST /api/python/quiz/submit
GET  /api/python/progress/overview
GET  /api/python/agents/runs
GET  /api/python/safety/flags
```

## 已完成能力

- 《Python程序设计》6 个课程模块 seed 数据
- 每个模块至少 5 条知识资料、1 个代码案例、5 道基础题、3 道进阶题
- 学生画像不少于 6 个维度标签
- 个性化学习路径生成
- 讲义、练习、代码案例、复习卡、思维导图等资源生成
- 课程资料引用式答疑
- 测验评分、错因分析、掌握度更新、画像更新
- SafetyAgent 安全审核和 `python_safety_flags` 日志
- `python_agent_runs` 多智能体运行日志

