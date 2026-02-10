'use client'

import { OrbitControls, Stage } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

export function ModelViewer({ modelUrl: _modelUrl }: { modelUrl: string }) {
  return (
    <div className="h-full w-full">
      <Canvas>
        <Stage>
          {/* GLB 模型加载 */}
        </Stage>
        <OrbitControls />
      </Canvas>
    </div>
  )
}
