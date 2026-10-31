import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAstrologer } from "./AstroChat";

const PACKS = [
  { amount: 50, extra: "" },
  { amount: 100, extra: "Get ₹40 Extra" },
  { amount: 250, extra: "Get ₹125 Extra", best: true },
  { amount: 500, extra: "Get ₹300 Extra" },
  { amount: 1000, extra: "Get ₹250 Extra" },
  { amount: 2000, extra: "Get ₹400 Extra" }
];

export default function AstroRecharge() {
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const astro = getAstrologer(id);
  const mode = new URLSearchParams(location.search).get("mode") || "chat";

  const selectPack = (amount) => nav(`/astro-chat/payment/${amount}?astro=${astro.id}&mode=${mode}`);

  return (
    <div className="astro-flow-page">
      <header className="astro-topbar">
        <button className="astro-close" type="button" onClick={() => nav("/astro-chat")}>×</button>
        <div className="astro-brand">astro<span>chat</span><small>.com</small></div>
        <div className="astro-top-actions"><span className="astro-mini-wallet">₹0.00</span><button className="astro-history" type="button">◷</button></div>
      </header>

      <div className="astro-recharge-shell">
        <div className="astro-recharge-astro"><img src={astro.image} alt={astro.name} onError={(e) => { e.currentTarget.style.display = "none"; }} /></div>
        <div className="astro-recharge-icon">⚡</div>
        <section className="astro-recharge-card">
          <h1>Recharge and Connect</h1>
          <p>Minimum balance of <b>5 minutes (₹{astro.price * 5})</b> is required to start a {mode === "call" ? "call" : "chat"} with {astro.name}.</p>
          <div className="astro-pack-grid">
            {PACKS.map((pack) => (
              <button key={pack.amount} type="button" className={`astro-pack ${pack.best ? "best" : ""}`} onClick={() => selectPack(pack.amount)}>
                {pack.best && <span className="astro-best-ribbon">BEST VALUE</span>}
                <strong>₹{pack.amount.toLocaleString("en-IN")}</strong>
                {pack.extra && <span>{pack.extra}</span>}
              </button>
            ))}
          </div>
          <p className="astro-recharge-foot">ⓘ Your selected amount will be filled automatically in the payment screen.</p>
        </section>
      </div>
    </div>
  );
}
