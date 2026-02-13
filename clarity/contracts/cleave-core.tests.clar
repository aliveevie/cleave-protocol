;; Cleave Core Fuzz / Invariant Tests (Rendezvous)

;; Invariant: total-deposited matches psBTC supply
(define-read-only (invariant-deposits-consistent)
  (let
    (
      (pool-info (contract-call? .cleave-core get-pool-info))
      (psbtc-supply (unwrap-panic (contract-call? .psbtc-token get-total-supply)))
    )
    (is-eq (get total-deposited pool-info) psbtc-supply)
  )
)

;; Invariant: psBTC supply equals ysBTC supply
(define-read-only (invariant-token-supplies-equal)
  (let
    (
      (psbtc-supply (unwrap-panic (contract-call? .psbtc-token get-total-supply)))
      (ysbtc-supply (unwrap-panic (contract-call? .ysbtc-token get-total-supply)))
    )
    (is-eq psbtc-supply ysbtc-supply)
  )
)

;; Property: yield calculation is deterministic
(define-read-only (test-yield-calculation (amount uint))
  (let
    (
      (yield1 (contract-call? .cleave-core calculate-yield amount))
      (yield2 (contract-call? .cleave-core calculate-yield amount))
    )
    (is-eq yield1 yield2)
  )
)
