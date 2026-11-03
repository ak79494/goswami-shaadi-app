import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import api, { API } from "./api";
import "./Biodata.css";

const text = (v, fallback = "Not specified") =>
  v !== null && v !== undefined && String(v).trim() ? String(v) : fallback;

const ageFromDob = (dob) => {
  if (!dob) return "";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  ) age--;
  return age > 0 ? age : "";
};

const dateText = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const photoDataUrl = async (url) => {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const BioFactIcon = ({ type }) => {
  const common = {
    viewBox: "0 0 24 24",
    width: "18",
    height: "18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (type === "age") return (
    <svg {...common}>
      <circle cx="12" cy="7" r="3" />
      <path d="M5.5 20c.7-3.5 2.9-5.5 6.5-5.5s5.8 2 6.5 5.5" />
    </svg>
  );

  if (type === "gender") return (
    <svg {...common}>
      <circle cx="10" cy="14" r="4" />
      <path d="M13 11l6-6M15 5h4v4" />
    </svg>
  );

  if (type === "profession") return (
    <svg {...common}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12h18M10 12v2h4v-2" />
    </svg>
  );

  if (type === "location") return (
    <svg {...common}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );

  return (
    <svg {...common}>
      <path d="M12 21s-7-4.35-7-10.25A4.75 4.75 0 0 1 12 7a4.75 4.75 0 0 1 7 3.75C19 16.65 12 21 12 21Z" />
    </svg>
  );
};

const Field = ({ icon, label, value }) => (
  <div className="bio-field">
    <div className="bio-field-icon">{icon}</div>
    <div className="bio-field-text">
      <span>{label}</span>
      <strong>{text(value)}</strong>
    </div>
  </div>
);

const Section = ({ number, icon, title, subtitle, children, className = "" }) => (
  <section className={`bio-section ${className}`}>
    <div className="bio-section-head">
      <div className="bio-section-badge">{number}</div>
      <div className="bio-section-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
    {children}
  </section>
);

export default function Biodata() {
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [preference, setPreference] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const [shareOpen, setShareOpen] = useState(false);

  // Close the Share Biodata menu whenever the user taps/clicks
  // anywhere outside the share button/menu area.
  const shareWrapRef = useRef(null);

  useEffect(() => {
    const handleOutsideShareClick = (event) => {
      if (
        shareWrapRef.current &&
        !shareWrapRef.current.contains(event.target)
      ) {
        setShareOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideShareClick);
    document.addEventListener("touchstart", handleOutsideShareClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideShareClick);
      document.removeEventListener("touchstart", handleOutsideShareClick);
    };
  }, []);

  const getShareText = () =>
    `GoswamiJodi Biodata\n\n` +
    `${name}\n` +
    `Profile ID: ${id}\n\n` +
    `View marriage biodata: ${window.location.href}`;

  const buildBiodataPdf = async () => {
    if (!profile) return null;
    const element = document.querySelector(".bio-paper");
    if (!element) {
      alert("Biodata preview is not ready.");
      return null;
    }

    const canvas = await html2canvas(element, {
      scale: 2, useCORS: true, allowTaint: false, backgroundColor: "#ffffff",
      imageTimeout: 20000, logging: false, scrollX: 0,
      scrollY: -window.scrollY, windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210, pageHeight = 297, margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const imageWidth = usableWidth;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    let sourceY = 0;
    const pageSourceHeight = Math.floor((usableHeight / imageHeight) * canvas.height);
    let pageNumber = 0;

    while (sourceY < canvas.height) {
      if (pageNumber > 0) pdf.addPage();
      const currentSourceHeight = Math.min(pageSourceHeight, canvas.height - sourceY);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = currentSourceHeight;
      const ctx = pageCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, sourceY, canvas.width, currentSourceHeight, 0, 0, pageCanvas.width, currentSourceHeight);
      const pageImg = pageCanvas.toDataURL("image/jpeg", 0.94);
      const renderedHeight = (currentSourceHeight * imageWidth) / canvas.width;
      pdf.addImage(pageImg, "JPEG", margin, margin, imageWidth, renderedHeight, undefined, "FAST");
      sourceY += currentSourceHeight;
      pageNumber++;
    }
    return pdf;
  };

  const getBiodataFile = async () => {
    const pdf = await buildBiodataPdf();
    if (!pdf) return null;
    const blob = pdf.output("blob");
    const safeName = name.replace(/[^a-z0-9]+/gi, "_") || "GoswamiJodi_Member";
    return new File([blob], `GoswamiJodi_Biodata_${safeName}.pdf`, { type: "application/pdf" });
  };

  const shareFile = async () => {
    const file = await getBiodataFile();
    if (!file) return;

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({
        title: `GoswamiJodi Biodata - ${name}`,
        text: getShareText(),
        files: [file],
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    alert("Direct PDF sharing is not supported by this browser. PDF download ho gaya hai; ise WhatsApp/Email me attach karein.");
  };

  const openShareWindow = (url) => {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) window.location.href = url;
  };

  const shareWhatsApp = () => {
    if (!profile) return;
    const url = `https://wa.me/?text=${encodeURIComponent(getShareText())}`;
    openShareWindow(url);
    setShareOpen(false);
  };

  const shareEmail = () => {
    if (!profile) return;
    const subject = `GoswamiJodi Biodata - ${name}`;
    const body = getShareText();
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShareOpen(false);
  };

  const copyBiodataLink = async () => {
    const link = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const input = document.createElement("input");
        input.value = link;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
    } catch (error) {
      // Keep the copy action silent — no browser alert/popup.
      console.warn("Unable to copy biodata link:", error);
    } finally {
      setShareOpen(false);
    }
  };

  const shareMore = async () => {
    if (!profile) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `GoswamiJodi Biodata - ${name}`,
          text: `GoswamiJodi Biodata of ${name} (Profile ID: ${id})`,
          url: window.location.href,
        });
      } else {
        await copyBiodataLink();
      }
    } catch (e) {
      if (e?.name !== "AbortError") console.error("Biodata share error:", e);
    } finally {
      setShareOpen(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/profiles/me");
        setProfile(r.data);
        try {
          const pref = await api.get("/preferences");
          setPreference(pref.data);
        } catch {}

        if (r.data?.user?.id) {
          try {
            const p = await api.get(`/photos/user/${r.data.user.id}`);
            const list = Array.isArray(p.data) ? p.data : [];
            setPhoto(list.find((x) => x.primaryPhoto) || list[0] || null);
          } catch {}
        }
      } catch (e) {
        setError(e.response?.data?.message || "Unable to load your biodata.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadPDF = async () => {
    if (!profile || downloading) return;
    setDownloading(true);
    try {
      const pdf = await buildBiodataPdf();
      if (!pdf) return;
      const safeName = name.replace(/[^a-z0-9]+/gi, "_") || "GoswamiJodi_Member";
      pdf.save(`GoswamiJodi_Biodata_${safeName}.pdf`);
    } catch (e) {
      console.error("Biodata PDF error:", e);
      alert("PDF create nahi ho paaya. Please page ko refresh karke dobara try karein.");
    } finally { setDownloading(false); }
  };

  if (loading) return (
    <div className="bio-loading">
      <div className="bio-loader" />
      <h3>Preparing your marriage biodata</h3>
      <p>Creating your premium profile preview...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="bio-error">
      <h2>Biodata unavailable</h2>
      <p>{error || "Profile could not be loaded."}</p>
      <button onClick={() => nav("/profile")}>Back to My Profile</button>
    </div>
  );

  const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "GoswamiJodi Member";
  const age = ageFromDob(profile.dateOfBirth);
  const id = profile.user?.goswamiId || `GS${String(profile.user?.id || profile.id || "").padStart(4, "0")}`;
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
  const photoUrl = photo?.url ? `${API}${photo.url}` : "";

  return (
    <main className="bio-reference-page">
      <div className="bio-reference-wrap">
        <div className="bio-reference-toolbar">
          <button className="bio-ref-back" onClick={() => nav(-1)}>← Back</button>
          <div><strong>Goswami<span>Jodi</span></strong><small>Marriage Biodata</small></div>
          <div className="bio-ref-actions">
            <div className="bio-share-wrap" ref={shareWrapRef}>
              <button type="button" className="bio-ref-share" onClick={() => setShareOpen(v => !v)} aria-expanded={shareOpen} aria-haspopup="menu">
                <span className="bio-share-trigger-icon" aria-hidden="true"></span>
                <span>Share Biodata</span>
                <span className="bio-share-chevron" aria-hidden="true">{shareOpen ? "⌃" : "⌄"}</span>
              </button>
              {shareOpen && (
                <div className="bio-share-menu" role="menu">
                  <div className="bio-share-menu-head">
                    <div className="bio-share-menu-title">Share Biodata</div>
                    <div className="bio-share-menu-subtitle">Choose how you want to share this profile</div>
                  </div>
                  <button type="button" className="bio-share-item whatsapp" onClick={shareWhatsApp} role="menuitem">
                    <span className="bio-share-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20.5 11.4a8.4 8.4 0 0 1-12.4 7.3L4 20l1.4-4a8.4 8.4 0 1 1 15.1-4.6Z"/><path d="M8.2 8.2c.3-.6.6-.6 1-.6h.5c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.5.6c-.1.1-.1.3 0 .5.5.8 1.2 1.5 2 2 .2.1.4.1.5 0l.7-.6c.2-.2.4-.2.7-.1l1.6.7c.3.1.4.3.4.6 0 .4-.2 1.1-.6 1.3-.4.3-1 .4-1.5.2-1-.3-2.4-1.1-3.7-2.3-1.1-1-2-2.3-2.5-3.3-.3-.6-.2-1.2.1-1.8Z"/></svg></span>
                    <span className="bio-share-item-copy"><strong>WhatsApp</strong></span>
                    <span className="bio-share-arrow" aria-hidden="true">›</span>
                  </button>
                  <button type="button" className="bio-share-item" onClick={shareEmail} role="menuitem">
                    <span className="bio-share-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg></span>
                    <span className="bio-share-item-copy"><strong>Email</strong></span>
                    <span className="bio-share-arrow" aria-hidden="true">›</span>
                  </button>
                  <button type="button" className="bio-share-item" onClick={copyBiodataLink} role="menuitem">
                    <span className="bio-share-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.1.1l1.4-1.4a5 5 0 0 0-7.1-7.1L10.2 5.8"/><path d="M14 11a5 5 0 0 0-7.1-.1L5.5 12.3a5 5 0 0 0 7.1 7.1l1.2-1.2"/></svg></span>
                    <span className="bio-share-item-copy"><strong>Copy Profile Link</strong></span>
                    <span className="bio-share-arrow" aria-hidden="true">›</span>
                  </button>
                  <div className="bio-share-divider" />
                  <button type="button" className="bio-share-item more" onClick={shareMore} role="menuitem">
                    <span className="bio-share-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg></span>
                    <span className="bio-share-item-copy"><strong>More Sharing Options</strong></span>
                    <span className="bio-share-arrow" aria-hidden="true">›</span>
                  </button>
                </div>
              )}
            </div>
            <button className="bio-ref-download" onClick={downloadPDF} disabled={downloading}>{downloading ? "Creating..." : "↓ Download PDF"}</button>
          </div>
        </div>

        <article className="bio-paper bio-reference-paper">
          <header className="bio-ref-profile-head">
            <div className="bio-ref-photo">
              {photoUrl ? <img src={photoUrl} alt={name} /> : <div>{name[0]}</div>}
            </div>
            <div className="bio-ref-identity">
              <h1>{name} <span className="bio-verified">✓</span></h1>
              <div className="bio-ref-id"><b>{id}</b><span>│</span><b>♛ Premium Member</b></div>
              <p className="bio-ref-quote">“A simple, family-oriented person who believes in tradition and modern values.”</p>
              <div className="bio-ref-facts">
                <span>
                  <i className="bio-ref-fact-icon"><BioFactIcon type="age" /></i>
                  <b>{age ? `${age} Years` : "Age not specified"}</b>
                </span>
                <span>
                  <i className="bio-ref-fact-icon"><BioFactIcon type="gender" /></i>
                  <b>{text(profile.user?.gender || profile.gender)}</b>
                </span>
                <span>
                  <i className="bio-ref-fact-icon"><BioFactIcon type="profession" /></i>
                  <b>{text(profile.profession)}</b>
                </span>
                <span>
                  <i className="bio-ref-fact-icon"><BioFactIcon type="location" /></i>
                  <b>{text(location)}</b>
                </span>
                <span className="bio-ref-fact-wide">
                  <i className="bio-ref-fact-icon"><BioFactIcon type="marital" /></i>
                  <b>{text(profile.maritalStatus)}</b>
                </span>
              </div>
            </div>
            <div className="bio-ref-values">
              <p>♥</p><em>Looking for a kind, understanding<br/>and family-oriented life partner<br/>to build a happy future together.</em>
              <div className="bio-ref-value-grid"><span>◆<b>Educated</b></span><span>♟<b>Family Oriented</b></span><span>♥<b>Values Tradition</b></span></div>
            </div>
          </header>

          <div className="bio-ref-grid">
            <div className="bio-ref-left-column">
              <section className="bio-ref-card">
                <h2>♟ <span>Personal Details</span></h2>
                <div className="bio-ref-fields one">
                  <div><span>Date of Birth</span><b>{dateText(profile.dateOfBirth)} {age ? `(${age} Years)` : ""}</b></div>
                  <div><span>Height</span><b>{text(profile.height)}</b></div>
                  <div><span>Body Type</span><b>{text(profile.bodyType)}</b></div>
                  <div><span>Education</span><b>{text(profile.education)}</b></div>
                  <div><span>Occupation</span><b>{text(profile.profession)}</b></div>
                  <div><span>Annual Income</span><b>{text(profile.incomeRange)}</b></div>
                  <div><span>Diet</span><b>{text(profile.foodPreference)}</b></div>
                  <div><span>Smoke</span><b>{text(profile.smoking)}</b></div>
                  <div><span>Drink</span><b>{text(profile.drinking)}</b></div>
                  <div><span>Languages Known</span><b>{text(profile.motherTongue)}</b></div>
                </div>
              </section>

              <section className="bio-ref-card">
                <h2>☎ <span>Contact <small>(Visible to Interested Members)</small></span></h2>
                <div className="bio-ref-fields one">
                  <div><span>Mobile</span><b>{profile.contactVisible ? text(profile.mobileNumber) : "Protected by privacy settings"}</b></div>
                  <div><span>Email</span><b>{profile.contactVisible ? text(profile.user?.email) : "Protected by privacy settings"}</b></div>
                  <div><span>Location</span><b>{text(location)}</b></div>
                </div>
              </section>

              <section className="bio-ref-card bio-ref-hobbies-card">
                <h2>♥ <span>Interests &amp; Hobbies</span></h2>
                <div className="bio-ref-hobbies-value">
                  {Array.isArray(profile.hobbies) && profile.hobbies.length
                    ? profile.hobbies.join(", ")
                    : "Not specified"}
                </div>
              </section>
            </div>

            <div className="bio-ref-right-column">
              <section className="bio-ref-card">
                <h2>♟ <span>Family Details</span></h2>
                <div className="bio-ref-fields one">
                  <div><span>Father's Name</span><b>{text(profile.fatherName)}</b></div>
                  <div><span>Mother's Name</span><b>{text(profile.motherName)}</b></div>
                  <div><span>Family Type</span><b>{text(profile.familyType)}</b></div>
                  <div><span>Native Place</span><b>{text(profile.city)}</b></div>
                  <div><span>Current City</span><b>{text(location)}</b></div>
                  <div><span>Siblings</span><b>{profile.siblings != null ? profile.siblings : "Not specified"}</b></div>
                  <div><span>Family Values</span><b>{text(profile.familyValues)}</b></div>
                </div>
              </section>

              <section className="bio-ref-card">
                <h2>♥ <span>Partner Preferences</span></h2>
                <div className="bio-ref-fields one">
                  <div><span>Looking for</span><b>{text(preference?.preferredGender, "Any")}</b></div>
                  <div><span>Age Range</span><b>{preference?.minAge || 21} - {preference?.maxAge || 35} Years</b></div>
                  <div><span>Height</span><b>As per preference</b></div>
                  <div><span>Education</span><b>{text(preference?.education, "Graduate or Above")}</b></div>
                  <div><span>Occupation</span><b>{text(preference?.profession, "Any")}</b></div>
                  <div><span>Marital Status</span><b>{text(preference?.maritalStatuses, "Any")}</b></div>
                  <div><span>Location</span><b>{text(preference?.cities, "India")}</b></div>
                  <div><span>Community</span><b>{text(preference?.communities, "Goswami (Preferred)")}</b></div>
                  <div className="bio-ref-wide"><span>Other Preference</span><b>{text(preference?.expectations, "Simple, family-oriented, understanding and caring.")}</b></div>
                </div>
              </section>
            </div>
          </div>

          <footer className="bio-ref-footer">— <em>Let’s build a beautiful future together</em> —</footer>
        </article>

        <div className="bio-ref-bottom"><button onClick={downloadPDF} disabled={downloading}>{downloading ? "Creating your PDF..." : "♥  Download Marriage Biodata PDF"}</button></div>
      </div>
    </main>
  );
}
