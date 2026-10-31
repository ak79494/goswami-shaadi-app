import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./MobileBottomNav.css";

export default function MobileBottomNav({
  requestCount = 0,
  messageCount = 0
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";

  const isMatches =
    location.pathname === "/search";

  const isRequests =
    location.pathname.startsWith("/requests");

  const isChats =
    location.pathname.startsWith("/messages") ||
    location.pathname.startsWith("/chat/");

  const isPremium =
    location.pathname.startsWith("/premium");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");

    navigate("/login", { replace: true });
  };

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile navigation"
    >

      {/* ================= HOME ================= */}
      <Link
        to="/"
        className={`mobile-bottom-nav-item home ${
          isHome ? "active" : ""
        }`}
      >
        <span className="mobile-bottom-icon home-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
          >
            <path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z" fill="currentColor" />
          </svg>
        </span>

        <span className="mobile-bottom-label">
          Home
        </span>
      </Link>


      {/* ================= MY MATCHES ================= */}
      <Link
        to="/search"
        className={`mobile-bottom-nav-item ${
          isMatches ? "active" : ""
        }`}
      >
        <span className="mobile-bottom-icon">
          ♡
        </span>

        <span className="mobile-bottom-label">
          My Matches
        </span>
      </Link>


      {/* ================= REQUESTS ================= */}
      <Link
        to="/requests"
        className={`mobile-bottom-nav-item ${
          isRequests ? "active" : ""
        }`}
      >
        <span className="mobile-bottom-icon-wrap">

          <span className="mobile-bottom-icon">
            ♧
          </span>

          {requestCount > 0 && (
            <span className="mobile-bottom-badge">
              {requestCount > 99 ? "99+" : requestCount}
            </span>
          )}

        </span>

        <span className="mobile-bottom-label">
          Requests
        </span>
      </Link>


      {/* ================= CHATS ================= */}
      <Link
        to="/messages"
        className={`mobile-bottom-nav-item ${
          isChats ? "active" : ""
        }`}
      >
        <span className="mobile-bottom-icon-wrap">

          <span className="mobile-bottom-icon">
            💬
          </span>

          {messageCount > 0 && (
            <span className="mobile-bottom-badge">
              {messageCount > 99 ? "99+" : messageCount}
            </span>
          )}

        </span>

        <span className="mobile-bottom-label">
          Chats
        </span>
      </Link>


      {/* ================= PREMIUM ================= */}
      <Link
        to="/premium"
        className={`mobile-bottom-nav-item premium ${
          isPremium ? "active" : ""
        }`}
      >
        <span className="premium-icon">
          <span className="premium-sparkle">✦</span>
          <span className="premium-diamond">◆</span>
          <span className="premium-sparkle small">✦</span>
        </span>

        <span className="mobile-bottom-label premium-label">
          Premium
        </span>
      </Link>


      {/* ================= LOGOUT ================= */}
      <button
        type="button"
        className="mobile-bottom-nav-item logout"
        onClick={handleLogout}
        aria-label="Logout"
      >
       <span className="logout-icon">
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
</span>

        <span className="mobile-bottom-label">
          Logout
        </span>
      </button>

    </nav>
  );
}