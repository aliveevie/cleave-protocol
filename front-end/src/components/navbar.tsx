"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Scissors, ArrowRightLeft, TrendingUp, Droplets } from "lucide-react"
import { useWallet } from "@/components/providers/wallet-provider"
import { ConnectButton } from "@/components/wallet/connect-button"
import { WalletDropdown } from "@/components/wallet/wallet-dropdown"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  devnetOnly?: boolean
}

const navLinks: NavLink[] = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/split", label: "Split", icon: Scissors },
  { href: "/merge", label: "Merge", icon: ArrowRightLeft },
  { href: "/redeem", label: "Redeem", icon: TrendingUp },
  { href: "/faucet", label: "Faucet", icon: Droplets, devnetOnly: true },
]

export function Navbar() {
  const { isConnected, isDevnet } = useWallet()
  const pathname = usePathname()

  const visibleLinks = navLinks.filter((link) => !link.devnetOnly || isDevnet)

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-wider">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              C
            </span>
            CLEA<span className="text-primary">V</span>E
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? <WalletDropdown /> : <ConnectButton />}
        </div>
      </div>
    </nav>
  )
}
