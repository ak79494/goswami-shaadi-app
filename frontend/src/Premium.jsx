import React, { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "./api";
import QRCode from "qrcode";

import "./premium.css";

const PLANS = [

  {

    key: "GOLD",

    name: "Gold",

    duration: "3 Months",

    months: 3,

    price: 700,

    tone: "gold",

    popular: false,

    badge: "STARTER",

    benefits: [

      "Send unlimited interests",

      "View contact details as per privacy",

      "Premium profile visibility",

      "Priority profile discovery",

      "Premium member badge"

    ]

  },

  {

    key: "DIAMOND",

    name: "Diamond",

    duration: "6 Months",

    months: 6,

    price: 1300,

    tone: "diamond",

    popular: true,

    badge: "MOST POPULAR",

    benefits: [

      "Everything in Gold",

      "Higher profile visibility",

      "Priority in match discovery",

      "Enhanced contact access",

      "Premium support"

    ]

  },

  {

    key: "PLATINUM_PLUS",

    name: "Platinum Plus",

    duration: "12 Months",

    months: 12,

    price: 2500,

    tone: "platinum",

    popular: false,

    badge: "BEST VALUE",

    benefits: [

      "Everything in Diamond",

      "Maximum profile visibility",

      "Priority recommendations",

      "Premium contact access",

      "12 months of premium benefits"

    ]

  }

];

const money = value =>

  new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0

  }).format(value);

function PremiumHeader({ status }) {

  const nav = useNavigate();

  return (

    <div className="premium-flow-topbar">

      <button className="premium-flow-back" onClick={() => nav(-1)}>

        ← Back

      </button>

      <div className="premium-flow-brand">

        <span className="premium-flow-brand-mark">G</span>

        <span>Goswami<span>Shaadi</span></span>

      </div>

      {status?.active ? (

        <div className="premium-active-mini">

          <span>✓</span> Premium Active

        </div>

      ) : (

        <div className="premium-secure-mini">🔒 Secure UPI Checkout</div>

      )}

    </div>

  );

}

function PlanCard({ plan, selected, onSelect }) {

  return (

    <button

      type="button"

      className={`premium-plan-card ${plan.tone} ${selected ? "selected" : ""}`}

      onClick={() => onSelect(plan)}

    >

      <div className="premium-plan-top">

        <span className="premium-plan-badge">{plan.badge}</span>

        {plan.popular && <span className="premium-plan-star">★</span>}

      </div>

      <div className="premium-plan-icon">

        {plan.tone === "gold" ? "✦" : plan.tone === "diamond" ? "◆" : "♛"}

      </div>

      <h3>{plan.name}</h3>

      <div className="premium-plan-duration">{plan.duration}</div>

      <div className="premium-plan-price">{money(plan.price)}</div>

      <div className="premium-plan-monthly">

        Approx. {money(Math.round(plan.price / plan.months))} / month

      </div>

      <div className="premium-plan-divider" />

      <div className="premium-plan-benefits">

        {plan.benefits.map((benefit, i) => (

          <span key={i}>✓ {benefit}</span>

        ))}

      </div>

      <span className="premium-plan-select">

        {selected ? "Selected ✓" : "Choose plan"}

      </span>

    </button>

  );

}

function OrderSummary({ plan, onClose, onProceed }) {

  return (

    <div className="premium-modal-backdrop" role="dialog" aria-modal="true">

      <div className="premium-summary-modal">

        <button className="premium-modal-close" onClick={onClose} aria-label="Close">

          ×

        </button>

        <div className="premium-summary-icon">♛</div>

        <div className="premium-summary-kicker">GOSWAMISHAADI PREMIUM</div>

        <h2>Order Summary</h2>

        <p className="premium-summary-subtitle">

          You are one step away from becoming a Premium Member.

        </p>

        <div className="premium-summary-line">

          <span>{plan.name} <small>({plan.duration})</small></span>

          <strong>{money(plan.price)}</strong>

        </div>

        <div className="premium-summary-line saving">

          <span>Premium member benefits</span>

          <strong>Included</strong>

        </div>

        <div className="premium-summary-rule" />

        <div className="premium-summary-total">

          <span>Total Amount</span>

          <strong>{money(plan.price)}</strong>

        </div>

        <div className="premium-summary-trust">

          <span>✓</span>

          <div>

            <strong>Fixed price</strong>

            <small>No extra charges added to your selected plan.</small>

          </div>

        </div>

        <button className="premium-proceed-btn" onClick={onProceed}>

          Proceed to Pay <span>→</span>

        </button>

        <div className="premium-payment-note">

          🔐 UPI payment • Google Pay • PhonePe

        </div>

      </div>

    </div>

  );

}

