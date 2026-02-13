;; Cleave Protocol Core
;; Bitcoin Yield Tokenization: split sBTC into psBTC (principal) + ysBTC (yield)

;; --- Constants ---
(define-constant contract-owner tx-sender)
(define-constant err-pool-inactive (err u100))
(define-constant err-invalid-amount (err u101))
(define-constant err-not-matured (err u200))
(define-constant err-insufficient-balance (err u300))
(define-constant err-not-authorized (err u401))
(define-constant err-vault-insufficient (err u500))

;; --- Data Variables ---
(define-data-var maturity-block uint u0)
(define-data-var yield-rate uint u500) ;; basis points (5%)
(define-data-var total-deposited uint u0)
(define-data-var pool-active bool false)
(define-data-var yield-reserve uint u0)

;; Transfer context vars (used to pass data into as-contract? body)
(define-data-var xfer-amount uint u0)
(define-data-var xfer-recipient principal contract-owner)

;; --- Maps ---
(define-map positions
  { user: principal }
  {
    deposited: uint,
    psbtc-minted: uint,
    ysbtc-minted: uint,
    deposit-block: uint
  }
)

;; --- Private Helpers ---
(define-private (check-owner)
  (ok (asserts! (is-eq tx-sender contract-owner) err-not-authorized))
)

;; Get this contract's own principal
(define-private (get-self)
  (as-contract? () tx-sender)
)

;; Send sBTC from contract to a recipient (set xfer-amount and xfer-recipient first)
(define-private (send-sbtc)
  (as-contract? ((with-all-assets-unsafe))
    (try! (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
      transfer (var-get xfer-amount) tx-sender (var-get xfer-recipient) none)))
)

;; --- Public Functions ---

;; Split sBTC into psBTC + ysBTC
(define-public (split-sbtc (amount uint))
  (let
    (
      (user tx-sender)
      (self (try! (get-self)))
      (existing (default-to { deposited: u0, psbtc-minted: u0, ysbtc-minted: u0, deposit-block: u0 } (map-get? positions { user: user })))
    )
    (asserts! (var-get pool-active) err-pool-inactive)
    (asserts! (> amount u0) err-invalid-amount)
    ;; Transfer sBTC from user to this contract
    (try! (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token transfer amount user self none))
    ;; Mint psBTC and ysBTC to user
    (try! (contract-call? .psbtc-token mint amount user))
    (try! (contract-call? .ysbtc-token mint amount user))
    ;; Update position
    (map-set positions { user: user }
      {
        deposited: (+ (get deposited existing) amount),
        psbtc-minted: (+ (get psbtc-minted existing) amount),
        ysbtc-minted: (+ (get ysbtc-minted existing) amount),
        deposit-block: stacks-block-height
      }
    )
    (var-set total-deposited (+ (var-get total-deposited) amount))
    (ok amount)
  )
)

;; Merge psBTC + ysBTC back into sBTC (before maturity)
(define-public (merge-tokens (amount uint))
  (let
    (
      (user tx-sender)
      (existing (unwrap! (map-get? positions { user: user }) err-insufficient-balance))
    )
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= (get psbtc-minted existing) amount) err-insufficient-balance)
    (asserts! (>= (get ysbtc-minted existing) amount) err-insufficient-balance)
    ;; Burn psBTC and ysBTC from user
    (try! (contract-call? .psbtc-token burn amount user))
    (try! (contract-call? .ysbtc-token burn amount user))
    ;; Return sBTC to user
    (var-set xfer-amount amount)
    (var-set xfer-recipient user)
    (try! (send-sbtc))
    ;; Update position
    (map-set positions { user: user }
      {
        deposited: (- (get deposited existing) amount),
        psbtc-minted: (- (get psbtc-minted existing) amount),
        ysbtc-minted: (- (get ysbtc-minted existing) amount),
        deposit-block: (get deposit-block existing)
      }
    )
    (var-set total-deposited (- (var-get total-deposited) amount))
    (ok amount)
  )
)

