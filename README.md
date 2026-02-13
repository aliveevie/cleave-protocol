# Cleave Protocol

Bitcoin yield tokenization on Stacks. Cleave lets you split sBTC into two derivative tokens — **psBTC** (principal) and **ysBTC** (yield) — enabling fixed-rate yield strategies and principal protection on Bitcoin.

## How It Works

1. **Split** — Deposit sBTC into the Cleave vault and receive psBTC + ysBTC tokens representing your principal and future yield.
2. **Merge** — Recombine psBTC and ysBTC to redeem your original sBTC before maturity.
3. **Redeem** — After maturity, redeem psBTC for your principal and ysBTC for accrued yield.

## Contracts

| Contract | Description |
|---|---|
| `cleave-core` | Core protocol logic — split, merge, redeem, pool management |
| `psbtc-token` | SIP-010 fungible token representing principal |
| `ysbtc-token` | SIP-010 fungible token representing yield |
| `stacking-vault` | Vault that holds deposited sBTC |

## Prerequisites

- [Node.js 18+](https://nodejs.org)
- [pnpm](https://pnpm.io/installation)
- [Clarinet](https://docs.hiro.so/clarinet) (for local contract development)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (required for local devnet)

## Quick Start

```bash
pnpm install
cp front-end/.env.example front-end/.env
```

Start local devnet (requires Docker):

```bash
cd clarity && clarinet devnet start
```

Wait for contracts to deploy (watch for block ~45), then in a new terminal:

```bash
pnpm --filter front-end dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
cleave-protocol/
├── clarity/               # Clarity smart contracts
│   ├── contracts/         # Contract source files
│   │   ├── traits/        # SIP-010 trait definitions
│   │   ├── cleave-core.clar
│   │   ├── psbtc-token.clar
│   │   ├── ysbtc-token.clar
│   │   └── stacking-vault.clar
│   ├── deployments/       # Deployment plans (devnet/simnet)
│   └── tests/             # Contract unit tests
├── front-end/             # Next.js application
│   └── src/
│       ├── app/           # Pages — split, merge, redeem, faucet
│       ├── components/    # UI components
│       ├── constants/     # Contract addresses, network config
│       ├── hooks/         # React hooks for contract interactions
│       └── lib/           # Utilities and helpers
└── pnpm-workspace.yaml
```

## License

MIT