const UPI_PAYEE_NAME = "Goswami Shaadi";

function PaymentScreen({ plan, orderId, onBack, onSuccess }) {
  const [method, setMethod] = useState("GOOGLE_PAY");
  const [checking, setChecking] = useState(false);
  const [paymentState, setPaymentState] = useState("WAITING");
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  const upiId = "goswamiarun263@okicici";
  const amount = Number(plan.price || 0);
  const methodLabel = method === "GOOGLE_PAY" ? "Google Pay" : "PhonePe";

  // The amount is locked to the selected plan. It is NOT entered manually.
  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(UPI_PAYEE_NAME)}` +
    `&am=${encodeURIComponent(amount)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(`GoswamiShaadi ${plan.name} Premium`)}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(upiUrl, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M"
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });

    return () => { cancelled = true; };
  }, [upiUrl]);

  const checkPaymentStatus = async () => {
    try {
      const response = await api.get(`/premium/orders/${orderId}/status`);
      const data = response.data || {};
      const status = String(data.status || "").toUpperCase();

      if (["SUCCESS", "PAID", "COMPLETED", "ACTIVE"].includes(status) || data.paid === true) {
        setPaymentState("SUCCESS");
        onSuccess(data);
        return true;
      }

      if (["FAILED", "CANCELLED", "EXPIRED"].includes(status)) {
        setPaymentState("FAILED");
        setError(data.message || "Payment was not successful. Please try again.");
        return true;
      }

      setPaymentState("WAITING");
      return false;
    } catch (err) {
      // Keep polling; a temporary network error must not mark a real payment as failed.
      return false;
    }
  };

  useEffect(() => {
    if (!orderId) return undefined;

    let stopped = false;
    let timer;

    const poll = async () => {
      if (stopped) return;
      const finished = await checkPaymentStatus();
      if (!finished && !stopped) {
        timer = window.setTimeout(poll, 3000);
      }
    };

    poll();
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderId]);

  const openUpi = () => {
    setChecking(true);
    setPaymentState("WAITING");
    setError("");
    window.location.href = upiUrl;
  };

  const retryCheck = async () => {
    setChecking(true);
    setError("");
    const finished = await checkPaymentStatus();
    if (!finished) setError("Payment is still being verified. Please wait a moment.");
    setChecking(false);
  };

  return (
    <div className="premium-payment-page">
      <div className="premium-payment-progress">
        <span className="done">1 <b>Plan</b></span>
        <i />
        <span className="done">2 <b>Order</b></span>
        <i />
        <span className="active">3 <b>Pay</b></span>
        <i />
        <span className={paymentState === "SUCCESS" ? "done" : ""}>4 <b>Complete</b></span>
      </div>

      <div className="premium-payment-shell">
        <div className="premium-payment-main">
          <button className="premium-inline-back" onClick={onBack}>← Change plan</button>

          <div className="premium-payment-heading">
            <div>
              <span className="premium-flow-eyebrow">SECURE CHECKOUT</span>
              <h1>Pay {money(amount)} securely</h1>
              <p>{plan.name} Premium • {plan.duration}</p>
            </div>
            <div className="premium-pay-amount">{money(amount)}</div>
          </div>

          <div className="premium-method-tabs">
            <button
              type="button"
              className={method === "GOOGLE_PAY" ? "active" : ""}
              onClick={() => setMethod("GOOGLE_PAY")}
            >
              <span className="gpay-logo">G</span> Google Pay
            </button>
            <button
              type="button"
              className={method === "PHONEPE" ? "active" : ""}
              onClick={() => setMethod("PHONEPE")}
            >
              <span className="phonepe-logo">पे</span> PhonePe
            </button>
          </div>

          <div className="premium-qr-card">
            <div className="premium-qr-heading">
              <span className="premium-qr-number">01</span>
              <div>
                <h3>Scan & pay with {methodLabel}</h3>
                <p>Amount is already set to {money(amount)}. No manual amount entry.</p>
              </div>
            </div>

            <div className="premium-qr-stage">
              <div className="premium-qr-frame">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`${UPI_PAYEE_NAME} UPI QR for ${money(amount)}`} />
                ) : (
                  <div className="premium-qr-generating">Generating secure QR…</div>
                )}
                <div className="premium-qr-corner tl" />
                <div className="premium-qr-corner tr" />
                <div className="premium-qr-corner bl" />
                <div className="premium-qr-corner br" />
              </div>
              <div className="premium-upi-details">
                <span>Paying to</span>
                <strong>{UPI_PAYEE_NAME}</strong>
                <code>{upiId}</code>
                <b>{money(amount)}</b>
                <small className="premium-locked-amount">🔒 Amount locked to selected plan</small>
              </div>
            </div>

            <button className="premium-upi-open-btn" onClick={openUpi}>
              Open {methodLabel} payment <span>↗</span>
            </button>

            <div className={`premium-auto-status ${paymentState.toLowerCase()}`}>
              <span className="premium-auto-status-icon">
                {paymentState === "SUCCESS" ? "✓" : paymentState === "FAILED" ? "!" : "↻"}
              </span>
              <div>
                <strong>
                  {paymentState === "SUCCESS"
                    ? "Payment successful"
                    : paymentState === "FAILED"
                      ? "Payment failed"
                      : "Waiting for payment confirmation"}
                </strong>
                <small>
                  {paymentState === "SUCCESS"
                    ? "Your Premium membership is being completed."
                    : paymentState === "FAILED"
                      ? error
                      : "Complete the payment in your UPI app. We will verify it automatically."}
                </small>
              </div>
            </div>

            {error && paymentState !== "FAILED" && (
              <div className="premium-form-error">{error}</div>
            )}

            <button
              type="button"
              className="premium-check-payment-btn"
              onClick={retryCheck}
              disabled={checking || paymentState === "SUCCESS"}
            >
              {checking ? "Checking payment…" : "Check payment status"}
            </button>
          </div>

          <div className="premium-payment-help premium-auto-help">
            <span>Automatic payment verification</span>
            <small>
              After you pay, this page checks the order status automatically. You do not need to type a UTR manually.
            </small>
          </div>
        </div>

        <aside className="premium-payment-sidebar">
          <div className="premium-order-mini">
            <span className="premium-flow-eyebrow">YOUR ORDER</span>
            <div className="premium-mini-plan">
              <div className={`mini-plan-icon ${plan.tone}`}>
                {plan.tone === "gold" ? "✦" : plan.tone === "diamond" ? "◆" : "♛"}
              </div>
              <div>
                <strong>{plan.name} Premium</strong>
                <small>{plan.duration}</small>
              </div>
            </div>
            <div className="premium-mini-row"><span>Plan price</span><strong>{money(amount)}</strong></div>
            <div className="premium-mini-row"><span>Extra charges</span><strong>₹0</strong></div>
            <div className="premium-mini-rule" />
            <div className="premium-mini-total"><span>To Pay</span><strong>{money(amount)}</strong></div>
          </div>

          <div className="premium-guarantee-card">
            <div className="guarantee-icon">✓</div>
            <strong>Automatic activation</strong>
            <p>After the verified payment is received, your selected Premium plan is activated automatically.</p>
          </div>

          <div className="premium-side-features">
            <span>✓ No manual amount entry</span>
            <span>✓ No manual UTR entry</span>
            <span>✓ Automatic payment status</span>
            <span>✓ Premium success screen</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PaymentSuccess({ data }) {

  const nav = useNavigate();

  const plan = PLANS.find(x => x.key === data.plan) || PLANS.find(x => x.name === data.planName);

  return (

    <div className="premium-success-page">

      <div className="premium-success-card">

        <div className="premium-success-orbit">

          <div>✓</div>

        </div>

        <span className="premium-flow-eyebrow">PAYMENT SUCCESSFUL</span>

        <h1>Welcome to Premium!</h1>

        <p>

          Your GoswamiShaadi account is now a Premium Member account.

        </p>

        <div className="premium-success-plan">

          <div>

            <small>PLAN</small>

            <strong>{data.planName || plan?.name || "Premium"}</strong>

          </div>

          <div>

            <small>AMOUNT</small>

            <strong>{money(data.amount || plan?.price || 0)}</strong>

          </div>

          <div>

            <small>VALID UNTIL</small>

            <strong>{data.validUntil ? new Date(data.validUntil).toLocaleDateString("en-IN", {

              day: "2-digit",

              month: "short",

              year: "numeric"

            }) : "Active"}</strong>

          </div>

        </div>

        {data.transactionId && (

          <div className="premium-success-utr">

            Transaction ID / UTR: <strong>{data.transactionId}</strong>

          </div>

        )}

        <div className="premium-success-benefits">

          <span>✓ Premium member badge</span>

          <span>✓ Enhanced profile visibility</span>

          <span>✓ Premium facilities enabled</span>

        </div>

        <button onClick={() => nav("/")} className="premium-success-primary">

          Continue to GoswamiShaadi

        </button>

        <button onClick={() => nav("/profile")} className="premium-success-secondary">

          View My Profile

        </button>

      </div>

    </div>

  );

}