;; Redeem principal post-maturity: burn psBTC, get sBTC 1:1
(define-public (redeem-principal (amount uint))
  (let
    (
      (user tx-sender)
      (existing (unwrap! (map-get? positions { user: user }) err-insufficient-balance))
    )
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= stacks-block-height (var-get maturity-block)) err-not-matured)
    (asserts! (>= (get psbtc-minted existing) amount) err-insufficient-balance)
    ;; Burn psBTC
    (try! (contract-call? .psbtc-token burn amount user))
    ;; Return sBTC 1:1
    (var-set xfer-amount amount)
    (var-set xfer-recipient user)
    (try! (send-sbtc))
    ;; Update position
    (map-set positions { user: user }
      (merge existing {
        deposited: (- (get deposited existing) amount),
        psbtc-minted: (- (get psbtc-minted existing) amount)
      })
    )
    (var-set total-deposited (- (var-get total-deposited) amount))
    (ok amount)
  )
)

;; Redeem yield post-maturity: burn ysBTC, get yield from reserve
(define-public (redeem-yield (amount uint))
  (let
    (
      (user tx-sender)
      (existing (unwrap! (map-get? positions { user: user }) err-insufficient-balance))
      (yield-amount (/ (* amount (var-get yield-rate)) u10000))
    )
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= stacks-block-height (var-get maturity-block)) err-not-matured)
    (asserts! (>= (get ysbtc-minted existing) amount) err-insufficient-balance)
    (asserts! (>= (var-get yield-reserve) yield-amount) err-vault-insufficient)
    ;; Burn ysBTC
    (try! (contract-call? .ysbtc-token burn amount user))
    ;; Pay yield from reserve
    (var-set xfer-amount yield-amount)
    (var-set xfer-recipient user)
    (try! (send-sbtc))
    ;; Update state
    (var-set yield-reserve (- (var-get yield-reserve) yield-amount))
    (map-set positions { user: user }
      (merge existing {
        ysbtc-minted: (- (get ysbtc-minted existing) amount)
      })
    )
    (ok yield-amount)
  )
)

;; Admin: fund yield reserve with sBTC
(define-public (fund-yield-reserve (amount uint))
  (let
    (
      (self (try! (get-self)))
    )
    (asserts! (> amount u0) err-invalid-amount)
    (try! (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token transfer amount tx-sender self none))
    (var-set yield-reserve (+ (var-get yield-reserve) amount))
    (ok amount)
  )
)

;; --- Admin Functions ---
(define-public (set-maturity (block uint))
  (begin
    (try! (check-owner))
    (var-set maturity-block block)
    (ok block)
  )
)

(define-public (set-yield-rate (rate uint))
  (begin
    (try! (check-owner))
    (var-set yield-rate rate)
    (ok rate)
  )
)

(define-public (activate-pool)
  (begin
    (try! (check-owner))
    (var-set pool-active true)
    (ok true)
  )
)

(define-public (close-pool)
  (begin
    (try! (check-owner))
    (var-set pool-active false)
    (ok false)
  )
)

;; --- Read-Only Functions ---
(define-read-only (get-position (user principal))
  (map-get? positions { user: user })
)

(define-read-only (get-pool-info)
  {
    maturity-block: (var-get maturity-block),
    yield-rate: (var-get yield-rate),
    total-deposited: (var-get total-deposited),
    pool-active: (var-get pool-active),
    yield-reserve: (var-get yield-reserve),
    contract-owner: contract-owner
  }
)

(define-read-only (calculate-yield (amount uint))
  (/ (* amount (var-get yield-rate)) u10000)
)

(define-read-only (get-time-to-maturity)
  (let ((maturity (var-get maturity-block)))
    (if (>= stacks-block-height maturity)
      u0
      (- maturity stacks-block-height)
    )
  )
)

(define-read-only (is-matured)
  (>= stacks-block-height (var-get maturity-block))
)
