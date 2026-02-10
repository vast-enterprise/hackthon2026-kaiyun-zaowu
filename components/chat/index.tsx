'use client'

export function Chat({ onModelReady: _onModelReady }: { onModelReady: (modelUrl: string) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* 消息列表 */}
      </div>
      <div className="border-t p-4">
        {/* 输入框 */}
      </div>
    </div>
  )
}