export default function Premium() {

  const [selected, setSelected] = useState(PLANS[1]);

  const [summaryOpen, setSummaryOpen] = useState(false);

  const [payment, setPayment] = useState(null);

  const [success, setSuccess] = useState(null);

  const [status, setStatus] = useState(null);

  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {

    api.get("/premium/status")

      .then(r => setStatus(r.data))

      .catch(() => setStatus(null))

      .finally(() => setLoadingStatus(false));

  }, []);

  const heading = useMemo(() => {

    if (status?.active) return "Extend your Premium membership";

    return "Upgrade to GoswamiShaadi Premium";

  }, [status]);

  if (success) {

    return <PaymentSuccess data={success} />;

  }

  if (payment) {

    return (

      <div className="premium-flow-page">

        <PremiumHeader status={status} />

        <PaymentScreen

          plan={payment.plan}

          orderId={payment.orderId}

          onBack={() => setPayment(null)}

          onSuccess={data => setSuccess(data)}

        />

      </div>

    );

  }

  return (

    <div className="premium-flow-page">

      <PremiumHeader status={status} />

      <main className="premium-plans-page">

        <section className="premium-hero-banner">

          <div className="premium-hero-glow glow-one" />

          <div className="premium-hero-glow glow-two" />

          <div className="premium-hero-copy">

            <span className="premium-flow-eyebrow">EXCLUSIVE MEMBERSHIP</span>

            <h1>{heading}</h1>

            <p>

              Unlock a more powerful matrimonial experience with premium visibility,

              premium facilities and priority access.

            </p>

            {status?.active && (

              <div className="premium-current-status">

                <span>✓</span>

                Current plan: <strong>{status.planName}</strong>

                {status.validUntil && (

                  <> • Valid until <strong>{new Date(status.validUntil).toLocaleDateString("en-IN")}</strong></>

                )}

              </div>

            )}

          </div>

          <div className="premium-hero-seal">

            <span>✦</span>

            <strong>PREMIUM</strong>

            <small>MEMBER</small>

          </div>

        </section>

        <section className="premium-plans-wrap">

          <div className="premium-section-title">

            <div>

              <span className="premium-flow-eyebrow">CHOOSE YOUR PLAN</span>

              <h2>Premium plans made simple</h2>

              <p>Fixed prices. No hidden charges. Choose the membership that fits you.</p>

            </div>

            {!loadingStatus && (

              <div className="premium-secure-chip">🔒 Secure UPI</div>

            )}

          </div>

          <div className="premium-plan-grid">

            {PLANS.map(plan => (

              <PlanCard

                key={plan.key}

                plan={plan}

                selected={selected.key === plan.key}

                onSelect={setSelected}

              />

            ))}

          </div>

          <div className="premium-bottom-strip">

            <div>

              <span>✓</span>

              <div>

                <strong>Simple & transparent pricing</strong>

                <small>Gold ₹700 • Diamond ₹1300 • Platinum Plus ₹2500</small>

              </div>

            </div>

            <button onClick={() => setSummaryOpen(true)}>

              Continue with {selected.name} <span>→</span>

            </button>

          </div>

        </section>

        <section className="premium-benefits-showcase">

          <div className="premium-section-title centered">

            <span className="premium-flow-eyebrow">WHY GO PREMIUM?</span>

            <h2>More visibility. More confidence. More connections.</h2>

          </div>

          <div className="premium-benefit-grid">

            <div><b>01</b><span>♕</span><h3>Premium Identity</h3><p>Show a premium member badge and a polished profile presence.</p></div>

            <div><b>02</b><span>◉</span><h3>Better Visibility</h3><p>Premium plans are designed to give your profile greater discovery priority.</p></div>

            <div><b>03</b><span>♡</span><h3>Premium Facilities</h3><p>Unlock the premium facilities available across GoswamiShaadi.</p></div>

            <div><b>04</b><span>��</span><h3>Secure Checkout</h3><p>Pay the exact plan amount through UPI using Google Pay or PhonePe.</p></div>

          </div>

        </section>

      </main>

      {summaryOpen && (

        <OrderSummary

          plan={selected}

          onClose={() => setSummaryOpen(false)}

          onProceed={async () => {

            try {

              const r = await api.post("/premium/orders", {

                plan: selected.key

              });

              setSummaryOpen(false);

              setPayment({

                orderId: r.data.orderId,

                plan: selected

              });

            } catch (err) {

              alert(

                err?.response?.data?.message ||

                "Unable to create premium order. Please try again."

              );

            }

          }}

        />

      )}

    </div>

  );

}