import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AstroChat.css";

const ASTROLOGERS = [
  {
    id: "dilip",
    name: "Astro Dilip",
    image: "/astro-dilip.jpg",
    exp: "10 yrs",
    languages: "Hindi, English",
    skills: ["Vedic", "Kundli", "Marriage"],
    rating: "4.9",
    sessions: "12,680 sessions",
    price: 5,
    oldPrice: 36,
    available: true,
    phone: "9386289377",
    whatsapp: "9386289377",
    source: "GoswamiJodi profile"
  },
  {
    id: "jayashree",
    name: "Astrologer Jayashree",
    image: "https://www.consultastrology.com/assets/images/jayashree.png",
    exp: "20+ yrs",
    languages: "Hindi, English",
    skills: ["Vedic", "Tarot", "Numerology"],
    rating: "4.9",
    sessions: "15,000+ sessions",
    price: 12,
    oldPrice: 30,
    available: true,
    whatsapp: "9840924789",
    source: "Public professional profile"
  },
  {
    id: "mamta",
    name: "Mamta Pandey",
    image: "https://www.askmamtappandey.com/images/mamta-pandey.jpg",
    exp: "10 yrs",
    languages: "Hindi, English",
    skills: ["Tarot", "Vedic", "Love"],
    rating: "4.9",
    sessions: "10,000+ readings",
    price: 10,
    oldPrice: 25,
    available: true,
    whatsapp: "9821254044",
    source: "Public professional profile"
  },
  {
    id: "medha",
    name: "Medha AstroTarot",
    image: "https://www.medhaastrotarot.in/images/medha-astrotarot-delhi-astrologer.jpg",
    exp: "6 yrs",
    languages: "Hindi, English",
    skills: ["Vedic", "Tarot", "Relationships"],
    rating: "5.0",
    sessions: "350+ five-star reviews",
    price: 15,
    oldPrice: 30,
    available: true,
    whatsapp: "9205402879",
    source: "Public professional profile"
  }
];

export function getAstrologer(id) {
  return ASTROLOGERS.find((item) => item.id === id) || ASTROLOGERS[0];
}

function Avatar({ astro }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="astro-avatar-wrap">
      {!failed && astro.image ? (
        <img
          className="astro-avatar-photo"
          src={astro.image}
          alt={astro.name}
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="astro-avatar-fallback">{astro.name.replace("Astro ", "").slice(0, 2).toUpperCase()}</div>
      )}
    </div>
  );
}

function Wallet({ balance, onClick }) {
  return (
    <button className="astro-wallet" type="button" onClick={onClick}>
      <span className="astro-wallet-icon">▣</span>
      <span>₹{Number(balance || 0).toFixed(2)}</span>
    </button>
  );
}

export default function AstroChat() {
  const nav = useNavigate();
  const [selected, setSelected] = useState("all");
  const balance = Number(localStorage.getItem("astroWallet") || 0);

  const visible = useMemo(() => {
    if (selected === "all") return ASTROLOGERS;
    return ASTROLOGERS.filter((a) => a.skills.some((s) => s.toLowerCase().includes(selected)));
  }, [selected]);

  const startChat = (astro) => {
    const wallet = Number(localStorage.getItem("astroWallet") || 0);
    if (wallet < astro.price * 5) {
      nav(`/astro-chat/recharge/${astro.id}`);
      return;
    }
    nav(`/astro-chat/session/${astro.id}`);
  };

  const startCall = (astro) => {
    nav(`/astro-chat/recharge/${astro.id}?mode=call`);
  };

  return (
    <div className="astro-app-shell">
      <header className="astro-topbar">
        <button className="astro-close" type="button" onClick={() => nav(-1)} aria-label="Close">×</button>
        <div className="astro-brand">
          <img className="astro-logo" src="/astro-logo.svg" alt="Astro" />
          <div className="astro-brand-text"><strong>Astro</strong><span>Chat</span></div>
        </div>
        <div className="astro-top-actions">
          <Wallet balance={balance} onClick={() => nav("/astro-chat/recharge/dilip")} />
          <button className="astro-history" type="button" aria-label="History">◷</button>
        </div>
      </header>

      <main className="astro-main">
        <section className="astro-hero">
          <div>
            <span className="astro-kicker">GOSWAMIJODI • ASTROLOGY</span>
            <h1>Talk to a real astrologer</h1>
            <p>Marriage, kundli, career, relationships and personal guidance — chat privately with an astrologer.</p>
          </div>
          <div className="astro-hero-badge">✦<span>Private<br/>chat</span></div>
        </section>

        <div className="astro-heading-row">
          <div>
            <h2>Astrologers</h2>
            <p>Choose an expert and start your private consultation.</p>
          </div>
          <button type="button" className="astro-details-link" onClick={() => nav("/astro-details")}>Astro Details</button>
        </div>

        <div className="astro-tabs">
          {["all", "marriage", "vedic", "vastu", "tarot"].map((item) => (
            <button key={item} className={selected === item ? "active" : ""} type="button" onClick={() => setSelected(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        <section className="astro-list">
          {visible.map((astro) => (
            <article className="astro-card" key={astro.id}>
              <div className="astro-card-photo-area">
                <Avatar astro={astro} />
                <span className={`astro-online ${astro.available ? "on" : "off"}`}>{astro.available ? "● Available" : "● Busy"}</span>
              </div>
              <div className="astro-card-content">
                <div className="astro-name-row">
                  <div>
                    <h3>{astro.name}</h3>
                    <p>💼 {astro.exp} <i>•</i> {astro.languages}</p>
                  </div>
                  <span className="astro-rating">{astro.rating} ★</span>
                </div>
                <div className="astro-tags">{astro.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                <div className="astro-meta"><span>★ {astro.rating}</span><span>•</span><span>{astro.sessions}</span></div>
                <div className="astro-price"><del>₹{astro.oldPrice}/min</del><strong>₹{astro.price}/min</strong></div>
                <div className="astro-actions">
                  <button type="button" className="astro-call" onClick={() => startCall(astro)}>☎ Call</button>
                  <button type="button" className="astro-chat" onClick={() => startChat(astro)}>▣ Chat</button>
                </div>
                <small className="astro-source-note">Profile: {astro.source}</small>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="astro-footer">
        <div className="astro-footer-links">
          <button type="button" onClick={() => nav("/astro-privacy-policy")}>Privacy Policy</button>
          <span className="astro-footer-divider">|</span>
          <button type="button" onClick={() => nav("/astro-terms")}>Terms &amp; Conditions</button>
        </div>
        <div className="astro-copyright">Copyright © 2026 GoswamiJodi</div>
        <div className="astro-version">AstroChat</div>
      </footer>
    </div>
  );
}
