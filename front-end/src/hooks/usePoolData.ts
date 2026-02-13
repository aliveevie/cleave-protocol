import { useQuery } from "@tanstack/react-query"
import { getStacksUrl } from "@/lib/stacks-api"
import { cvToJSON, hexToCV, Cl, serializeCV } from "@stacks/transactions"
import {
  CLEAVE_CORE_CONTRACT,
  PSBTC_TOKEN_CONTRACT,
  YSBTC_TOKEN_CONTRACT,
  SBTC_TOKEN_CONTRACT,
} from "@/constants/contracts"

interface ReadOnlyResponse {
  okay: boolean
  result?: string
  cause?: string
}

async function callReadOnly(
  contractAddress: string,
  contractName: string,
  functionName: string,
  sender: string,
  args: string[] = []
): Promise<ReadOnlyResponse> {
  const url = `${getStacksUrl()}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender, arguments: args }),
  })
  return response.json()
}

function parseReadOnlyResult(data: ReadOnlyResponse) {
  if (data?.okay && data?.result) {
    return cvToJSON(hexToCV(data.result))
  }
  return null
}

export interface PoolInfo {
  maturityBlock: number
  yieldRate: number
  totalDeposited: number
  poolActive: boolean
  yieldReserve: number
}

export function usePoolInfo() {
  return useQuery<PoolInfo>({
    queryKey: ["poolInfo"],
    queryFn: async () => {
      const data = await callReadOnly(
        CLEAVE_CORE_CONTRACT.address || "",
        CLEAVE_CORE_CONTRACT.name,
        "get-pool-info",
        CLEAVE_CORE_CONTRACT.address || ""
      )
      const result = parseReadOnlyResult(data)
      if (!result) throw new Error("Failed to fetch pool info")

      return {
        maturityBlock: parseInt(result.value["maturity-block"].value, 10),
        yieldRate: parseInt(result.value["yield-rate"].value, 10),
        totalDeposited: parseInt(result.value["total-deposited"].value, 10),
        poolActive: result.value["pool-active"].value,
        yieldReserve: parseInt(result.value["yield-reserve"].value, 10),
      }
    },
    refetchInterval: 10000,
    retry: 3,
  })
}

export interface UserPosition {
  deposited: number
  psbtcMinted: number
  ysbtcMinted: number
  depositBlock: number
  sbtcBalance: number
  psbtcBalance: number
  ysbtcBalance: number
}

export function useUserPosition(address: string | null) {
  return useQuery<UserPosition | null>({
    queryKey: ["userPosition", address],
    queryFn: async () => {
      if (!address) return null
      const sender = address
      const principalArg = `0x${serializeCV(Cl.principal(address))}`

      // Fetch all data in parallel
      const [positionData, sbtcData, psbtcData, ysbtcData] = await Promise.all([
        callReadOnly(
          CLEAVE_CORE_CONTRACT.address || "",
          CLEAVE_CORE_CONTRACT.name,
          "get-position",
          sender,
          [principalArg]
        ).catch(() => null),
        callReadOnly(
          SBTC_TOKEN_CONTRACT.address,
          SBTC_TOKEN_CONTRACT.name,
          "get-balance",
          sender,
          [principalArg]
        ).catch(() => null),
        callReadOnly(
          PSBTC_TOKEN_CONTRACT.address || "",
          PSBTC_TOKEN_CONTRACT.name,
          "get-balance",
          sender,
          [principalArg]
        ).catch(() => null),
        callReadOnly(
          YSBTC_TOKEN_CONTRACT.address || "",
          YSBTC_TOKEN_CONTRACT.name,
          "get-balance",
          sender,
          [principalArg]
        ).catch(() => null),
      ])

      const posResult = positionData ? parseReadOnlyResult(positionData) : null
      const sbtcResult = sbtcData ? parseReadOnlyResult(sbtcData) : null
      const psbtcResult = psbtcData ? parseReadOnlyResult(psbtcData) : null
      const ysbtcResult = ysbtcData ? parseReadOnlyResult(ysbtcData) : null

      const pos = posResult?.value
      return {
        deposited: pos?.deposited?.value ? parseInt(pos.deposited.value, 10) : 0,
        psbtcMinted: pos?.["psbtc-minted"]?.value ? parseInt(pos["psbtc-minted"].value, 10) : 0,
        ysbtcMinted: pos?.["ysbtc-minted"]?.value ? parseInt(pos["ysbtc-minted"].value, 10) : 0,
        depositBlock: pos?.["deposit-block"]?.value ? parseInt(pos["deposit-block"].value, 10) : 0,
        sbtcBalance: sbtcResult?.value ? parseInt(sbtcResult.value.value, 10) : 0,
        psbtcBalance: psbtcResult?.value ? parseInt(psbtcResult.value.value, 10) : 0,
        ysbtcBalance: ysbtcResult?.value ? parseInt(ysbtcResult.value.value, 10) : 0,
      }
    },
    enabled: !!address,
    refetchInterval: 10000,
  })
}

export function useIsMatured() {
  return useQuery<boolean>({
    queryKey: ["isMatured"],
    queryFn: async () => {
      const data = await callReadOnly(
        CLEAVE_CORE_CONTRACT.address || "",
        CLEAVE_CORE_CONTRACT.name,
        "is-matured",
        CLEAVE_CORE_CONTRACT.address || ""
      )
      const result = parseReadOnlyResult(data)
      return result?.value === true
    },
    refetchInterval: 10000,
  })
}

export function useTimeToMaturity() {
  return useQuery<number>({
    queryKey: ["timeToMaturity"],
    queryFn: async () => {
      const data = await callReadOnly(
        CLEAVE_CORE_CONTRACT.address || "",
        CLEAVE_CORE_CONTRACT.name,
        "get-time-to-maturity",
        CLEAVE_CORE_CONTRACT.address || ""
      )
      const result = parseReadOnlyResult(data)
      return result?.value ? parseInt(result.value, 10) : 0
    },
    refetchInterval: 10000,
  })
}
