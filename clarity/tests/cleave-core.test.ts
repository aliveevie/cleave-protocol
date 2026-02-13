import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";
import { initSimnet } from "@stacks/clarinet-sdk";

const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

const sbtcContract = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";

// Helper: activate pool and set maturity
function setupPool(maturityBlock: number = 100) {
  simnet.callPublicFn("cleave-core", "activate-pool", [], deployer);
  simnet.callPublicFn(
    "cleave-core",
    "set-maturity",
    [Cl.uint(maturityBlock)],
    deployer
  );
  simnet.callPublicFn(
    "cleave-core",
    "set-yield-rate",
    [Cl.uint(500)],
    deployer
  );
}

describe("cleave-core contract", () => {
  describe("pool administration", () => {
    it("deployer can activate pool", () => {
      const response = simnet.callPublicFn(
        "cleave-core",
        "activate-pool",
        [],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("deployer can set maturity block", () => {
      const response = simnet.callPublicFn(
        "cleave-core",
        "set-maturity",
        [Cl.uint(100)],
        deployer
      );
      expect(response.result).toBeOk(Cl.uint(100));
    });

    it("deployer can set yield rate", () => {
      const response = simnet.callPublicFn(
        "cleave-core",
        "set-yield-rate",
        [Cl.uint(500)],
        deployer
      );
      expect(response.result).toBeOk(Cl.uint(500));
    });

    it("non-deployer cannot activate pool (u401)", () => {
      const response = simnet.callPublicFn(
        "cleave-core",
        "activate-pool",
        [],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(401));
    });

    it("non-deployer cannot set maturity (u401)", () => {
      const response = simnet.callPublicFn(
        "cleave-core",
        "set-maturity",
        [Cl.uint(100)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(401));
    });

    it("get-pool-info returns correct state", () => {
      simnet.callPublicFn("cleave-core", "activate-pool", [], deployer);
      simnet.callPublicFn(
        "cleave-core",
        "set-maturity",
        [Cl.uint(200)],
        deployer
      );
      simnet.callPublicFn(
        "cleave-core",
        "set-yield-rate",
        [Cl.uint(750)],
        deployer
      );

      const response = simnet.callReadOnlyFn(
        "cleave-core",
        "get-pool-info",
        [],
        deployer
      );

      const result = response.result;
      expect(result.type).toBe(ClarityType.Tuple);
    });
  });

  describe("split-sbtc", () => {
    it("fails when pool is inactive (u100)", () => {
      const response = simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(1000000)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(100));
    });

    it("fails with zero amount (u101)", () => {
      setupPool();
      const response = simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(0)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(101));
    });

    it("splits sBTC into psBTC + ysBTC", () => {
      setupPool();
      const amount = 10000000; // 0.1 sBTC

      const response = simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(amount)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.uint(amount));

      // Verify psBTC balance
      const psbtcBalance = simnet.callReadOnlyFn(
        "psbtc-token",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(psbtcBalance.result).toBeOk(Cl.uint(amount));

      // Verify ysBTC balance
      const ysbtcBalance = simnet.callReadOnlyFn(
        "ysbtc-token",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(ysbtcBalance.result).toBeOk(Cl.uint(amount));

      // Verify position
      const position = simnet.callReadOnlyFn(
        "cleave-core",
        "get-position",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(position.result.type).toBe(ClarityType.OptionalSome);
    });
  });

  describe("merge-tokens", () => {
    it("merges psBTC + ysBTC back into sBTC", () => {
      setupPool();
      const amount = 10000000;

      // First split
      simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(amount)],
        wallet1
      );

      // Then merge
      const response = simnet.callPublicFn(
        "cleave-core",
        "merge-tokens",
        [Cl.uint(amount)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.uint(amount));

      // Verify psBTC balance is 0
      const psbtcBalance = simnet.callReadOnlyFn(
        "psbtc-token",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(psbtcBalance.result).toBeOk(Cl.uint(0));

      // Verify ysBTC balance is 0
      const ysbtcBalance = simnet.callReadOnlyFn(
        "ysbtc-token",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(ysbtcBalance.result).toBeOk(Cl.uint(0));
    });

    it("allows partial merge", () => {
      setupPool();
      const splitAmount = 10000000;
      const mergeAmount = 5000000;

      simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(splitAmount)],
        wallet1
      );

      const response = simnet.callPublicFn(
        "cleave-core",
        "merge-tokens",
        [Cl.uint(mergeAmount)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.uint(mergeAmount));

      // Remaining psBTC should be splitAmount - mergeAmount
      const psbtcBalance = simnet.callReadOnlyFn(
        "psbtc-token",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(psbtcBalance.result).toBeOk(Cl.uint(splitAmount - mergeAmount));
    });

    it("fails with no position (u300)", () => {
      setupPool();
      const response = simnet.callPublicFn(
        "cleave-core",
        "merge-tokens",
        [Cl.uint(1000000)],
        wallet2
      );
      expect(response.result).toBeErr(Cl.uint(300));
    });
  });

  describe("redeem-principal", () => {
    it("fails before maturity (u200)", () => {
      setupPool(99999);
      const amount = 10000000;

      simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(amount)],
        wallet1
      );

      const response = simnet.callPublicFn(
        "cleave-core",
        "redeem-principal",
        [Cl.uint(amount)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(200));
    });

    it("redeems principal 1:1 after maturity", () => {
      setupPool(2); // Set maturity to block 2 (low so we pass it quickly)

      const amount = 10000000;
      simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(amount)],
        wallet1
      );

      // Mine enough blocks to pass maturity
      simnet.mineEmptyBlocks(5);

      const response = simnet.callPublicFn(
        "cleave-core",
        "redeem-principal",
        [Cl.uint(amount)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.uint(amount));

      // psBTC should be burned
      const psbtcBalance = simnet.callReadOnlyFn(
        "psbtc-token",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(psbtcBalance.result).toBeOk(Cl.uint(0));
    });
  });

  describe("redeem-yield", () => {
    it("redeems yield after maturity with funded reserve", () => {
      setupPool(2);

      const splitAmount = 10000000; // 0.1 sBTC
      const yieldRate = 500; // 5%
      const expectedYield = (splitAmount * yieldRate) / 10000; // 500000

      // Split
      simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(splitAmount)],
        wallet1
      );

      // Fund yield reserve (deployer sends sBTC)
      simnet.callPublicFn(
        "cleave-core",
        "fund-yield-reserve",
        [Cl.uint(expectedYield)],
        deployer
      );

      // Mine past maturity
      simnet.mineEmptyBlocks(5);

      const response = simnet.callPublicFn(
        "cleave-core",
        "redeem-yield",
        [Cl.uint(splitAmount)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.uint(expectedYield));
    });

    it("fails when reserve is insufficient (u500)", () => {
      setupPool(2);

      const amount = 10000000;
      simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(amount)],
        wallet1
      );

      // Don't fund reserve
      simnet.mineEmptyBlocks(5);

      const response = simnet.callPublicFn(
        "cleave-core",
        "redeem-yield",
        [Cl.uint(amount)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(500));
    });
  });

  describe("multiple users", () => {
    it("tracks positions independently", () => {
      setupPool();
      const amount1 = 10000000;
      const amount2 = 20000000;

      simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(amount1)],
        wallet1
      );
      simnet.callPublicFn(
        "cleave-core",
        "split-sbtc",
        [Cl.uint(amount2)],
        wallet2
      );

      // Verify wallet1 position
      const pos1 = simnet.callReadOnlyFn(
        "cleave-core",
        "get-position",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(pos1.result.type).toBe(ClarityType.OptionalSome);

      // Verify wallet2 position
      const pos2 = simnet.callReadOnlyFn(
        "cleave-core",
        "get-position",
        [Cl.principal(wallet2)],
        wallet2
      );
      expect(pos2.result.type).toBe(ClarityType.OptionalSome);

      // Verify psBTC balances
      const balance1 = simnet.callReadOnlyFn(
        "psbtc-token",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance1.result).toBeOk(Cl.uint(amount1));

      const balance2 = simnet.callReadOnlyFn(
        "psbtc-token",
        "get-balance",
        [Cl.principal(wallet2)],
        wallet2
      );
      expect(balance2.result).toBeOk(Cl.uint(amount2));
    });
  });

  describe("read-only functions", () => {
    it("calculate-yield returns correct amount", () => {
      const response = simnet.callReadOnlyFn(
        "cleave-core",
        "calculate-yield",
        [Cl.uint(10000000)],
        deployer
      );
      // 10000000 * 500 / 10000 = 500000
      expect(response.result).toStrictEqual(Cl.uint(500000));
    });

    it("is-matured returns false before maturity", () => {
      simnet.callPublicFn(
        "cleave-core",
        "set-maturity",
        [Cl.uint(99999)],
        deployer
      );
      const response = simnet.callReadOnlyFn(
        "cleave-core",
        "is-matured",
        [],
        deployer
      );
      expect(response.result).toStrictEqual(Cl.bool(false));
    });
  });
});
