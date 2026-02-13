(impl-trait .sip-010-trait.sip-010-trait)

(define-fungible-token psbtc)

(define-constant err-forbidden (err u403))

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) err-forbidden)
    (try! (ft-transfer? psbtc amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

(define-read-only (get-name)
  (ok "Cleave Principal sBTC")
)

(define-read-only (get-symbol)
  (ok "psBTC")
)

(define-read-only (get-decimals)
  (ok u8)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance psbtc account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply psbtc))
)

(define-read-only (get-token-uri)
  (ok none)
)

;; Mint - restricted to cleave-core
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq contract-caller .cleave-core) err-forbidden)
    (ft-mint? psbtc amount recipient)
  )
)

;; Burn - restricted to cleave-core
(define-public (burn (amount uint) (owner principal))
  (begin
    (asserts! (is-eq contract-caller .cleave-core) err-forbidden)
    (ft-burn? psbtc amount owner)
  )
)
