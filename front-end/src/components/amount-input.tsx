"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatSbtc } from "@/lib/cleave-utils"

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  maxAmount: number
  label: string
  symbol: string
}

export function AmountInput({
  value,
  onChange,
  maxAmount,
  label,
  symbol,
}: AmountInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">
          Balance: {formatSbtc(maxAmount)} {symbol}
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="0.00000000"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step="0.00000001"
          min="0"
          className="font-mono"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(formatSbtc(maxAmount))}
          className="shrink-0"
        >
          MAX
        </Button>
      </div>
    </div>
  )
}
