"use client"

import { Layers, TrendingUp, Clock, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePoolInfo, useTimeToMaturity, useUserPosition } from "@/hooks/usePoolData"
import { useWallet } from "@/components/providers/wallet-provider"
import { formatSbtc } from "@/lib/cleave-utils"

const BLOCKS_PER_DAY = 144

export function PoolStats() {
  const { data: pool, isLoading } = usePoolInfo()
  const { data: blocksToMaturity } = useTimeToMaturity()
  const { address, isConnected } = useWallet()
  const { data: position } = useUserPosition(address)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const tvlSbtc = pool ? formatSbtc(pool.totalDeposited) : "0"
  const tvlUsd = pool ? `~$${((pool.totalDeposited / 1e8) * 100000).toLocaleString()}` : "~$0"
  const yieldPct = pool ? `${(pool.yieldRate / 100).toFixed(2)}%` : "0%"
  const daysRemaining = blocksToMaturity ? Math.ceil(blocksToMaturity / BLOCKS_PER_DAY) : 0
  const positionValue = isConnected && position
    ? `${formatSbtc(position.psbtcBalance)} psBTC`
    : null

  const stats = [
    {
      label: "TOTAL VALUE LOCKED",
      value: `${tvlSbtc} sBTC`,
      sub: tvlUsd,
      icon: Layers,
    },
    {
      label: "YIELD RATE",
      value: yieldPct,
      sub: "+0.5% this epoch",
      icon: TrendingUp,
    },
    {
      label: "MATURITY",
      value: blocksToMaturity === 0 ? "Matured" : `${blocksToMaturity} blocks`,
      sub: blocksToMaturity === 0 ? "Redeemable now" : `~${daysRemaining} days remaining`,
      icon: Clock,
    },
    {
      label: "YOUR POSITION",
      value: positionValue ?? "---",
      sub: isConnected ? (position ? `${formatSbtc(position.ysbtcBalance)} ysBTC` : "Loading...") : "Connect to view",
      icon: DollarSign,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.label}
            style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.1)" }}
          >
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-[11px] font-medium tracking-widest text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="rounded-md bg-primary/10 p-1.5">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
