;; Stacking Vault
;; Holds STX for PoX stacking to earn BTC rewards that fund the yield reserve

;; --- Constants ---
(define-constant vault-owner tx-sender)
(define-constant err-not-authorized (err u401))
(define-constant err-invalid-amount (err u101))

;; --- Data Variables ---
(define-data-var stx-locked uint u0)
(define-data-var btc-reward-address { version: (buff 1), hashbytes: (buff 32) }
  { version: 0x04, hashbytes: 0x0000000000000000000000000000000000000000000000000000000000000000 }
)

;; Transfer context var
(define-data-var xfer-stx-amount uint u0)

;; --- Private Helpers ---
(define-private (check-owner)
  (ok (asserts! (is-eq tx-sender vault-owner) err-not-authorized))
)

(define-private (get-self)
  (as-contract? () tx-sender)
)

(define-private (send-stx-to-owner)
  (as-contract? ((with-all-assets-unsafe))
    (try! (stx-transfer? (var-get xfer-stx-amount) tx-sender vault-owner)))
)

;; --- Public Functions ---

;; Deposit STX into the vault
(define-public (deposit-stx (amount uint))
  (let
    (
      (self (try! (get-self)))
    )
    (asserts! (> amount u0) err-invalid-amount)
    (try! (stx-transfer? amount tx-sender self))
    (var-set stx-locked (+ (var-get stx-locked) amount))
    (ok amount)
  )
)

;; Withdraw unlocked STX (admin only)
(define-public (withdraw-stx (amount uint))
  (begin
    (try! (check-owner))
    (asserts! (> amount u0) err-invalid-amount)
    (var-set xfer-stx-amount amount)
    (try! (send-stx-to-owner))
    (var-set stx-locked (if (>= (var-get stx-locked) amount)
      (- (var-get stx-locked) amount)
      u0
    ))
    (ok amount)
  )
)

;; Set BTC reward address for PoX
(define-public (set-btc-address (version (buff 1)) (hashbytes (buff 32)))
  (begin
    (try! (check-owner))
    (var-set btc-reward-address { version: version, hashbytes: hashbytes })
    (ok true)
  )
)

;; --- Read-Only Functions ---
(define-read-only (get-vault-info)
  {
    stx-locked: (var-get stx-locked),
    btc-reward-address: (var-get btc-reward-address),
    vault-owner: vault-owner
  }
)

(define-read-only (get-stx-locked)
  (var-get stx-locked)
)

(define-read-only (get-btc-address)
  (var-get btc-reward-address)
)
