"use client"

import { useState } from "react"
import { Wallet, ExternalLink, TestTube } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useWallet } from "@/components/providers/wallet-provider"
import { devnetWallets } from "@/lib/devnet-wallet-context"
import { formatStxAddress } from "@/lib/address-utils"
import { cn } from "@/lib/utils"

export function WalletConnectDialog() {
  const [open, setOpen] = useState(false)
  const { isDevnet, isConnecting, connectWallet, setDevnetWallet } = useWallet()

  const handleBrowserConnect = async () => {
    await connectWallet()
    setOpen(false)
  }

  const handleDevnetSelect = (wallet: typeof devnetWallets[0]) => {
    setDevnetWallet(wallet)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">Connect Your Wallet</DialogTitle>
          <DialogDescription>
            Choose how you want to connect to the Stacks blockchain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Browser Wallet Connection */}
          <Button
            className="w-full h-auto py-4 flex items-start gap-4 justify-start"
            variant="outline"
            onClick={handleBrowserConnect}
            disabled={isConnecting}
          >
            <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
              <ExternalLink className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">
                {isConnecting ? "Connecting..." : "Connect Browser Wallet"}
              </p>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Leather, Xverse &amp; other Stacks wallets
              </p>
            </div>
          </Button>

          {/* Devnet Test Wallets */}
          {isDevnet && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground flex items-center gap-1">
                    <TestTube className="h-3 w-3" />
                    Devnet Test Wallets
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
                {devnetWallets.map((wallet) => (
                  <button
                    key={wallet.stxAddress}
                    onClick={() => handleDevnetSelect(wallet)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                      "hover:bg-accent hover:border-primary/50"
                    )}
                  >
                    <span className="text-sm font-medium">{wallet.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatStxAddress(wallet.stxAddress)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
