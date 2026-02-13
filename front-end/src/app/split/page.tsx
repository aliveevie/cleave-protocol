"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AmountInput } from "@/components/amount-input"
import { TxStatus } from "@/components/tx-status"
import { useWallet } from "@/components/providers/wallet-provider"
import { useUserPosition } from "@/hooks/usePoolData"
import { useSplitSbtc } from "@/hooks/useCleave"
import { formatSbtc, parseSbtcInput } from "@/lib/cleave-utils"
import { ConnectButton } from "@/components/wallet/connect-button"
import { Loader2 } from "lucide-react"

export default function SplitPage() {
  const [inputValue, setInputValue] = useState("")
  const [lastTxId, setLastTxId] = useState<string | null>(null)
  const { isConnected, address } = useWallet()
  const { data: position } = useUserPosition(address)
  const splitMutation = useSplitSbtc()

  const amountSats = parseSbtcInput(inputValue)
  const sbtcBalance = position?.sbtcBalance ?? 0

  const handleSplit = () => {
    if (amountSats <= 0) return
    splitMutation.mutate(amountSats, {
      onSuccess: (data) => setLastTxId(data.txid),
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Split sBTC</h1>
          <p className="text-sm text-muted-foreground">
            Deposit sBTC to receive psBTC (principal) + ysBTC (yield) tokens
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deposit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected ? (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to split sBTC
                </p>
                <ConnectButton />
              </div>
            ) : (
              <>
                <AmountInput
                  value={inputValue}
                  onChange={setInputValue}
                  maxAmount={sbtcBalance}
                  label="sBTC Amount"
                  symbol="sBTC"
                />

                {amountSats > 0 && (
                  <div className="space-y-2 p-3 rounded-md bg-muted">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      You will receive
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">psBTC</span>
                      <span className="font-mono">{formatSbtc(amountSats)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ysBTC</span>
                      <span className="font-mono">{formatSbtc(amountSats)}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSplit}
                  disabled={amountSats <= 0 || splitMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {splitMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Splitting...
                    </>
                  ) : (
                    "Cleave"
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
