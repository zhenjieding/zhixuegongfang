import type {
  PythonBaseLevel,
  PythonKnowledgeItem,
  PythonQuestionItem,
  PythonResourceType,
  PythonCourseUnit,
} from "../types/pythonCourse";

export const PYTHON_COURSE_ID = "python-programming";
export const PYTHON_COURSE_TITLE = "Python程序设计";

export interface PythonStudentArchetype {
  id: string;
  label: string;
  description: string;
  baseLevel: PythonBaseLevel;
  learningStyle: "visual" | "practice" | "mixed" | "project";
  weakPoints: string[];
  preferredFormats: string[];
  targetProject: string;
}

export const pythonCourseUnits: PythonCourseUnit[] = [
  {
    id: "py-1",
    title: "Python 入门与数据类型",
    summary: "认识 Python 运行方式、变量、输入输出、基本数据类型和类型转换。",
    difficulty: "beginner",
    orderIndex: 1,
    estimatedMinutes: 90,
    objectives: [
      "理解 Python 解释执行的基本方式",
      "会使用 print 和 input 完成简单交互",
      "掌握变量命名、数字、字符串与布尔值",
      "会进行 int、float、str 的基础转换",
    ],
    prerequisites: [],
    commonMistakes: [
      "把字符串和数字直接相加",
      "忘记做类型转换",
      "变量名不规范或重复覆盖",
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-2",
    title: "分支、循环与流程控制",
    summary: "掌握 if、for、while、range、break、continue 的基本用法。",
    difficulty: "beginner",
    orderIndex: 2,
    estimatedMinutes: 120,
    objectives: [
      "会使用条件判断组织程序分支",
      "会写 for 和 while 循环",
      "理解循环边界与循环退出条件",
      "能读懂带有缩进的流程控制代码",
    ],
    prerequisites: ["py-1"],
    commonMistakes: [
      "循环边界写错",
      "条件判断重复或遗漏",
      "缩进层级混乱",
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-3",
    title: "函数、模块与代码组织",
    summary: "掌握函数定义、参数、返回值、模块导入与简单项目结构。",
    difficulty: "intermediate",
    orderIndex: 3,
    estimatedMinutes: 120,
    objectives: [
      "会把重复逻辑拆成函数",
      "理解参数、默认值和返回值",
      "知道如何导入模块和组织文件",
      "能把零散代码整理成小型程序结构",
    ],
    prerequisites: ["py-1", "py-2"],
    commonMistakes: [
      "函数只写调用不写返回",
      "参数名和变量名混用",
      "模块导入路径写错",
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-4",
    title: "列表、字典、集合与字符串处理",
    summary: "集中掌握 Python 常用容器和文本处理能力。",
    difficulty: "intermediate",
    orderIndex: 4,
    estimatedMinutes: 130,
    objectives: [
      "会读写列表、字典、集合和元组",
      "理解下标、切片、遍历和查找",
      "会处理字符串拆分、拼接和格式化",
      "能根据业务需要选择合适的数据结构",
    ],
    prerequisites: ["py-1", "py-2"],
    commonMistakes: [
      "把列表和字典的操作方式混淆",
      "忘记字典 key 的唯一性",
      "字符串切片边界理解不清",
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-5",
    title: "文件操作、异常处理与调试",
    summary: "掌握文件读写、异常捕获、上下文管理和基础调试方法。",
    difficulty: "intermediate",
    orderIndex: 5,
    estimatedMinutes: 120,
    objectives: [
      "会读取和写入文本文件",
      "理解 try、except、finally 的作用",
      "会用 with 管理文件对象",
      "能定位常见运行错误并给出修复建议",
    ],
    prerequisites: ["py-3", "py-4"],
    commonMistakes: [
      "文件路径写错",
      "打开文件后没有关闭",
      "异常捕获范围过大或过小",
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-6",
    title: "面向对象与综合项目",
    summary: "把前面所学整合为类、对象、方法和一个可展示的小项目。",
    difficulty: "advanced",
    orderIndex: 6,
    estimatedMinutes: 150,
    objectives: [
      "理解类、对象、属性和方法",
      "会设计简单的封装和初始化逻辑",
      "能把模块、函数、容器和文件能力组合起来",
      "完成一个可演示的 Python 综合小项目",
    ],
    prerequisites: ["py-3", "py-4", "py-5"],
    commonMistakes: [
      "把 self 和普通参数混淆",
      "类的职责划分过于混乱",
      "项目功能拆分不清晰",
    ],
    updatedAt: new Date().toISOString(),
  },
];

export const pythonKnowledgeItems: PythonKnowledgeItem[] = [
  {
    id: "py-1-lecture",
    unitId: "py-1",
    itemType: "lecture",
    title: "Python 入门讲义",
    contentMarkdown:
      "### 学习目标\n- 认识 Python 的解释执行方式\n- 会用 `print()` 和 `input()` 完成基础交互\n- 掌握变量、数字、字符串、布尔值和类型转换\n\n### 核心提示\n1. Python 代码依赖缩进组织结构。\n2. 数值和字符串不要直接混着算，先判断是否需要类型转换。\n3. 变量命名建议使用有意义的英文单词，避免过短或重复。\n",
    sourceLabel: "课程资料",
    sourceRef: "Python 程序设计第 1 章",
    keywords: ["变量", "数据类型", "输入输出", "类型转换", "print", "input"],
    orderIndex: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-1-code",
    unitId: "py-1",
    itemType: "code_example",
    title: "基础交互与类型转换示例",
    contentMarkdown:
      "```python\nname = input(\"请输入你的名字：\")\nage = int(input(\"请输入年龄：\"))\nprint(f\"{name} 明年就 {age + 1} 岁了\")\n```\n\n### 说明\n- `input()` 读到的是字符串。\n- 如果要进行数学运算，通常要先转成 `int` 或 `float`。\n",
    sourceLabel: "课程练习",
    sourceRef: "入门示例 1",
    keywords: ["input", "int", "f-string", "类型转换"],
    orderIndex: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-2-lecture",
    unitId: "py-2",
    itemType: "lecture",
    title: "分支与循环讲义",
    contentMarkdown:
      "### 学习目标\n- 能写出 `if / elif / else` 判断\n- 能使用 `for` 和 `while` 解决重复执行问题\n- 理解 `break` 和 `continue` 的差异\n\n### 常见错误\n- 循环条件写反\n- `range()` 的终止值默认不包含在内\n- 缩进错误导致代码块执行顺序不对\n",
    sourceLabel: "课程资料",
    sourceRef: "Python 程序设计第 2 章",
    keywords: ["if", "elif", "else", "for", "while", "range", "break", "continue"],
    orderIndex: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-2-mindmap",
    unitId: "py-2",
    itemType: "mindmap",
    title: "流程控制思维导图",
    contentMarkdown:
      "```mermaid\nmindmap\n  root((流程控制))\n    条件判断\n      if\n      elif\n      else\n    循环\n      for\n      while\n    控制语句\n      break\n      continue\n```\n",
    sourceLabel: "课程资料",
    sourceRef: "流程控制知识图谱",
    keywords: ["流程控制", "流程图", "循环", "分支"],
    orderIndex: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-3-lecture",
    unitId: "py-3",
    itemType: "lecture",
    title: "函数与模块讲义",
    contentMarkdown:
      "### 学习目标\n- 会定义函数并正确传参\n- 理解返回值和局部变量\n- 知道如何把代码拆成多个文件\n\n### 关键建议\n- 函数应尽量只做一件事。\n- 先写输入、处理、输出三步，再决定如何拆分函数。\n- 模块化是后续项目开发的基础。\n",
    sourceLabel: "课程资料",
    sourceRef: "Python 程序设计第 3 章",
    keywords: ["函数", "参数", "返回值", "模块", "import"],
    orderIndex: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-3-code",
    unitId: "py-3",
    itemType: "code_example",
    title: "函数拆分示例",
    contentMarkdown:
      "```python\ndef average(values):\n    total = sum(values)\n    count = len(values)\n    return total / count if count else 0\n\nscores = [88, 92, 76]\nprint(average(scores))\n```\n\n### 说明\n- 函数返回结果后，外部再决定如何展示。\n- 这种写法比把所有逻辑堆在一起更适合课程项目。\n",
    sourceLabel: "课程练习",
    sourceRef: "函数拆分示例",
    keywords: ["函数", "return", "sum", "len"],
    orderIndex: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-4-lecture",
    unitId: "py-4",
    itemType: "lecture",
    title: "容器与字符串讲义",
    contentMarkdown:
      "### 学习目标\n- 会用列表、元组、字典和集合组织数据\n- 会遍历和查找常见容器\n- 会进行字符串切片、拼接和格式化\n\n### 典型场景\n- 成绩统计适合用字典\n- 重复元素去重适合用集合\n- 订单或任务列表适合用列表\n",
    sourceLabel: "课程资料",
    sourceRef: "Python 程序设计第 4 章",
    keywords: ["列表", "字典", "集合", "元组", "字符串", "切片"],
    orderIndex: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-5-lecture",
    unitId: "py-5",
    itemType: "lecture",
    title: "文件与异常讲义",
    contentMarkdown:
      "### 学习目标\n- 掌握文件读写的基本语法\n- 理解 `try / except / finally` 的作用\n- 会判断常见运行时错误的来源\n\n### 调试建议\n1. 先看报错行号。\n2. 再确认变量类型和输入内容。\n3. 最后检查文件路径和缩进。\n",
    sourceLabel: "课程资料",
    sourceRef: "Python 程序设计第 5 章",
    keywords: ["文件", "异常", "try", "except", "finally", "with"],
    orderIndex: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-5-code",
    unitId: "py-5",
    itemType: "code_example",
    title: "文件读取与异常捕获示例",
    contentMarkdown:
      "```python\ntry:\n    with open(\"data.txt\", \"r\", encoding=\"utf-8\") as f:\n        content = f.read()\n        print(content)\nexcept FileNotFoundError:\n    print(\"文件不存在，请检查路径\")\n```\n",
    sourceLabel: "课程练习",
    sourceRef: "文件操作示例",
    keywords: ["open", "with", "FileNotFoundError", "编码"],
    orderIndex: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-6-lecture",
    unitId: "py-6",
    itemType: "lecture",
    title: "面向对象与项目讲义",
    contentMarkdown:
      "### 学习目标\n- 理解类、对象、属性和方法\n- 设计一个小型课程项目结构\n- 把前面章节知识整合成完整程序\n\n### 项目建议\n可以做一个“Python 学习助手”小项目，支持课程查询、错题记录、学习计划和进度查看。\n",
    sourceLabel: "课程资料",
    sourceRef: "Python 程序设计第 6 章",
    keywords: ["类", "对象", "方法", "self", "项目", "封装"],
    orderIndex: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-6-project",
    unitId: "py-6",
    itemType: "project_case",
    title: "综合项目建议",
    contentMarkdown:
      "#### 小项目方向\n- 学习计划生成器\n- 错题本管理器\n- 课程知识卡片站\n\n### 推荐拆分\n1. 数据层：保存课程单元、学习记录和测验结果\n2. 服务层：生成路径、题目和答疑\n3. 展示层：输出卡片、时间线和统计信息\n",
    sourceLabel: "课程设计参考",
    sourceRef: "课程综合项目模板",
    keywords: ["项目", "数据层", "服务层", "展示层"],
    orderIndex: 2,
    updatedAt: new Date().toISOString(),
  },
];

export const pythonQuestionBank: PythonQuestionItem[] = [
  {
    id: "py-q-1",
    unitId: "py-1",
    questionType: "single_choice",
    difficulty: "beginner",
    prompt: "下面哪一项最适合存储用户输入后要参与加法运算的年龄值？",
    options: ["str", "int", "list", "bool"],
    correctIndex: 1,
    explanation: "年龄要参与数学运算时，通常应先转换为整数类型。",
    answerText: "int",
    tags: ["类型转换", "input"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-2",
    unitId: "py-1",
    questionType: "single_choice",
    difficulty: "beginner",
    prompt: "Python 中用来输出内容到屏幕的常见函数是哪个？",
    options: ["scan", "print", "show", "write"],
    correctIndex: 1,
    explanation: "Python 使用 print() 将内容输出到终端或控制台。",
    answerText: "print",
    tags: ["print", "输出"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-3",
    unitId: "py-2",
    questionType: "single_choice",
    difficulty: "beginner",
    prompt: "for i in range(3) 会执行几次循环？",
    options: ["1 次", "2 次", "3 次", "4 次"],
    correctIndex: 2,
    explanation: "range(3) 会生成 0、1、2，共 3 次循环。",
    answerText: "3 次",
    tags: ["range", "循环边界"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-4",
    unitId: "py-2",
    questionType: "single_choice",
    difficulty: "beginner",
    prompt: "在循环中提前结束当前一轮并进入下一轮，应该使用哪个语句？",
    options: ["break", "continue", "return", "pass"],
    correctIndex: 1,
    explanation: "continue 会跳过当前循环剩余部分并进入下一轮。",
    answerText: "continue",
    tags: ["continue", "循环控制"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-5",
    unitId: "py-3",
    questionType: "single_choice",
    difficulty: "intermediate",
    prompt: "函数中把结果返回给调用者，应使用哪个关键字？",
    options: ["yield", "return", "import", "global"],
    correctIndex: 1,
    explanation: "return 用于把函数执行结果返回给外部调用处。",
    answerText: "return",
    tags: ["函数", "返回值"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-6",
    unitId: "py-3",
    questionType: "single_choice",
    difficulty: "intermediate",
    prompt: "下面哪种做法最适合把重复代码整理成可复用结构？",
    options: ["复制粘贴多次", "写成函数", "写成注释", "删除重复代码"],
    correctIndex: 1,
    explanation: "重复逻辑应抽取为函数，提高可读性和复用性。",
    answerText: "写成函数",
    tags: ["模块化", "函数"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-7",
    unitId: "py-4",
    questionType: "single_choice",
    difficulty: "intermediate",
    prompt: "如果要保存“课程名 -> 分数”这样的映射关系，最合适的数据结构是什么？",
    options: ["list", "tuple", "dict", "set"],
    correctIndex: 2,
    explanation: "字典最适合表达 key-value 映射关系。",
    answerText: "dict",
    tags: ["字典", "映射"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-8",
    unitId: "py-4",
    questionType: "single_choice",
    difficulty: "intermediate",
    prompt: "字符串 'Python'[:3] 的结果是什么？",
    options: ["Pyt", "yth", "tho", "Python"],
    correctIndex: 0,
    explanation: "切片从下标 0 开始，到 3 之前结束，因此结果是 Pyt。",
    answerText: "Pyt",
    tags: ["字符串", "切片"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-9",
    unitId: "py-5",
    questionType: "single_choice",
    difficulty: "intermediate",
    prompt: "读取文本文件时，建议优先使用哪种方式自动关闭文件？",
    options: ["open 后手动忘记关闭", "with open(...)", "print(file)", "catch all exception"],
    correctIndex: 1,
    explanation: "with 上下文管理器能在代码块结束后自动关闭文件。",
    answerText: "with open(...)",
    tags: ["文件", "with"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-10",
    unitId: "py-5",
    questionType: "single_choice",
    difficulty: "intermediate",
    prompt: "如果文件路径写错，最常见的异常是什么？",
    options: ["IndexError", "FileNotFoundError", "TypeError", "KeyError"],
    correctIndex: 1,
    explanation: "文件找不到时通常会抛出 FileNotFoundError。",
    answerText: "FileNotFoundError",
    tags: ["异常", "文件路径"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-11",
    unitId: "py-6",
    questionType: "single_choice",
    difficulty: "advanced",
    prompt: "在类的方法定义中，哪个参数通常用于接收当前对象本身？",
    options: ["self", "this", "cls", "obj"],
    correctIndex: 0,
    explanation: "实例方法的第一个参数通常写作 self，用来引用当前对象。",
    answerText: "self",
    tags: ["类", "对象", "self"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "py-q-12",
    unitId: "py-6",
    questionType: "single_choice",
    difficulty: "advanced",
    prompt: "完成一个课程综合项目时，最合理的开发顺序是什么？",
    options: ["先写界面再想数据", "先做数据和服务，再做展示", "先写测试视频", "先做宣传文案"],
    correctIndex: 1,
    explanation: "项目开发建议先把数据和服务层打通，再做展示和包装。",
    answerText: "先做数据和服务，再做展示",
    tags: ["项目", "结构设计"],
    updatedAt: new Date().toISOString(),
  },
];

type PythonKnowledgeItemType = PythonKnowledgeItem["itemType"];

function unitKeywords(unit: PythonCourseUnit) {
  return [
    ...unit.title.split(/[、，, ]+/).filter(Boolean),
    ...unit.objectives.flatMap((item) => item.split(/[、，, ]+/).filter((keyword) => keyword.length >= 2)),
  ].slice(0, 8);
}

function maxKnowledgeOrder(unitId: string, items: PythonKnowledgeItem[]) {
  return items
    .filter((item) => item.unitId === unitId)
    .reduce((max, item) => Math.max(max, item.orderIndex), 0);
}

function buildKnowledgeContent(unit: PythonCourseUnit, itemType: PythonKnowledgeItemType) {
  const firstObjective = unit.objectives[0] ?? unit.summary;
  const commonMistake = unit.commonMistakes[0] ?? "忽略代码执行顺序";

  if (itemType === "mindmap") {
    return [
      "```mermaid",
      "mindmap",
      `  root((${unit.title}))`,
      ...unit.objectives.map((objective) => `    ${objective.replace(/[()]/g, "")}`),
      "```",
      "",
      `这张图用于帮助学生把“${unit.title}”拆成可复习的知识节点。`,
    ].join("\n");
  }

  if (itemType === "code_example") {
    return [
      "```python",
      `# ${unit.title}：课程设计演示代码骨架`,
      "def explain_step():",
      `    focus = \"${firstObjective}\"`,
      "    print(f\"当前练习目标：{focus}\")",
      "",
      "if __name__ == \"__main__\":",
      "    explain_step()",
      "```",
      "",
      `示例强调先完成“${firstObjective}”，再把代码放入课程项目中演示。`,
    ].join("\n");
  }

  if (itemType === "exercise") {
    return [
      `#### ${unit.title} 随堂练习`,
      "",
      `1. 用自己的话解释：${firstObjective}。`,
      `2. 写一个最小 Python 代码片段，体现该知识点的用法。`,
      `3. 检查代码中是否出现“${commonMistake}”这一类问题。`,
    ].join("\n");
  }

  if (itemType === "review") {
    return [
      `### ${unit.title} 复习卡`,
      "",
      `- 核心目标：${firstObjective}`,
      `- 常见错误：${commonMistake}`,
      `- 自测问题：如果要在课程项目里使用本知识点，你会拆成哪三步？`,
    ].join("\n");
  }

  if (itemType === "project_case") {
    return [
      `### ${unit.title} 项目化案例`,
      "",
      "把该知识点接入“Python 学习助手”课程项目：",
      "1. 设计输入数据。",
      "2. 用函数或模块处理数据。",
      "3. 输出可展示的学习结果或反馈。",
      `重点避免：${commonMistake}。`,
    ].join("\n");
  }

  return [
    `### ${unit.title} 概念卡片`,
    "",
    `- 学习目标：${firstObjective}`,
    `- 使用场景：${unit.summary}`,
    `- 易错提醒：${commonMistake}`,
  ].join("\n");
}

function buildSupplementalKnowledgeItems(existingItems: PythonKnowledgeItem[]) {
  const additions: PythonKnowledgeItem[] = [];
  const requiredTypes: PythonKnowledgeItemType[] = [
    "lecture",
    "mindmap",
    "code_example",
    "exercise",
    "review",
    "project_case",
  ];

  for (const unit of pythonCourseUnits) {
    let orderIndex = maxKnowledgeOrder(unit.id, [...existingItems, ...additions]) + 1;
    const currentItems = () => [...existingItems, ...additions].filter((item) => item.unitId === unit.id);
    const currentTypes = () => new Set(currentItems().map((item) => item.itemType));

    for (const itemType of requiredTypes) {
      if (currentItems().length >= 5 && currentTypes().has("code_example")) {
        break;
      }

      if (currentTypes().has(itemType)) {
        continue;
      }

      additions.push({
        id: `${unit.id}-${itemType}-auto`,
        unitId: unit.id,
        itemType,
        title: `${unit.title}${itemType === "code_example" ? "代码案例" : itemType === "mindmap" ? "结构图" : itemType === "exercise" ? "专项练习" : itemType === "review" ? "复习卡" : itemType === "project_case" ? "项目案例" : "补充讲义"}`,
        contentMarkdown: buildKnowledgeContent(unit, itemType),
        sourceLabel: "课程 seed 资料",
        sourceRef: `${PYTHON_COURSE_TITLE} ${unit.orderIndex}.${orderIndex}`,
        keywords: unitKeywords(unit),
        orderIndex,
        updatedAt: new Date().toISOString(),
      });
      orderIndex += 1;
    }
  }

  return additions;
}

function buildSupplementalQuestion(
  unit: PythonCourseUnit,
  difficulty: PythonBaseLevel,
  index: number,
): PythonQuestionItem {
  const objective = unit.objectives[index % unit.objectives.length] ?? unit.summary;
  const mistake = unit.commonMistakes[index % unit.commonMistakes.length] ?? "代码执行顺序不清";
  const isAdvanced = difficulty === "advanced";

  return {
    id: `py-q-${unit.id}-${difficulty}-${index + 1}`,
    unitId: unit.id,
    questionType: "single_choice",
    difficulty,
    prompt: isAdvanced
      ? `在课程项目中应用“${unit.title}”时，下面哪种做法最合理？`
      : `学习“${unit.title}”时，下面哪一项最符合本节目标？`,
    options: isAdvanced
      ? [
          `先围绕“${objective}”拆分任务，再写可运行代码`,
          `直接复制一段无关代码，演示时再解释`,
          `只写界面，不考虑数据和逻辑`,
          `遇到“${mistake}”也不需要调试`,
        ]
      : [
          objective,
          mistake,
          "只关注页面展示，不运行代码",
          "跳过基础概念直接背答案",
        ],
    correctIndex: 0,
    explanation: isAdvanced
      ? `进阶应用应先明确目标和任务拆分，再落到代码实现，并主动规避“${mistake}”。`
      : `本题对应本节核心目标：${objective}。`,
    answerText: isAdvanced ? "先拆分任务再实现代码" : objective,
    tags: [unit.title, isAdvanced ? "项目应用" : "基础概念", mistake],
    updatedAt: new Date().toISOString(),
  };
}

function buildSupplementalQuestionBank(existingQuestions: PythonQuestionItem[]) {
  const additions: PythonQuestionItem[] = [];

  for (const unit of pythonCourseUnits) {
    for (const difficulty of ["beginner", "advanced"] as PythonBaseLevel[]) {
      const requiredCount = difficulty === "beginner" ? 5 : 3;
      const currentCount = () =>
        [...existingQuestions, ...additions].filter(
          (question) => question.unitId === unit.id && question.difficulty === difficulty,
        ).length;

      for (let index = currentCount(); index < requiredCount; index += 1) {
        additions.push(buildSupplementalQuestion(unit, difficulty, index));
      }
    }
  }

  return additions;
}

pythonKnowledgeItems.push(...buildSupplementalKnowledgeItems(pythonKnowledgeItems));
pythonQuestionBank.push(...buildSupplementalQuestionBank(pythonQuestionBank));

export const pythonDemoStudents: PythonStudentArchetype[] = [
  {
    id: "py-student-beginner",
    label: "零基础型",
    description: "适合刚开始学习 Python 的学生，重点补语法和流程控制。",
    baseLevel: "beginner",
    learningStyle: "mixed",
    weakPoints: ["循环边界", "类型转换"],
    preferredFormats: ["lecture", "exercise", "review"],
    targetProject: "Python 入门练习册",
  },
  {
    id: "py-student-practice",
    label: "刷题强化型",
    description: "有一点基础，但需要大量练习和错题巩固。",
    baseLevel: "intermediate",
    learningStyle: "practice",
    weakPoints: ["函数返回值", "字典遍历", "异常处理"],
    preferredFormats: ["exercise", "code_example", "review"],
    targetProject: "课程作业强化包",
  },
  {
    id: "py-student-project",
    label: "项目驱动型",
    description: "希望尽快做出一个可展示的课程项目。",
    baseLevel: "advanced",
    learningStyle: "project",
    weakPoints: ["类设计", "模块拆分", "文件组织"],
    preferredFormats: ["project_case", "mindmap", "code_example"],
    targetProject: "Python 学习助手小项目",
  },
];

export function defaultResourceTypesForStyle(style: PythonStudentArchetype["learningStyle"]): PythonResourceType[] {
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
