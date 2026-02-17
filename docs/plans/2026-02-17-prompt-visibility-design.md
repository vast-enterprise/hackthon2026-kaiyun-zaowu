# 模型生成 Prompt 可视化与编辑

## 背景

当前 `generateMascot` / `retextureMascot` 工具返回 `{ taskId, status }` 不含 prompt，前端无法看到 AI 实际使用的生成提示词。用户需要透明度（知道 AI 用了什么 prompt）、可调整性（编辑 prompt 快速迭代）和调试能力（排查生成质量问题）。

## 设计

### 1. 数据层

在 `generateMascot` 和 `retextureMascot` 的返回值中补充 prompt 字段：

```typescript
// generateMascot.execute 返回
return { success: true, taskId, status: 'pending', prompt: fullPrompt, negativePrompt: negativePrompt ?? null }

// retextureMascot.execute 返回
return { success: true, taskId, status: 'pending', prompt, negativePrompt: null }
```

不新增类型、不改 IndexedDB schema、不改 transport。

### 2. UI 层 — PromptCard 组件

新建 `components/chat/prompt-card.tsx`，内联卡片组件：

**Props:**
- `prompt: string` — 主提示词
- `negativePrompt?: string | null` — 反向提示词
- `disabled?: boolean` — 是否禁用重新生成（pendingTaskId 存在时）
- `onRegenerate?: (prompt: string, negativePrompt?: string) => void` — 重新生成回调

**折叠态（默认）:**
- 标题：「吉祥物生成提示词」（retexture 时为「纹理重生成提示词」）
- 右侧：展开箭头

**展开态:**
- 主提示词 textarea（可编辑，等宽字体）
- 反向提示词 textarea（可选，可编辑）
- 操作按钮：「重新生成」「复制」「重置」（仅修改后显示）

复用 Collapsible、Badge 等现有 UI 组件，与 AnalysisCard / Tool 风格统一。

### 3. 渲染路由

`chat-message.tsx` 中 `generateMascot` / `retextureMascot` 分支修改：

```tsx
if (toolName === 'generateMascot' || toolName === 'retextureMascot') {
  if (state === 'output-available' && output?.taskId) {
    return (
      <>
        {output.prompt && (
          <PromptCard
            prompt={output.prompt as string}
            negativePrompt={output.negativePrompt as string | null}
            disabled={!isLast || isStreaming}
            onRegenerate={(p, np) => onSendMessage?.(`请直接使用以下提示词重新生成吉祥物：\n\nprompt: ${p}${np ? `\nnegativePrompt: ${np}` : ''}`)}
            title={toolName === 'retextureMascot' ? '纹理重生成提示词' : '吉祥物生成提示词'}
          />
        )}
        <ModelPreview taskId={output.taskId as string} />
      </>
    )
  }
}
```

### 4. 重新生成交互流程

走对话流，保持历史完整：

1. 用户编辑 prompt 后点击「重新生成」
2. 自动发送结构化用户消息：`"请直接使用以下提示词重新生成吉祥物：\n\nprompt: ...\nnegativePrompt: ..."`
3. AI 识别为明确的重生请求，直接调用 `generateMascot`，不再讨论
4. 新 ModelPreview 出现，开始轮询

**约束：**
- 模型生成中（pendingTaskId 存在）时「重新生成」按钮 disabled
- 只有最后一条消息的 PromptCard 可操作（`isLast && !isStreaming`）

### 5. 涉及文件

| 文件 | 改动 |
|------|------|
| `app/api/chat/route.ts` | generateMascot / retextureMascot 返回值加 prompt |
| `components/chat/prompt-card.tsx` | 新建 PromptCard 组件 |
| `components/chat/chat-message.tsx` | 路由渲染加 PromptCard，合并 generateMascot/retextureMascot 分支 |
