import { devnetWallets } from "@/lib/devnet-wallet-context";

const DEPLOYER_ADDRESS =
  process.env.NEXT_PUBLIC_STACKS_NETWORK === "devnet"
    ? devnetWallets[0].stxAddress
    : process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
    ? process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER_TESTNET_ADDRESS
    : process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER_MAINNET_ADDRESS;

export const CLEAVE_CORE_CONTRACT = {
  address: DEPLOYER_ADDRESS,
  name: "cleave-core",
} as const;

export const PSBTC_TOKEN_CONTRACT = {
  address: DEPLOYER_ADDRESS,
  name: "psbtc-token",
} as const;

export const YSBTC_TOKEN_CONTRACT = {
  address: DEPLOYER_ADDRESS,
  name: "ysbtc-token",
} as const;

export const SBTC_TOKEN_CONTRACT = {
  address:
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "devnet"
      ? devnetWallets[0].stxAddress
      : "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4",
  name: "sbtc-token",
} as const;
