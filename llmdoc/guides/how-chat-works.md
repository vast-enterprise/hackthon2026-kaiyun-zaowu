# 聊天系统工作流程

## 1. 新会话创建到消息发送

1. **页面加载初始化：** `hooks/use-chat-session.ts:115-139` 的 mount effect 执行，调用 `getLatestSession()` 恢复最新会话 + `getAnalysisNote()` 恢复 analysisNote + 将 `session.maskId` 回写 Zustand。若无会话，调用 `createSession()` 生成新会话（继承当前 Zustand maskId）。
2. **面具选择（新会话）：** 新会话无消息时，`components/chat/index.tsx` 渲染 `MaskGuide` 面具卡片网格，用户点击卡片选择对话风格。maskId 写入 Zustand，后续 Transport 请求和会话保存时携带。
3. **用户输入消息：** 在 `PromptInput` 中输入文本后按 Enter，触发 `sendMessage({ text })`。
4. **Transport 发送请求：** `hooks/use-chat-session.ts:17-24` 的 `DefaultChatTransport` 向 `/api/chat` 发送 POST，请求体包含 `messages`、`pendingTaskId`、`analysisNote` 和 `maskId`。
5. **API 路由处理：** `app/api/chat/route.ts:101-262` 解析请求，`getMaskById(maskId)` 查找面具定义，`mask.promptOverride + behaviorPrompt` 拼装 system prompt，`buildAnalysisContext` 将 analysisNote 注入 system prompt，`streamText` 调用 DeepSeek 模型（含五个工具），返回流式响应。
6. **消息实时更新：** `useChat` 自动解析 SSE 流，更新 `messages` 数组。
7. **analysisNote 同步：** `hooks/use-chat-session.ts:82-112` 检测 `analyzeBazi`/`deepAnalysis` 工具输出中的 `analysisNote`，保存到 IndexedDB + Zustand。
8. **自动持久化：** 消息变化后 300ms 防抖写入 IndexedDB（含当前 maskId），同时从首条用户消息提取前 20 字符作为会话标题。

## 2. 添加新的 AI 工具

1. **定义工具 Schema：** 在 `app/api/chat/route.ts` 中使用 `tool()` 函数定义新工具，包含 `description`、`inputSchema`（Zod schema）和 `execute` 异步函数。**注意：execute 是必需的**——没有 execute 会导致 DeepSeek API 拒绝后续请求。
2. **注册到 streamText：** 将新工具添加到 `app/api/chat/route.ts:259` 的 `tools` 对象中：`tools: { analyzeBazi, generateMascot, retextureMascot, presentOptions, deepAnalysis, yourNewTool }`。
3. **更新 System Prompt：** 在 `app/api/chat/route.ts:26-78` 的 `behaviorPrompt` 中描述新工具的使用场景。注意：原 systemPrompt 已拆分为 `mask.promptOverride`（面具「你是谁」段落，来自 `lib/masks.ts`）+ `behaviorPrompt`（行为规则），面具部分无需修改。
4. **添加前端渲染：** 在 `components/chat/chat-message.tsx` 的 tool parts 路由逻辑中为新工具添加条件分支。
5. **注册工具标题：** 在 `components/chat/chat-message.tsx` 的 `TOOL_TITLES` 映射表中添加中文名称。当前已注册：`analyzeBazi`、`generateMascot`、`retextureMascot`、`presentOptions`、`deepAnalysis`。
6. **验证：** 启动开发服务器，在对话中触发新工具的调用场景，确认工具执行成功且 UI 正确渲染。

## 3. 会话切换和历史加载

1. **查看会话列表：** 侧边栏调用 `listSessions()`（`lib/persistence/chat-db.ts`）从 IndexedDB 按 `updatedAt` 倒序加载。
2. **点击切换会话：** 调用 `loadSession(sessionId)`（`hooks/use-chat-session.ts:141-161`），按顺序执行：`chatStopRef.current()`（停止活跃 streaming）-> `clearTimeout(saveTimerRef.current)`（取消待执行 save）-> `resetStore()`（清除状态，maskId 不被清除）-> 加载消息（经 `sanitizeMessages` 过滤）-> 将 `session.maskId` 回写 Zustand -> 加载 `getAnalysisNote(sessionId)` 恢复 analysisNote。
3. **创建新会话：** 调用 `newSession()`（`hooks/use-chat-session.ts:163-174`），同样先停止 streaming + 取消 save，重置 store（analysisNote = null，maskId 保留当前值）、`createSession()` 从 Zustand 读取当前 maskId 写入新会话、清空消息。新会话显示 MaskGuide 面具选择界面。
4. **删除会话：** `deleteSession(sessionId)`（`lib/persistence/chat-db.ts:78-85`）事务性删除 sessions + messages + analysisNotes。
5. **消息清洗（防御 MissingToolResultsError）：** `sanitizeMessages()`（`hooks/use-chat-session.ts:26-41`）过滤 assistant 消息中 state 不为 `output-available` 的 tool-* parts，应用于 init 加载和 loadSession 加载两个入口，防止不完整 tool call 导致 AI SDK 报错。

## 4. 3D 模型生成流程

1. **AI 调用工具：** DeepSeek 模型根据八字分析结果决定调用 `generateMascot`（支持 `negativePrompt` 参数）或 `retextureMascot`。
2. **后端创建任务：** 检查 `pendingTaskId` 防重复，调用 `tripoClient.createTask`（含默认 negativePrompt 和 `texture_quality: 'high'`）或 `tripoClient.retextureModel` 获取 taskId。
3. **前端接收 taskId：** `ChatMessage` 检测到工具输出含 `taskId`，渲染 `ModelPreview` 组件。
4. **轮询任务状态：** `ModelPreview` 每 3 秒调用 `/api/tripo/task/{taskId}` 查询状态，展示进度条。
5. **模型就绪：** 任务成功后 -> `setModelUrl()` -> phase 切换为 'split' -> 渲染 `ModelViewer` 分屏。
