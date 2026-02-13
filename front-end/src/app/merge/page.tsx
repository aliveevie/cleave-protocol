"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AmountInput } from "@/components/amount-input"
import { TxStatus } from "@/components/tx-status"
import { useWallet } from "@/components/providers/wallet-provider"
import { useUserPosition } from "@/hooks/usePoolData"
import { useMergeTokens } from "@/hooks/useCleave"
import { formatSbtc, parseSbtcInput } from "@/lib/cleave-utils"
import { ConnectButton } from "@/components/wallet/connect-button"
import { Loader2 } from "lucide-react"

export default function MergePage() {
  const [inputValue, setInputValue] = useState("")
  const [lastTxId, setLastTxId] = useState<string | null>(null)
  const { isConnected, address } = useWallet()
  const { data: position } = useUserPosition(address)
  const mergeMutation = useMergeTokens()

  const amountSats = parseSbtcInput(inputValue)
  const psbtcBalance = position?.psbtcBalance ?? 0
  const ysbtcBalance = position?.ysbtcBalance ?? 0
  const maxMerge = Math.min(psbtcBalance, ysbtcBalance)

  const handleMerge = () => {
    if (amountSats <= 0) return
    mergeMutation.mutate(amountSats, {
      onSuccess: (data) => setLastTxId(data.txid),
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Merge Tokens</h1>
          <p className="text-sm text-muted-foreground">
            Burn psBTC + ysBTC to recover your original sBTC (before maturity)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Merge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected ? (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to merge tokens
                </p>
                <ConnectButton />
              </div>
            ) : (
              <>
                <div className="space-y-1 p-3 rounded-md bg-muted text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">psBTC Balance</span>
                    <span className="font-mono">{formatSbtc(psbtcBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ysBTC Balance</span>
                    <span className="font-mono">{formatSbtc(ysbtcBalance)}</span>
                  </div>
                </div>

                <AmountInput
                  value={inputValue}
                  onChange={setInputValue}
                  maxAmount={maxMerge}
                  label="Amount to Merge"
                  symbol="tokens"
                />

                {amountSats > 0 && (
                  <div className="space-y-2 p-3 rounded-md bg-muted">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      You will receive
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">sBTC</span>
                      <span className="font-mono">{formatSbtc(amountSats)}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleMerge}
                  disabled={amountSats <= 0 || mergeMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {mergeMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Merging...
                    </>
                  ) : (
                    "Merge"
                  )}
                </Button>

                <TxStatus txId={lastTxId} />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
