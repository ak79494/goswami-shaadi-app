import React, { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import api, { API } from "./api";

function ageFromDob(dob) {

  if (!dob) return "";

  const d = new Date(dob);

  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();

  let age = now.getFullYear() - d.getFullYear();

  const m = now.getMonth() - d.getMonth();

  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;

  return age > 0 ? age : "";

}

function relativeTime(value) {

  if (!value) return "Active recently";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "Active recently";

  const diff = Math.max(0, Date.now() - d.getTime());

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

}

function displayHeight(value) {

  if (!value) return "";

  const s = String(value).trim();

  if (s.includes("'")) return s;

  const parts = s.split(".");

  if (parts.length === 2) return `${parts[0]}' ${parts[1]}"`;

  return s;

}

function MobileDailyHome() {

  const nav = useNavigate();

  const [me, setMe] = useState(null);

  const [profiles, setProfiles] = useState([]);

  const [photos, setPhotos] = useState({});

  const [index, setIndex] = useState(0);

  const [photoIndex, setPhotoIndex] = useState({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [matchModal, setMatchModal] = useState(false);

  const [astroModal, setAstroModal] = useState(false);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);

  const [reportStep, setReportStep] = useState("reasons");

  const [reportReason, setReportReason] = useState("");

  const [reportFile, setReportFile] = useState(null);

  const [reportBusy, setReportBusy] = useState(false);

  const [actionMessage, setActionMessage] = useState("");

  const touchStartX = useRef(0);

  const touchStartY = useRef(0);

  const current = profiles[index];

  const currentUserId = current?.user?.id;

  const currentPhotos = currentUserId ? (photos[currentUserId] || []) : [];

  const currentPhotoIndex = currentUserId ? (photoIndex[currentUserId] || 0) : 0;

  const currentPhoto = currentPhotos[currentPhotoIndex] || currentPhotos[0] || null;
const profilesLeft = Math.max(profiles.length - index, 0);
const profilesSeen = Math.min(index + 1, profiles.length);

  useEffect(() => {

    let alive = true;

    const load = async () => {

      setLoading(true);

      setError("");

      try {

        const meResponse = await api.get("/profiles/me");

        if (!alive) return;

        setMe(meResponse.data);

        const r = await api.get("/profiles/search", {

          params: { type: "new", page: 0, size: 18 }

        });

        if (!alive) return;

        const content = Array.isArray(r.data?.content) ? r.data.content : [];

        const unique = Array.from(new Map(content.map(p => [p.id, p])).values());

        setProfiles(unique);

        const photoEntries = await Promise.all(

          unique.map(async p => {

            const uid = p?.user?.id;

            if (!uid) return [null, []];

            try {

              const pr = await api.get("/photos/user/" + uid);

              const list = Array.isArray(pr.data) ? pr.data.filter(x => x?.url) : [];

              list.sort((a, b) => Number(b.primaryPhoto) - Number(a.primaryPhoto));

              return [uid, list];

            } catch {

              return [uid, []];

            }

          })

        );

        if (!alive) return;

        setPhotos(Object.fromEntries(photoEntries.filter(x => x[0] !== null)));

      } catch (e) {

        if (!alive) return;

        if (e.response?.status === 400 || e.response?.status === 404) {

          nav("/profile/edit", { replace: true });

          return;

        }

        setError(e.response?.data?.message || "Unable to load daily matches");

      } finally {

        if (alive) setLoading(false);

      }

    };

    load();

    return () => { alive = false; };

  }, [nav]);

  const goNextProfile = () => {

    if (profiles.length < 2) return;

    setIndex(v => (v + 1) % profiles.length);

  };

  const goPrevProfile = () => {

    if (profiles.length < 2) return;

    setIndex(v => (v - 1 + profiles.length) % profiles.length);

  };

  const goNextPhoto = e => {

    e?.stopPropagation();

    if (!currentUserId || currentPhotos.length < 2) return;

    setPhotoIndex(v => ({ ...v, [currentUserId]: (currentPhotoIndex + 1) % currentPhotos.length }));

  };

  const goPrevPhoto = e => {

    e?.stopPropagation();

    if (!currentUserId || currentPhotos.length < 2) return;

    setPhotoIndex(v => ({ ...v, [currentUserId]: (currentPhotoIndex - 1 + currentPhotos.length) % currentPhotos.length }));

  };

  const handleTouchStart = e => {

    // Photo navigation arrows must control photos only; never let their

    // touch gesture bubble into the profile swipe handler.

    if (e.target.closest?.(".mobile-daily-photo-arrow")) {

      touchStartX.current = null;

      touchStartY.current = null;

      return;

    }

    const touch = e.changedTouches[0];

    touchStartX.current = touch.clientX;

    touchStartY.current = touch.clientY;

  };

  const handleTouchEnd = e => {

    // A tap/drag that started on a photo arrow belongs exclusively to

    // photo navigation, not profile navigation.

    if (touchStartX.current === null || touchStartY.current === null ||

        e.target.closest?.(".mobile-daily-photo-arrow")) {

      touchStartX.current = 0;

      touchStartY.current = 0;

      return;

    }

    const touch = e.changedTouches[0];

    const diffX = touch.clientX - touchStartX.current;

    const diffY = touch.clientY - touchStartY.current;

    // Only a clear horizontal swipe changes the profile.

    // Vertical page scrolling must never change the profile/photo.

    if (Math.abs(diffX) < 55 || Math.abs(diffX) <= Math.abs(diffY)) return;

    if (diffX < 0) goNextProfile();

    else goPrevProfile();

  };

  const reasons = useMemo(() => {

    if (!me || !current) return [];

    const out = [];

    if (me.foodPreference && current.foodPreference &&

        me.foodPreference.toLowerCase() === current.foodPreference.toLowerCase()) {

      out.push(`She too is ${current.foodPreference.toLowerCase()}`);

    }

    if (me.education && current.education &&

        me.education.toLowerCase() === current.education.toLowerCase()) {

      out.push(`She too has ${current.education}`);

    }

    if (me.motherTongue && current.motherTongue &&

        me.motherTongue.toLowerCase() === current.motherTongue.toLowerCase()) {

      out.push(`You both speak ${current.motherTongue}`);

    }

    if (me.community && current.community &&

        me.community.toLowerCase() === current.community.toLowerCase()) {

      out.push(`You both are from the ${current.community} community`);

    }

    if (me.city && current.city && me.city.toLowerCase() === current.city.toLowerCase()) {

      out.push(`You both are from ${current.city}`);

    }

    return out.slice(0, 4);

  }, [me, current]);

  const age = ageFromDob(current?.dateOfBirth);

  const name = `${current?.firstName || "Member"} ${current?.lastName || ""}`.trim();

  const basicLine = [age ? `${age}` : "", displayHeight(current?.height),

    [current?.religion, current?.community].filter(Boolean).join(" • "),

    current?.profession].filter(Boolean);

  const requestStatus = current?.user?.id ? null : null;

  const sendInterest = async () => {

    if (!current?.user?.id) return;

    try {

      await api.post("/requests/" + current.user.id);

      setProfiles(list => list.map((p, i) => i === index ? { ...p, __interestSent: true } : p));

    } catch (e) {

      console.error(e);

    }

  };

  const closeModals = () => {

    setMatchModal(false);

    setAstroModal(false);

    setProfileMenuOpen(false);

  };

  const openReport = () => {
    setProfileMenuOpen(false);
    setReportReason("");
    setReportFile(null);
    setReportStep("reasons");
    setReportOpen(true);
  };

  const hideCurrentProfile = async () => {
    if (!currentUserId) return;
    try {
      await api.post("/hidden-profiles/" + currentUserId);
      setProfiles(list => list.filter((_, i) => i !== index));
      setIndex(v => Math.min(v, Math.max(profiles.length - 2, 0)));
      setProfileMenuOpen(false);
      setActionMessage("Profile hidden");
      setTimeout(() => setActionMessage(""), 2500);
    } catch (e) {
      setActionMessage(e.response?.data?.message || "Unable to hide profile");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  const blockCurrentProfile = async () => {
    if (!currentUserId) return;
    try {
      await api.post("/blocks/" + currentUserId);
      setProfiles(list => list.filter((_, i) => i !== index));
      setIndex(v => Math.min(v, Math.max(profiles.length - 2, 0)));
      setProfileMenuOpen(false);
      setActionMessage("Profile blocked");
      setTimeout(() => setActionMessage(""), 2500);
    } catch (e) {
      setActionMessage(e.response?.data?.message || "Unable to block profile");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  const shareCurrentProfile = () => {
    if (!current) return;
    const shareText = `GoswamiShaadi profile: ${name}${age ? `, ${age}` : ""}. ${[current.city, current.state].filter(Boolean).join(", ")}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setProfileMenuOpen(false);
  };

  const chooseReportReason = reason => {
    setReportReason(reason);
    setReportStep("details");
  };

  const submitReport = async () => {
    if (!currentUserId || !reportReason || reportBusy) return;
    setReportBusy(true);
    try {
      const form = new FormData();
      form.append("targetUserId", String(currentUserId));
      form.append("reason", reportReason);
      if (reportFile) form.append("file", reportFile);
      await api.post("/reports/profile", form);
      setReportOpen(false);
      setReportStep("reasons");
      setReportReason("");
      setReportFile(null);
      setActionMessage("Report submitted successfully");
      setTimeout(() => setActionMessage(""), 3500);
    } catch (e) {
      setActionMessage(e.response?.data?.message || "Unable to submit report");
      setTimeout(() => setActionMessage(""), 3500);
    } finally {
      setReportBusy(false);
    }
  };

  if (loading) {

    return <div className="mobile-daily-page"><div className="mobile-daily-loading">Finding your daily matches...</div></div>;

  }

  if (error) {

    return <div className="mobile-daily-page"><div className="mobile-daily-error">{error}</div></div>;

  }

  if (!profiles.length) {

    return (

      <div className="mobile-daily-page">

        <div className="mobile-daily-empty">

          <div className="mobile-daily-empty-icon">♡</div>

          <h2>No new profiles today</h2>

          <p>Check again later for fresh matches.</p>

          <button onClick={() => nav("/search")}>Explore Matches</button>

        </div>

      </div>

    );

  }

  return (

    <main className="mobile-daily-page">

      <div className="mobile-daily-header">

        <div>

          <span>DAILY MATCHES</span>

          <h1>Matches</h1>

        </div>

        <button type="button" className="mobile-daily-menu" onClick={() => nav("/notifications")} aria-label="Notifications">

          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">

            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

            <path d="M10 21h4" />

          </svg>

          <span className="mobile-daily-notification-badge">2</span>

        </button>

      </div>

      <div className="mobile-daily-tabs">

        <button className="active">Daily ({profiles.length})</button>

        <button onClick={() => nav("/search")}>My Matches</button>

      </div>

      <div

        className="mobile-daily-card"

        onTouchStart={handleTouchStart}

        onTouchEnd={handleTouchEnd}

      >

        <div className="mobile-daily-photo-wrap">

          {currentPhoto ? (

            <img

              className="mobile-daily-photo"

              src={`${API}${currentPhoto.url}`}

              alt={name}

              draggable="false"

            />

          ) : (

            <div className="mobile-daily-avatar">{name.charAt(0).toUpperCase()}</div>

          )}

          {currentPhotos.length > 1 && (

            <div className="mobile-daily-photo-count">▣ {currentPhotoIndex + 1} / {currentPhotos.length}</div>

          )}

          <button
            type="button"
            className="mobile-profile-more"
            aria-label="More profile actions"
            onClick={e => { e.stopPropagation(); setProfileMenuOpen(true); }}
          >
            <span>⋮</span>
          </button>

          {profiles.length > 1 && (

            <>

              <button

                type="button"

                className="mobile-daily-photo-arrow left"

                onClick={e => { e.stopPropagation(); goPrevProfile(); }}

                aria-label="Previous profile"

              >‹</button>

              <button

                type="button"

                className="mobile-daily-photo-arrow right"

                onClick={e => { e.stopPropagation(); goNextProfile(); }}

                aria-label="Next profile"

              >›</button>

            </>

          )}

          <div className="mobile-daily-photo-gradient"></div>

          <div className="mobile-daily-photo-text">

            <h2>{name}{age ? `, ${age}` : ""}</h2>

            <p>{basicLine.join(" • ")}</p>

            <p>{[current?.city, current?.state].filter(Boolean).join(", ")}</p>

            <div className="mobile-daily-active"><i></i>{relativeTime(current?.user?.lastActiveAt)}</div>

          </div>

        </div>

        <div className="mobile-daily-actions">

          <button type="button" className="mobile-daily-action secondary" onClick={() => setMatchModal(true)}>

            <span>♧</span><small>You &amp; Her</small>

          </button>

          <button type="button" className="mobile-daily-action heart" onClick={sendInterest} disabled={current.__interestSent}>

            <span>{current.__interestSent ? "✓" : "♡"}</span><small>{current.__interestSent ? "Sent" : "Connect Now"}</small>

          </button>

          <button type="button" className="mobile-daily-action astro" onClick={() => setAstroModal(true)}>

            <span>✦</span><small>Astro</small>

          </button>

        </div>

        <div className="mobile-daily-footer">

          <span
  className="mobile-daily-profile-left"
  aria-label={`${profilesSeen} of ${profiles.length} profiles`}
>
  {profilesSeen} / {profiles.length} profiles
</span>

          <button type="button" onClick={() => nav("/profile-view/" + current.user.id)}>View Full Profile</button>

        </div>

      </div>

      {actionMessage && (
        <div className="mobile-profile-action-toast" role="status">{actionMessage}</div>
      )}

      {profileMenuOpen && (
        <div className="mobile-daily-modal-backdrop profile-menu-backdrop" onClick={() => setProfileMenuOpen(false)}>
          <div className="mobile-profile-action-sheet" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={shareCurrentProfile}>Share</button>
            <button type="button" onClick={async () => {
              if (!currentUserId) return;
              try {
                await api.post("/shortlists/" + currentUserId);
                setProfileMenuOpen(false);
                setActionMessage("Added to shortlist");
                setTimeout(() => setActionMessage(""), 2500);
              } catch (e) {
                setActionMessage(e.response?.data?.message || "Unable to add to shortlist");
                setTimeout(() => setActionMessage(""), 3000);
              }
            }}>Add to Shortlist</button>
            <button type="button" onClick={hideCurrentProfile}>Hide this Profile</button>
            <button type="button" onClick={blockCurrentProfile}>Block this Profile</button>
            <button type="button" className="danger" onClick={openReport}>Report this Profile</button>
          </div>
          <button type="button" className="mobile-profile-cancel" onClick={() => setProfileMenuOpen(false)}>Cancel</button>
        </div>
      )}

      {reportOpen && (
        <div className="mobile-daily-modal-backdrop report-backdrop">
          <div className={`mobile-report-sheet ${reportStep === "details" ? "details" : "reasons"}`} onClick={e => e.stopPropagation()}>
            <div className="mobile-report-header">
              <button type="button" onClick={() => { if (reportStep === "details") setReportStep("reasons"); else setReportOpen(false); }} aria-label="Back">‹</button>
              <h2>Reason for reporting</h2>
            </div>
            {reportStep === "reasons" ? (
              <>
                <div className="mobile-report-intro">⚑ <span>You are raising a complaint against <b>{name}</b> with the GoswamiShaadi.com team.</span></div>
                <div className="mobile-report-reasons">
                  {[
                    "Fake / Misleading Profile Information",
                    "Multiple Profiles",
                    "Phone number is incorrect",
                    "Photos are fake or obscene",
                    "Has sent abusive Emails / Chats",
                    "Is already married / engaged",
                    "Asking for money / scammer",
                    "Not responding",
                    "Other misuse reasons"
                  ].map(reason => (
                    <button type="button" key={reason} className="mobile-report-reason" onClick={() => chooseReportReason(reason)}>
                      <span className="mobile-report-radio"></span>{reason}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mobile-report-selected"><span className="mobile-report-radio selected"></span>{reportReason}</div>
                <label className="mobile-report-upload">
                  <span>Please add supporting documents to help the investigation.</span>
                  <strong>☁ Choose file</strong>
                  <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={e => setReportFile(e.target.files?.[0] || null)} />
                </label>
                {reportFile && <div className="mobile-report-file">{reportFile.name}</div>}
                <div className="mobile-report-actions">
                  <button type="button" className="report-submit" disabled={reportBusy} onClick={submitReport}>{reportBusy ? "Submitting..." : "Report"}</button>
                  <button type="button" className="report-cancel" onClick={() => setReportOpen(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {matchModal && (

        <div className="mobile-daily-modal-backdrop" onClick={closeModals}>

          <div className="mobile-match-modal" onClick={e => e.stopPropagation()}>

            <button className="mobile-modal-close" onClick={closeModals}>×</button>

            <div className="mobile-match-avatars">

              <div>{me?.firstName?.[0]?.toUpperCase() || "Y"}</div>

              {currentPhoto ? <img src={`${API}${currentPhoto.url}`} alt="Match" /> : <div>{name.charAt(0)}</div>}

            </div>

            <h2>You &amp; Her</h2>

            <div className="mobile-match-reasons">

              {reasons.length ? reasons.map((x, i) => <p key={i}><b>✓</b>{x}</p>) : <p><b>✓</b>Your profiles share compatible preferences.</p>}

            </div>

          </div>

        </div>

      )}

      {astroModal && (

        <div className="mobile-daily-modal-backdrop" onClick={closeModals}>

          <div className="mobile-astro-modal" onClick={e => e.stopPropagation()}>

            <button className="mobile-modal-close" onClick={closeModals}>×</button>

            <div className="mobile-astro-badge">✦ ASTRO</div>

            <h2>Astro Details</h2>

            <div className="mobile-astro-list">

              <div><span>Time of Birth</span><strong>{current?.timeOfBirth || "Not specified"}</strong></div>

              <div><span>Place of Birth</span><strong>{current?.placeOfBirth || "Not specified"}</strong></div>

              <div><span>Manglik</span><strong>{current?.manglik || "Not specified"}</strong></div>

              <div><span>Rashi</span><strong>{current?.rashi || "Not specified"}</strong></div>

              <div><span>Nakshatra</span><strong>{current?.nakshatra || "Not specified"}</strong></div>

            </div>

          </div>

        </div>

      )}

    </main>

  );

}

export default MobileDailyHome;