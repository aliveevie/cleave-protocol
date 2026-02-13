"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserPosition, usePoolInfo } from "@/hooks/usePoolData"
import { useWallet } from "@/components/providers/wallet-provider"
import { formatSbtc } from "@/lib/cleave-utils"

export function PositionCard() {
  const { address } = useWallet()
  const { data: position, isLoading } = useUserPosition(address)
  const { data: pool } = usePoolInfo()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!position) return null

  const estimatedYield = pool
    ? (position.psbtcBalance * pool.yieldRate) / 10000
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Position</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">sBTC Balance</span>
          <span className="font-mono">{formatSbtc(position.sbtcBalance)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">psBTC</span>
          <span className="font-mono">{formatSbtc(position.psbtcBalance)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">ysBTC</span>
          <span className="font-mono">{formatSbtc(position.ysbtcBalance)}</span>
        </div>
        {estimatedYield > 0 && (
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground">Estimated Yield</span>
            <span className="font-mono text-primary">
              {formatSbtc(estimatedYield)} sBTC
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
