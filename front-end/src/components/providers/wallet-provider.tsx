"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { connect, disconnect, isConnected, getLocalStorage } from "@stacks/connect"
import { DevnetWallet } from "@/lib/devnet-wallet-context"
import { NetworkType } from "@/lib/networks"

interface WalletContextType {
  // Connection state
  isConnected: boolean
  isConnecting: boolean

  // User data
  address: string | null
  network: NetworkType

  // Actions
  connectWallet: () => Promise<void>
  disconnectWallet: () => void

  // Devnet specific
  isDevnet: boolean
  devnetWallet: DevnetWallet | null
  setDevnetWallet: (wallet: DevnetWallet | null) => void
}

const WalletContext = createContext<WalletContextType | null>(null)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const network = (process.env.NEXT_PUBLIC_STACKS_NETWORK || "devnet") as NetworkType
  const isDevnet = network === "devnet"

  // State
  const [mounted, setMounted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [leatherConnected, setLeatherConnected] = useState(false)
  const [devnetWallet, setDevnetWallet] = useState<DevnetWallet | null>(null)

  // Mount effect - check for existing Leather connection
  useEffect(() => {
    setMounted(true)
    setLeatherConnected(isConnected())
  }, [])

  // Browser wallet connection (works on any network including devnet)
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true)
      await connect()
      setLeatherConnected(isConnected())
      // If connected via browser wallet, clear any devnet wallet selection
      if (isConnected()) {
        setDevnetWallet(null)
      }
    } catch (error) {
      console.error("Wallet connection failed:", error)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    if (devnetWallet) {
      setDevnetWallet(null)
    }
    if (leatherConnected) {
      disconnect()
      setLeatherConnected(false)
    }
  }, [devnetWallet, leatherConnected])

  // Handle devnet wallet selection — clears browser wallet state
  const handleSetDevnetWallet = useCallback((wallet: DevnetWallet | null) => {
    if (wallet && leatherConnected) {
      disconnect()
      setLeatherConnected(false)
    }
    setDevnetWallet(wallet)
  }, [leatherConnected])

  // Compute current address
  const address = useMemo(() => {
    if (!mounted) return null

    // Devnet test wallet takes priority if selected
    if (devnetWallet) {
      return devnetWallet.stxAddress
    }

    // Browser wallet
    if (leatherConnected) {
      const data = getLocalStorage()
      const stxAddresses = data?.addresses?.stx || []
      return stxAddresses.length > 0 ? stxAddresses[0].address : null
    }

    return null
  }, [mounted, devnetWallet, leatherConnected])

  // Compute connection state
  const isConnectedValue = useMemo(() => {
    if (!mounted) return false
    return devnetWallet !== null || leatherConnected
  }, [mounted, devnetWallet, leatherConnected])

  const contextValue = useMemo<WalletContextType>(
    () => ({
      isConnected: isConnectedValue,
      isConnecting,
      address,
      network,
      connectWallet,
      disconnectWallet,
      isDevnet,
      devnetWallet,
      setDevnetWallet: handleSetDevnetWallet,
    }),
    [
      isConnectedValue,
      isConnecting,
      address,
      network,
      connectWallet,
      disconnectWallet,
      isDevnet,
      devnetWallet,
      handleSetDevnetWallet,
    ]
  )

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
