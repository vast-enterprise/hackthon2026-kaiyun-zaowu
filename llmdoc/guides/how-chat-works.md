# 聊天系统工作流程

## 1. 新会话创建到消息发送

1. **页面加载初始化：** `hooks/use-chat-session.ts:57-76` 的 mount effect 执行，调用 `getLatestSession()` 尝试恢复最新会话。若无会话，调用 `createSession()` 生成 UUID + 时间戳，保存到 IndexedDB。
2. **用户输入消息：** 在 `PromptInput` 中输入文本后按 Enter，触发 `components/chat/index.tsx:63-66` 的 `onSubmit`，调用 `sendMessage({ text })`。
3. **Transport 发送请求：** `hooks/use-chat-session.ts:16-21` 的 `DefaultChatTransport` 向 `/api/chat` 发送 POST，请求体包含 `messages` 和 `pendingTaskId`。
4. **API 路由处理：** `app/api/chat/route.ts:73-110` 解析请求，`streamText` 调用 DeepSeek 模型，返回 `UIMessageStreamResponse` 流式响应。
5. **消息实时更新：** `useChat` 自动解析 SSE 流，更新 `messages` 数组，触发 UI 重渲染。
6. **自动持久化：** `hooks/use-chat-session.ts:39-53` 监听 messages 变化，300ms 防抖后将会话和消息写入 IndexedDB，同时从首条用户消息提取前 20 字符作为会话标题。

## 2. 添加新的 AI 工具

1. **定义工具 Schema：** 在 `app/api/chat/route.ts` 中使用 `tool()` 函数定义新工具，包含 `description`、`inputSchema`（Zod schema）和 `execute` 异步函数。参考 `analyzeBazi`（`app/api/chat/route.ts:12-38`）的模式。
2. **注册到 streamText：** 将新工具添加到 `app/api/chat/route.ts:105` 的 `tools` 对象中：`tools: { analyzeBazi, generateMascot, yourNewTool }`。
3. **更新 System Prompt：** 在 `app/api/chat/route.ts:41-71` 的 `systemPrompt` 中描述新工具的使用场景和调用时机，指导 AI 何时调用。
4. **添加前端渲染：** 在 `components/chat/chat-message.tsx:74-107` 的 tool parts 路由逻辑中，为新工具添加条件分支。若需自定义 UI，创建独立组件；否则使用默认 `Tool` 组件展示。
5. **注册工具标题：** 在 `components/chat/chat-message.tsx:27-30` 的 `TOOL_TITLES` 映射表中添加新工具的中文名称。
6. **验证：** 启动开发服务器，在对话中触发新工具的调用场景，确认工具执行成功且 UI 正确渲染。

## 3. 会话切换和历史加载

1. **查看会话列表：** 侧边栏组件调用 `listSessions()`（`lib/persistence/chat-db.ts:48-52`）从 IndexedDB 按 `updatedAt` 倒序加载所有会话。
2. **点击切换会话：** 调用 `loadSession(sessionId)`（`hooks/use-chat-session.ts:78-92`），执行以下步骤：
   - 调用 `resetStore()` 清除 Zustand 中的 modelUrl、pendingTaskId、phase。
   - 从 IndexedDB 加载目标会话的消息列表。
   - 更新 `currentSessionId` 和 `initialMessages`，触发 `useChat` 重新初始化。
3. **创建新会话：** 调用 `newSession()`（`hooks/use-chat-session.ts:94-102`），重置 store、生成新 UUID、清空消息、保存空会话到 IndexedDB。
4. **删除会话：** 侧边栏调用 `deleteSession(sessionId)`（`lib/persistence/chat-db.ts:68-74`），事务性删除 sessions + messages 记录。若删除当前会话则自动创建新会话。

## 4. 3D 模型生成流程

1. **AI 调用工具：** DeepSeek 模型根据八字分析结果决定调用 `generateMascot`，传入 prompt 和 style。
2. **后端创建任务：** `app/api/chat/route.ts:82-98` 检查 `pendingTaskId` 防重复，调用 `tripoClient.createTask` 获取 taskId。
3. **前端接收 taskId：** `ChatMessage` 检测到 `tool-generateMascot` 且 `output.taskId` 存在，渲染 `ModelPreview` 组件。
4. **轮询任务状态：** `components/chat/model-preview.tsx:27-63` 每 3 秒调用 `/api/tripo/task/{taskId}` 查询状态，展示进度条。
5. **模型就绪：** 任务成功后，守卫检查通过 -> 调用 `setModelUrl()` -> Zustand phase 切换为 'split' -> `app/page.tsx:39-53` 渲染 `ModelViewer` 分屏面板。
