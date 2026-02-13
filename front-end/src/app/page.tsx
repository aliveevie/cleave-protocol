"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { PoolStats } from "@/components/pool-stats"
import { PositionCard } from "@/components/position-card"
import { YieldCalculator } from "@/components/yield-calculator"
import { useWallet } from "@/components/providers/wallet-provider"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { isConnected } = useWallet()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">
            Cleave Your <span className="text-primary">Bitcoin Yield</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Split sBTC into principal and yield tokens. Trade, hold, or redeem at maturity on Bitcoin&apos;s most secure smart contract layer.
          </p>
          {!isConnected && (
            <Button variant="outline" className="mt-4 border-primary text-primary hover:bg-primary/10" asChild>
              <Link href="#connect">Connect wallet to start earning</Link>
            </Button>
          )}
        </div>

        {/* Stats — always visible */}
        <PoolStats />

        {/* Yield Estimator — always visible */}
        <YieldCalculator />

        {/* Position + actions — only when connected */}
        {isConnected && (
          <>
            <PositionCard />
            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link href="/split">Split sBTC</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/redeem">Redeem</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
