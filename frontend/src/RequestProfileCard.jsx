import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { API } from "./api";

function RequestProfileCard({
    request,
    mode,
    onRespond
  }) {
    const [profile, setProfile] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState("");
    const [acceptedMenuOpen, setAcceptedMenuOpen] = useState(false);

    const nav = useNavigate();

    const currentUserId =
      Number(localStorage.getItem("userId"));

    const targetId =
      request.sender?.id === currentUserId
        ? request.receiver?.id
        : request.sender?.id;

    useEffect(() => {
      const load = async () => {
        if (!targetId) {
          setLoading(false);
          return;
        }

        try {
          const profileResponse =
            await api.get(
              "/profiles/user/" + targetId
            );

          setProfile(profileResponse.data);
        } catch (e) {
          console.log(
            "Profile loading failed",
            e
          );
        }

        try {
          const photoResponse =
            await api.get(
              "/photos/user/" + targetId
            );

          const list =
            Array.isArray(photoResponse.data)
              ? photoResponse.data
              : [];

          setPhoto(
            list.find(
              x => x.primaryPhoto
            ) ||
            list[0] ||
            null
          );
        } catch (e) {
          console.log(
            "Photo loading failed",
            e
          );
        }

        setLoading(false);
      };

      load();
    }, [targetId]);

    const respond = async (status) => {
      if (busy) return;

      setAcceptedMenuOpen(false);

      setBusy(true);
      setActionError("");

      try {
        await onRespond(
          request.id,
          status
        );
      } catch (e) {
        setActionError(
          e.response?.data?.message ||
          "Unable to update request"
        );
      } finally {
        setBusy(false);
      }
    };

    if (loading) {
      return (
        <div className="premium-sent-card loading">
          Loading profile...
        </div>
      );
    }

    const name =
      profile
        ? `${profile.firstName || "Member"} ${
            profile.lastName || ""
          }`.trim()
        : "Member";

    const age =
      profile?.dateOfBirth
        ? (() => {
            const dob =
              new Date(
                profile.dateOfBirth
              );

            const today =
              new Date();

            let years =
              today.getFullYear() -
              dob.getFullYear();

            const month =
              today.getMonth() -
              dob.getMonth();

            if (
              month < 0 ||
              (
                month === 0 &&
                today.getDate() < dob.getDate()
              )
            ) {
              years--;
            }

            return years;
          })()
        : null;

    const location =
      [
        profile?.city,
        profile?.state
      ]
        .filter(Boolean)
        .join(", ");

    const religionCommunity =
      [
        profile?.religion,
        profile?.community
      ]
        .filter(Boolean)
        .join(" , ");

    const education =
      profile?.education ||
      "Education not specified";

    const profession =
      profile?.profession ||
      "Profession not specified";

    const isAccepted =
      request.status === "ACCEPTED";

    // These UI changes apply ONLY to the Accepted tab.
    // Sent / Received / Contacts cards keep their existing behavior.
    const isAcceptedTab = mode === "accepted";

    const formatHeight = (value) => {
      if (value === null || value === undefined || value === "") {
        return "";
      }

      const raw = String(value).trim();

      // Convert values such as 5.6 / 5.6 ft into 5'6.
      const match = raw.match(/^(\d+)\.(\d+)(?:\s*(?:ft|feet))?$/i);

      if (match) {
        return `${match[1]}'${match[2]}`;
      }

      return raw;
    };

    const formattedHeight = formatHeight(profile?.height);

    const openProfile = () => {
      if (targetId) {
        nav("/profile-view/" + targetId);
      }
    };

    const handleAcceptedCardClick = (e) => {
      if (!isAcceptedTab) return;

      // Keep Call / WhatsApp / Chat / menu buttons independent.
      if (e.target.closest("button, a, input, select, textarea")) {
        return;
      }

      openProfile();
    };

    const handleAcceptedCardKeyDown = (e) => {
      if (!isAcceptedTab || e.target !== e.currentTarget) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProfile();
      }
    };

    // Check if the current mode is "contacts"
    const isContactsMode = mode === "contacts";

    return (
      <article
        className={`premium-sent-card request-mode-${mode === "requests-accepted" ? "accepted" : mode}`}
        onClick={isAcceptedTab ? handleAcceptedCardClick : undefined}
        onKeyDown={isAcceptedTab ? handleAcceptedCardKeyDown : undefined}
        role={isAcceptedTab ? "link" : undefined}
        tabIndex={isAcceptedTab ? 0 : undefined}
        aria-label={isAcceptedTab ? `Open ${name} profile` : undefined}
      >

        {/* =================================================
            PHOTO
        ================================================= */}

        <div className="premium-sent-photo-area">

          {(mode === "accepted" || mode === "requests-accepted" || mode === "contacts") && isAccepted && (
            <div className="accepted-connection-menu-wrap">
              <button
                type="button"
                className="accepted-connection-menu-button"
                aria-label="Connection options"
                onClick={(e) => {
                  e.stopPropagation();
                  setAcceptedMenuOpen(v => !v);
                }}
              >
                ⋮
              </button>

              {acceptedMenuOpen && (
  <div
    className="accepted-connection-menu"
    onClick={(e) => e.stopPropagation()}
  >
    <div className="accepted-menu-title">
      CONNECTION OPTIONS
    </div>

    <button
      type="button"
      className="accepted-cancel-menu-item"
      disabled={busy}
      onClick={() => respond("WITHDRAWN")}
    >
      Cancel Accepted
    </button>

    <button
      type="button"
      className="accepted-cancel-menu-close"
      onClick={() => setAcceptedMenuOpen(false)}
    >
      Cancel
    </button>
  </div>
)}
            </div>
          )}

          <button
            type="button"
            className="premium-sent-photo-button"
            onClick={() =>
              nav(
                "/profile-view/" +
                targetId
              )
            }
          >

            {photo ? (
              <img
                src={`${API}${photo.url}`}
                alt={name}
                className="premium-sent-photo"
              />
            ) : (
              <div className="premium-sent-avatar">
                {name
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

          </button>

          <div className="premium-photo-badge">
            Goswami Profile
          </div>

        </div>


        {/* =================================================
            CENTER CONTENT
        ================================================= */}

        <div className="premium-sent-main">

          <div className="premium-sent-header">

            <div>

              <button
                type="button"
                className="premium-sent-name"
                onClick={() =>
                  nav(
                    "/profile-view/" +
                    targetId
                  )
                }
              >
                {name}
              </button>

              <div className="premium-sent-online">
                <span></span>
                Active recently
              </div>

            </div>

            <div className="premium-sent-date">
              {request.createdAt
                ? new Date(
                    request.createdAt
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    }
                  )
                : ""}
            </div>

          </div>


          <div className="premium-sent-divider"></div>


          {/* PROFILE DETAILS */}

          <div className="premium-sent-details">

            {isAcceptedTab ? (
              <>
                <span className="accepted-primary-details">
                  {[
                    age !== null ? `${age} yrs` : "",
                    formattedHeight,
                    profile?.profession ? profession : ""
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>

                {religionCommunity && (
                  <span>
                    {religionCommunity}
                  </span>
                )}

                {location && (
                  <span>
                    {location}
                  </span>
                )}

                <span>
                  {education}
                </span>
              </>
            ) : (
              <>
                {age !== null && (
                  <span>
                    {age} yrs
                  </span>
                )}

                {profile?.height && (
                  <span>
                    {profile.height}
                  </span>
                )}

                {religionCommunity && (
                  <span>
                    {religionCommunity}
                  </span>
                )}

                {location && (
                  <span>
                    {location}
                  </span>
                )}

                <span>
                  {education}
                </span>

                <span>
                  {profession}
                </span>
              </>
            )}

          </div>


          {/* ABOUT */}

          <div className="premium-sent-about">

            {profile?.aboutMe
              ? profile.aboutMe.length > 180
                ? profile.aboutMe.substring(
                    0,
                    180
                  ) + "..."
                : profile.aboutMe
              : "This member has not added an introduction yet."}

          </div>


          {actionError && (
            <div className="premium-sent-error">
              {actionError}
            </div>
          )}


          {/* ACTIONS */}

          <div className="premium-sent-actions">

            <button
              type="button"
              className="premium-view-profile-btn"
              onClick={() =>
                nav(
                  "/profile-view/" +
                  targetId
                )
              }
            >
              View Profile
            </button>


            {/* SENT */}

            {mode === "sent" && (
              <span
                className={
                  isAccepted
                    ? "premium-request-status accepted"
                    : "premium-request-status"
                }
              >
                {isAccepted
                  ? "✓ Accepted"
                  : "✓ Interest Sent"}
              </span>
            )}


            {/* RECEIVED / PENDING */}

            {(mode === "received" ||
              mode === "requests-pending") && (
              <>
                <button
                  type="button"
                  className="premium-accept-btn"
                  disabled={busy}
                  onClick={() =>
                    respond("ACCEPTED")
                  }
                >
                  {busy
                    ? "Please wait..."
                    : "Accept"}
                </button>

                <button
                  type="button"
                  className="premium-decline-btn"
                  disabled={busy}
                  onClick={() =>
                    respond("REJECTED")
                  }
                >
                  Decline
                </button>
              </>
            )}


            {/* ACCEPTED / CONTACTS */}

            {(mode === "accepted" ||
              mode === "requests-accepted" ||
              mode === "contacts") && (
              <button
                type="button"
                className="premium-chat-btn"
                onClick={() =>
                  nav(
                    "/chat/" +
                    targetId
                  )
                }
              >
                💬 Chat
              </button>
            )}

          </div>

        </div>


        {/* =================================================
            RIGHT CONTACT PANEL
            This section is now specifically for the 'contacts' mode on mobile.
            For desktop, it remains as a side panel.
            For mobile, it will be hidden by default and shown as a horizontal row via CSS.
        ================================================= */}

        {(mode === "sent" ||
          mode === "accepted" ||
          mode === "requests-accepted" ||
          mode === "contacts") && (

          <div className="premium-contact-panel">

            <div className="premium-contact-title">
              Connect directly
            </div>

            <div className="premium-contact-subtitle">
              Contact details become available
              after connection.
            </div>


            {/* CALL */}

            <button
              type="button"
              className="premium-contact-btn call"
              onClick={() => {

                const phone =
                  profile?.mobileNumber ||
                  profile?.phone ||
                  profile?.user?.mobileNumber ||
                  profile?.user?.phone ||
                  "";

                const cleanPhone =
                  String(phone).replace(
                    /\D/g,
                    ""
                  );

                if (!cleanPhone) {
                  setActionError(
                    "Phone number is not available."
                  );
                  return;
                }

                const callNumber =
                  cleanPhone.length === 10
                    ? `+91${cleanPhone}`
                    : `+${cleanPhone}`;

                window.location.href =
                  `tel:${callNumber}`;
              }}
            >
              <svg
                className="call-logo"
                viewBox="0 0 512 512"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M164.9 24.6c-7.7-17.8-28.3-25.8-46.4-18.1L39.9 39.8C24.8 46.2 15.3 61.8 17.1 78.1c18.2 165.9 91.5 307.4 235.1 451 143.6 143.6 285.1 216.9 451 235.1 16.3 1.8 31.9-7.7 38.3-22.8l33.3-78.6c7.7-18.1-.3-38.7-18.1-46.4l-87.9-37.7c-15.1-6.5-32.7-2.1-43.1 10.7l-40.5 49.4c-72.6-34.7-131.4-93.5-166.1-166.1l49.4-40.5c12.8-10.4 17.2-28 10.7-43.1l-37.7-87.9c-7.7-17.8-28.3-25.8-46.4-18.1l-78.6 33.3C191.8 315 164.2 249.7 159.5 177.6l49.4-40.5c12.8-10.4 17.2-28 10.7-43.1L164.9 24.6z"
                />
              </svg>
              Call
            </button>


            {/* WHATSAPP */}

            <button
              type="button"
              className="premium-contact-btn whatsapp"
              onClick={() => {

                const phone =
                  profile?.mobileNumber ||
                  profile?.phone ||
                  profile?.user?.mobileNumber ||
                  profile?.user?.phone ||
                  "";

                const cleanPhone =
                  String(phone).replace(
                    /\D/g,
                    ""
                  );

                if (!cleanPhone) {
                  setActionError(
                    "WhatsApp number is not available."
                  );
                  return;
                }

                const whatsappNumber =
                  cleanPhone.length === 10
                    ? `91${cleanPhone}`
                    : cleanPhone;

                window.open(
                  `https://wa.me/${whatsappNumber}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            >
              <svg
                className="whatsapp-logo"
                viewBox="0 0 448 512"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"
                />
              </svg>
              WhatsApp
            </button>


            {/* SHAADI CHAT */}

            <button
              type="button"
              className="premium-contact-btn chat"
              onClick={() =>
                nav(
                  "/chat/" +
                  targetId
                )
              }
            >
              <span>💬</span>
              Chat
            </button>

          </div>

        )}

      </article>
    );
  }

  export default RequestProfileCard;