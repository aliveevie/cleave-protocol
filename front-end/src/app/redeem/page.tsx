"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AmountInput } from "@/components/amount-input"
import { TxStatus } from "@/components/tx-status"
import { MaturityCountdown } from "@/components/maturity-countdown"
import { useWallet } from "@/components/providers/wallet-provider"
import { useUserPosition, usePoolInfo, useIsMatured } from "@/hooks/usePoolData"
import { useRedeemPrincipal, useRedeemYield } from "@/hooks/useCleave"
import { formatSbtc, parseSbtcInput } from "@/lib/cleave-utils"
import { ConnectButton } from "@/components/wallet/connect-button"
import { Loader2 } from "lucide-react"

export default function RedeemPage() {
  const [principalInput, setPrincipalInput] = useState("")
  const [yieldInput, setYieldInput] = useState("")
  const [lastTxId, setLastTxId] = useState<string | null>(null)
  const { isConnected, address } = useWallet()
  const { data: position } = useUserPosition(address)
  const { data: pool } = usePoolInfo()
  const { data: isMatured } = useIsMatured()
  const redeemPrincipalMutation = useRedeemPrincipal()
  const redeemYieldMutation = useRedeemYield()

  const principalAmount = parseSbtcInput(principalInput)
  const yieldAmount = parseSbtcInput(yieldInput)
  const psbtcBalance = position?.psbtcBalance ?? 0
  const ysbtcBalance = position?.ysbtcBalance ?? 0
  const yieldRate = pool?.yieldRate ?? 0
  const calculatedYield = Math.floor((yieldAmount * yieldRate) / 10000)

  const handleRedeemPrincipal = () => {
    if (principalAmount <= 0) return
    redeemPrincipalMutation.mutate(principalAmount, {
      onSuccess: (data) => setLastTxId(data.txid),
    })
  }

  const handleRedeemYield = () => {
    if (yieldAmount <= 0) return
    redeemYieldMutation.mutate(yieldAmount, {
      onSuccess: (data) => setLastTxId(data.txid),
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Redeem</h1>
          <MaturityCountdown />
        </div>

        {!isConnected ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to redeem tokens
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6 relative">
              {/* Redeem Principal */}
              <Card className={!isMatured ? "opacity-50 pointer-events-none" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">Redeem Principal</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Burn psBTC to receive sBTC 1:1
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AmountInput
                    value={principalInput}
                    onChange={setPrincipalInput}
                    maxAmount={psbtcBalance}
                    label="psBTC Amount"
                    symbol="psBTC"
                  />

                  {principalAmount > 0 && (
                    <div className="p-3 rounded-md bg-muted">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">sBTC received</span>
                        <span className="font-mono">{formatSbtc(principalAmount)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleRedeemPrincipal}
                    disabled={
                      principalAmount <= 0 ||
                      !isMatured ||
                      redeemPrincipalMutation.isPending
                    }
                    className="w-full"
                  >
                    {redeemPrincipalMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Redeeming...
                      </>
                    ) : (
                      "Redeem Principal"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Redeem Yield */}
              <Card className={!isMatured ? "opacity-50 pointer-events-none" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">Redeem Yield</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Burn ysBTC to receive accumulated yield
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AmountInput
                    value={yieldInput}
                    onChange={setYieldInput}
                    maxAmount={ysbtcBalance}
                    label="ysBTC Amount"
                    symbol="ysBTC"
                  />

                  {yieldAmount > 0 && (
                    <div className="p-3 rounded-md bg-muted space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Yield rate</span>
                        <span className="font-mono">
                          {(yieldRate / 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">sBTC received</span>
                        <span className="font-mono text-primary">
                          {formatSbtc(calculatedYield)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleRedeemYield}
                    disabled={
                      yieldAmount <= 0 ||
                      !isMatured ||
                      redeemYieldMutation.isPending
                    }
                    className="w-full"
                  >
                    {redeemYieldMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Redeeming...
                      </>
                    ) : (
                      "Redeem Yield"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Not matured overlay hint */}
              {!isMatured && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg px-6 py-3 border">
                    <p className="text-sm font-medium">
                      Redemption available after maturity
                    </p>
                  </div>
                </div>
              )}
            </div>

            <TxStatus txId={lastTxId} />
          </>
        )}
      </main>
    </div>
  )
}
