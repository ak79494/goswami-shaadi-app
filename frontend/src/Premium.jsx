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

        <span>Goswami<span>Jodi</span></span>

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

        <div className="premium-summary-kicker">GOSWAMIJODI PREMIUM</div>

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

const UPI_PAYEE_NAME = "Goswami Jodi";

function PaymentScreen({ plan, orderId, onBack, onSuccess }) {
  const [method, setMethod] = useState("GOOGLE_PAY");
  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    `&tn=${encodeURIComponent(`GoswamiJodi ${plan.name} Premium`)}`;

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

  const openUpi = () => {
    setError("");
    window.location.href = upiUrl;
  };

  // Nothing tells us a UPI payment has arrived: the member sends the reference and the team checks the account.
  const submitPayment = async e => {
    e.preventDefault();
    const clean = utr.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9]{6,40}$/.test(clean)) {
      setError("Enter the UPI reference / UTR number shown in your payment app (usually 12 digits).");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await api.post(`/premium/orders/${orderId}/submit-payment`, {
        paymentMethod: method,
        transactionId: clean
      });
      onSuccess(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't submit this. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
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
        <span>4 <b>Complete</b></span>
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

            <form className="premium-utr-form" onSubmit={submitPayment}>
              <div className="premium-qr-heading">
                <span className="premium-qr-number">02</span>
                <div>
                  <h3>Enter your payment reference</h3>
                  <p>Find the UPI reference / UTR number under the transaction details in your payment app.</p>
                </div>
              </div>
              <input
                className="premium-utr-input"
                value={utr}
                onChange={e => setUtr(e.target.value)}
                placeholder="e.g. 431245678901"
                aria-label="UPI reference or UTR number"
              />
              {error && <div className="premium-form-error">{error}</div>}
              <button type="submit" className="premium-check-payment-btn" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit for verification"}
              </button>
            </form>
          </div>

          <div className="premium-payment-help premium-auto-help">
            <span>How your payment is verified</span>
            <small>
              Our team checks that the payment reached our account, then activates Premium and notifies you. This usually takes a few hours.
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
            <strong>Activated after verification</strong>
            <p>Your selected Premium plan starts as soon as our team has confirmed your payment.</p>
          </div>

          <div className="premium-side-features">
            <span>✓ Amount already filled in for you</span>
            <span>✓ Paid directly by UPI</span>
            <span>✓ You are notified when it is active</span>
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

        <span className="premium-flow-eyebrow">PAYMENT SUBMITTED</span>

        <h1>We are checking your payment</h1>

        <p>
          We will activate your plan and notify you as soon as our team confirms it, usually within a few hours.
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

            <small>STATUS</small>

            <strong>Being verified</strong>

          </div>

        </div>

        {data.transactionId && (

          <div className="premium-success-utr">

            Transaction ID / UTR: <strong>{data.transactionId}</strong>

          </div>

        )}

        <button onClick={() => nav("/")} className="premium-success-primary">

          Continue to GoswamiJodi

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

    return "Upgrade to GoswamiJodi Premium";

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
        {status?.latestOrder?.status === "PENDING" && (
          <div className="premium-form-error premium-pending-note">
            Your {status.latestOrder.planName} payment is being verified. We will notify you as soon as it is confirmed.
          </div>
        )}
        {status?.latestOrder?.status === "REJECTED" && (
          <div className="premium-form-error premium-pending-note">
            Your last payment could not be verified: {status.latestOrder.adminNote}
          </div>
        )}

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

            <div><b>03</b><span>♡</span><h3>Premium Facilities</h3><p>Unlock the premium facilities available across GoswamiJodi.</p></div>

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