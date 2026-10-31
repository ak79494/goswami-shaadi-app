import React, { useEffect, useState } from "react";
import api, { API } from "./api";

function PrivacyOptionsPage() {

    const [profile, setProfile] = useState(null);
    const [photos, setPhotos] = useState([]);
  
    const [openSection, setOpenSection] = useState(null);
  
    const [displayName, setDisplayName] = useState("full");
    const [phonePrivacy, setPhonePrivacy] = useState("premium");
    const [emailPrivacy, setEmailPrivacy] = useState("premium");
    const [dobPrivacy, setDobPrivacy] = useState("full");
    const [horoscopePrivacy, setHoroscopePrivacy] = useState("accepted");
    const [profilePrivacy, setProfilePrivacy] = useState("all");
  
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
  
    // ==========================================
    // LOAD REAL USER DATA
    // ==========================================
  
    useEffect(() => {
  
      Promise.all([
        api.get("/profiles/me"),
        api.get("/photos")
      ])
        .then(([profileRes, photoRes]) => {
  
          const p = profileRes.data;
  
          setProfile(p);
  
          const photoList = Array.isArray(photoRes.data)
            ? photoRes.data
            : [];
  
          setPhotos(photoList);
  
        })
        .catch(error => {
          console.error("Failed to load privacy data:", error);
        });
  
    }, []);
  
  
    // ==========================================
    // PRIMARY PHOTO
    // ==========================================
  
    const primaryPhoto =
      photos.find(photo => photo.primaryPhoto) ||
      photos[0] ||
      null;
  
  
    // ==========================================
    // TOGGLE
    // ==========================================
  
    const toggleSection = (section) => {
  
      setOpenSection(
        openSection === section
          ? null
          : section
      );
  
    };
  
  
    // ==========================================
    // SAVE
    // ==========================================
  
    const savePrivacy = async () => {
  
      if (!profile) return;
  
      try {
  
        setSaving(true);
        setMessage("");
  
        await api.put("/profiles/me", {
  
          ...profile,
  
          // Profile visibility
          profileVisible:
            profilePrivacy === "all"
              ? true
              : false,
  
          // Contact visibility
          contactVisible:
            phonePrivacy !== "none"
  
        });
  
        setMessage("Privacy settings updated successfully.");
  
        setTimeout(() => {
          setMessage("");
        }, 3000);
  
      } catch (error) {
  
        console.error(error);
  
        setMessage(
          "Unable to update privacy settings."
        );
  
      } finally {
  
        setSaving(false);
  
      }
  
    };
  
  
    if (!profile) {
  
      return (
        <div className="privacy-page">
          <div className="privacy-loading">
            Loading privacy settings...
          </div>
        </div>
      );
  
    }
  
  
    const fullName =
      `${profile.firstName || ""} ${profile.lastName || ""}`
        .trim();
  
  
    return (
  
      <div className="privacy-page">
  
        <div className="privacy-container">
  
          {/* =====================================
              PAGE HEADER
          ====================================== */}
  
          <div className="privacy-page-header">
  
            <h1>Privacy Options</h1>
  
            <p>
              Control how your profile information
              is displayed to other members.
            </p>
  
          </div>
  
  
          {/* =====================================
              SUCCESS MESSAGE
          ====================================== */}
  
          {message && (
            <div className="privacy-success">
              ✓ {message}
            </div>
          )}
  
  
          {/* =====================================
              PRIVACY CARD
          ====================================== */}
  
          <div className="privacy-card">
  
            {/* ===================================
                DISPLAY NAME
            ==================================== */}
  
            <PrivacyAccordion
              title="Display Name"
              summary={
                displayName === "full"
                  ? fullName || "Your Full Name"
                  : displayName === "hide-last"
                    ? `${profile.firstName || ""} ${(profile.lastName || "").charAt(0)}.`
                    : `${(profile.firstName || "").charAt(0)}. ${profile.lastName || ""}`
              }
              open={openSection === "displayName"}
              onClick={() => toggleSection("displayName")}
            >
  
              <div className="privacy-editor">
  
                <div className="privacy-field-title">
                  Full Name
                </div>
  
                <div className="privacy-full-name">
                  {fullName || "Not specified"}
  
                  <button
                    type="button"
                    className="privacy-edit-link"
                    onClick={() => window.location.href = "/profile/edit"}
                  >
                    Edit
                  </button>
  
                </div>
  
  
                <div className="privacy-option-label">
                  Display Name as
                </div>
  
  
                <label className="privacy-radio">
  
                  <input
                    type="radio"
                    name="displayName"
                    checked={displayName === "hide-last"}
                    onChange={() =>
                      setDisplayName("hide-last")
                    }
                  />
  
                  <span>
                    Hide my last name
                  </span>
  
                  <small>
                    (
                    {profile.firstName || "First Name"}{" "}
                    {(profile.lastName || "").charAt(0)}
                    .)
                  </small>
  
                </label>
  
  
                <label className="privacy-radio">
  
                  <input
                    type="radio"
                    name="displayName"
                    checked={displayName === "hide-first"}
                    onChange={() =>
                      setDisplayName("hide-first")
                    }
                  />
  
                  <span>
                    Hide my first name
                  </span>
  
                  <small>
                    (
                    {(profile.firstName || "").charAt(0)}
                    .{" "}
                    {profile.lastName || "Last Name"}
                    )
                  </small>
  
                </label>
  
  
                <label className="privacy-radio">
  
                  <input
                    type="radio"
                    name="displayName"
                    checked={displayName === "full"}
                    onChange={() =>
                      setDisplayName("full")
                    }
                  />
  
                  <span>
                    Show my full name
                  </span>
  
                </label>
  
  
                <div className="privacy-note">
                  Premium members may be able to see
                  your full name depending on your
                  account settings.
                </div>
  
  
                <PrivacyButtons
                  onCancel={() =>
                    setOpenSection(null)
                  }
                  onSave={savePrivacy}
                  saving={saving}
                />
  
              </div>
  
            </PrivacyAccordion>
  
  
            {/* ===================================
                PHOTO
            ==================================== */}
  
            <PrivacyAccordion
              title="Photo"
              summary={
                primaryPhoto
                  ? "Profile Photo"
                  : "No profile photo"
              }
              open={openSection === "photo"}
              onClick={() => toggleSection("photo")}
            >
  
              <div className="privacy-editor">
  
                <div className="photo-preview-title">
                  This is how your photo will look
                  to other members
                </div>
  
                <div className="privacy-photo-area">
  
                  {primaryPhoto ? (
  
                    <img
                      src={`${API}${primaryPhoto.url}`}
                      alt={fullName || "Profile"}
                      className="privacy-profile-photo"
                    />
  
                  ) : (
  
                    <div className="privacy-no-photo">
                      No profile photo uploaded
                    </div>
  
                  )}
  
                </div>
  
  
                <div className="privacy-photo-actions">
  
                  <button
                    type="button"
                    onClick={() =>
                      window.location.href = "/profile/photos"
                    }
                    className="privacy-secondary-button"
                  >
                    Manage Photos
                  </button>
  
                </div>
  
  
                <PrivacyButtons
                  onCancel={() =>
                    setOpenSection(null)
                  }
                  onSave={savePrivacy}
                  saving={saving}
                />
  
              </div>
  
            </PrivacyAccordion>
  
  
            {/* ===================================
                PHONE
            ==================================== */}
  
            <PrivacyAccordion
              title="Phone"
              summary={
                phonePrivacy === "premium"
                  ? "Only Premium Members"
                  : phonePrivacy === "liked"
                    ? "Only Premium Members you like"
                    : phonePrivacy === "none"
                      ? "No one"
                      : "Only your matches"
              }
              open={openSection === "phone"}
              onClick={() => toggleSection("phone")}
            >
  
              <div className="privacy-editor">
  
                <PrivacyRadio
                  name="phonePrivacy"
                  value="premium"
                  checked={phonePrivacy === "premium"}
                  onChange={setPhonePrivacy}
                  text="Only Premium Members"
                />
  
                <PrivacyRadio
                  name="phonePrivacy"
                  value="liked"
                  checked={phonePrivacy === "liked"}
                  onChange={setPhonePrivacy}
                  text="Only Premium Members you like"
                />
  
                <PrivacyRadio
                  name="phonePrivacy"
                  value="none"
                  checked={phonePrivacy === "none"}
                  onChange={setPhonePrivacy}
                  text="No one (Matches won't be able to call you)"
                />
  
                <PrivacyRadio
                  name="phonePrivacy"
                  value="matches"
                  checked={phonePrivacy === "matches"}
                  onChange={setPhonePrivacy}
                  text="Only visible to all your Matches"
                  disabled
                />
  
  
                <PrivacyButtons
                  onCancel={() =>
                    setOpenSection(null)
                  }
                  onSave={savePrivacy}
                  saving={saving}
                />
  
              </div>
  
            </PrivacyAccordion>
  
  
            {/* ===================================
                EMAIL
            ==================================== */}
  
            <PrivacyAccordion
              title="Email"
              summary={
                emailPrivacy === "premium"
                  ? "Visible to all Premium Members"
                  : emailPrivacy === "connect"
                    ? "Visible to Premium Members you wish to connect to"
                    : "Hide my Email Address"
              }
              open={openSection === "email"}
              onClick={() => toggleSection("email")}
            >
  
              <div className="privacy-editor">
  
                <PrivacyRadio
                  name="emailPrivacy"
                  value="premium"
                  checked={emailPrivacy === "premium"}
                  onChange={setEmailPrivacy}
                  text="Visible to all Premium Members"
                />
  
                <PrivacyRadio
                  name="emailPrivacy"
                  value="connect"
                  checked={emailPrivacy === "connect"}
                  onChange={setEmailPrivacy}
                  text="Visible to Premium Members you wish to connect to"
                />
  
                <PrivacyRadio
                  name="emailPrivacy"
                  value="hide"
                  checked={emailPrivacy === "hide"}
                  onChange={setEmailPrivacy}
                  text="Hide my Email Address"
                />
  
                <PrivacyButtons
                  onCancel={() =>
                    setOpenSection(null)
                  }
                  onSave={savePrivacy}
                  saving={saving}
                />
  
              </div>
  
            </PrivacyAccordion>
  
  
            {/* ===================================
                DATE OF BIRTH
            ==================================== */}
  
            <PrivacyAccordion
              title="Date of Birth"
              summary={
                dobPrivacy === "full"
                  ? "Show my full Date of Birth (dd/mm/yyyy)"
                  : "Show only the Month & Year (mm/yyyy)"
              }
              open={openSection === "dob"}
              onClick={() => toggleSection("dob")}
            >
  
              <div className="privacy-editor">
  
                <PrivacyRadio
                  name="dobPrivacy"
                  value="full"
                  checked={dobPrivacy === "full"}
                  onChange={setDobPrivacy}
                  text="Show my full Date of Birth (dd/mm/yyyy)"
                />
  
                <PrivacyRadio
                  name="dobPrivacy"
                  value="month"
                  checked={dobPrivacy === "month"}
                  onChange={setDobPrivacy}
                  text="Show only the Month & Year (mm/yyyy)"
                />
  
  
                <PrivacyButtons
                  onCancel={() =>
                    setOpenSection(null)
                  }
                  onSave={savePrivacy}
                  saving={saving}
                />
  
              </div>
  
            </PrivacyAccordion>
  
  
            {/* ===================================
                ANNUAL INCOME
            ==================================== */}
  
            <PrivacyAccordion
              title="Annual Income"
              summary=""
              open={openSection === "income"}
              onClick={() => toggleSection("income")}
            >
  
              <div className="privacy-editor">
  
                <PrivacyRadio
                  name="incomePrivacy"
                  value="all"
                  checked
                  onChange={() => {}}
                  text="Visible to members according to your privacy settings"
                />
  
                <PrivacyButtons
                  onCancel={() =>
                    setOpenSection(null)
                  }
                  onSave={savePrivacy}
                  saving={saving}
                />
  
              </div>
  
            </PrivacyAccordion>
  
  
            {/* ===================================
                HOROSCOPE
            ==================================== */}
  
            <PrivacyAccordion
              title="Horoscope"
              summary={
                horoscopePrivacy === "all"
                  ? "Visible to all Members"
                  : horoscopePrivacy === "accepted"
                    ? "Visible to contacted and accepted Members"
                    : "Hide from all"
              }
              open={openSection === "horoscope"}
              onClick={() =>
                toggleSection("horoscope")
              }
            >
  
              <div className="privacy-editor">
  
                <PrivacyRadio
                  name="horoscopePrivacy"
                  value="all"
                  checked={horoscopePrivacy === "all"}
                  onChange={setHoroscopePrivacy}
                  text="Visible to all Members"
                />
  
                <PrivacyRadio
                  name="horoscopePrivacy"
                  value="accepted"
                  checked={horoscopePrivacy === "accepted"}
                  onChange={setHoroscopePrivacy}
                  text="Visible to contacted and accepted Members"
                />
  
                <PrivacyRadio
                  name="horoscopePrivacy"
                  value="none"
                  checked={horoscopePrivacy === "none"}
                  onChange={setHoroscopePrivacy}
                  text="Hide from all"
                />
  
  
                <PrivacyButtons
                  onCancel={() =>
                    setOpenSection(null)
                  }
                  onSave={savePrivacy}
                  saving={saving}
                />
  
              </div>
  
            </PrivacyAccordion>
  
  
            {/* ===================================
                SHORTLIST
            ==================================== */}
  
            <PrivacyAccordion
              title="Shortlist Setting"
              summary="Let other Members know that I have shortlisted their Profile"
              open={openSection === "shortlist"}
              onClick={() =>
                toggleSection("shortlist")
              }
            >
  
              <div className="privacy-editor">
  
                <PrivacyRadio
                  name="shortlist"
                  value="yes"
                  checked
                  onChange={() => {}}
                  text="Let other Members know that I have shortlisted their Profile"
                />
  
                <PrivacyButtons
                  onCancel={() =>
                    setOpenSection(null)
                  }
                  onSave={savePrivacy}
                  saving={saving}
                />
  
              </div>
  
            </PrivacyAccordion>
  
  
            {/* ===================================
                DO NOT DISTURB
            ==================================== */}
  
            <PrivacyAccordion
              title="Do Not Disturb"
              summary=""
              open={openSection === "dnd"}
              onClick={() =>
                toggleSection("dnd")
              }
            >
  
              <div className="privacy-editor">
  
                <PrivacyRadio
                  name="dnd"
                  value="off"
                  checked
                  onChange={() => {}}
                  text="Do Not Disturb is currently OFF"
                />
  
                <PrivacyButtons
                  onCancel={() =>
                    setOpenSection(null)
                  }
                  onSave={savePrivacy}
                  saving={saving}
                />
  
              </div>
  
            </PrivacyAccordion>
  
  
            {/* ===================================
                PROFILE PRIVACY
            ==================================== */}
  
            <PrivacyAccordion
              title="Profile Privacy"
              summary={
                profilePrivacy === "all"
                  ? "Visible to all, including unregistered visitors"
                  : "Only visible to registered Members"
              }
              open={openSection === "profilePrivacy"}
              onClick={() =>
                toggleSection("profilePrivacy")
              }
            >
  
              <div className="privacy-editor">
  
                <PrivacyRadio
                  name="profilePrivacy"
                  value="all"
                  checked={profilePrivacy === "all"}
                  onChange={setProfilePrivacy}
                  text="Visible to all, including unregistered visitors (Photo and Name will not be visible on Profile)"
                />
  
                <PrivacyRadio
                  name="profilePrivacy"
                  value="registered"
                  checked={profilePrivacy === "registered"}
                  onChange={setProfilePrivacy}
                  text="Only visible to registered Members"
                />
  
  
                <PrivacyButtons
                  onCancel={() =>
                    setOpenSection(null)
                  }
                  onSave={savePrivacy}
                  saving={saving}
                />
  
              </div>
  
            </PrivacyAccordion>
  
          </div>

          <div className="privacy-safety-links">
            <button type="button" className="privacy-safety-card" onClick={() => window.location.href = "/hidden-blocked-profiles"}>
              <span className="privacy-safety-icon">🛡</span>
              <span><strong>Hidden &amp; Blocked Profiles</strong><small>View and manage profiles you have hidden or blocked.</small></span>
              <b>›</b>
            </button>
            <button type="button" className="privacy-safety-card" onClick={() => window.location.href = "/reports"}>
              <span className="privacy-safety-icon report">⚑</span>
              <span><strong>Report a Problem</strong><small>View profiles you reported, reason, details and report status.</small></span>
              <b>›</b>
            </button>
            <button type="button" className="privacy-safety-card" onClick={() => window.location.href = "/account-settings"}>
              <span className="privacy-safety-icon settings">⚙</span>
              <span><strong>Account Settings</strong><small>Manage your account, security and personal data.</small></span>
              <b>›</b>
            </button>
          </div>
  
        </div>
  
      </div>
  
    );
  }

  function PrivacyAccordion({
    title,
    summary,
    open,
    onClick,
    children
  }) {
  
    return (
      <div className={`privacy-accordion ${open ? "open" : ""}`}>
  
        <button
          type="button"
          className="privacy-accordion-header"
          onClick={onClick}
        >
  
          <div className="privacy-title">
            <span>{title}</span>
  
            {summary && (
              <span className="privacy-summary">
                {summary}
              </span>
            )}
  
          </div>
  
          <span className="privacy-arrow">
            {open ? "⌃" : "⌄"}
          </span>
  
        </button>
  
  
        {open && (
          <div className="privacy-accordion-content">
            {children}
          </div>
        )}
  
      </div>
    );
  }

  function PrivacyRadio({
    name,
    value,
    checked,
    onChange,
    text,
    disabled = false
  }) {
  
    return (
      <label
        className={`privacy-radio ${disabled ? "disabled" : ""}`}
      >
  
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={() => onChange(value)}
        />
  
        <span className="privacy-radio-text">
          {text}
        </span>
  
      </label>
    );
  }
 function PrivacyButtons({
  onCancel,
  onSave,
  saving
}) {

  return (
    <div className="privacy-buttons">

      <button
        type="button"
        className="privacy-cancel"
        onClick={onCancel}
      >
        Cancel
      </button>

      <button
        type="button"
        className="privacy-submit"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Submit"}
      </button>

    </div>
  );
}

export default PrivacyOptionsPage;