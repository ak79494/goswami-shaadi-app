import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { getAstrologer } from "./AstroChat";

const UPI_ID = "goswamiarun263@okicici";
const PAYEE = "Goswami Shaadi";

export default function AstroPayment() {
  const nav = useNavigate();
  const { amount: amountParam } = useParams();
  const [search] = useSearchParams();
  const astro = getAstrologer(search.get("astro"));
  const mode = search.get("mode") || "chat";
  const amount = Math.max(1, Number(amountParam || 50));
  const [method, setMethod] = useState("GOOGLE_PAY");
  const [qr, setQr] = useState("");
  const [opened, setOpened] = useState(false);

  const upiUrl = useMemo(() => (
    `upi://pay?pa=${encodeURIComponent(UPI_ID)}` +
    `&pn=${encodeURIComponent(PAYEE)}` +
    `&am=${encodeURIComponent(amount)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(`Astro ${astro.name} - ${mode === "call" ? "Call" : "Chat"}`)}`
  ), [amount, astro.name, mode]);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(upiUrl, { width: 300, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setQr(""));
    return () => { cancelled = true; };
  }, [upiUrl]);

  const openPayment = () => {
    setOpened(true);
    const params = `pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE)}&am=${encodeURIComponent(amount + Math.round(amount * 0.18))}&cu=INR&tn=${encodeURIComponent(`Astro ${astro.name} - ${mode === "call" ? "Call" : "Chat"}`)}`;
    const appUrl = method === "GOOGLE_PAY" ? `tez://upi/pay?${params}` : method === "PHONEPE" ? `phonepe://pay?${params}` : `upi://pay?${params}`;
    window.location.href = appUrl;
  };

  const continueAfterPayment = () => {
    // The UPI app receives the exact selected amount. The wallet is updated only
    // after the user explicitly confirms returning from the UPI app.
    const current = Number(localStorage.getItem("astroWallet") || 0);
    localStorage.setItem("astroWallet", String(current + amount));
    if (mode === "call") nav(`/astro-chat/session/${astro.id}?mode=call`);
    else nav(`/astro-chat/session/${astro.id}`);
  };

  return (
    <div className="astro-flow-page astro-payment-page">
      <header className="astro-payment-header">
        <button type="button" onClick={() => nav(-1)}>‹</button>
        <h1>Payment</h1>
      </header>
      <div className="astro-payment-brand">Goswami<span>Shaadi</span></div>
      <main className="astro-payment-content">
        <section className="astro-summary-card">
          <div><span>Sub Total</span><strong>₹{amount}</strong></div>
          <div><span>GST (18%)</span><strong>₹{Math.round(amount * 0.18)}</strong></div>
          <hr />
          <div className="total"><b>Total Amount</b><b>₹{amount + Math.round(amount * 0.18)}</b></div>
        </section>
        <section className="astro-credit-card">
          <h2>Your Credit Details:</h2>
          <div><span>Recharge</span><b>₹{amount}</b></div>
          <hr />
          <div><b>Total Credit</b><b>₹{amount}</b></div>
        </section>
        <section className="astro-upi-card">
          <div className="astro-upi-heading"><span className="upi-circle">UPI</span><b>Pay by any UPI App</b><span>⌃</span></div>
          <div className="astro-methods">
            <button className={method === "PHONEPE" ? "active" : ""} onClick={() => setMethod("PHONEPE")} type="button"><span className="phonepe-logo">पे</span><small>PhonePe</small></button>
            <button className={method === "GOOGLE_PAY" ? "active" : ""} onClick={() => setMethod("GOOGLE_PAY")} type="button"><span className="gpay-logo">G</span><small>GPay</small></button>
            <button type="button" onClick={() => setMethod("OTHER")}><span className="other-logo">₹</span><small>Other UPI</small></button>
          </div>
          <div className="astro-upi-detail-row"><span>Goswami Shaadi</span><code>{UPI_ID}</code></div>
          {qr && <img className="astro-payment-qr" src={qr} alt="UPI payment QR" />}
          <button className="astro-open-payment" type="button" onClick={openPayment}>Pay ₹{amount + Math.round(amount * 0.18)} with {method === "PHONEPE" ? "PhonePe" : method === "GOOGLE_PAY" ? "Google Pay" : "UPI"} ↗</button>
          {opened && <button className="astro-confirm-payment" type="button" onClick={continueAfterPayment}>I have completed the payment → Continue</button>}
          <p className="astro-payment-safe">🔒 Amount is locked to the selected recharge. Payee name: <b>Goswami Shaadi</b>.</p>
        </section>
      </main>
    </div>
  );
}
