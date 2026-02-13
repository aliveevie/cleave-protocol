import { CLEAVE_CORE_CONTRACT } from "@/constants/contracts"
import { Cl, PostConditionMode } from "@stacks/transactions"

export function getSplitTxOptions(amount: number) {
  return {
    contractAddress: CLEAVE_CORE_CONTRACT.address || "",
    contractName: CLEAVE_CORE_CONTRACT.name,
    functionName: "split-sbtc",
    functionArgs: [Cl.uint(amount)],
    postConditionMode: PostConditionMode.Allow,
  }
}

export function getMergeTxOptions(amount: number) {
  return {
    contractAddress: CLEAVE_CORE_CONTRACT.address || "",
    contractName: CLEAVE_CORE_CONTRACT.name,
    functionName: "merge-tokens",
    functionArgs: [Cl.uint(amount)],
    postConditionMode: PostConditionMode.Allow,
  }
}

export function getRedeemPrincipalTxOptions(amount: number) {
  return {
    contractAddress: CLEAVE_CORE_CONTRACT.address || "",
    contractName: CLEAVE_CORE_CONTRACT.name,
    functionName: "redeem-principal",
    functionArgs: [Cl.uint(amount)],
    postConditionMode: PostConditionMode.Allow,
  }
}

export function getRedeemYieldTxOptions(amount: number) {
  return {
    contractAddress: CLEAVE_CORE_CONTRACT.address || "",
    contractName: CLEAVE_CORE_CONTRACT.name,
    functionName: "redeem-yield",
    functionArgs: [Cl.uint(amount)],
    postConditionMode: PostConditionMode.Allow,
  }
}

export function formatSbtc(sats: number): string {
  return (sats / 100_000_000).toFixed(8)
}

export function parseSbtcInput(value: string): number {
  const parsed = parseFloat(value)
  if (isNaN(parsed) || parsed < 0) return 0
  return Math.floor(parsed * 100_000_000)
}
