'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function OrderModal({
  open,
  onOpenChange,
  modelUrl: _modelUrl,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelUrl: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>下单打印</DialogTitle>
        </DialogHeader>
        {/* 下单表单 */}
      </DialogContent>
    </Dialog>
  )
}
