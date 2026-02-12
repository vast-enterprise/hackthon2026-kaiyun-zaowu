'use client'

import { Button } from '@/components/ui/button'

interface OptionItem {
  label: string
  description?: string
}

interface OptionsButtonsProps {
  options: OptionItem[]
  onSelect: (label: string) => void
  disabled?: boolean
}

export function OptionsButtons({ options, onSelect, disabled }: OptionsButtonsProps) {
  return (
    <div data-slot="options-buttons" className="flex flex-wrap gap-2 py-2">
      {options.map(option => (
        <Button
          key={option.label}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(option.label)}
          title={option.description}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
