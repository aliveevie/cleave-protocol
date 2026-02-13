import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useWallet } from "@/components/providers/wallet-provider"
import { executeContractCall, openContractCall } from "@/lib/contract-utils"
import {
  getSplitTxOptions,
  getMergeTxOptions,
  getRedeemPrincipalTxOptions,
  getRedeemYieldTxOptions,
} from "@/lib/cleave-utils"
import { toast } from "sonner"

function useCleaveAction(
  label: string,
  getTxOptions: (amount: number) => ReturnType<typeof getSplitTxOptions>
) {
  const { isDevnet, devnetWallet, isConnected } = useWallet()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!isConnected) throw new Error("Wallet not connected")

      const txOptions = getTxOptions(amount)

      if (devnetWallet) {
        // Direct signing with devnet test wallet mnemonic
        return await executeContractCall(txOptions, devnetWallet)
      } else {
        // Browser wallet (Leather, Xverse) on any network
        const result = await openContractCall(txOptions)
        return { txid: result.txid || "" }
      }
    },
    onSuccess: (data) => {
      toast.success(`${label} submitted`, {
        description: `TX: ${data.txid.slice(0, 10)}...`,
      })
      queryClient.invalidateQueries({ queryKey: ["poolInfo"] })
      queryClient.invalidateQueries({ queryKey: ["userPosition"] })
      queryClient.invalidateQueries({ queryKey: ["isMatured"] })
      queryClient.invalidateQueries({ queryKey: ["timeToMaturity"] })
    },
    onError: (error: Error) => {
      toast.error(`${label} failed`, {
        description: error.message,
      })
    },
  })
}

export function useSplitSbtc() {
  return useCleaveAction("Split", getSplitTxOptions)
}

export function useMergeTokens() {
  return useCleaveAction("Merge", getMergeTxOptions)
}

export function useRedeemPrincipal() {
  return useCleaveAction("Redeem Principal", getRedeemPrincipalTxOptions)
}

export function useRedeemYield() {
  return useCleaveAction("Redeem Yield", getRedeemYieldTxOptions)
}
