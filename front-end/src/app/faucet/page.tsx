"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/components/providers/wallet-provider"
import { ConnectButton } from "@/components/wallet/connect-button"
import { toast } from "sonner"
import { Loader2, Droplets, Coins, Settings, Zap } from "lucide-react"
import { SBTC_TOKEN_CONTRACT, CLEAVE_CORE_CONTRACT } from "@/constants/contracts"
import { devnetWallets } from "@/lib/devnet-wallet-context"
import { generateWallet } from "@stacks/wallet-sdk"
import {
  makeSTXTokenTransfer,
  makeContractCall,
  broadcastTransaction,
  PostConditionMode,
  Cl,
  AnchorMode,
} from "@stacks/transactions"
import { DEVNET_NETWORK } from "@/constants/devnet"
import { usePoolInfo } from "@/hooks/usePoolData"
import { useQueryClient } from "@tanstack/react-query"

const STX_DRIP_AMOUNT = 500_000_000n // 500 STX in microSTX
const SBTC_DRIP_AMOUNT = 100_000_000 // 1 sBTC in sats
const POOL_MATURITY_OFFSET = 500 // blocks from now
const YIELD_RESERVE_AMOUNT = 500_000_000 // 5 sBTC for yield reserve

export default function FaucetPage() {
  const { isConnected, address, isDevnet } = useWallet()
  const [stxLoading, setStxLoading] = useState(false)
  const [sbtcLoading, setSbtcLoading] = useState(false)
  const [poolLoading, setPoolLoading] = useState(false)
  const { data: poolInfo } = usePoolInfo()
  const queryClient = useQueryClient()

  const getDeployerKey = async () => {
    const deployer = devnetWallets[0]
    const wallet = await generateWallet({
      secretKey: deployer.mnemonic,
      password: "password",
    })
    return wallet.accounts[0].stxPrivateKey
  }

  const requestStx = async () => {
    if (!address) return
    setStxLoading(true)
    try {
      const senderKey = await getDeployerKey()

      const transaction = await makeSTXTokenTransfer({
        recipient: address,
        amount: STX_DRIP_AMOUNT,
        senderKey,
        network: DEVNET_NETWORK,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      })

      const response = await broadcastTransaction({
        transaction,
        network: DEVNET_NETWORK,
      })

      if ("error" in response) {
        throw new Error(response.error || "Broadcast failed")
      }

      toast.success("500 STX sent!", {
        description: `TX: ${response.txid.slice(0, 12)}...`,
      })
    } catch (error) {
      toast.error("STX transfer failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setStxLoading(false)
    }
  }

  const requestSbtc = async () => {
    if (!address) return
    setSbtcLoading(true)
    try {
      const deployer = devnetWallets[0]
      const senderKey = await getDeployerKey()

      const transaction = await makeContractCall({
        contractAddress: SBTC_TOKEN_CONTRACT.address,
        contractName: SBTC_TOKEN_CONTRACT.name,
        functionName: "transfer",
        functionArgs: [
          Cl.uint(SBTC_DRIP_AMOUNT),
          Cl.principal(deployer.stxAddress),
          Cl.principal(address),
          Cl.none(),
        ],
        network: DEVNET_NETWORK,
        senderKey,
        postConditionMode: PostConditionMode.Allow,
        fee: 1000,
      })

      const response = await broadcastTransaction({
        transaction,
        network: DEVNET_NETWORK,
      })

      if ("error" in response) {
        const errMsg = response.error || "Broadcast failed"
        if (typeof errMsg === "string" && errMsg.includes("NoSuchContract")) {
          throw new Error("sBTC contract not deployed. Restart devnet to deploy.")
        }
        throw new Error(errMsg)
      }

      toast.success("1 sBTC sent!", {
        description: `TX: ${response.txid.slice(0, 12)}...`,
      })
      queryClient.invalidateQueries({ queryKey: ["userPosition"] })
    } catch (error) {
      toast.error("sBTC transfer failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setSbtcLoading(false)
    }
  }

  const initializePool = async () => {
    setPoolLoading(true)
    try {
      const senderKey = await getDeployerKey()
      const deployer = devnetWallets[0]

      // Get current block height
      const infoRes = await fetch("http://localhost:3999/v2/info")
      const info = await infoRes.json()
      const currentHeight = info.stacks_tip_height
      const maturityBlock = currentHeight + POOL_MATURITY_OFFSET

      // 1. Activate pool
      const activateTx = await makeContractCall({
        contractAddress: CLEAVE_CORE_CONTRACT.address || "",
        contractName: CLEAVE_CORE_CONTRACT.name,
        functionName: "activate-pool",
        functionArgs: [],
        network: DEVNET_NETWORK,
        senderKey,
        postConditionMode: PostConditionMode.Allow,
        fee: 1000,
      })
      const activateRes = await broadcastTransaction({ transaction: activateTx, network: DEVNET_NETWORK })
      if ("error" in activateRes) throw new Error(activateRes.error || "activate-pool failed")
      toast.success("Pool activated!", { description: `TX: ${activateRes.txid.slice(0, 12)}...` })

      // Wait a moment for nonce to update
      await new Promise(r => setTimeout(r, 1000))

      // 2. Set maturity block
      const maturityTx = await makeContractCall({
        contractAddress: CLEAVE_CORE_CONTRACT.address || "",
        contractName: CLEAVE_CORE_CONTRACT.name,
        functionName: "set-maturity",
        functionArgs: [Cl.uint(maturityBlock)],
        network: DEVNET_NETWORK,
        senderKey,
        postConditionMode: PostConditionMode.Allow,
        fee: 1000,
      })
      const maturityRes = await broadcastTransaction({ transaction: maturityTx, network: DEVNET_NETWORK })
      if ("error" in maturityRes) throw new Error(maturityRes.error || "set-maturity failed")
      toast.success(`Maturity set to block ${maturityBlock}`, { description: `TX: ${maturityRes.txid.slice(0, 12)}...` })

      await new Promise(r => setTimeout(r, 1000))

      // 3. Fund yield reserve
      const fundTx = await makeContractCall({
        contractAddress: CLEAVE_CORE_CONTRACT.address || "",
        contractName: CLEAVE_CORE_CONTRACT.name,
        functionName: "fund-yield-reserve",
        functionArgs: [Cl.uint(YIELD_RESERVE_AMOUNT)],
        network: DEVNET_NETWORK,
        senderKey,
        postConditionMode: PostConditionMode.Allow,
        fee: 1000,
      })
      const fundRes = await broadcastTransaction({ transaction: fundTx, network: DEVNET_NETWORK })
      if ("error" in fundRes) throw new Error(fundRes.error || "fund-yield-reserve failed")
      toast.success("Yield reserve funded with 5 sBTC!", { description: `TX: ${fundRes.txid.slice(0, 12)}...` })

      queryClient.invalidateQueries({ queryKey: ["poolInfo"] })
      queryClient.invalidateQueries({ queryKey: ["isMatured"] })
      queryClient.invalidateQueries({ queryKey: ["timeToMaturity"] })
    } catch (error) {
      toast.error("Pool initialization failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setPoolLoading(false)
    }
  }

  if (!isDevnet) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8 max-w-lg mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold">Faucet</h1>
          <p className="text-muted-foreground">
            The faucet is only available on devnet.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8 max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Devnet Faucet</h1>
          <p className="text-sm text-muted-foreground">
            Get test STX and sBTC tokens for development
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to request tokens
                </p>
                <ConnectButton />
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  Receiving address: {address}
                </p>

                <div className="grid gap-3">
                  {/* STX Faucet */}
                  <button
                    onClick={requestStx}
                    disabled={stxLoading}
                    className="flex items-center gap-4 w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent hover:border-primary/50 disabled:opacity-50"
                  >
                    <div className="rounded-lg bg-orange-500/10 p-3 shrink-0">
                      <Coins className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Get STX</p>
                      <p className="text-sm text-muted-foreground">
                        Receive 500 STX from the deployer wallet
                      </p>
                    </div>
                    {stxLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </button>

                  {/* sBTC Faucet */}
                  <button
                    onClick={requestSbtc}
                    disabled={sbtcLoading}
                    className="flex items-center gap-4 w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent hover:border-primary/50 disabled:opacity-50"
                  >
                    <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                      <Droplets className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Get sBTC</p>
                      <p className="text-sm text-muted-foreground">
                        Receive 1 sBTC from the deployer wallet
                      </p>
                    </div>
                    {sbtcLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground text-center pt-2">
                  Tokens are for local devnet testing only. No real value.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pool Initialization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Pool Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Status</p>
                <p className={`font-semibold ${poolInfo?.poolActive ? "text-green-500" : "text-yellow-500"}`}>
                  {poolInfo?.poolActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Yield Rate</p>
                <p className="font-semibold">{poolInfo ? `${poolInfo.yieldRate / 100}%` : "—"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Maturity Block</p>
                <p className="font-semibold">{poolInfo?.maturityBlock || "—"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Yield Reserve</p>
                <p className="font-semibold">{poolInfo ? `${(poolInfo.yieldReserve / 1e8).toFixed(2)} sBTC` : "—"}</p>
              </div>
            </div>

            {!poolInfo?.poolActive && (
              <button
                onClick={initializePool}
                disabled={poolLoading}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground p-3 font-semibold transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {poolLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
                {poolLoading ? "Initializing..." : "Initialize Pool"}
              </button>
            )}

            {poolInfo?.poolActive && (
              <p className="text-xs text-green-500/80 text-center">
                Pool is active and ready for deposits.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
