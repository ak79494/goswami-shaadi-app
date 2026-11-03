import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";


export default function ContactSettings() {
	const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [displayOption, setDisplayOption] = useState(
    "Only Premium Members"
  );

  const [editingMobile, setEditingMobile] = useState(false);
  const [savingMobile, setSavingMobile] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/profiles/me");

      setProfile(res.data);

      setMobileNumber(res.data.mobileNumber || "");

      setDisplayOption(
        res.data.contactDisplayOption ||
          "Only Premium Members"
      );
    } catch (error) {
      console.error("Failed to load profile:", error);
      setMessage("Unable to load contact details.");
    }
  };

  // -------------------------
  // SAVE MOBILE NUMBER
  // -------------------------
  const saveMobileNumber = async () => {
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setSavingMobile(true);
      setMessage("");

      const updatedProfile = {
        ...profile,
        mobileNumber: mobileNumber,
        contactDisplayOption: displayOption
      };

      const res = await api.put(
        "/profiles/me",
        updatedProfile
      );

      setProfile(res.data || updatedProfile);

      setEditingMobile(false);

      setMessage(
        "✓ Mobile number updated successfully"
      );

      setTimeout(() => {
        setMessage("");
      }, 4000);

    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
        "Failed to update mobile number."
      );
    } finally {
      setSavingMobile(false);
    }
  };

  // -------------------------
  // SAVE DISPLAY OPTION
  // -------------------------
  const submitDisplayOption = async () => {
    try {
      setSavingStatus(true);
      setMessage("");

      const updatedProfile = {
        ...profile,
        mobileNumber: mobileNumber,
        contactDisplayOption: displayOption
      };

      const res = await api.put(
        "/profiles/me",
        updatedProfile
      );

      setProfile(res.data || updatedProfile);

      setMessage(
        "✓ Contact display status updated successfully"
      );

      setTimeout(() => {
        setMessage("");
      }, 4000);

    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
        "Failed to update contact display status."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  if (!profile) {
    return (
      <div className="contact-settings-page">
        <div className="contact-settings-card">
          <div className="contact-loading">
            Loading contact settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-settings-page">

      <div className="contact-settings-card">

        {/* =========================
            PAGE HEADER
        ========================= */}

        <div className="contact-settings-header">

  <div className="contact-title-area">
    <button
      type="button"
      className="contact-back-button"
      onClick={() => navigate("/profile")}
    >
      ← Back
    </button>

    <h2>My Contact Settings</h2>
  </div>

  <span className="contact-collapse">
    ⌃
  </span>

</div>


        {/* =========================
            SUCCESS / ERROR MESSAGE
        ========================= */}

        {message && (
          <div className="contact-message">
            {message}
          </div>
        )}


        {/* =========================
            CONTACT NUMBER
        ========================= */}

        <div className="contact-number-box">

          <div className="contact-number-header">

            <h3>
              Contact Number
            </h3>

            {!editingMobile && (
              <button
                type="button"
                className="contact-edit-link"
                onClick={() => {
                  setEditingMobile(true);
                  setMessage("");
                }}
              >
                Edit
              </button>
            )}

          </div>


          {!editingMobile ? (

            <div className="contact-number-content">

              <div className="contact-phone">
                +91-{mobileNumber}
              </div>

            </div>

          ) : (

            <div className="mobile-edit-area">

              <label>
                Mobile Number
              </label>

              <div className="mobile-input-row">

                <span className="country-code">
                  +91
                </span>

                <input
                  type="tel"
                  value={mobileNumber}
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="Enter 10 digit mobile number"
                  onChange={(e) => {
                    const value =
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

                    setMobileNumber(value);
                    setMessage("");
                  }}
                />

              </div>


              <div className="mobile-edit-actions">

                <button
                  type="button"
                  className="save-mobile-button"
                  onClick={saveMobileNumber}
                  disabled={savingMobile}
                >
                  {savingMobile
                    ? "Saving..."
                    : "Save"}
                </button>

                

              </div>

            </div>

          )}

        </div>


        {/* =========================
            CONTACT DISPLAY STATUS
        ========================= */}

        <div className="contact-status-box">

          <h3>
            Contact display status
          </h3>


          <label className="contact-radio">

            <input
              type="radio"
              name="contactDisplay"
              value="Only Premium Members"
              checked={
                displayOption ===
                "Only Premium Members"
              }
              onChange={(e) =>
                setDisplayOption(e.target.value)
              }
            />

            <span>
              Only Premium Members
            </span>

          </label>


          <label className="contact-radio">

            <input
              type="radio"
              name="contactDisplay"
              value="Only Premium Members you like"
              checked={
                displayOption ===
                "Only Premium Members you like"
              }
              onChange={(e) =>
                setDisplayOption(e.target.value)
              }
            />

            <span>
              Only Premium Members you like
            </span>

          </label>


          <label className="contact-radio">

            <input
              type="radio"
              name="contactDisplay"
              value="No one (Matches won't be able to call you)"
              checked={
                displayOption ===
                "No one (Matches won't be able to call you)"
              }
              onChange={(e) =>
                setDisplayOption(e.target.value)
              }
            />

            <span>
              No one (Matches won't be able to call you)
            </span>

          </label>


          <label className="contact-radio disabled-option">

            <input
              type="radio"
              disabled
            />

            <span>
              Only visible to all your Matches
              <small>
                {" "}
                (Expires with Membership)
              </small>
            </span>

            <span className="question-mark">
              ?
            </span>

          </label>


          {/* =========================
              SUBMIT BUTTON
          ========================= */}

          <div className="contact-submit-area">

            <button
              type="button"
              className="contact-submit-button"
              onClick={submitDisplayOption}
              disabled={savingStatus}
            >
              {savingStatus
                ? "Saving..."
                : "Submit"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}