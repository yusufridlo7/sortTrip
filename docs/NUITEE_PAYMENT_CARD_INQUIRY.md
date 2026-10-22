# Nuitee support inquiry — account card with Payment SDK

Submitted 2026-10-15 through official Request Assistance. Ticket LAS-3185, Billing / Medium / Open, production-onboarding context. Owner explicitly authorized sending and completed login; dashboard verified before submission. No card details, API keys, booking references or guest information included. Awaiting response.

Subject: Account-card liability and production activation with Payment SDK

Hello Nuitee Support,

We are preparing SortTrip for production and selected the WhiteLabel / Payment SDK commercial model, with Nuitee as Merchant of Record. Our integration uses `usePaymentSdk: true` at Prebook and `payment.method: TRANSACTION_ID` at Book. We do not use `ACC_CREDIT_CARD`, merchant-funded vouchers, or an account-card fallback.

Production onboarding nevertheless requires an account card and says that adding it authorizes Nuitee to charge bookings made using our API key. Before accepting that authorization, please clarify:

1. For ordinary Payment SDK bookings, is the traveller's payment the sole source of payment? Are an account card and wallet funding both mandatory for this specific model?
2. In what circumstances can our account card be charged despite using Payment SDK, including failed traveller payments, chargebacks, fraud, refunds, API misuse, or optional service fees? We understand that merchant-funded voucher discounts can charge the account card; please distinguish that from ordinary SDK bookings.
3. Can account-card-funded booking methods and automatic fallback charges be disabled for our production API key while leaving Payment SDK active? Are spending caps or per-charge approval available?
4. Please provide the exact current terms/card authorization applicable to this Nuitee Connect Payment SDK account, including who bears chargeback liability and whether the general pro.nuitee.com terms apply.

This is a clarification request only, not authorization to add a card, change payment methods, activate billing, or incur charges.

Thank you,
SortTrip
