"use client"

import { useTransactionStatus } from "@/hooks/useTransactionStatus"
import { Loader2 } from "lucide-react"

interface TxStatusProps {
  txId: string | null
}

export function TxStatus({ txId }: TxStatusProps) {
  const { data: txStatus } = useTransactionStatus(txId)

  if (!txId) return null

  return (
    <div className="flex items-center gap-2 text-sm p-3 rounded-md bg-muted">
      {txStatus?.isConfirmed ? (
        <span className="text-green-500">Confirmed</span>
      ) : txStatus?.isFailed ? (
        <span className="text-destructive">Failed</span>
      ) : (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span className="text-muted-foreground">Transaction pending...</span>
        </>
      )}
      <span className="font-mono text-xs text-muted-foreground ml-auto">
        {txId.slice(0, 12)}...
      </span>
    </div>
  )
}
