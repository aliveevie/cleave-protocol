"use client"

import { useTimeToMaturity, useIsMatured } from "@/hooks/usePoolData"
import { Badge } from "@/components/ui/badge"

export function MaturityCountdown() {
  const { data: blocksToMaturity } = useTimeToMaturity()
  const { data: isMatured } = useIsMatured()

  if (isMatured) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
        MATURED - Ready to Redeem
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">
        {blocksToMaturity ?? "..."} blocks to maturity
      </Badge>
    </div>
  )
}
