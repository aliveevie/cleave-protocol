"use client"

import { useState } from "react"
import { Calculator, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePoolInfo } from "@/hooks/usePoolData"
import { formatSbtc, parseSbtcInput } from "@/lib/cleave-utils"

export function YieldCalculator() {
  const [inputValue, setInputValue] = useState("")
  const { data: pool } = usePoolInfo()

  const amountSats = parseSbtcInput(inputValue)
  const yieldRate = pool?.yieldRate ?? 500
  const yieldAmount = Math.floor((amountSats * yieldRate) / 10000)

  return (
    <Card style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.1)" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Yield Estimator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Input */}
          <div className="w-full md:flex-1 space-y-2">
            <label className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Deposit Amount
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00000000"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                step="0.00000001"
                min="0"
                className="font-mono pr-16"
              />
              <Badge
                variant="secondary"
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                sBTC
              </Badge>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center rounded-full border p-2 text-muted-foreground shrink-0">
            <ArrowRight className="h-4 w-4" />
          </div>

          {/* Results */}
          <div className="w-full md:flex-1 rounded-md border bg-muted/30 divide-y">
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-muted-foreground">You Receive (Principal)</span>
              <span className="font-mono">{amountSats > 0 ? formatSbtc(amountSats) : "0.0"} psBTC</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-muted-foreground">You Receive (Yield)</span>
              <span className="font-mono">{amountSats > 0 ? formatSbtc(amountSats) : "0.0"} ysBTC</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-muted-foreground">Est. Yield at Maturity</span>
              <span className="font-mono text-primary font-medium">
                {amountSats > 0 ? formatSbtc(yieldAmount) : "0.0"} sBTC
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
