# 智学工坊 - 前端

基于 React + TypeScript + Vite 的 Python个性化学习系统前端

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **React Router** - 路由管理
- **Axios** - HTTP 客户端
- **React Markdown** - Markdown 渲染
- **Remark GFM** - GitHub Flavored Markdown

## 页面功能

### 1. 登录页面 (`/login`)
- 用户名密码登录
- 演示账号说明
- 美观渐变背景

### 2. 学习首页 (`/student/home`)
- 学习统计概览
- 下一步行动建议
- 课程模块列表
- 掌握度进度条
- 最近活动记录

### 3. 学生画像 (`/student/profile`)
- 画像问卷
- AI分析学生标签
- 薄弱点识别
- 基本信息展示

### 4. 学习路径 (`/student/learning-path`)
- 个性化学习路径生成
- 阶段任务时间线
- 预计学习时长
- 推荐理由

### 5. 资源生成 (`/student/resources`)
- 讲义（Markdown格式）
- 代码示例
- 练习题
- 复习卡片
- 思维导图

### 6. 智能答疑 (`/student/tutor`)
- 对话式问答
- 引用来源展示
- 追问建议
- 快捷问题

### 7. 测验评估 (`/student/quiz`)
- 自动生成测验
- 选择题/填空题
- 自动评分
- 错题解析
- 画像更新

## 安装和运行

### 1. 安装依赖

```bash
# 在项目根目录
npm install

# 在前端目录
cd "web frontend"
npm install
```

### 2. 启动开发服务器

```bash
# 启动后端（端口 3001）
npm run dev

# 启动前端（端口 3000）
npm run dev:frontend
```

### 3. 访问应用

打开浏览器访问: http://localhost:3000

## 演示账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 学生 | student001 | 123456 |
| 学生 | student002 | 123456 |
| 学生 | student003 | 123456 |
| 管理员 | admin001 | 123456 |

## 项目结构

```
web frontend/
├── src/
│   ├── components/
│   │   └── Layout.tsx           # 主布局组件（侧边栏导航）
│   ├── contexts/
│   │   └── AuthContext.tsx      # 认证状态管理
│   ├── pages/
│   │   ├── Login.tsx            # 登录页
│   │   └── student/
│   │       ├── Home.tsx         # 学习首页
│   │       ├── Profile.tsx      # 学生画像
│   │       ├── LearningPath.tsx # 学习路径
│   │       ├── Resources.tsx    # 资源生成
│   │       ├── Tutor.tsx        # 智能答疑
│   │       └── Quiz.tsx         # 测验评估
│   ├── services/
│   │   └── api.ts               # API 接口封装
│   ├── types/
│   │   └── index.ts             # TypeScript 类型定义
│   ├── App.tsx                  # 主应用组件
│   ├── main.tsx                 # 应用入口
│   └── index.css                # 全局样式
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 设计特点

### 视觉设计
- 现代化卡片式布局
- 渐变配色
- 平滑过渡动画
- 响应式设计

### 交互体验
- 加载状态提示
- 操作反馈
- 表单验证
- 错误处理

### 代码质量
- TypeScript 类型安全
- 组件化开发
- API 统一封装
- 状态管理

## 开发建议

1. 确保后端服务先启动（端口 3001）
2. 使用 Vite 的热更新功能提高开发效率
3. 遵循现有代码风格和组件结构
4. 注意响应式设计适配

## 构建部署

```bash
# 构建前端
cd "web frontend"
npm run build

# 构建产物在 dist/ 目录
```
