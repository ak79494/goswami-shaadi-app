import React,{useEffect,useState,useRef} from "react";

import { createPortal } from "react-dom";

import { Client } from "@stomp/stompjs";

import {Routes,Route,Navigate,Link,useNavigate,useLocation,useParams} from "react-router-dom";

import api,{API} from "./api";
import { ChildSafetyPage, DeleteAccountPage, PrivacyPolicyPage, TermsPage } from "./LegalPages";

import About from "./About";

import Help from "./Help";

import HelpSupport from "./HelpSupport";

import ContactSettings from "./ContactSettings";

import ContactFilters from "./ContactFilters";

import PrivacyOptionsPage from "./PrivacyOptionsPage";

import HiddenBlockedProfilesPage from "./HiddenBlockedProfilesPage";

import ReportProblemPage from "./ReportProblemPage";

import Premium from "./Premium";

import Biodata from "./Biodata";

import MobileBottomNav from "./MobileBottomNav";

import MobileDailyHome from "./MobileDailyHome";

import RequestProfileCard from "./RequestProfileCard";

import AstroChat from "./AstroChat";

import AstroRecharge from "./AstroRecharge";

import AstroPayment from "./AstroPayment";

import AstroChatSession from "./AstroChatSession";

import mentalWellbeingHero from "/images/mental-wellbeing-hero.png";

import mentalWellbeingIllustration from "/images/mental-wellbeing-illustration.png";

function AstroLegalPage({ type }) {

  const nav = useNavigate();

  const isPrivacy = type === "privacy";

  return (

    <div className="astro-legal-page">

      <header className="astro-legal-header">

        <button type="button" className="astro-legal-back" onClick={() => nav("/astro-chat")} aria-label="Back to AstroChat">

          ←

        </button>

        <img src="/astro-logo.svg" alt="Astro" className="astro-legal-logo" />

        <div className="astro-legal-brand">

          <strong>AstroChat</strong>

          <span>GoswamiJodi</span>

        </div>

      </header>

      <main className="astro-legal-content">

        <h1>{isPrivacy ? "Privacy Policy" : "Terms & Conditions"}</h1>

        <p className="astro-legal-updated">Last updated: September 2026</p>

        {isPrivacy ? (

          <>

            <h2>Privacy</h2>

            <p>GoswamiJodi respects your privacy. Information provided while using AstroChat is handled securely and used to provide astrology consultation services.</p>

            <h2>Information We Collect</h2>

            <p>We may collect account information, profile details, consultation information and payment-related information required to provide the service.</p>

            <h2>Information Protection</h2>

            <p>We take reasonable security measures to protect personal information from unauthorized access, disclosure or misuse.</p>

            <h2>Contact</h2>

            <p>For privacy-related questions, please contact GoswamiJodi support through the application's Help &amp; Support section.</p>

          </>

        ) : (

          <>

            <h2>Use of AstroChat</h2>

            <p>AstroChat provides astrology consultation services through available astrologers. Users should use the service responsibly.</p>

            <h2>Consultation Disclaimer</h2>

            <p>Astrology consultations are provided for guidance and informational purposes only. They should not be considered professional medical, legal or financial advice.</p>

            <h2>Payments</h2>

            <p>Recharge and consultation charges are displayed before the applicable service is started. Please review the amount before confirming a payment.</p>

            <h2>User Responsibility</h2>

            <p>Users are responsible for maintaining the security of their account and for information shared during their use of AstroChat.</p>

          </>

        )}

      </main>

    </div>

  );

}

function Header() {

  const nav = useNavigate();

  const location = useLocation();

  const [count, setCount] = useState(0);

  const [requestCount, setRequestCount] = useState(0);

  const [helpOpen, setHelpOpen] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const [premiumStatus, setPremiumStatus] = useState(null);

  const [loggedInProfile, setLoggedInProfile] = useState(null);

  const [loggedInPhoto, setLoggedInPhoto] = useState(null);

  const [safetyOpen, setSafetyOpen] = useState(false);

  useEffect(() => {

    if (localStorage.getItem("token")) {

      api.get("/notifications/unread-count")

        .then(r => setCount(r.data))

        .catch(() => {});

      api.get("/requests/incoming")

        .then(r => {

          const pending = Array.isArray(r.data)

            ? r.data.filter(x => x.status === "PENDING").length

            : 0;

          setRequestCount(pending);

        })

        .catch(() => {});

      api.get("/premium/status")

        .then(r => setPremiumStatus(r.data))

        .catch(() => setPremiumStatus(null));

    }

  }, [location.pathname]);

  useEffect(() => {

    setMenuOpen(false);

    setHelpOpen(false);

  }, [location.pathname]);

  useEffect(() => {

    const refreshRequestCount = () => {

      if (!localStorage.getItem("token")) return;

      api.get("/requests/incoming")

        .then(r => {

          const pending = Array.isArray(r.data)

            ? r.data.filter(x => x.status === "PENDING").length

            : 0;

          setRequestCount(pending);

        })

        .catch(() => {});

    };

    window.addEventListener("request-count-changed", refreshRequestCount);

    return () => {

      window.removeEventListener("request-count-changed", refreshRequestCount);

    };

  }, []);

  useEffect(() => {

    const closeMenu = (e) => {

      if (e.key === "Escape") {

        setMenuOpen(false);

      }

    };

    document.addEventListener("keydown", closeMenu);

    return () => {

      document.removeEventListener("keydown", closeMenu);

    };

  }, []);

  const logout = () => {

    localStorage.clear();

    setMenuOpen(false);

    nav("/login", { replace: true });

  };

  const go = (path) => {

    setMenuOpen(false);

    nav(path);

  };

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {

  if (!isLoggedIn) {

    setLoggedInProfile(null);

    setLoggedInPhoto(null);

    return;

  }

  api.get("/profiles/me")

    .then((res) => {

      setLoggedInProfile(res.data);

    })

    .catch(() => {

      setLoggedInProfile(null);

    });

  api.get("/photos")

    .then((res) => {

      const photos = Array.isArray(res.data) ? res.data : [];

      if (photos.length > 0) {

        setLoggedInPhoto(photos[0]);

      }

    })

    .catch(() => {

      setLoggedInPhoto(null);

    });

}, [isLoggedIn, location.pathname]);

  return (

    <>

      <header

  className={`header ${

    location.pathname === "/messages"

      ? "messages-page-header"

      : ""

  }`}

>

        {/* HAMBURGER */}

        <button

          type="button"

          className="hamburger-button"

          onClick={() => setMenuOpen(true)}

          aria-label="Open menu"

        >

          <span></span>

          <span></span>

          <span></span>

        </button>

        {/* LOGO */}

        <Link className="brand" to="/">

          Goswami<span>Jodi</span>

        </Link>

        {location.pathname === "/messages" && (

  <>

    <span className="messages-mobile-title">

      Chat

    </span>

    <div className="messages-mobile-actions">

      <button

  type="button"

  className="messages-mobile-icon messages-safety-button"

  onClick={() => setSafetyOpen(true)}

  aria-label="Safety First"

>

  <svg viewBox="0 0 24 24">

    <path d="M12 3l8 3v5c0 5.1-3.4 8.8-8 10-4.6-1.2-8-4.9-8-10V6l8-3z" />

    <path d="M9 12l2 2 4-4" />

  </svg>

</button>

      <button

  type="button"

  className="messages-mobile-icon messages-notification-button"

  onClick={() => nav("/notifications")}

  aria-label="Notifications"

>

  <svg viewBox="0 0 24 24">

    <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

    <path d="M10 21h4" />

  </svg>

  {count > 0 && (

    <span className="messages-notification-badge">

      {count > 99 ? "99+" : count}

    </span>

  )}

</button>

    </div>

  </>

)}

        {/* DESKTOP NAVIGATION */}

        <nav className="main-nav">

          <Link

  to="/"

  className="nav-link mobile-home-link"

>

  Home

</Link>

          <Link

            to="/about"

            className="nav-link"

          >

            About Us

          </Link>

          {/* HELP */}

          <div className="help-menu-wrapper">

            <button

              className="help-menu-button"

              onClick={() => setHelpOpen(!helpOpen)}

            >

              Help

              <span className="help-arrow">

                {helpOpen ? "⌃" : "⌄"}

              </span>

            </button>

            {helpOpen && (

              <div className="help-dropdown">

                <button

                  onClick={() => {

                    setHelpOpen(false);

                    nav("/help-support");

                  }}

                >

                  <span>Help and Support</span>

                  <span>›</span>

                </button>

                <button

                  onClick={() => {

                    setHelpOpen(false);

                    nav("/safe-online");

                  }}

                >

                  <span>Be Safe Online</span>

                  <span>›</span>

                </button>

                <button

                  onClick={() => {

                    setHelpOpen(false);

                    nav("/regional-offices");

                  }}

                >

                  <span>Regional Offices</span>

                  <span>›</span>

                </button>

              </div>

            )}

          </div>

          {isLoggedIn ? (

            <>

              <Link to="/search">Discover</Link>

              <Link to="/requests" className="mobile-request-link">

                Requests

                {requestCount > 0 && (

                  <span className="badge request-badge">{requestCount}</span>

                )}

              </Link>

              <Link to="/shortlists">Shortlist</Link>

             <Link

  to="/profile"

  className="mobile-profile-link"

>

  My Profile

</Link>

              <Link to="/preferences">Preferences</Link>

              <Link to="/messages">Messages</Link>

              <Link to="/notifications">

                Notifications

                {count > 0 && (

                  <span className="badge">{count}</span>

                )}

              </Link>

              {premiumStatus?.active && (

                <Link to="/premium" className="header-premium-member">

                  ✦ Premium

                </Link>

              )}

              <button onClick={logout}>

                Logout

              </button>

            </>

          ) : (

            <>

              <Link to="/register">

                Register

              </Link>

              <Link to="/login">

                Login

              </Link>

            </>

          )}

        </nav>

      </header>

      {/* SAFETY FIRST MOBILE SHEET */}

{safetyOpen && (

  <>

    <div

      className="mobile-safety-overlay"

      onClick={() => setSafetyOpen(false)}

    />

    <div className="mobile-safety-sheet">

      <button

        type="button"

        className="mobile-safety-close"

        onClick={() => setSafetyOpen(false)}

        aria-label="Close safety tips"

      >

        ×

      </button>

      <h2>Safety First</h2>

      <div className="mobile-safety-item">

        <div className="mobile-safety-item-icon lock">

          🔒

        </div>

        <div>

          <strong>Take your time</strong>

          <p>

            Get to know somebody before taking the

            conversation offline

          </p>

        </div>

      </div>

      <div className="mobile-safety-item">

        <div className="mobile-safety-item-icon alert">

          ⚠

        </div>

        <div>

          <strong>Stay Alert</strong>

          <p>

            Beware of urgent money request or quick

            commitments. Never share financial

            information

          </p>

        </div>

      </div>

      <div className="mobile-safety-item">

        <div className="mobile-safety-item-icon report">

          🚩

        </div>

        <div>

          <strong>Report</strong>

          <p>

            If you receive offensive messages or notice

            anything suspicious, use the option to

            report the Profile

          </p>

        </div>

      </div>

      <button

        type="button"

        className="mobile-safety-more"

        onClick={() => {

          setSafetyOpen(false);

          nav("/safe-online");

        }}

      >

        Get more safety tips

        <span>→</span>

      </button>

    </div>

  </>

)}





      {/* OVERLAY */}

      {menuOpen && (

        <div

          className="drawer-overlay"

          onClick={() => setMenuOpen(false)}

        ></div>

      )}





      {/* LEFT SIDE MENU */}

      <aside

        className={`side-drawer ${

          menuOpen ? "side-drawer-open" : ""

        }`}

      >

        {/* DRAWER HEADER */}

        <div className="drawer-header">

  {isLoggedIn ? (

    <div className="mobile-drawer-profile-header">

      <div className="mobile-drawer-profile-photo">

        {loggedInPhoto?.url ? (

          <img

            src={`${API}${loggedInPhoto.url}`}

            alt="My Profile"

          />

        ) : (

          <span>

            {loggedInProfile?.firstName?.charAt(0)?.toUpperCase() || "U"}

          </span>

        )}

      </div>

      <div className="mobile-drawer-profile-info">

        <div className="mobile-drawer-profile-name">

          {`${loggedInProfile?.firstName || ""} ${

            loggedInProfile?.lastName || ""

          }`.trim() || "My Profile"}

          <span className="mobile-drawer-verified">

            ✓

          </span>

        </div>

        <div className="mobile-drawer-profile-id">

          {loggedInProfile?.goswamiId ||

            `GS${String(

              loggedInProfile?.user?.id ||

              loggedInProfile?.id ||

              ""

            ).padStart(4, "0")}`}

        </div>

      </div>

    </div>

  ) : (

    <div className="drawer-logo">

      Goswami<span>Jodi</span>

    </div>

  )}

  <button

    type="button"

    className="drawer-close"

    onClick={() => setMenuOpen(false)}

    aria-label="Close menu"

  >

    ×

  </button>

</div>





        {/* LOGIN / REGISTER */}

        {/* LOGIN / REGISTER */}

<div className="drawer-auth">

  {/* LOGGED-IN USER */}

  {isLoggedIn && (

    <div className="drawer-profile-card">

      <div className="drawer-profile-avatar">

        {loggedInPhoto?.url ? (

          <img

            src={`${API}${loggedInPhoto.url}`}

            alt="My profile"

          />

        ) : (

          <span>

            {loggedInProfile?.firstName?.charAt(0)?.toUpperCase() || "U"}

          </span>

        )}

      </div>

      <div className="drawer-profile-info">

        <div className="drawer-profile-name">

          {`${loggedInProfile?.firstName || ""} ${

            loggedInProfile?.lastName || ""

          }`.trim() || "My Profile"}

          <span className="drawer-profile-verified">

            ✓

          </span>

        </div>

        <div className="drawer-profile-id">

          {loggedInProfile?.goswamiId ||

            `GS${String(

              loggedInProfile?.user?.id ||

              loggedInProfile?.id ||

              ""

            ).padStart(4, "0")}`}

        </div>

      </div>

    </div>

  )}

  {/* LOGIN + REGISTRATION ONLY WHEN LOGGED OUT */}

  {!isLoggedIn && (

    <>

      <button

        type="button"

        onClick={() => go("/login")}

        className="drawer-menu-item"

      >

        <span></span>

        <span>Login</span>

      </button>

      <button

        type="button"

        onClick={() => go("/register")}

        className="drawer-menu-item"

      >

        <span></span>

        <span>Registration</span>

      </button>

    </>

  )}

  {/* MY PROFILE */}

  {isLoggedIn && (

    <>

      <button

        type="button"

        onClick={() => go("/profile")}

        className="drawer-menu-item drawer-view-profile"

      >

        <span>✎</span>

        <span>View and Edit your Profile</span>

      </button>

      {/* DISCOVER MATCHES */}

      <button

        type="button"

        onClick={() => go("/search")}

        className="drawer-menu-item"

      >

        <span></span>

        <span>Discover Matches</span>

      </button>

      {/* BIODATA */}

      <button

        type="button"

        onClick={() => go("/biodata")}

        className="drawer-menu-item"

      >

        <span></span>

        <span>Biodata</span>

      </button>

    </>

  )}

</div>





        {/* MY SHAADI / SETTINGS */}

        {/* MY GOSWAMIJODI / SETTINGS */}

{isLoggedIn && (

  <>

    <div className="drawer-section-title">

      My GoswamiJodi

    </div>

    <button

      onClick={() => go("/account-settings")}

      className="drawer-menu-item"

    >

      <span></span>

      <span>Account Settings</span>

    </button>

    <button

      onClick={() => go("/contact-settings")}

      className="drawer-menu-item"

    >

      <span></span>

      <span>My Contact Settings</span>

    </button>

    <button

      onClick={() => go("/contact-filters")}

      className="drawer-menu-item"

    >

      <span></span>

      <span>Contact Filters</span>

    </button>

    <button

      onClick={() => go("/astro-details")}

      className="drawer-menu-item"

    >

      <span></span>

      <span>Astro Details</span>

    </button>

    <button

  onClick={() => go("/astro-chat")}

  className="drawer-menu-item astro-chat-drawer-item"

>

  <span></span>

  <span>Astro Chat</span>

</button>

    <button

      onClick={() => go("/email-sms-alerts")}

      className="drawer-menu-item"

    >

      <span></span>

      <span>Email / SMS Alerts</span>

    </button>

    <button

      onClick={() => go("/privacy-options")}

      className="drawer-menu-item"

    >

      <span></span>

      <span>Privacy Options</span>

    </button>

    <button

      onClick={() => go("/jodi-live")}

      className="drawer-menu-item"

    >

      <span></span>

      <span>

        Jodi Live

        <b className="drawer-new-badge">NEW</b>

      </span>

    </button>

    <button

      onClick={() => go("/hide-delete-profile")}

      className="drawer-menu-item"

    >

      <span></span>

      <span>Hide / Delete Profile</span>

    </button>

  </>

)}





        {/* HELP & SETTINGS */}

        <div className="drawer-section-title">

          Settings & Help

        </div>

        <button

          onClick={() => go("/help-support")}

          className="drawer-menu-item"

        >

          <span></span>

          <span>Help & Support</span>

        </button>

        <button

          onClick={() => go("/about")}

          className="drawer-menu-item"

        >

          <span></span>

          <span>About Us</span>

        </button>





        {/* PREMIUM */}

        {isLoggedIn && (

          <button

            onClick={() => go("/premium")}

            className="drawer-premium-button"

          >

            ✦ {premiumStatus?.active ? "Premium Active" : "Renew Premium"}

          </button>

        )}





        {/* LOGOUT */}

        {isLoggedIn && (

          <button

            onClick={logout}

            className="drawer-logout-button"

          >

             Logout

          </button>

        )}

        {/* PRIVACY / TERMS - shown below Logout */}

        <div className="drawer-legal-footer">

          <div className="drawer-legal-links">

            <button

              type="button"

              onClick={() => go("/privacy-policy")}

            >

              Privacy Policy

            </button>

            <span className="drawer-legal-divider">|</span>

            <button

              type="button"

              onClick={() => go("/terms-conditions")}

            >

              Terms &amp; Conditions

            </button>

          </div>

          <div className="drawer-legal-copyright">

            Copyright © 2026 GoswamiJodi

          </div>

          <div className="drawer-legal-version">

            Version 1.6.0

          </div>

        </div>

      </aside>

    </>

  );

}

function Shell({ children }) {

  return (

    <>

      {children}

    </>

  );

}

function Auth({mode}){

  const nav = useNavigate();

  const [form,setForm] = useState({

    email:"",

    password:"",

    phone:"",

    gender:"MALE"

  });

  const [showPassword,setShowPassword] = useState(false);
  const [agreed,setAgreed] = useState(false);

  const [error,setError] = useState("");





  const submit = async e => {

    e.preventDefault();

    setError("");

    try {

      const r = await api.post(`/auth/${mode}`, form);

      localStorage.setItem("token", r.data.token);

      localStorage.setItem("userId", r.data.userId);

      localStorage.setItem("userEmail", form.email);

      nav("/");

} catch(x) {

      setError(

        x.response?.data?.message ||

        "Something went wrong"

      );

    }

  };





  return (

    <div className="premium-auth-page">

      {/* =====================================

          LEFT PREMIUM MATRIMONIAL SECTION

          \\===================================== */}

      <div className="premium-auth-brand">

        <div className="premium-brand-content">

          <div className="premium-brand-logo">

            Goswami<span>Jodi</span>

          </div>





          <div className="premium-brand-badge">

            ✦ TRUSTED MATRIMONIAL PLATFORM

          </div>





          <h2>

            Where meaningful

            <span> relationships begin.</span>

          </h2>





          <p>

            Find a life partner who shares your values,

            family traditions and dreams.

          </p>





          <div className="premium-brand-points">

            <div>

              <span>✓</span>

              <strong>Verified Profiles</strong>

            </div>





            <div>

              <span>♡</span>

              <strong>Meaningful Matches</strong>

            </div>





            <div>

              <span>🔒</span>

              <strong>Privacy Protected</strong>

            </div>

          </div>

        </div>

      </div>





      {/* =====================================

          RIGHT LOGIN / REGISTER SECTION

          \\===================================== */}

      <div className="premium-auth-right">

        <div className="premium-login-card">





          {/* LOGO */}

          <div className="premium-login-icon">

            J

          </div>





          {/* HEADING */}

          <div className="premium-login-heading">

            <div className="premium-small-title">

              WELCOME TO GOSWAMIJODI

            </div>





            <h1>

              {mode === "login"

                ? "Welcome back"

                : "Create your profile"}

            </h1>





            <p>

              {mode === "login"

                ? "Login to continue your matrimonial journey"

                : "Start your journey towards a meaningful relationship"}

            </p>

          </div>





          {/* ERROR */}

          {error && (

            <div className="premium-error">

              {error}

            </div>

          )}





          {/* =====================================

              FORM

              \\===================================== */}

          <form onSubmit={submit}>





            {/* REGISTER ONLY */}

            {mode === "register" && (

              <>

                <label className="premium-field-label">

                  Mobile Number

                </label>





                <input

                  className="premium-input"

                  type="tel"

                  placeholder="Enter mobile number"

                  value={form.phone}

                  maxLength="10"

                  onChange={e =>

                    setForm({

                      ...form,

                      phone: e.target.value

                        .replace(/\D/g,"")

                        .slice(0,10)

                    })

                  }

                />





                <label className="premium-field-label">

                  Gender

                </label>





                <select

                  className="premium-input"

                  value={form.gender}

                  onChange={e =>

                    setForm({

                      ...form,

                      gender:e.target.value

                    })

                  }

                >

                  <option value="MALE">

                    Male

                  </option>

                  <option value="FEMALE">

                    Female

                  </option>

                  <option value="OTHER">

                    Other

                  </option>

                </select>

              </>

            )}





            {/* =====================================

                EMAIL

                \\===================================== */}

            <label className="premium-field-label">

              Email Address

            </label>





            <input

              className="premium-input"

              type="email"

              placeholder="Enter your email address"

              required

              value={form.email}

              onChange={e =>

                setForm({

                  ...form,

                  email:e.target.value

                })

              }

            />





            {/* =====================================

                PASSWORD

                \\===================================== */}

            <label className="premium-field-label">

              Password

            </label>





            <div className="premium-password-wrap">

              <input

                className="premium-input"

                type={

                  showPassword

                    ? "text"

                    : "password"

                }

                placeholder="Password (8+ characters)"

                required

                value={form.password}

                onChange={e =>

                  setForm({

                    ...form,

                    password:e.target.value

                  })

                }

              />





              <button

                type="button"

                className="premium-show-password"

                onClick={() =>

                  setShowPassword(!showPassword)

                }

              >

                {showPassword

                  ? "Hide"

                  : "Show"}

              </button>

            </div>





            {mode === "register" && (
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "4px 0 14px", fontSize: 13, lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <span>
                  I am at least 18 years old and looking for a marriage partner. I agree to the{" "}
                  <a href="/terms-conditions" target="_blank" rel="noreferrer">Terms &amp; Conditions</a> and{" "}
                  <a href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>.
                </span>
              </label>
            )}

            {/* =====================================

                MAIN BUTTON

                \\===================================== */}

            <button

              type="submit"

              className="premium-login-button"

            >

              {mode === "login"

                ? " Login"

                : "Create My Account"}

              <span>

                →

              </span>

            </button>





            {/* =====================================

                FORGOT PASSWORD

                \\===================================== */}

            {mode === "login" && (

              <div className="premium-forgot">

                <Link to="/forgot-password">

                  Forgot password?

                </Link>

              </div>

            )}

          </form>





          {/* =====================================

              LOGIN / REGISTER SWITCH

              \\===================================== */}

          <div className="premium-auth-bottom">

            {mode === "login" ? (

              <>

                <span>

                  New to GoswamiJodi?

                </span>

                <Link to="/register">

                  Create your account

                </Link>

              </>

            ) : (

              <>

                <span>

                  Already have an account?

                </span>

                <Link to="/login">

                  Login here

                </Link>

              </>

            )}

          </div>





          {/* =====================================

              SECURITY MESSAGE

              \\===================================== */}

          <div className="premium-secure-footer">

            🔒 Your information is secure & private

          </div>





        </div>

      </div>

    </div>

  );

}

function ForgotPassword() {

  const nav = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState("");

  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {

    e.preventDefault();

    setError("");

    setMessage("");

    setLoading(true);

    try {

      await api.post("/auth/forgot-password", {

        email

      });

      setMessage("OTP has been sent to your registered email.");

      setStep(2);

    } catch (x) {

      setError(

        x.response?.data?.message ||

        "Unable to send OTP"

      );

    } finally {

      setLoading(false);

    }

  };





  const resetPassword = async (e) => {

    e.preventDefault();

    setError("");

    setMessage("");

    setLoading(true);

    try {

      await api.post("/auth/reset-password", {

        email,

        otp,

        newPassword: password

      });

      setMessage(

        "Password changed successfully."

      );

      setStep(3);

    } catch (x) {

      setError(

        x.response?.data?.message ||

        "Invalid or expired OTP"

      );

    } finally {

      setLoading(false);

    }

  };





  return (

    <div className="forgot-premium-page">

      {/* =========================

          LEFT PREMIUM SECTION

         \\========================= */}

      <section className="forgot-premium-left">

        <div className="forgot-left-content">

          <div className="forgot-brand">

            Goswami<span>Jodi</span>

          </div>

          <div className="forgot-badge">

            ✦ TRUSTED MATRIMONIAL PLATFORM

          </div>

          <h1>

            Your journey

            <br />

            <span>continues.</span>

          </h1>

          <p>

            Forgot your password? Don't worry.

            Securely recover your account and

            continue your journey towards finding

            a meaningful life partner.

          </p>





          <div className="forgot-benefits">

            <div className="forgot-benefit">

              <div className="forgot-benefit-icon">

                ✓

              </div>

              <div>

                <strong>Verified Profiles</strong>

                <small>

                  Connect with genuine members

                </small>

              </div>

            </div>





            <div className="forgot-benefit">

              <div className="forgot-benefit-icon">

                ♡

              </div>

              <div>

                <strong>Meaningful Matches</strong>

                <small>

                  Find someone truly compatible

                </small>

              </div>

            </div>





            <div className="forgot-benefit">

              <div className="forgot-benefit-icon">

                🔒

              </div>

              <div>

                <strong>Privacy Protected</strong>

                <small>

                  Your account remains secure

                </small>

              </div>

            </div>

          </div>

        </div>

      </section>





      {/* =========================

          RIGHT SECTION

         \\========================= */}

      <section className="forgot-premium-right">

        <div className="forgot-premium-card">

          <div className="forgot-card-logo">

            J

          </div>





          {/* STEP 1 */}

          {step === 1 && (

            <>

              <div className="forgot-card-badge">

                GOSWAMIJODI ACCOUNT

              </div>

              <h2>

                Forgot Password?

              </h2>

              <p className="forgot-card-subtitle">

                Enter your registered email address

                to securely recover your account.

              </p>





              {error && (

                <div className="forgot-error">

                  {error}

                </div>

              )}





              <form onSubmit={sendOtp}>

                <label>

                  Email Address

                </label>

                <input

                  type="email"

                  placeholder="Enter your registered email"

                  required

                  value={email}

                  onChange={e => setEmail(e.target.value)}

                />





                <button

                  type="submit"

                  className="forgot-primary-btn"

                  disabled={loading}

                >

                  {loading

                    ? "Sending OTP..."

                    : "Send Secure OTP →"

                  }

                </button>

              </form>





              <button

                className="forgot-back-btn"

                onClick={() => nav("/login")}

              >

                ← Back to Login

              </button>

            </>

          )}





          {/* STEP 2 */}

          {step === 2 && (

            <>

              <div className="forgot-card-badge">

                VERIFY YOUR IDENTITY

              </div>

              <h2>

                Verify OTP

              </h2>

              <p className="forgot-card-subtitle">

                Enter the 6-digit OTP sent to

                your registered email address.

              </p>





              {error && (

                <div className="forgot-error">

                  {error}

                </div>

              )}





              {message && (

                <div className="forgot-success">

                  ✓ {message}

                </div>

              )}





              <form onSubmit={resetPassword}>

                <label>

                  Verification Code

                </label>

                <input

                  type="text"

                  inputMode="numeric"

                  placeholder="Enter 6-digit OTP"

                  maxLength="6"

                  required

                  value={otp}

                  onChange={e =>

                    setOtp(

                      e.target.value

                        .replace(/\D/g, "")

                        .slice(0, 6)

                    )

                  }

                />





                <label>

                  New Password

                </label>

                <input

                  type="password"

                  placeholder="New Password (8+ characters)"

                  minLength="8"

                  required

                  value={password}

                  onChange={e =>

                    setPassword(e.target.value)

                  }

                />





                <button

                  type="submit"

                  className="forgot-primary-btn"

                  disabled={loading}

                >

                  {loading

                    ? "Updating Password..."

                    : "Reset Password →"

                  }

                </button>

              </form>





              <button

                className="forgot-back-btn"

                onClick={() => {

                  setStep(1);

                  setError("");

                  setMessage("");

                }}

              >

                ← Change Email

              </button>

            </>

          )}





          {/* STEP 3 */}

          {step === 3 && (

            <>

              <div className="forgot-success-icon">

                ✓

              </div>

              <div className="forgot-card-badge">

                ALL DONE

              </div>

              <h2>

                Password Updated

              </h2>

              <p className="forgot-card-subtitle">

                Your password has been changed

                successfully. You can now login

                securely to GoswamiJodi.

              </p>





              <div className="forgot-success-box">

                ✓ Your account is ready

              </div>





              <button

                className="forgot-primary-btn"

                onClick={() => nav("/login")}

              >

                Go to Login →

              </button>

            </>

          )}





          {/* SECURITY FOOTER */}

          <div className="forgot-security">

            🔒

            <div>

              <strong>

                Your information is secure & private

              </strong>

              <small>

                GoswamiJodi protects your account information.

              </small>

            </div>

          </div>

        </div>

      </section>

    </div>

  );

}

function Home() {

  if (window.innerWidth <= 700) {

    return <MobileDailyHome />;

  }

  return (

    <main className="premium-home">

      {/* HERO */}

      <section className="premium-hero">

        <div className="premium-hero-overlay"></div>

        <div className="premium-hero-content">

          <div className="premium-badge">

            ✦ TRUSTED MATRIMONIAL PLATFORM

          </div>

          <h1>

            Find Your

            <span> Forever Partner</span>

          </h1>

          <p className="premium-hero-subtitle">

            Discover meaningful connections with people who share

            your values, family traditions and dreams.

          </p>

          <div className="premium-hero-actions">

            <Link

              to="/profile/edit"

              className="premium-main-btn"

            >

              Create My Biodata

              <span>→</span>

            </Link>

            <Link

              to="/search"

              className="premium-outline-btn"

            >

              Explore Profiles

            </Link>

          </div>

          <div className="premium-trust-row">

            <div>

              <strong>✓</strong>

              <span>Verified Profiles</span>

            </div>

            <div>

              <strong>♡</strong>

              <span>Meaningful Matches</span>

            </div>

            <div>

              <strong>🔒</strong>

              <span>Privacy Protected</span>

            </div>

          </div>

        </div>

      </section>





      {/* TRUST STATS */}

      <section className="premium-stats">

        <div className="premium-stat">

          <div className="premium-stat-icon">♡</div>

          <div>

            <strong>10,000+</strong>

            <span>Registered Members</span>

          </div>

        </div>

        <div className="premium-stat">

          <div className="premium-stat-icon">✓</div>

          <div>

            <strong>Verified</strong>

            <span>Genuine Profiles</span>

          </div>

        </div>

        <div className="premium-stat">

          <div className="premium-stat-icon">💞</div>

          <div>

            <strong>Meaningful</strong>

            <span>Relationship Focused</span>

          </div>

        </div>

        <div className="premium-stat">

          <div className="premium-stat-icon">✅</div>

          <div>

            <strong>100%</strong>

            <span>Privacy First</span>

          </div>

        </div>

      </section>





      {/* WHY GOSWAMIJODI */}

      <section className="premium-features">

        <div className="premium-section-heading">

          <span>WHY GOSWAMIJODI</span>

          <h2>

            A Better Way To Find

            <strong> Your Life Partner</strong>

          </h2>

          <p>

            We bring together compatibility, family values and

            modern technology to make your matrimonial journey

            simple and meaningful.

          </p>

        </div>





        <div className="premium-feature-grid">

          <div className="premium-feature-card">

            <div className="premium-feature-icon">💑</div>

            <h3>Compatibility First</h3>

            <p>

              Discover profiles based on preferences,

              values, lifestyle and compatibility.

            </p>

          </div>

          <div className="premium-feature-card">

            <div className="premium-feature-icon">🛡️</div>

            <h3>Trusted & Secure</h3>

            <p>

              Your privacy matters. Connect confidently

              in a safe matrimonial environment.

            </p>

          </div>

          <div className="premium-feature-card">

            <div className="premium-feature-icon">👨‍👩‍👧</div>

            <h3>Family Values</h3>

            <p>

              Find someone who respects relationships,

              traditions and family values.

            </p>

          </div>

          <div className="premium-feature-card">

            <div className="premium-feature-icon">✨</div>

            <h3>Premium Experience</h3>

            <p>

              Enjoy a clean, modern and personalized

              experience designed for serious relationships.

            </p>

          </div>

        </div>

      </section>





      {/* CTA */}

      <section className="premium-final-cta">

        <div>

          <span>YOUR JOURNEY STARTS HERE</span>

          <h2>

            Ready to Meet Someone

            <strong> Truly Special?</strong>

          </h2>

          <p>

            Create your profile and start discovering

            meaningful matrimonial connections today.

          </p>

          <Link

            to="/profile/edit"

            className="premium-main-btn"

          >

            Create My Biodata

            <span>→</span>

          </Link>

        </div>

      </section>

    </main>

  );

}

const emptyProfile={firstName:"",lastName:"",dateOfBirth:"",city:"",state:"", mobileNumber: "", gender: "",country:"India",motherTongue:"",religion:"",community:"",subCommunity:"",maritalStatus:"Never Married",height:"",bodyType:"",education:"",college:"",profession:"",company:"",incomeRange:"",aboutMe:"",hobbies:[],familyType:"",familyValues:"",  fatherName: "",  motherName: "",fatherOccupation:"",motherOccupation:"",siblings:"",lifestyle:"",foodPreference:"",smoking:"",drinking:"", timeOfBirth:"",

  placeOfBirth:"",manglik:"",nakshatra:"",rashi:"",profileVisible:true,contactVisible:false};









const HOBBY_OPTIONS = [

  "Travelling",

  "Music",

  "Reading",

  "Technology",

  "Photography",

  "Fitness",

  "Movies"

];

function InterestHobbiesField({ value, onChange }) {

  const [open, setOpen] = useState(false);

  const [otherText, setOtherText] = useState("");

  const [otherMode, setOtherMode] = useState(false);

  const hobbies = Array.isArray(value) ? value : [];

  const predefined = new Set(HOBBY_OPTIONS);

  const customHobbies = hobbies.filter(h => !predefined.has(h));

  const hasOther = customHobbies.length > 0;

  const toggleHobby = (hobby) => {

    if (hobbies.includes(hobby)) {

      onChange(hobbies.filter(h => h !== hobby));

    } else {

      onChange([...hobbies, hobby]);

    }

  };

  const addOther = () => {

    const entries = otherText

      .split(",")

      .map(x => x.trim())

      .filter(Boolean);

    if (!entries.length) return;

    const next = [...hobbies];

    entries.forEach(hobby => {

      if (!next.some(existing => existing.toLowerCase() === hobby.toLowerCase())) {

        next.push(hobby);

      }

    });

    onChange(next);

    setOtherText("");

  };

  const removeHobby = (hobby) => {

    onChange(hobbies.filter(h => h !== hobby));

  };

  return (

    <div className="full interest-hobbies-field">

      <label>

        <span>Interests &amp; Hobbies</span>

        <button

          type="button"

          className={`hobby-dropdown-trigger ${open ? "open" : ""}`}

          onClick={() => setOpen(v => !v)}

          aria-expanded={open}

        >

          <span>

            {hobbies.length

              ? `${hobbies.length} selected`

              : "Select interests & hobbies"}

          </span>

          <span className="hobby-dropdown-arrow">⌄</span>

        </button>

      </label>

      {open && (

        <div className="hobby-dropdown-menu">

          <div className="hobby-dropdown-title">

            <strong>Select as many as you like</strong>

            <small>No limit on the number of hobbies.</small>

          </div>

          <div className="hobby-option-list">

            {HOBBY_OPTIONS.map(hobby => (

              <label className="hobby-option" key={hobby}>

                <input

                  type="checkbox"

                  checked={hobbies.includes(hobby)}

                  onChange={() => toggleHobby(hobby)}

                />

                <span>{hobby}</span>

              </label>

            ))}

          </div>

          <div className="hobby-other-box">

            <label className="hobby-option hobby-other-toggle">

              <input

                type="checkbox"

                checked={otherMode || hasOther}

                onChange={e => {

                  const checked = e.target.checked;

                  setOtherMode(checked);

                  if (!checked) {

                    onChange(hobbies.filter(h => predefined.has(h)));

                    setOtherText("");

                  }

                }}

              />

              <span>Other</span>

            </label>

            {(otherMode || hasOther) && (

              <>

                <div className="hobby-other-input-row">

                  <input

                    type="text"

                    value={otherText}

                    onChange={e => setOtherText(e.target.value)}

                    onKeyDown={e => {

                      if (e.key === "Enter") {

                        e.preventDefault();

                        addOther();

                      }

                    }}

                    placeholder="Type your hobby and press Add"

                  />

                  <button type="button" onClick={addOther}>Add</button>

                </div>

                <small>You can add multiple custom hobbies. Separate multiple names with commas.</small>

              </>

            )}

          </div>

        </div>

      )}

      {hobbies.length > 0 && (

        <div className="hobby-chips">

          {hobbies.map(hobby => (

            <span className="hobby-chip" key={hobby}>

              {hobby}

              <button

                type="button"

                onClick={() => removeHobby(hobby)}

                aria-label={`Remove ${hobby}`}

              >

                ×

              </button>

            </span>

          ))}

        </div>

      )}

    </div>

  );

}

function Profile() {

  const [p, setP] = useState(emptyProfile);

  const [photos, setPhotos] = useState([]);

  const [msg, setMsg] = useState("");

  const [errors, setErrors] = useState({});

  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [actionId, setActionId] = useState(null);

  const loadPhotos = async () => {

    const r = await api.get("/photos");

    setPhotos(r.data);

  };

  useEffect(() => {

    api.get("/profiles/me")

      .then(r =>

        setP({

          ...emptyProfile,

          ...r.data,

          dateOfBirth: r.data.dateOfBirth || ""

        })

      )

      .catch(() => {});

    loadPhotos().catch(() => {});

  }, []);

  // Save Biodata

  // Save Biodata

const save = async e => {

  e.preventDefault();

  setMsg("");

  setErrors({});

  const requiredFields = {

    firstName: "First name is required",

    lastName: "Last name is required",

    dateOfBirth: "Date of birth is required",

    city: "City is required",

    state: "State is required",

    mobileNumber: "Mobile number is required",

    motherTongue: "Mother tongue is required",

    religion: "Religion is required",

    community: "Community is required",

    subCommunity: "Sub-community is required",

    maritalStatus: "Marital status is required",

    height: "Height is required",

    education: "Education is required",

    profession: "Profession is required",

    incomeRange: "Income range is required",

    smoking: "Smoking selection is required",

    drinking: "Drinking selection is required"

  };

  const newErrors = {};

  Object.keys(requiredFields).forEach(key => {

    if (!p[key] || String(p[key]).trim() === "") {

      newErrors[key] = requiredFields[key];

    }

  });

  // Mobile number validation

if (

  p.mobileNumber &&

  !/^[0-9]{10}$/.test(p.mobileNumber)

) {

  newErrors.mobileNumber =

    "Enter a valid 10-digit mobile number";

}

  if (Object.keys(newErrors).length > 0) {

    setErrors(newErrors);

    setMsg("Please fill all required fields.");

    return;

  }

  setSaving(true);

  try {

    await api.put("/profiles/me", p);

    setMsg("✓ Biodata saved successfully");

    setTimeout(() => {

      setMsg("");

    }, 4000);

  } catch (x) {

    setMsg(

      x.response?.data?.message ||

      "Failed to save biodata"

    );

  } finally {

    setSaving(false);

  }

};

  // Upload Photo

  const upload = async e => {

    const f = e.target.files?.[0];

    if (!f) return;

    if (!f.type.startsWith("image/")) {

      setMsg("Please select a valid image file.");

      return;

    }

    if (f.size > 10 * 1024 * 1024) {

      setMsg("Image size should be less than 10 MB.");

      return;

    }

    setUploading(true);

    setMsg("");

    try {

      const d = new FormData();

      d.append("file", f);

      await api.post("/photos", d, {

        headers: {

          "Content-Type": "multipart/form-data"

        }

      });

      await loadPhotos();

      setMsg("✓ Photo uploaded successfully");

      setTimeout(() => {

        setMsg("");

      }, 4000);

    } catch (x) {

      setMsg(

        x.response?.data?.message ||

        "Failed to upload photo"

      );

    } finally {

      setUploading(false);

      // Same file dobara select karne ke liye

      e.target.value = "";

    }

  };

  // Delete Photo

  const del = async id => {

    setActionId(id);

    setMsg("");

    try {

      await api.delete("/photos/" + id);

      await loadPhotos();

      setMsg("✓ Photo deleted successfully");

      setTimeout(() => {

        setMsg("");

      }, 3000);

    } catch (x) {

      setMsg(

        x.response?.data?.message ||

        "Failed to delete photo"

      );

    } finally {

      setActionId(null);

    }

  };

  // Set Primary Photo

  const primary = async id => {

    setActionId(id);

    setMsg("");

    try {

      await api.patch("/photos/" + id + "/primary");

      await loadPhotos();

      setMsg("✓ Primary photo updated successfully");

      setTimeout(() => {

        setMsg("");

      }, 3000);

    } catch (x) {

      setMsg(

        x.response?.data?.message ||

        "Failed to update primary photo"

      );

    } finally {

      setActionId(null);

    }

  };

  // Common input field

// Common input field

const field = (k, label, type = "text", required = false) => (

  <label>

    <span>

      {label}

      {required && (

        <span className="required-star">*</span>

      )}

    </span>

    <input

      type={k === "mobileNumber" ? "tel" : type}

      value={p[k] ?? ""}

      maxLength={k === "mobileNumber" ? 10 : undefined}

      inputMode={k === "mobileNumber" ? "numeric" : undefined}

      pattern={k === "mobileNumber" ? "[0-9]{10}" : undefined}

      onChange={e => {

        let value = e.target.value;

        // Mobile number: only 10 digits

        if (k === "mobileNumber") {

          value = value.replace(/\D/g, "").slice(0, 10);

        }

        setP({

          ...p,

          [k]: value

        });

        if (errors[k]) {

          setErrors({

            ...errors,

            [k]: ""

          });

        }

      }}

    />

    {errors[k] && (

      <span className="field-error">

        {errors[k]}

      </span>

    )}

  </label>

);





// Common select field

const selectField = (

  k,

  label,

  options,

  required = false

) => (

  <label>

    <span>

      {label}

      {required && (

        <span className="required-star">*</span>

      )}

    </span>

    <select

      value={p[k] ?? ""}

      onChange={e => {

        setP({

          ...p,

          [k]: e.target.value

        });

        if (errors[k]) {

          setErrors({

            ...errors,

            [k]: ""

          });

        }

      }}

    >

      <option value="">

        Select {label}

      </option>

      {options.map(option => (

        <option key={option} value={option}>

          {option}

        </option>

      ))}

    </select>

    {errors[k] && (

      <span className="field-error">

        {errors[k]}

      </span>

    )}

  </label>

);





  return (

    <div>

      <h2>My Biodata</h2>

      {/* Success / Error Message */}

      {msg && (

        <div className="success">

          {msg}

        </div>

      )}

      {/* ================= PHOTO SECTION ================= */}

      <div className="card">

        <h3>

          Profile Photos ({photos.length}/10)

        </h3>

        <div className="photos">

  {photos.map(x => (

    <div className="photo" key={x.id}>

      <div className="photo-image-wrapper">

        <img

          src={`${API}${x.url}`}

          alt="Profile"

          className="profile-photo"

          onError={e => {

            e.currentTarget.src =

              "https://via.placeholder.com/300x350?text=Photo";

          }}

        />

      </div>

      <small>

        {x.primaryPhoto ? "✓ Primary Photo" : ""}

      </small>

      <div className="photo-actions">

        {!x.primaryPhoto && (

          <button

            type="button"

            disabled={actionId === x.id}

            onClick={() => primary(x.id)}

          >

            {actionId === x.id ? "Updating..." : "Set Primary"}

          </button>

        )}

        <button

          type="button"

          disabled={actionId === x.id}

          onClick={() => del(x.id)}

        >

          {actionId === x.id ? "Deleting..." : "Delete"}

        </button>

      </div>

    </div>

  ))}

</div>

        {/* Upload */}

        {photos.length < 10 && (

          <div className="upload-area">

            <label className="upload-button">

              {uploading

                ? "Uploading..."

                : "+ Upload Photo"}

              <input

                type="file"

                accept="image/*"

                onChange={upload}

                disabled={uploading}

                hidden

              />

            </label>

            <small>

              JPG, JPEG, PNG • Maximum 10 MB

            </small>

          </div>

        )}

      </div>





      {/* ================= BIODATA FORM ================= */}

      <form

        className="card form-grid"

        onSubmit={save}

      >

        {field("firstName", "First name", "text", true)}

{field("lastName", "Last name", "text", true)}

{field("dateOfBirth", "Date of birth", "date", true)}

{field("city", "City", "text", true)}

{field("state", "State", "text", true)}

{field("mobileNumber", "Mobile number", "tel", true)}

{selectField(

  "gender",

  "Gender",

  [

    "Male",

    "Female"

  ],

  true

)}

{field("motherTongue", "Mother tongue", "text", true)}

{selectField(

  "religion",

  "Religion",

  [

    "Hindu"

  ],

  true

)}

{selectField(

  "community",

  "Community",

  [

    "Brahmin-Goswami",

    "Brahmin"

  ],

  true

)}

{selectField(

  "subCommunity",

  "Sub-community",

  [

    "Goswami",

    "Giri",

    "Puri",

    "Bharti",

    "Tirtha",

    "Vana",

    "Aranya",

    "Parvata",

    "Ashrama",

    "Saraswati",

    "Sagara"

  ],

  true

)}

{selectField(

  "maritalStatus",

  "Marital status",

  [

    "Never Married",

    "Married",

    "Divorced",

    "Widowed"

  ],

  true

)}

{selectField(

  "height",

  "Height",

  [

    "4.5",

    "4.6",

    "4.7",

    "4.8",

    "4.9","4.10","4.11",

    "5.0",

    "5.1",

    "5.2",

    "5.3",

    "5.4",

    "5.5",

    "5.6",

    "5.7",

    "5.8",

    "5.9","5.10","5.11",

    "6.0",

    "6.1",

    "6.2",

    "6.3",

    "6.4",

    "6.5",

    "6.6",

    "6.7",

    "6.8",

    "6.9","6.10","6.11",

    "7.0"

  ],

  true

)}

        {field("bodyType", "Body type")}

        {field("education", "Education")}

        {field("college", "College")}

        {field("profession", "Profession")}

        {field("company", "Company")}

        {field(

          "incomeRange",

          "Income range"

        )}

        <InterestHobbiesField

          value={p.hobbies}

          onChange={hobbies => setP({ ...p, hobbies })}

        />

        {field(

          "familyType",

          "Family type"

        )}

        {field(

          "familyValues",

          "Family values"

        )}

        {field("fatherName", "Father's name")}

        {field("motherName", "Mother's name")}

        {field(

          "fatherOccupation",

          "Father occupation"

        )}

        {field(

          "motherOccupation",

          "Mother occupation"

        )}

        {field(

          "siblings",

          "Siblings",

          "number"

        )}

        {field("lifestyle", "Lifestyle")}

        {field(

          "foodPreference",

          "Food preference"

        )}

        {selectField("smoking", "Smoking", ["Yes", "No"], true)}

        {selectField("drinking", "Drinking", ["Yes", "No"], true)}

        {/* ================= ASTRO DETAILS ================= */}

<div className="full astro-edit-section">

  <div className="form-grid">

    {field(

      "timeOfBirth",

      "Time of Birth",

      "time"

    )}

    {field(

      "placeOfBirth",

      "Place of Birth"

    )}

    {selectField(

      "manglik",

      "Manglik",

      ["Yes", "No", "Don't Know"]

    )}

    {field(

      "nakshatra",

      "Nakshatra"

    )}

    {field(

      "rashi",

      "Rashi"

    )}

  </div>

</div>

        {/* About Me */}

        <label className="full">

          About me

          <textarea

            value={p.aboutMe ?? ""}

            onChange={e =>

              setP({

                ...p,

                aboutMe: e.target.value

              })

            }

          />

        </label>





        {/* Profile Visible */}

        <label className="full checkbox-row">

          <input

            type="checkbox"

            checked={p.profileVisible}

            onChange={e =>

              setP({

                ...p,

                profileVisible:

                  e.target.checked

              })

            }

          />

          Make profile visible in search

        </label>





        {/* Contact Visible */}

        <label className="full checkbox-row">

          <input

            type="checkbox"

            checked={p.contactVisible}

            onChange={e =>

              setP({

                ...p,

                contactVisible:

                  e.target.checked

              })

            }

          />

          Show contact information to accepted matches

        </label>





        {/* Save Button */}

        <button

          type="submit"

          className="primary full save-biodata-btn"

          disabled={saving}

        >

          {saving

            ? "Saving..."

            : "Save Biodata"}

        </button>

      </form>

    </div>

  );

}









function Preferences(){

 const empty={minAge:21,maxAge:35,preferredGender:"",religions:"",communities:"",cities:"",education:"",profession:"",maritalStatuses:"",foodPreference:"",lifestyle:"",expectations:""};

 const [p,setP]=useState(empty),[msg,setMsg]=useState("");

 useEffect(()=>api.get("/preferences").then(r=>setP({...empty,...r.data})).catch(()=>{}),[]);

 const save=async e=>{e.preventDefault();try{await api.put("/preferences",p);setMsg("Partner preference saved")}catch(x){setMsg(x.response?.data?.message||"Save failed")}};

 return (

  <div className="preferences-page">

    <div className="preferences-header">

      <div>

        <span className="preferences-eyebrow">YOUR MATCH PREFERENCES</span>

        <h1>Partner Preferences</h1>

        <p>

          Tell us what you're looking for and we'll help you find

          more compatible matches.

        </p>

      </div>

      <div className="preferences-header-icon">

        ♡

      </div>

    </div>

    <form className="preferences-card" onSubmit={save}>

      {/* Age & Gender */}

      <div className="preference-section">

        <div className="preference-section-title">

          <span className="preference-icon">♡</span>

          <div>

            <h2>Age & Gender</h2>

            <p>Choose your preferred age range and gender.</p>

          </div>

        </div>

        <div className="preference-grid">

          <label>

            Minimum age

            <input

              type="number"

              value={p.minAge}

              onChange={e =>

                setP({ ...p, minAge: e.target.value })

              }

              min="18"

              max="100"

            />

          </label>

          <label>

            Maximum age

            <input

              type="number"

              value={p.maxAge}

              onChange={e =>

                setP({ ...p, maxAge: e.target.value })

              }

              min="18"

              max="100"

            />

          </label>

          <label>

            Preferred gender

            <select

              value={p.preferredGender}

              onChange={e =>

                setP({ ...p, preferredGender: e.target.value })

              }

            >

              <option value="">Select gender</option>

              <option value="female">Female</option>

              <option value="male">Male</option>

              <option value="any">Any</option>

            </select>

          </label>

          <label>

            Marital status

            <input

              value={p.maritalStatuses || ""}

              onChange={e =>

                setP({ ...p, maritalStatuses: e.target.value })

              }

              placeholder="e.g. Never Married"

            />

          </label>

        </div>

      </div>





      {/* Religion & Community */}

      <div className="preference-section">

        <div className="preference-section-title">

          <span className="preference-icon">♢</span>

          <div>

            <h2>Religion & Community</h2>

            <p>Set your preferred religious and community background.</p>

          </div>

        </div>

        <div className="preference-grid">

          <label>

            Religion

            <input

              value={p.religions || ""}

              onChange={e =>

                setP({ ...p, religions: e.target.value })

              }

              placeholder="e.g. Hindu"

            />

          </label>

          <label>

            Community

            <input

              value={p.communities || ""}

              onChange={e =>

                setP({ ...p, communities: e.target.value })

              }

              placeholder="e.g. Brahmin-Goswami"

            />

          </label>

          <label>

            Mother tongue

            <input

              value={p.motherTongue || ""}

              onChange={e =>

                setP({ ...p, motherTongue: e.target.value })

              }

              placeholder="e.g. Hindi"

            />

          </label>

          <label>

            Preferred cities

            <input

              value={p.cities || ""}

              onChange={e =>

                setP({ ...p, cities: e.target.value })

              }

              placeholder="e.g. Mumbai, Delhi"

            />

          </label>

        </div>

      </div>





      {/* Education & Career */}

      <div className="preference-section">

        <div className="preference-section-title">

          <span className="preference-icon">▣</span>

          <div>

            <h2>Education & Career</h2>

            <p>Tell us about your preferred education and profession.</p>

          </div>

        </div>

        <div className="preference-grid">

          <label>

            Education

            <input

              value={p.education || ""}

              onChange={e =>

                setP({ ...p, education: e.target.value })

              }

              placeholder="e.g. Graduate, BCA, MBA"

            />

          </label>

          <label>

            Profession

            <input

              value={p.profession || ""}

              onChange={e =>

                setP({ ...p, profession: e.target.value })

              }

              placeholder="e.g. Software Engineer"

            />

          </label>

        </div>

      </div>





      {/* Lifestyle */}

      <div className="preference-section">

        <div className="preference-section-title">

          <span className="preference-icon">✦</span>

          <div>

            <h2>Lifestyle & Food</h2>

            <p>Choose lifestyle and food preferences.</p>

          </div>

        </div>

        <div className="preference-grid">

          <label>

            Food preference

            <input

              value={p.foodPreference || ""}

              onChange={e =>

                setP({ ...p, foodPreference: e.target.value })

              }

              placeholder="e.g. Vegetarian"

            />

          </label>

          <label>

            Lifestyle

            <input

              value={p.lifestyle || ""}

              onChange={e =>

                setP({ ...p, lifestyle: e.target.value })

              }

              placeholder="e.g. Simple, Moderate"

            />

          </label>

        </div>

      </div>





      {/* Expectations */}

      <div className="preference-section last-section">

        <div className="preference-section-title">

          <span className="preference-icon">♡</span>

          <div>

            <h2>What are you looking for?</h2>

            <p>Share a few expectations from your future partner.</p>

          </div>

        </div>

        <label className="expectations-field">

          Your expectations

          <textarea

            value={p.expectations || ""}

            onChange={e =>

              setP({ ...p, expectations: e.target.value })

            }

            placeholder="Write something about the partner you are looking for..."

            rows="5"

          />

        </label>

      </div>





      {/* Message */}

      {msg && (

        <div className="preference-message">

          ✓ {msg}

        </div>

      )}





      {/* Actions */}

      <div className="preferences-actions">

        <button

          type="button"

          className="preferences-cancel"

          onClick={() => window.history.back()}

        >

          Cancel

        </button>

        <button

          type="submit"

          className="preferences-save"

        >

          Save Preferences

          <span>→</span>

        </button>

      </div>

    </form>

  </div>

);

}

function Search() {

  const nav = useNavigate();

  const [data, setData] = useState({

    content: [],

    totalElements: 0,

    totalPages: 0

  });

  const [filters, setFilters] = useState({

    city: "",

    religion: "",

    profession: ""

  });

  const [goswamiId, setGoswamiId] = useState("");

  const [idSearching, setIdSearching] = useState(false);

  const [idError, setIdError] = useState("");

  const [showIdSearch, setShowIdSearch] = useState(false);

  const [type, setType] = useState("new");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const searchByGoswamiId = async () => {

  const id = goswamiId.trim();

  if (!id) {

    setIdError("Please enter Goswami ID");

    return;

  }

  setIdSearching(true);

  setIdError("");

  setError("");

  try {

    const r = await api.get(

      "/profiles/goswami/" + encodeURIComponent(id)

    );

    setData({

      content: [r.data],

      totalElements: 1,

      totalPages: 1

    });

  } catch (x) {

    console.error("Goswami ID search failed:", x);

    setData({

      content: [],

      totalElements: 0,

      totalPages: 0

    });

    setIdError(

      x.response?.data?.message ||

      "Goswami ID not found"

    );

  } finally {

    setIdSearching(false);

  }

};





  const load = async () => {

    setLoading(true);

    setError("");

    try {

      const r = await api.get("/profiles/search", {

        params: {

          ...filters,

          type: type,

          page: 0,

          size: 12

        }

      });

      setData(r.data);

    } catch (x) {

      console.error(x);

      setError(

        x.response?.data?.message ||

        "Unable to load profiles"

      );

    } finally {

      setLoading(false);

    }

  };





  useEffect(() => {

    load();

  }, [type]);





  const changeFilter = (key, value) => {

    setFilters({

      ...filters,

      [key]: value

    });

  };





  return (

    <div className="discover-page">

      {/* ================================= */}

      {/* HEADER */}

      {/* ================================= */}

      <div className="discover-header">

        <div>

          <h2>Discover Profiles</h2>

          <p>

            Find meaningful connections based on your preferences.

          </p>

        </div>

      </div>





      {/* ================================= */}

      {/* PROFILE TYPE TABS */}

      {/* ================================= */}

      <div className="profile-tabs">

        <button

          className={type === "new" ? "tab active" : "tab"}

          onClick={() => setType("new")}

        >

           New Profiles

        </button>





        <button

          className={type === "active" ? "tab active" : "tab"}

          onClick={() => setType("active")}

        >

           Active Now

        </button>

        <button

  type="button"

  className="search-id-tab"

  onClick={() => {

    setShowIdSearch(!showIdSearch);

    setIdError("");

  }}

>

   Search ID

</button>

      </div>

      {showIdSearch && (

  <div className="goswami-id-inline-search">

    <input

      type="text"

      value={goswamiId}

      onChange={(e) =>

        setGoswamiId(e.target.value.toUpperCase())

      }

      onKeyDown={(e) => {

        if (e.key === "Enter") {

          searchByGoswamiId();

        }

      }}

      placeholder="Enter Goswami ID e.g. GJ0001"

      autoFocus

    />

    <button

      type="button"

      onClick={searchByGoswamiId}

      disabled={idSearching}

    >

      {idSearching ? "Searching..." : "Search"}

    </button>

    <button

      type="button"

      onClick={() => {

        setShowIdSearch(false);

        setGoswamiId("");

        setIdError("");

      }}

    >

      Cancel

    </button>

    {idError && (

      <span className="goswami-id-error">

        {idError}

      </span>

    )}

  </div>

)}













      {/* ================================= */}

      {/* FILTERS */}

      {/* ================================= */}

      <div className="searchbar modern-searchbar">

        <input

          placeholder="City"

          value={filters.city}

          onChange={e =>

            changeFilter("city", e.target.value)

          }

        />





        <input

          placeholder="Religion"

          value={filters.religion}

          onChange={e =>

            changeFilter("religion", e.target.value)

          }

        />





        <input

          placeholder="Profession"

          value={filters.profession}

          onChange={e =>

            changeFilter("profession", e.target.value)

          }

        />





        <button

          className="primary search-button"

          onClick={load}

        >

          Search

        </button>

      </div>





      {/* ================================= */}

      {/* ERROR */}

      {/* ================================= */}

      {error && (

        <div className="error">

          {error}

        </div>

      )}





      {/* ================================= */}

      {/* LOADING */}

      {/* ================================= */}

      {loading && (

        <div className="loading-card">

          <div className="loader"></div>

          <p>Finding profiles for you...</p>

        </div>

      )}





      {/* ================================= */}

      {/* RESULTS */}

      {/* ================================= */}

      {!loading && data.content?.length > 0 && (

        <>

          <div className="results-header">

            <h3>

              {type === "new"

                ? "New Profiles"

                : "Active Profiles"}

            </h3>

            <span>

              {data.totalElements} profiles found

            </span>

          </div>





          <div className="grid">

            {data.content.map(p => (

              <ProfileCard

                key={p.id}

                p={p}

              />

            ))}

          </div>

        </>

      )}





      {/* ================================= */}

      {/* EMPTY */}

      {/* ================================= */}

      {!loading && !data.content?.length && (

        <div className="card empty-search">

          <div className="empty-icon">

            💕

          </div>

          <h3>

            No profiles found

          </h3>

          <p>

            Try changing your filters or check again later.

          </p>

        </div>

      )}

    </div>

  );

}





function ProfileCard({ p }) {

  const [busy, setBusy] = useState(false);

  const [photo, setPhoto] = useState(null);

  const [interestStatus, setInterestStatus] =

    useState("LOADING");

  const [shortlistStatus, setShortlistStatus] =

    useState("LOADING");

  const [actionMessage, setActionMessage] =

    useState("");

  // Mobile only: open the same Send Interest message sheet shown

  // in the provided reference. Desktop keeps the existing direct action.

  const [interestModalOpen, setInterestModalOpen] =

    useState(false);

  const nav = useNavigate();





  // =========================================================

  // LOAD PHOTO + INTERACTION STATUS

  // =========================================================

  useEffect(() => {

    const load = async () => {

      if (!p?.user?.id) {

        return;

      }

      try {

        const photoResponse =

          await api.get(

            "/photos/user/" + p.user.id

          );

        if (

          photoResponse.data &&

          photoResponse.data.length > 0

        ) {

          const primary =

            photoResponse.data.find(

              x => x.primaryPhoto

            ) ||

            photoResponse.data[0];

          setPhoto(primary);

        }

      } catch (e) {

        console.log(

          "Photo loading failed",

          e

        );

      }





      // -------------------------------------------------------

      // Interest status

      // -------------------------------------------------------

      try {

        const r =

          await api.get(

            "/requests/status/" + p.user.id

          );

        setInterestStatus(r.data);

      } catch (e) {

        console.log(

          "Interest status loading failed",

          e

        );

        setInterestStatus("SEND_INTEREST");

      }





      // -------------------------------------------------------

      // Shortlist status

      // -------------------------------------------------------

      try {

        const r =

          await api.get(

            "/shortlists/status/" + p.user.id

          );

        setShortlistStatus(r.data);

      } catch (e) {

        console.log(

          "Shortlist status loading failed",

          e

        );

        setShortlistStatus("SHORTLIST");

      }

    };





    load();

  }, [p?.user?.id]);





  // =========================================================

  // INTEREST

  // =========================================================

  const sendInterest = async (interestMessage = "") => {

    if (

      interestStatus !== "SEND_INTEREST"

    ) {

      return false;

    }

    setBusy(true);

    try {

      // 1) Create the interest request.

      await api.post(

        "/requests/" + p.user.id

      );

      // 2) When the mobile modal supplies a message, send that

      //    message immediately after the interest is created.

      //    The backend already permits chat after a pending interest.

      if (interestMessage && interestMessage.trim()) {

        try {

          await api.post(

            "/chats/messages",

            {

              toUserId: p.user.id,

              content: interestMessage.trim()

            }

          );

        } catch (messageError) {

          setInterestStatus("INTEREST_SENT");

          setActionMessage(

            "Interest sent, but the message could not be sent."

          );

          setTimeout(() => {

            setActionMessage("");

          }, 3500);

          return false;

        }

      }

      // Immediately change button.

      setInterestStatus(

        "INTEREST_SENT"

      );

      setActionMessage(

        interestMessage && interestMessage.trim()

          ? "Interest and message sent successfully"

          : "Interest sent successfully"

      );

      setTimeout(() => {

        setActionMessage("");

      }, 2500);

      return true;

    } catch (x) {

      setActionMessage(

        x.response?.data?.message ||

        "Unable to send interest"

      );

      setTimeout(() => {

        setActionMessage("");

      }, 3500);

      return false;

    } finally {

      setBusy(false);

    }

  };

  const openSendInterest = () => {

    if (

      busy ||

      interestStatus !== "SEND_INTEREST"

    ) {

      return;

    }

    // The message selector is intentionally mobile-only.

    if (

      window.matchMedia("(max-width: 700px)").matches

    ) {

      setInterestModalOpen(true);

      return;

    }

    // Preserve the existing desktop behavior.

    sendInterest();

  };





  // =========================================================

  // SHORTLIST

  // =========================================================

  const addShortlist = async () => {

    if (

      shortlistStatus !== "SHORTLIST"

    ) {

      return;

    }

    setBusy(true);

    try {

      await api.post(

        "/shortlists/" + p.user.id

      );

      // Immediately change button

      setShortlistStatus(

        "SHORTLISTED"

      );

      setActionMessage(

        "Profile added to your shortlist"

      );

      setTimeout(() => {

        setActionMessage("");

      }, 2500);

    } catch (x) {

      setActionMessage(

        x.response?.data?.message ||

        "Unable to shortlist profile"

      );

      setTimeout(() => {

        setActionMessage("");

      }, 3500);

    } finally {

      setBusy(false);

    }

  };





  return (

    <div

      className="profile-card"

      onClick={(e) => {

        // Preserve the existing desktop behavior. On mobile, tapping

        // anywhere on the card (except an interactive control) opens the profile.

        if (window.matchMedia("(max-width: 700px)").matches &&

            !e.target.closest("button, a, input, select, textarea")) {

          nav("/profile-view/" + p.user.id);

        }

      }}

      role="link"

      tabIndex={0}

      onKeyDown={(e) => {

        if (window.matchMedia("(max-width: 700px)").matches &&

            (e.key === "Enter" || e.key === " ")) {

          e.preventDefault();

          nav("/profile-view/" + p.user.id);

        }

      }}

    >

      {photo ? (

        <img

          src={`${API}${photo.url}`}

          alt={`${p.firstName || ""} ${p.lastName || ""}`}

          className="search-profile-photo"

          onError={e => {

            e.currentTarget.style.display = "none";

          }}

        />

      ) : (

        <div className="avatar">

          {p.firstName?.[0] || "?"}

        </div>

      )}





      <h3>

        {p.firstName} {p.lastName || ""}

      </h3>





      <p className="goswami-id-search">

        Goswami ID:

        {" "}

        <strong>

          {p.user?.goswamiId}

        </strong>

      </p>





      <p>

        {p.city || "India"}

        {" · "}

        {p.profession || "Professional"}

      </p>





      <p>

        {p.education || "Education not added"}

      </p>





      <p>

        {p.religion || "Religion not specified"}

        {p.community &&

          " · " + p.community}

      </p>





      {actionMessage && (

        <div className="profile-action-message">

          ✓ {actionMessage}

        </div>

      )}





      <div className="actions">





        {/* =================================================

            INTEREST BUTTON

        \\================================================= */}

        <button

          disabled={

            busy ||

            interestStatus !== "SEND_INTEREST"

          }

          className={

            interestStatus === "INTEREST_SENT" ||

            interestStatus === "INTEREST_ACCEPTED"

              ? "action-success"

              : ""

          }

          onClick={openSendInterest}

        >

          {interestStatus === "LOADING"

            ? "Loading..."

            : interestStatus === "INTEREST_ACCEPTED"

              ? "Accepted"

              : interestStatus === "INTEREST_SENT"

                ? "Interest Sent"

                : busy

                ? "Sending..."

                : "♡ Send Interest"

          }

        </button>





        {/* =================================================

            SHORTLIST BUTTON

        \\================================================= */}

        <button

          disabled={

            busy ||

            shortlistStatus !== "SHORTLIST"

          }

          className={

            shortlistStatus === "SHORTLISTED"

              ? "action-success"

              : ""

          }

          onClick={addShortlist}

        >

          {shortlistStatus === "LOADING"

            ? "Loading..."

            : shortlistStatus === "SHORTLISTED"

              ? "★ Shortlisted"

              : busy

                ? "Saving..."

                : "☆ Shortlist"

          }

        </button>





        {/* MESSAGE */}

        <button

          disabled={busy}

          onClick={() =>

            nav(

              "/chat/" +

              p.user.id

            )

          }

        >

          Message

        </button>





        {/* VIEW */}

        <Link

          to={

            "/profile-view/" +

            p.user.id

          }

        >

          View

        </Link>

      </div>

      {/* Mobile Send Interest message modal.

          It is rendered only while open and CSS hides this component on desktop. */}

      {interestModalOpen && (

        <SendInterestModal

          profile={p}

          photo={photo}

          loading={busy}

          onClose={() => {

            if (!busy) {

              setInterestModalOpen(false);

            }

          }}

          onSend={async (selectedMessage) => {

            const sent = await sendInterest(selectedMessage);

            if (sent) {

              setInterestModalOpen(false);

            }

          }}

        />

      )}

    </div>

  );

}

function Requests() {

  const [incoming, setIncoming] = useState([]);

  const [outgoing, setOutgoing] = useState([]);

  const [tab, setTab] = useState("received");

  const [requestTab, setRequestTab] = useState("pending");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");





  const load = async () => {

    setLoading(true);

    setError("");

    try {

      const [incomingResponse, outgoingResponse] =

        await Promise.all([

          api.get("/requests/incoming"),

          api.get("/requests/outgoing")

        ]);

      setIncoming(

        Array.isArray(incomingResponse.data)

          ? incomingResponse.data

          : []

      );

      setOutgoing(

        Array.isArray(outgoingResponse.data)

          ? outgoingResponse.data

          : []

      );

    } catch (e) {

      setError(

        e.response?.data?.message ||

        "Unable to load requests"

      );

    } finally {

      setLoading(false);

    }

  };





  useEffect(() => {

    load();

  }, []);





  const respond = async (id, status) => {

    await api.patch(

      `/requests/${id}`,

      null,

      { params: { status } }

    );

    await load();

    window.dispatchEvent(new Event("request-count-changed"));

  };





  const receivedPending =

    incoming.filter(x => x.status === "PENDING");

  const receivedAccepted =

    incoming.filter(x => x.status === "ACCEPTED");

  const sentPending =

    outgoing.filter(x => x.status === "PENDING");

  const sentAccepted =

    outgoing.filter(x => x.status === "ACCEPTED");

  // Accepted is a connection state. Include accepted requests

  // from either direction, while de-duplicating the request itself.

  const acceptedMap = new Map();

  [...incoming, ...outgoing]

    .filter(x => x.status === "ACCEPTED")

    .forEach(x => acceptedMap.set(x.id, x));

  const allAccepted = Array.from(acceptedMap.values());

  const deletedRequests = [

    ...incoming,

    ...outgoing

  ].filter(x => x.status === "REJECTED");





  const contactMap = new Map();

  [...incoming, ...outgoing]

    .filter(x => x.status === "ACCEPTED")

    .forEach(x => {

      const targetId =

        x.sender?.id === Number(localStorage.getItem("userId"))

          ? x.receiver?.id

          : x.sender?.id;

      if (targetId && !contactMap.has(targetId)) {

        contactMap.set(targetId, x);

      }

    });

  const contacts = Array.from(contactMap.values());





  const renderCards = (items, mode) => {

    if (!items.length) {

      return (

        <div className="request-empty-state">

          <div className="request-empty-icon">♡</div>

          <h3>

            {mode === "received" && "No Pending Invitations"}

            {mode === "accepted" && "No Accepted Interests Yet"}

            {mode === "sent" && "No Sent Interests"}

            {mode === "contacts" && "No Contacts Yet"}

            {mode === "deleted" && "No Declined Profiles"}

          </h3>

          <p>

            {mode === "received"

              ? "When someone sends you an interest, it will appear here."

              : mode === "accepted"

                ? "Interests accepted by the profiles you contacted will appear here."

                : mode === "sent"

                  ? "Profiles you have recently contacted will appear here."

                  : mode === "contacts"

                    ? "Accepted connections will appear here."

                    : "Declined interest requests will appear here."}

          </p>

          <Link to="/search" className="request-empty-link">

            Discover Profiles

          </Link>

        </div>

      );

    }

    return (

      <div className="request-card-list">

        {items.map(request => (

          <RequestProfileCard

            key={`${mode}-${request.id}`}

            request={request}

            mode={mode}

            onRespond={respond}

          />

        ))}

      </div>

    );

  };





  if (loading) {

    return (

      <div className="requests-page premium-requests-page">

        <div className="requests-shell">

          <div className="requests-title-block">

            <span className="requests-eyebrow">CONNECTIONS</span>

            <h1>Interest & Connections</h1>

            <p>Manage your invitations, accepted connections and sent interests.</p>

          </div>

          <div className="request-main-loading">Loading your requests...</div>

        </div>

      </div>

    );

  }





  if (error) {

    return (

      <div className="requests-page premium-requests-page">

        <div className="requests-shell">

          <div className="request-error-card">

            <h2>Unable to load requests</h2>

            <p>{error}</p>

            <button type="button" onClick={load}>Try Again</button>

          </div>

        </div>

      </div>

    );

  }





  return (

    <div className="requests-page premium-requests-page">

      <div className="requests-shell">

       <div className="requests-title-block">

  <div className="requests-eyebrow">

    YOUR CONNECTIONS

  </div>

  <h1>Interest & Connections</h1>

  <p>

    Everything about your matrimonial requests in one place.

  </p>

</div>

<button

  type="button"

  className="requests-back-btn"

  onClick={() => window.history.back()}

>

  ← Back

</button>





        {/* =====================================================

            MAIN REQUEST NAVIGATION

        \\===================================================== */}

        <div className="requests-main-tabs" role="tablist">

          <button

            type="button"

            className={tab === "received" ? "active" : ""}

            onClick={() => setTab("received")}

          >

            <span>Received</span>

            {receivedPending.length > 0 && (

              <b>{receivedPending.length}</b>

            )}

          </button>

          <button

            type="button"

            className={tab === "accepted" ? "active" : ""}

            onClick={() => setTab("accepted")}

          >

            Accepted

          </button>

          <button

            type="button"

            className={tab === "requests" ? "active" : ""}

            onClick={() => setTab("requests")}

          >

            Requests

          </button>

          <button

            type="button"

            className={tab === "sent" ? "active" : ""}

            onClick={() => setTab("sent")}

          >

            Sent

          </button>

          <button

            type="button"

            className={tab === "contacts" ? "active" : ""}

            onClick={() => setTab("contacts")}

          >

            Contacts

          </button>

          <button

            type="button"

            className={tab === "deleted" ? "active" : ""}

            onClick={() => setTab("deleted")}

          >

            Deleted

          </button>

        </div>





        {/* RECEIVED */}

        {tab === "received" && (

          <section className="requests-content-panel">

            <div className="requests-panel-heading">

              <div>

                <h2>Received Invitations</h2>

                <p>Profiles who have shown interest in you.</p>

              </div>

              <span className="requests-count-pill">

                {receivedPending.length} Pending

              </span>

            </div>

            {renderCards(receivedPending, "received")}

          </section>

        )}





        {/* ACCEPTED */}

        {tab === "accepted" && (

          <section className="requests-content-panel">

            <div className="requests-panel-heading">

              <div>

                <h2>Accepted by Them</h2>

                <p>Profiles you contacted who accepted your interest.</p>

              </div>

              <span className="requests-count-pill success">

                {allAccepted.length} Accepted

              </span>

            </div>

            {renderCards(allAccepted, "accepted")}

          </section>

        )}





        {/* REQUESTS */}

        {tab === "requests" && (

          <section className="requests-content-panel">

            <div className="requests-sub-tabs">

              <button

                type="button"

                className={requestTab === "pending" ? "active" : ""}

                onClick={() => setRequestTab("pending")}

              >

                Pending Requests

                {receivedPending.length > 0 && <b>{receivedPending.length}</b>}

              </button>

              <button

                type="button"

                className={requestTab === "accepted" ? "active" : ""}

                onClick={() => setRequestTab("accepted")}

              >

                Accepted Requests

              </button>

              <button

                type="button"

                className={requestTab === "sent" ? "active" : ""}

                onClick={() => setRequestTab("sent")}

              >

                Sent Requests

                {sentPending.length > 0 && <b>{sentPending.length}</b>}

              </button>

            </div>

            {requestTab === "pending" && renderCards(receivedPending, "requests-pending")}

            {requestTab === "accepted" && renderCards(receivedAccepted, "requests-accepted")}

            {requestTab === "sent" && renderCards(sentPending, "sent")}

          </section>

        )}





        {/* SENT */}

        {tab === "sent" && (

  <section className="premium-sent-section">





    <div className="premium-sent-heading">

      <div>

        <div className="premium-section-label">

          MY SENT INTERESTS

        </div>

        <h2>

          Sent Invitations

        </h2>

        <p>

          Profiles you have shown interest in.

        </p>

      </div>





      <div className="premium-sent-count">

        <strong>

          {sentPending.length}

        </strong>

        <span>

          Pending

        </span>

      </div>

    </div>





    <div className="premium-sent-layout">





      {/* ============================================

          LEFT FILTER

      \\============================================ */}

      <aside className="premium-sent-filter">





        <div className="premium-filter-heading">

          Filters

        </div>





        <label className="premium-filter-option">

          <input

            type="radio"

            name="sentFilter"

            defaultChecked

          />

          <span>

            All Invitations

          </span>

        </label>





        <label className="premium-filter-option">

          <input

            type="radio"

            name="sentFilter"

          />

          <span>

            Viewed by them

          </span>

        </label>





        <label className="premium-filter-option">

          <input

            type="radio"

            name="sentFilter"

          />

          <span>

            Not viewed yet

          </span>

        </label>





        <div className="premium-filter-divider"></div>





        <div className="premium-filter-small-title">

          Request Status

        </div>





        <div className="premium-filter-status">

          <span className="status-dot pending"></span>

          Pending

        </div>





        <div className="premium-filter-status">

          <span className="status-dot accepted"></span>

          Accepted

        </div>

      </aside>





      {/* ============================================

          RIGHT CONTENT

      \\============================================ */}

      <div className="premium-sent-results">

        {renderCards(

          sentPending,

          "sent"

        )}

      </div>

    </div>

  </section>

)}





        {/* CONTACTS */}

        {tab === "contacts" && (

          <section className="requests-content-panel">

            <div className="requests-panel-heading">

              <div>

                <h2>My Contacts</h2>

                <p>Your accepted matrimonial connections.</p>

              </div>

              <span className="requests-count-pill success">

                {contacts.length} Connections

              </span>

            </div>

            {renderCards(contacts, "contacts")}

          </section>

        )}





        {/* DELETED */}

        {tab === "deleted" && (

          <section className="requests-content-panel">

            <div className="requests-panel-heading">

              <div>

                <h2>Deleted / Declined</h2>

                <p>Profiles where an interest request was declined.</p>

              </div>

              <span className="requests-count-pill muted">

                {deletedRequests.length} Declined

              </span>

            </div>

            {renderCards(deletedRequests, "deleted")}

          </section>

        )}

      </div>

    </div>

  );

}





function Shortlists() {

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const load = async () => {

    setLoading(true);

    setError("");

    try {

      const r = await api.get("/shortlists");

      setItems(Array.isArray(r.data) ? r.data : []);

    } catch (e) {

      setError(e.response?.data?.message || "Unable to load shortlist");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    load();

  }, []);

  return (

    <div className="requests-page premium-requests-page">

      <div className="requests-shell">

        <div className="requests-title-block">

          <span className="requests-eyebrow">YOUR SAVED PROFILES</span>

          <h1>My Shortlist</h1>

          <p>Keep your favourite profiles close while you decide.</p>

        </div>

        {loading && (

          <div className="request-main-loading">Loading your shortlist...</div>

        )}

        {error && (

          <div className="request-error-card">

            <h2>Unable to load shortlist</h2>

            <p>{error}</p>

            <button type="button" onClick={load}>Try Again</button>

          </div>

        )}

        {!loading && !error && !items.length && (

          <div className="request-empty-state shortlist-empty-state">

            <div className="request-empty-icon">★</div>

            <h3>Your shortlist is empty</h3>

            <p>Save profiles from Discover and they will appear here.</p>

            <Link to="/search" className="request-empty-link">Discover Profiles</Link>

          </div>

        )}

        {!loading && !error && items.length > 0 && (

          <div className="shortlist-premium-list">

            {items.map(x => (

              <ShortlistProfileCard

                key={x.id}

                item={x}

              />

            ))}

          </div>

        )}

      </div>

    </div>

  );

}





function ShortlistProfileCard({ item }) {

  const [profile, setProfile] = useState(item.targetUser?.profile || null);

  const [photo, setPhoto] = useState(null);

  const [status, setStatus] = useState("SHORTLISTED");

  const [busy, setBusy] = useState(false);

  const nav = useNavigate();

  const targetId = item.targetUser?.id;

  useEffect(() => {

    const load = async () => {

      if (!targetId) return;

      try {

        const r = await api.get("/profiles/user/" + targetId);

        setProfile(r.data);

      } catch (e) {

        console.log("Shortlist profile loading failed", e);

      }

      try {

        const r = await api.get("/photos/user/" + targetId);

        const list = Array.isArray(r.data) ? r.data : [];

        setPhoto(list.find(x => x.primaryPhoto) || list[0] || null);

      } catch (e) {

        console.log("Shortlist photo loading failed", e);

      }

      try {

        const r = await api.get("/shortlists/status/" + targetId);

        setStatus(r.data);

      } catch (e) {

        setStatus("SHORTLISTED");

      }

    };

    load();

  }, [targetId]);





  const remove = async () => {

    if (!targetId || busy) return;

    setBusy(true);

    try {

      await api.delete("/shortlists/" + targetId);

      setStatus("SHORTLIST");

    } catch (e) {

      console.log(e);

    } finally {

      setBusy(false);

    }

  };





  const name = profile

    ? `${profile.firstName || "Member"} ${profile.lastName || ""}`.trim()

    : item.targetUser?.email || "Member";

  const location = [profile?.city, profile?.state]

    .filter(Boolean).join(", ");

  const facts = [

    profile?.dateOfBirth

      ? `${new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()} yrs`

      : null,

    profile?.height,

    [profile?.religion, profile?.community].filter(Boolean).join(" • "),

    location,

    profile?.education,

    profile?.profession

  ].filter(Boolean);

  if (status === "SHORTLIST") return null;

  return (

    <article className="request-profile-card shortlist-profile-card">

      <button

        type="button"

        className="request-photo-button"

        onClick={() => nav("/profile-view/" + targetId)}

      >

        {photo ? (

          <img

            src={`${API}${photo.url}`}

            alt={name}

            className="request-profile-photo"

          />

        ) : (

          <div className="request-profile-avatar">

            {name.charAt(0).toUpperCase()}

          </div>

        )}

      </button>

      <div className="request-profile-content">

        <div className="request-profile-topline">

          <div>

            <button

              type="button"

              className="request-profile-name"

              onClick={() => nav("/profile-view/" + targetId)}

            >

              {name}

            </button>

            <div className="request-online-line">

              <span className="request-online-dot">●</span>

              Profile saved to your shortlist

            </div>

          </div>

          <span className="shortlist-star-mark">★</span>

        </div>

        <div className="request-profile-divider"></div>

        <div className="request-profile-facts">

          {facts.map((x, i) => <span key={i}>{x}</span>)}

        </div>

        <div className="request-card-actions">

          <button

            type="button"

            className="request-view-btn"

            onClick={() => nav("/profile-view/" + targetId)}

          >

            View Profile

          </button>

          <button

            type="button"

            className="request-message-btn"

            onClick={() => nav("/chat/" + targetId)}

          >

            💬 Message

          </button>

          <button

            type="button"

            className="request-remove-btn"

            disabled={busy}

            onClick={remove}

          >

            {busy ? "Removing..." : "Remove"}

          </button>

        </div>

      </div>

    </article>

  );

}

function Notifications() {

  const [n, setN] = useState([]);

  useEffect(() => {

  api.get("/notifications").then(async r => {

    const notifications = r.data || [];

    setN(notifications);

    // Page open hote hi unread notifications ko read mark karo

    const unreadNotifications = notifications.filter(x => !x.read);

    await Promise.all(

      unreadNotifications.map(x =>

        api.patch(`/notifications/${x.id}/read`)

          .catch(() => {})

      )

    );

    // Navbar unread count ko refresh karne ke liye event

    window.dispatchEvent(new Event("notifications-read"));

  });

}, []);

  return (

    <div className="notifications-page">

      <div className="notifications-shell">

        <div className="notifications-header">

          <div>

            <div className="notifications-eyebrow">

              YOUR ACTIVITY

            </div>

            <h1>Notifications</h1>

            <p>

              Stay updated with your latest connections and activity.

            </p>

          </div>

          {n.length > 0 && (

            <div className="notifications-count">

              <span>{n.length}</span>

              New

            </div>

          )}

        </div>

        <div className="notifications-list">

          {n.map(x => {

            const type = String(x.type || "").toUpperCase();

            const isInterest = type === "INTEREST";
            const isProfileVisit = type === "PROFILE_VISIT";

            return (

              <div

                className={`notification-card ${

                  isInterest

                    ? "notification-interest"

                    : "notification-message"

                }`}

                key={x.id}

              >

                <div className="notification-icon">

                  {isInterest ? "♡" : isProfileVisit ? "👀" : "✉"}

                </div>

                <div className="notification-content">

                  <div className="notification-top">

                    <span className="notification-type">

                      {type || "NOTIFICATION"}

                    </span>

                    <span className="notification-time">

                      {new Date(x.createdAt).toLocaleString()}

                    </span>

                  </div>

                  <p className="notification-message">

                    {x.message}

                  </p>

                  <div className="notification-footer">

                    <span className="notification-dot"></span>

                    GoswamiJodi

                  </div>

                </div>

                <div className="notification-arrow">

                  →

                </div>

              </div>

            );

          })}

          {!n.length && (

            <div className="notification-empty">

              <div className="notification-empty-icon">

                ♡

              </div>

              <h3>No notifications yet</h3>

              <p>

                When you receive new activity, it will appear here.

              </p>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}





function formatMessageTime(value) {

  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString([], {

    day: "2-digit",

    month: "short"

  });

}

function formatLastSeen(value) {

  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  const diff = Math.max(0, Date.now() - d.getTime());

  const minutes = Math.floor(diff / 60000);

  // Current day

  if (minutes < 1) return "now";

  if (minutes < 60) {

    return `${minutes} min ago`;

  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {

    return `${hours}h ago`;

  }

  // More than 24 hours

  const days = Math.floor(hours / 24);

  if (days === 1) {

    return "1 day before";

  }

  // 2+ days: show date like "12 Sep"

  return d.toLocaleDateString("en-IN", {

    day: "numeric",

    month: "short"

  });

}





function Messages() {

  const nav = useNavigate();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");

  const [unreadTotal, setUnreadTotal] = useState(0);

  const loadMessages = async () => {

    setLoading(true);

    setError("");

    try {

      const [conversationResponse, unreadResponse] =

        await Promise.all([

          api.get("/chats"),

          api.get("/chats/unread-count")

        ]);

      setItems(conversationResponse.data || []);

      setUnreadTotal(Number(unreadResponse.data || 0));

    } catch (x) {

      console.error(x);

      setError(

        x.response?.data?.message ||

        "Unable to load messages"

      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadMessages();

    const refresh = setInterval(() => {

      loadMessages();

    }, 15000);

    return () => clearInterval(refresh);

  }, []);

  const visibleItems =

    filter === "unread"

      ? items.filter(item => Number(item.unreadCount || 0) > 0)

      : items;

  return (

    <div className="messages-page">

      <div className="messages-header">

        <div>

  <h2>Messages</h2>

  <span className="messages-mobile-heading">

    Messages

  </span>

  <p>

    Your conversations

  </p>

</div>

        <div className="messages-unread-total">

          {unreadTotal > 0

            ? `${unreadTotal} Unread`

            : "All caught up"}

        </div>

      </div>

      <div className="messages-filter-tabs">

        <button

          type="button"

          className={filter === "all" ? "active" : ""}

          onClick={() => setFilter("all")}

        >

          All

        </button>

        <button

          type="button"

          className={filter === "unread" ? "active" : ""}

          onClick={() => setFilter("unread")}

        >

          Unread

          {unreadTotal > 0 && (

            <span className="messages-unread-tab-badge">

              {unreadTotal}

            </span>

          )}

        </button>

      </div>

      {loading && (

        <div className="card">

          Loading messages...

        </div>

      )}

      {error && (

        <div className="error">

          {error}

        </div>

      )}

      {!loading &&

        !error &&

        visibleItems.length === 0 && (

          <div className="card messages-empty">

            <div className="messages-empty-icon">

              💬

            </div>

            <h3>

              {filter === "unread"

                ? "No unread messages"

                : "No messages yet"}

            </h3>

            <p>

              {filter === "unread"

                ? "You are all caught up."

                : "When someone messages you, your conversation will appear here."}

            </p>

          </div>

        )}

      <div className="conversation-list">

        {visibleItems.map(item => (

          <button

            key={item.userId}

            className={`conversation-item ${

              Number(item.unreadCount || 0) > 0

                ? "conversation-item-unread"

                : ""

            }`}

            onClick={() =>

              nav("/chat/" + item.userId)

            }

          >

            <div className="conversation-avatar-wrap">

              {item.photoUrl ? (

                <img

                  src={`${API}${item.photoUrl}`}

                  alt={item.name || "Profile"}

                  className="conversation-avatar-photo"

                />

              ) : (

                <div className="conversation-avatar">

                  {item.name

                    ? item.name.charAt(0).toUpperCase()

                    : "U"}

                </div>

              )}

              {item.online && (

                <span

                  className="conversation-online-dot"

                  aria-label="Online"

                />

              )}

            </div>

            <div className="conversation-info">

              <div className="conversation-top">

  <strong>

    {item.name}

  </strong>

  <span className="conversation-presence">

    {item.online

      ? "now"

      : formatLastSeen(item.lastActiveAt)}

  </span>

</div>

<div className="conversation-middle">

</div>

              <div className="conversation-bottom">

                <p>

                  {item.lastMessage ||

                    "No messages"}

                </p>

                {Number(item.unreadCount || 0) > 0 && (

                  <span className="message-unread">

                    {item.unreadCount}

                  </span>

                )}

              </div>

            </div>

          </button>

        ))}

      </div>

    </div>

  );

}

function calculateAge(dob){

  if(!dob) return "";

  const birth = new Date(dob);

  if(Number.isNaN(birth.getTime())) return "";

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();

  if(m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

  return age > 0 ? age : "";

}

function formatHeight(height) {

  if (!height) return "";

  const value = String(height).trim();

  if (value.includes("'")) {

    return value;

  }

  const parts = value.split(".");

  if (parts.length === 2) {

    const feet = parts[0];

    const inches = parts[1];

    return `${feet}' ${inches}"`;

  }

  return `${value} ft`;

}

function displayDate(dob){

  if(!dob) return "Not specified";

  const d = new Date(dob);

  if(Number.isNaN(d.getTime())) return dob;

  return d.toLocaleDateString("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric"

  });

}

function MyProfileView(){

  const [p,setP] = useState(null);

  const [photos,setPhotos] = useState([]);

  const [activePhoto,setActivePhoto] = useState(null);

  const [error,setError] = useState("");

  useEffect(() => {

    Promise.all([

      api.get("/profiles/me"),

      api.get("/profiles/me/hobbies"),

      api.get("/photos")

    ])

      .then(([profileRes, hobbiesRes, photoRes]) => {

        setP({

          ...profileRes.data,

          hobbies: Array.isArray(hobbiesRes.data)

            ? hobbiesRes.data

            : (Array.isArray(profileRes.data.hobbies) ? profileRes.data.hobbies : [])

        });

        const list = Array.isArray(photoRes.data) ? photoRes.data : [];

        setPhotos(list);

        const primary = list.find(x => x.primaryPhoto) || list[0];

        setActivePhoto(primary || null);

      })

      .catch(() => setError("Unable to load your profile."));

  }, []);

  if(error) {

    return <div className="container"><div className="card error">{error}</div></div>;

  }

  if(!p) {

    return <div className="profile-page-loading"><div className="loading-spinner"></div><p>Loading your profile...</p></div>;

  }

  const age = calculateAge(p.dateOfBirth);

  const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "My Profile";

  const goswamiId = p.user?.goswamiId || "";

  const photoUrl = activePhoto ? `${API}${activePhoto.url}` : "";

  const InfoRow = ({label,value}) => (

    <div className="profile-info-row">

      <span className="profile-info-label">{label}</span>

      <span className="profile-info-value">{value || "Not specified"}</span>

    </div>

  );

  const Section = ({title, editTo="/profile/edit", children}) => (

    <section className="profile-section">

      <div className="profile-section-head">

        <h3>{title}</h3>

        <Link className="profile-edit-link" to={editTo}>Edit <span>›</span></Link>

      </div>

      {children}

    </section>

  );

  return (

    <div className="my-profile-view">

      <div className="profile-view-container">

        <div className="profile-title-bar">

          <div>

            <span className="profile-eyebrow">MY PROFILE</span>

            <h1>{fullName}</h1>

{p.user?.goswamiId && (

  <div className="goswami-id-badge">

    Goswami ID: <strong>{p.user.goswamiId}</strong>

  </div>

)}

<p>Your matrimonial profile</p>

          </div>

          <div className="profile-title-actions">

            <Link className="profile-outline-btn" to="/profile/edit">Edit Profile</Link>

            <Link className="profile-primary-btn" to="/search">Discover Matches</Link>

          </div>

        </div>

        <div className="profile-overview-card">

          <div className="profile-photo-panel">

            <div className="profile-main-photo-wrap">

              {photoUrl ? (

                <img

                  src={photoUrl}

                  alt={fullName}

                  className="profile-main-photo"

                  onError={e => {

                    e.currentTarget.style.display = "none";

                    e.currentTarget.parentElement.classList.add("profile-photo-fallback");

                  }}

                />

              ) : (

                <div className="profile-photo-placeholder">

                  <span>{p.firstName?.[0]?.toUpperCase() || "G"}</span>

                  <small>Add a profile photo</small>

                </div>

              )}

              {activePhoto?.primaryPhoto && <span className="primary-photo-badge">✓ Primary</span>}

            </div>

            {photos.length > 0 && (

              <div className="profile-photo-thumbs">

                {photos.slice(0,6).map(x => (

                  <button

                    type="button"

                    key={x.id}

                    className={`profile-thumb ${activePhoto?.id === x.id ? "active" : ""}`}

                    onClick={() => setActivePhoto(x)}

                  >

                    <img src={`${API}${x.url}`} alt="Profile thumbnail" />

                  </button>

                ))}

              </div>

            )}

            <Link className="album-link" to="/profile/edit">📷 Manage photos</Link>

          </div>

          <div className="profile-overview-content">

            <div className="profile-name-line">

              <div>

                <h2>{fullName}</h2>

<p className="profile-id-line">

  {p.user?.goswamiId && (

    <strong>Goswami ID: {p.user.goswamiId} • </strong>

  )}

  {age ? `${age} years` : "Age not specified"}

  {p.height ? ` • ${p.height}` : ""}

</p>

              </div>

              <span className={`profile-status-pill ${p.profileVisible ? "visible" : "hidden"}`}>

                {p.profileVisible ? "● Profile visible" : "● Profile hidden"}

              </span>

            </div>

            <div className="profile-basic-details">

  <div className="basic-detail-row">

    <span className="detail-label">Age / Height</span>

    <span className="detail-colon">:</span>

    <span className="detail-value">

      {age ? age : "Not specified"}

      {p.height ? ` / ${formatHeight(p.height)}` : ""}

    </span>

  </div>

  <div className="basic-detail-row">

    <span className="detail-label">Marital Status</span>

    <span className="detail-colon">:</span>

    <span className="detail-value">

      {p.maritalStatus || "Not specified"}

    </span>

  </div>

  <div className="basic-detail-row">

    <span className="detail-label">Posted by</span>

    <span className="detail-colon">:</span>

    <span className="detail-value">

      Self

    </span>

  </div>

  <div className="basic-detail-row">

    <span className="detail-label">Religion / Community</span>

    <span className="detail-colon">:</span>

    <span className="detail-value">

      {p.religion || "Not specified"}

      {p.community ? `, ${p.community}` : ""}

    </span>

  </div>

  <div className="basic-detail-row">

    <span className="detail-label">Location</span>

    <span className="detail-colon">:</span>

    <span className="detail-value">

      {p.city || "Not specified"}

    </span>

  </div>

  <div className="basic-detail-row">

    <span className="detail-label">Mother Tongue</span>

    <span className="detail-colon">:</span>

    <span className="detail-value">

      {p.motherTongue || "Not specified"}

    </span>

  </div>

</div>

            <div className="profile-action-row">

              <Link className="profile-primary-btn" to="/profile/edit">✎ Edit Personal Profile</Link>

              <Link className="profile-soft-btn" to="/profile/photos">📷 Add Photos </Link>                                    

              <Link className="profile-soft-btn" to="/preferences">⚙ Partner Preferences</Link>

            </div>

            <div className="profile-mini-highlights">

  <div className="mini-highlight">

    <span className="mini-icon">✓</span>

    <div>

      <strong>Profile Visible</strong>

      <small>Visible to matches</small>

    </div>

  </div>

  <div className="mini-highlight">

    <span className="mini-icon">♡</span>

    <div>

      <strong>Better Matches</strong>

      <small>Based on your preferences</small>

    </div>

  </div>

  <div className="mini-highlight">

    <span className="mini-icon">🔒</span>

    <div>

      <strong>Privacy Protected</strong>

      <small>Your details stay secure</small>

    </div>

  </div>

</div>

          </div>

        </div>

        <div className="profile-content-grid">

          <main>

            <Section title="About Myself"

            editTo="/profile/edit/about-me">

              <div className="profile-about">

                {p.aboutMe

                  ? p.aboutMe.split(/\n+/).map((line,i) => <p key={i}>{line}</p>)

                  : <p className="muted-text">Tell prospective matches a little about yourself.</p>

                }

              </div>

            </Section>

            <Section

  title="Interests & Hobbies"

  editTo="/profile/edit/interests-hobbies"

>

  <div className="profile-hobbies-view">

    {Array.isArray(p.hobbies) && p.hobbies.length > 0 ? (

      p.hobbies.map(hobby => (

        <span className="profile-hobby-chip" key={hobby}>

          {hobby}

        </span>

      ))

    ) : (

      <p className="muted-text">Add your interests and hobbies to help matches know you better.</p>

    )}

  </div>

</Section>

            <Section

  title="Basics & Lifestyle"

  editTo="/profile/edit/basic-details"

>

  <div className="profile-info-grid">

    <InfoRow label="Age" value={age ? `${age} years` : ""} />

    <InfoRow label="Date of Birth" value={displayDate(p.dateOfBirth)} />

    <InfoRow label="Marital Status" value={p.maritalStatus} />

    <InfoRow label="Height" value={p.height} />

    <InfoRow label="Body Type" value={p.bodyType} />

    <InfoRow label="Mother Tongue" value={p.motherTongue} />

    <InfoRow label="Food Preference" value={p.foodPreference} />

    <InfoRow label="Lifestyle" value={p.lifestyle} />

    <InfoRow label="Smoking" value={p.smoking} />

    <InfoRow label="Drinking" value={p.drinking} />

  </div>

</Section>

            <Section 

             title="Religious Background"

             editTo="/profile/edit/religious-details">

              <div className="profile-info-grid">

                <InfoRow label="Religion" value={p.religion} />

                <InfoRow label="Community" value={p.community} />

                <InfoRow label="Sub-community" value={p.subCommunity} />

                <InfoRow label="Mother Tongue" value={p.motherTongue} />

              </div>

            </Section>

            <Section title="Family Details"

            editTo="/profile/edit/family-details">

              <div className="profile-info-grid">

                <InfoRow label="Family Type" value={p.familyType} />

                <InfoRow label="Family Values" value={p.familyValues} />

                <InfoRow label="Father's Occupation" value={p.fatherOccupation} />

                <InfoRow label="Mother's Occupation" value={p.motherOccupation} />

                <InfoRow label="Siblings" value={p.siblings !== null && p.siblings !== undefined ? p.siblings : ""} />

              </div>

            </Section>

            <Section title="Education & Career"

            editTo="/profile/edit/education-career">

              <div className="profile-info-grid">

                <InfoRow label="Highest Qualification" value={p.education} />

                <InfoRow label="College / University" value={p.college} />

                <InfoRow label="Profession" value={p.profession} />

                <InfoRow label="Company" value={p.company} />

                <InfoRow label="Annual Income" value={p.incomeRange} />

              </div>

            </Section>

            <Section

  title="Location"

  editTo="/profile/edit/location"

>

  <div className="profile-info-grid">

    <InfoRow

      label="Current Residence"

      value={[p.city, p.state, p.country]

        .filter(Boolean)

        .join(", ")}

    />

    <InfoRow

      label="State of Residence"

      value={p.state}

    />

    <InfoRow

      label="Country"

      value={p.country}

    />

  </div>

</Section>

            <Section title="Partner Preferences" editTo="/preferences">

              <div className="partner-preference-card">

                <p>Your preferred partner criteria can be managed from Partner Preferences.</p>

                <Link to="/preferences" className="profile-text-link">View / Edit Partner Preferences →</Link>

              </div>

            </Section>

            <Section

  title="My Contact detail"

  editTo="/contact-settings"

>

  <div className="contact-detail-grid">

    <div className="contact-detail-row">

      <span className="contact-detail-label">

        Mobile

      </span>

      <span className="contact-detail-colon">

        :

      </span>

      <span className="contact-detail-value">

        {p.mobileNumber

          ? `+91-${p.mobileNumber}`

          : "Not specified"}

      </span>

    </div>





    <div className="contact-detail-row">

      <span className="contact-detail-label">

        Display Option

      </span>

      <span className="contact-detail-colon">

        :

      </span>

      <span className="contact-detail-value">

        Only Premium Members

      </span>

    </div>

  </div>

</Section>

          </main>

          <aside className="profile-sidebar">

            <div className="profile-sidebar-card verification-sidebar-card">

              <div className="verification-sidebar-title">

                <span className="verification-check">✓</span>

                <div>

                  <h3>Verification</h3>

                  <p>Verified details build trust</p>

                </div>

              </div>

              <div className="verification-sidebar-list">

                <div><span>Mobile Verified</span><strong>✓</strong></div>

                <div><span>Email Verified</span><strong>✓</strong></div>

                <div><span>Identity Verified</span><strong>✓</strong></div>

                <div><span>Photo Verified</span><strong>✓</strong></div>

                <div><span>Profile Verified</span><strong>✓</strong></div>

              </div>

            </div>

            <div className="profile-sidebar-card">

              <h3>Profile Completion</h3>

              <div className="completion-ring">

                <span>80%</span>

              </div>

              <p>Complete your profile to improve your chances of finding a compatible match.</p>

              <Link to="/profile/edit" className="profile-sidebar-btn">Complete Profile</Link>

            </div>

            <div className="profile-sidebar-card">

              <h3>Quick Links</h3>

              <Link to="/profile/edit">✎ Edit Profile</Link>

              <Link to="/preferences">♡ Partner Preferences</Link>

              <Link to="/search">⌕ Discover Matches</Link>

              <Link to="/shortlists">☆ My Shortlist</Link>

              <Link to="/notifications">🔔 Notifications</Link>

            </div>

            <div className="profile-sidebar-card privacy-card">

              <h3>Privacy</h3>

              <p>Your profile visibility is currently <b>{p.profileVisible ? "ON" : "OFF"}</b>.</p>

              <p className="small-note">Contact information is shown only according to your privacy settings.</p>

            </div>

          </aside>

        </div>

      </div>

    </div>

  );

}









function AboutMe() {

  const [profile, setProfile] = useState(null);

  const [aboutMe, setAboutMe] = useState("");

  const [saving, setSaving] = useState(false);

   const [msg, setMsg] = useState("");

  useEffect(() => {

    api.get("/profiles/me")

      .then((r) => {

        setProfile(r.data);

        setAboutMe(r.data.aboutMe || "");

      })

      .catch((e) => {

        console.error(e);

      });

  }, []);

  const save = async () => {

  try {

    setSaving(true);

    setMsg("");

    await api.put("/profiles/me", {

      ...profile,

      aboutMe

    });

    setMsg("About Myself updated successfully");

    setTimeout(() => {

     setMsg("");

     }, 3000);

  } catch (e) {

    console.error(e);

    setMsg(

      e.response?.data?.message ||

      "Failed to update About Myself"

    );

  } finally {

    setSaving(false);

  }

};

  if (!profile) {

    return <div className="container">Loading...</div>;

  }

 return (

  <div className="container about-edit-page">

    <div className="card about-edit-card">

      <div className="about-edit-header">

        <div>

          <span className="section-kicker">YOUR PROFILE</span>

          <h2>Edit About Myself</h2>

          <p>

            Tell prospective matches a little about yourself.

          </p>

        </div>

        <div className="about-icon">

        </div>

      </div>

      <div className="about-edit-body">

        <label htmlFor="aboutMe">

          About Myself

        </label>

        <textarea

          id="aboutMe"

          value={aboutMe}

          onChange={(e) => setAboutMe(e.target.value)}

          rows={8}

          placeholder="Write something about yourself, your personality, interests, family values and what you are looking for..."

        />

        <div className="about-help">

          <span></span>

          <span>

            A genuine introduction helps you get better matches.

          </span>

        </div>

        {msg && (

  <div className="success-message">

    {msg}

  </div>

)}

      </div>

      <div className="form-actions">

        <Link to="/profile" className="secondary">

          Cancel

        </Link>

        <button

          className="primary"

          onClick={save}

          disabled={saving}

        >

          {saving ? "Saving..." : "✓ Save Changes"}

        </button>

      </div>

    </div>

  </div>

);

}

function InterestsHobbiesEdit() {

  const navigate = useNavigate();

  const [hobbies, setHobbies] = useState([]);

  const [msg, setMsg] = useState("");

  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {

    api.get("/profiles/me/hobbies")

      .then(r => setHobbies(Array.isArray(r.data) ? r.data : []))

      .catch(() => setError("Unable to load your interests & hobbies."));

  }, []);

  const saveHobbies = async (e) => {

    e.preventDefault();

    setSaving(true);

    setMsg("");

    setError("");

    try {

      const cleaned = (Array.isArray(hobbies) ? hobbies : [])

        .map(x => String(x || "").trim())

        .filter(Boolean)

        .filter((x, i, arr) => arr.findIndex(y => y.toLowerCase() === x.toLowerCase()) === i);

      await api.put("/profiles/me/hobbies", { hobbies: cleaned });

      setHobbies(cleaned);

      setMsg("✓ Interests & Hobbies updated successfully");

    } catch (x) {

      setError(x.response?.data?.message || "Failed to update Interests & Hobbies");

    } finally {

      setSaving(false);

    }

  };

  return (

    <div className="modern-hobbies-page">

      <div className="hobbies-page-header">

        <div>

          <span className="hobbies-eyebrow">PROFILE INFORMATION</span>

          <h1>Interests &amp; Hobbies</h1>

          <p>

            Tell prospective matches what you enjoy. Select as many as you like,

            or add your own hobbies.

          </p>

          <button

            type="button"

            className="profile-back-button"

            onClick={() => navigate("/profile")}

          >

            ← Back

          </button>

        </div>

        <div className="hobbies-header-icon">♡</div>

      </div>

      {msg && <div className="basic-success"><span>✓</span>{msg}</div>}

      {error && <div className="hobbies-error">{error}</div>}

      <form className="modern-hobbies-card" onSubmit={saveHobbies}>

        <div className="hobbies-section-heading">

          <div className="hobbies-section-icon">♡</div>

          <div>

            <h2>Choose your interests</h2>

            <p>Select any number of hobbies. There is no limit.</p>

          </div>

        </div>

        <InterestHobbiesField

          value={hobbies}

          onChange={setHobbies}

        />

        <div className="hobbies-selected-summary">

          <strong>{hobbies.length}</strong>

          <span>{hobbies.length === 1 ? "hobby selected" : "hobbies selected"}</span>

        </div>

        <div className="form-actions hobbies-form-actions">

          <Link to="/profile" className="secondary hobbies-cancel">Cancel</Link>

          <button className="primary" type="submit" disabled={saving}>

            {saving ? "Saving..." : "✓ Save Changes"}

          </button>

        </div>

      </form>

    </div>

  );

}

function BasicDetails() {

  const navigate = useNavigate();

  const [p, setP] = useState(emptyProfile);

  const [msg, setMsg] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {

    api.get("/profiles/me")

      .then(r => {

        setP({

          ...emptyProfile,

          ...r.data,

          dateOfBirth: r.data.dateOfBirth || ""

        });

      })

      .catch(() => {});

  }, []);

  const saveBasicDetails = async (e) => {

    e.preventDefault();

    setSaving(true);

    setMsg("");

    try {

      await api.put("/profiles/me", p);

      setMsg("✓ Basics & Lifestyle updated successfully");

      setTimeout(() => {

        setMsg("");

      }, 3000);

    } catch (x) {

      setMsg(

        x.response?.data?.message ||

        "Failed to update Basics & Lifestyle"

      );

    } finally {

      setSaving(false);

    }

  };

  return (

  <div className="modern-basic-page">

    <div className="basic-page-header">

      <div>

        <span className="basic-eyebrow">PROFILE INFORMATION</span>

        <h1>Basics & Lifestyle</h1>

        <p>

          Keep your personal details updated to help your

          matches know you better.

        </p>

        <button

  type="button"

  className="profile-back-button"

  onClick={() => navigate("/profile")}

>

  ← Back

</button>

      </div>

      <div className="basic-header-icon">

        ✦

      </div>

    </div>

    {msg && (

      <div className="basic-success">

        <span>✓</span>

        {msg}

      </div>

    )}

    <form

      className="modern-basic-card"

      onSubmit={saveBasicDetails}

    >

      {/* Personal Details */}

      <section className="basic-section">

        <div className="basic-section-heading">

          <div className="basic-section-icon">

            ♡

          </div>

          <div>

            <h2>Personal Details</h2>

            <p>Your basic personal information</p>

          </div>

        </div>

        <div className="basic-fields">

          <label className="modern-field">

            <span>Date of Birth</span>

            <div className="input-with-icon">

              <input

                type="date"

                value={p.dateOfBirth || ""}

                onChange={e =>

                  setP({

                    ...p,

                    dateOfBirth: e.target.value

                  })

                }

              />

            </div>

          </label>

          <label className="modern-field">

            <span>Marital Status</span>

            <select

              value={p.maritalStatus || ""}

              onChange={e =>

                setP({

                  ...p,

                  maritalStatus: e.target.value

                })

              }

            >

              <option value="">

                Select Marital Status

              </option>

              <option value="Never Married">

                Never Married

              </option>

              <option value="Married">

                Married

              </option>

              <option value="Divorced">

                Divorced

              </option>

              <option value="Widowed">

                Widowed

              </option>

            </select>

          </label>

          <label className="modern-field">

            <span>Height</span>

            <select

              value={p.height || ""}

              onChange={e =>

                setP({

                  ...p,

                  height: e.target.value

                })

              }

            >

              <option value="">Select Height</option>

              {[

                "4.5","4.6","4.7","4.8","4.9","4.10","4.11",

                "5.0","5.1","5.2","5.3","5.4",

                "5.5","5.6","5.7","5.8","5.9","5.10","5.11",

                "6.0","6.1","6.2","6.3","6.4",

                "6.5","6.6","6.7","6.8","6.9","6.10","6.11",

                "7.0"

              ].map(h => (

                <option key={h} value={h}>

                  {h}

                </option>

              ))}

            </select>

          </label>

          <label className="modern-field">

            <span>Body Type</span>

            <input

              type="text"

              value={p.bodyType || ""}

              onChange={e =>

                setP({

                  ...p,

                  bodyType: e.target.value

                })

              }

              placeholder="e.g. Slim, Average, Athletic"

            />

          </label>

        </div>

      </section>





      {/* Lifestyle */}

      <section className="basic-section">

        <div className="basic-section-heading">

          <div className="basic-section-icon">

            ✦

          </div>

          <div>

            <h2>Lifestyle & Food</h2>

            <p>Share your everyday lifestyle preferences</p>

          </div>

        </div>

        <div className="basic-fields">

          <label className="modern-field">

            <span>Mother Tongue</span>

            <input

              type="text"

              value={p.motherTongue || ""}

              onChange={e =>

                setP({

                  ...p,

                  motherTongue: e.target.value

                })

              }

              placeholder="e.g. Hindi"

            />

          </label>

          <label className="modern-field">

            <span>Food Preference</span>

            <input

              type="text"

              value={p.foodPreference || ""}

              onChange={e =>

                setP({

                  ...p,

                  foodPreference: e.target.value

                })

              }

              placeholder="e.g. Vegetarian"

            />

          </label>

          <label className="modern-field">

            <span>Lifestyle</span>

            <input

              type="text"

              value={p.lifestyle || ""}

              onChange={e =>

                setP({

                  ...p,

                  lifestyle: e.target.value

                })

              }

              placeholder="e.g. Simple, Moderate"

            />

          </label>

        </div>

      </section>





      {/* Habits */}

      <section className="basic-section">

        <div className="basic-section-heading">

          <div className="basic-section-icon">

            ◉

          </div>

          <div>

            <h2>Habits</h2>

            <p>Tell us about your lifestyle habits</p>

          </div>

        </div>

        <div className="basic-fields">

          <label className="modern-field">

            <span>Smoking</span>

            <select

              value={p.smoking || ""}

              onChange={e =>

                setP({

                  ...p,

                  smoking: e.target.value

                })

              }

            >

              <option value="">

                Select Smoking

              </option>

              <option value="Yes">Yes</option>

              <option value="No">No</option>

            </select>

          </label>

          <label className="modern-field">

            <span>Drinking</span>

            <select

              value={p.drinking || ""}

              onChange={e =>

                setP({

                  ...p,

                  drinking: e.target.value

                })

              }

            >

              <option value="">

                Select Drinking

              </option>

              <option value="Yes">Yes</option>

              <option value="No">No</option>

            </select>

          </label>

        </div>

      </section>





      {/* Bottom Action */}

      <div className="basic-form-footer">

        <div className="basic-footer-note">

          <span>🔒</span>

          <div>

            <strong>Your information is private</strong>

            <small>

              You control what information is visible to matches.

            </small>

          </div>

        </div>





        <button

          type="submit"

          className="modern-update-btn"

          disabled={saving}

        >

          {saving ? "Saving..." : "Save Changes"}

          <span>→</span>

        </button>

      </div>

    </form>

  </div>

);

}

function ReligiousDetails() {

  const [p, setP] = useState(emptyProfile);

  const [msg, setMsg] = useState("");

  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {

    api.get("/profiles/me")

      .then(r => {

        setP({

          ...emptyProfile,

          ...r.data

        });

      })

      .catch(() => {});

  }, []);

 const saveReligiousDetails = async (e) => {

  e.preventDefault();

  const newErrors = {};

  if (!p.religion) {

    newErrors.religion = "Religion is required";

  }

  if (!p.community) {

    newErrors.community = "Community is required";

  }

  if (!p.subCommunity) {

    newErrors.subCommunity = "Sub-community is required";

  }

  if (!p.motherTongue || !p.motherTongue.trim()) {

    newErrors.motherTongue = "Mother Tongue is required";

  }

  setErrors(newErrors);

  // Koi bhi required field empty hai to API call mat karo

  if (Object.keys(newErrors).length > 0) {

    return;

  }

  setSaving(true);

  try {

    await api.put("/profiles/me", p);

    setMsg("✓ Religious Background updated successfully");

  } catch (x) {

    setMsg(

      x.response?.data?.message ||

      "Failed to update Religious Background"

    );

  } finally {

    setSaving(false);

  }

};

  return (

    <div className="container">

      <h2>Religious Background</h2>

      {msg && (

        <div className="success">

          {msg}

        </div>

      )}

      <form

        className="card form-grid"

        onSubmit={saveReligiousDetails}

      >

        {/* Religion */}

        <label>

  Religion <span className="required-star">*</span>

  <select

    value={p.religion || ""}

    onChange={e => {

      setP({

        ...p,

        religion: e.target.value

      });

      setErrors({

        ...errors,

        religion: ""

      });

    }}

  >

    <option value="">Select Religion</option>

    <option value="Hindu">Hindu</option>

    <option value="Muslim">Muslim</option>

    <option value="Christian">Christian</option>

    <option value="Sikh">Sikh</option>

    <option value="Jain">Jain</option>

    <option value="Buddhist">Buddhist</option>

    <option value="Other">Other</option>

  </select>

  {errors.religion && (

    <span className="field-error">

      {errors.religion}

    </span>

  )}

</label>

        {/* Community */}

        <label>

  Community *

  <select

    value={p.community || ""}

    onChange={e => {

      setP({

        ...p,

        community: e.target.value

      });

      setErrors({

        ...errors,

        community: ""

      });

    }}

  >

    <option value="">Select Community</option>

    <option value="Brahmin-Goswami">Brahmin-Goswami</option>

    <option value="Brahmin">Brahmin</option>

    <option value="Other">Other</option>

  </select>

  {errors.community && (

    <div className="field-error">

      {errors.community}

    </div>

  )}

</label>





        {/* Sub-community */}

        <label>

  Sub-community <span className="required-star">*</span>

  <select

    value={p.subCommunity || ""}

    onChange={e => {

      setP({

        ...p,

        subCommunity: e.target.value

      });

      setErrors({

        ...errors,

        subCommunity: ""

      });

    }}

  >

    <option value="">Select Sub-community</option>

    <option value="Goswami">Goswami</option>

    <option value="Giri">Giri</option>

    <option value="Puri">Puri</option>

    <option value="Bharti">Bharti</option>

    <option value="Tirtha">Tirtha</option>

    <option value="Vana">Vana</option>

    <option value="Aranya">Aranya</option>

    <option value="Parvata">Parvata</option>

    <option value="Ashrama">Ashrama</option>

    <option value="Saraswati">Saraswati</option>

    <option value="Sagara">Sagara</option>

  </select>

  {errors.subCommunity && (

    <div className="field-error">

      {errors.subCommunity}

    </div>

  )}

</label>





        {/* Mother Tongue */}

        <label>

  Mother Tongue <span className="required-star">*</span>

  <input

    type="text"

    value={p.motherTongue || ""}

    onChange={e => {

      setP({

        ...p,

        motherTongue: e.target.value

      });

      setErrors({

        ...errors,

        motherTongue: ""

      });

    }}

  />

  {errors.motherTongue && (

    <div className="field-error">

      {errors.motherTongue}

    </div>

  )}

</label>





        <button

          type="submit"

          className="primary full"

          disabled={saving}

        >

          {saving ? "Updating..." : "Update"}

        </button>

      </form>

    </div>

  );

}

function FamilyDetails() {

  const [p, setP] = useState(emptyProfile);

  const [msg, setMsg] = useState("");

  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {

    api.get("/profiles/me")

      .then(r => {

        setP({

          ...emptyProfile,

          ...r.data

        });

      })

      .catch(() => {});

  }, []);

 const saveFamilyDetails = async (e) => {

  e.preventDefault();

  const newErrors = {};

  if (!p.familyType?.trim()) {

    newErrors.familyType = "Family Type is required";

  }

  if (p.siblings === "" || p.siblings === null || p.siblings === undefined) {

    newErrors.siblings = "Siblings is required";

  }

  setErrors(newErrors);

  // Validation error hai to API call mat karo

  if (Object.keys(newErrors).length > 0) {

    return;

  }

  setSaving(true);

  setMsg("");

  try {

    await api.put("/profiles/me", p);

    setMsg("✓ Family Details updated successfully");

    setTimeout(() => {

      setMsg("");

    }, 3000);

  } catch (x) {

    setMsg(

      x.response?.data?.message ||

      "Failed to update Family Details"

    );

  } finally {

    setSaving(false);

  }

};

  return (

    <div className="container">

      <h2>Family Details</h2>

      {msg && (

        <div className="success">

          {msg}

        </div>

      )}

      <form

        className="card form-grid"

        onSubmit={saveFamilyDetails}

      >

        {/* Family Type */}

        <label>

  Family Type{" "}

  <span className="required-star">*</span>

  <input

    type="text"

    value={p.familyType || ""}

    onChange={e => {

      setP({

        ...p,

        familyType: e.target.value

      });

      if (e.target.value.trim()) {

        setErrors({

          ...errors,

          familyType: ""

        });

      }

    }}

  />

  {errors.familyType && (

    <span className="field-error">

      {errors.familyType}

    </span>

  )}

</label>





        {/* Family Values */}

        <label>

          Family Values

          <input

            type="text"

            value={p.familyValues || ""}

            onChange={e =>

              setP({

                ...p,

                familyValues: e.target.value

              })

            }

          />

        </label>





        {/* Father's Occupation */}

        <label>

          Father's Occupation

          <input

            type="text"

            value={p.fatherOccupation || ""}

            onChange={e =>

              setP({

                ...p,

                fatherOccupation: e.target.value

              })

            }

          />

        </label>





        {/* Mother's Occupation */}

        <label>

          Mother's Occupation

          <input

            type="text"

            value={p.motherOccupation || ""}

            onChange={e =>

              setP({

                ...p,

                motherOccupation: e.target.value

              })

            }

          />

        </label>





        {/* Siblings */}

        <label>

  Siblings{" "}

  <span className="required-star">*</span>

  <input

    type="number"

    min="0"

    value={p.siblings ?? ""}

    onChange={e => {

      setP({

        ...p,

        siblings: e.target.value

      });

      if (e.target.value !== "") {

        setErrors({

          ...errors,

          siblings: ""

        });

      }

    }}

  />

  {errors.siblings && (

    <span className="field-error">

      {errors.siblings}

    </span>

  )}

</label>





        {/* Update */}

        <button

          type="submit"

          className="primary full"

          disabled={saving}

        >

          {saving ? "Updating..." : "Update"}

        </button>

      </form>

    </div>

  );

}

function EducationCareer() {

  const [p, setP] = useState(emptyProfile);

  const [msg, setMsg] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {

    api.get("/profiles/me")

      .then(r => {

        setP({

          ...emptyProfile,

          ...r.data

        });

      })

      .catch(() => {});

  }, []);

  const saveEducationCareer = async (e) => {

    e.preventDefault();

    setSaving(true);

    setMsg("");

    try {

      await api.put("/profiles/me", p);

      setMsg("✓ Education & Career updated successfully");

      setTimeout(() => {

        setMsg("");

      }, 3000);

    } catch (x) {

      setMsg(

        x.response?.data?.message ||

        "Failed to update Education & Career"

      );

    } finally {

      setSaving(false);

    }

  };

  return (

    <div className="container">

      <h2>Education & Career</h2>

      {msg && (

        <div className="success">

          {msg}

        </div>

      )}

      <form

        className="card form-grid"

        onSubmit={saveEducationCareer}

      >

        {/* Highest Qualification */}

        <label>

          Highest Qualification

          <input

            type="text"

            value={p.education || ""}

            onChange={e =>

              setP({

                ...p,

                education: e.target.value

              })

            }

          />

        </label>





        {/* College / University */}

        <label>

          College / University

          <input

            type="text"

            value={p.college || ""}

            onChange={e =>

              setP({

                ...p,

                college: e.target.value

              })

            }

          />

        </label>





        {/* Profession */}

        <label>

          Profession

          <input

            type="text"

            value={p.profession || ""}

            onChange={e =>

              setP({

                ...p,

                profession: e.target.value

              })

            }

          />

        </label>





        {/* Company */}

        <label>

          Company

          <input

            type="text"

            value={p.company || ""}

            onChange={e =>

              setP({

                ...p,

                company: e.target.value

              })

            }

          />

        </label>





        {/* Annual Income */}

        <label>

          Annual Income

          <input

            type="text"

            value={p.incomeRange || ""}

            onChange={e =>

              setP({

                ...p,

                incomeRange: e.target.value

              })

            }

          />

        </label>





        {/* Update */}

        <button

          type="submit"

          className="primary full"

          disabled={saving}

        >

          {saving ? "Updating..." : "Update"}

        </button>

      </form>

    </div>

  );

}

function LocationDetails() {

  const [p, setP] = useState(emptyProfile);

  const [msg, setMsg] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {

    api.get("/profiles/me")

      .then(r => {

        setP({

          ...emptyProfile,

          ...r.data

        });

      })

      .catch(() => {});

  }, []);

  const saveLocationDetails = async (e) => {

    e.preventDefault();

    setSaving(true);

    setMsg("");

    try {

      await api.put("/profiles/me", p);

      setMsg("✓ Location updated successfully");

      setTimeout(() => {

        setMsg("");

      }, 3000);

    } catch (x) {

      setMsg(

        x.response?.data?.message ||

        "Failed to update Location"

      );

    } finally {

      setSaving(false);

    }

  };

  return (

    <div className="container">

      <h2>Location</h2>

      {msg && (

        <div className="success">

          {msg}

        </div>

      )}

      <form

        className="card form-grid"

        onSubmit={saveLocationDetails}

      >

        {/* City */}

        <label>

          City

          <input

            type="text"

            value={p.city || ""}

            onChange={e =>

              setP({

                ...p,

                city: e.target.value

              })

            }

          />

        </label>





        {/* State */}

        <label>

          State

          <input

            type="text"

            value={p.state || ""}

            onChange={e =>

              setP({

                ...p,

                state: e.target.value

              })

            }

          />

        </label>





        {/* Country */}

        <label>

          Country

          <input

            type="text"

            value={p.country || ""}

            onChange={e =>

              setP({

                ...p,

                country: e.target.value

              })

            }

          />

        </label>





        {/* Update */}

        <button

          type="submit"

          className="primary full"

          disabled={saving}

        >

          {saving ? "Updating..." : "Update"}

        </button>

      </form>

    </div>

  );

}

function ViewProfile({ id }) {

  const [p, setP] = useState(null);

  const [photos, setPhotos] = useState([]);

  const [activePhoto, setActivePhoto] = useState(null);

  const [mobilePhotoViewerOpen, setMobilePhotoViewerOpen] = useState(false);

  const [busy, setBusy] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [interestStatus, setInterestStatus] =

  useState("LOADING");

const [shortlistStatus, setShortlistStatus] =

  useState("LOADING");

  const nav = useNavigate();

useEffect(() => {

  const load = async () => {

    try {

      setError("");

      const profileResponse =

        await api.get("/profiles/user/" + id);

      setP(profileResponse.data);

      // PROFILE VISIT NOTIFICATION
      try {
        const currentUserId = localStorage.getItem("userId");
        if (currentUserId && Number(currentUserId) !== Number(id)) {
          await api.post("/profile-visits/" + id);
        }
      } catch (visitError) {
        // Do not block profile loading if visit notification fails.
        console.log("Profile visit notification failed", visitError);
      }





      try {

        const photoResponse =

          await api.get("/photos/user/" + id);

        const list =

          Array.isArray(photoResponse.data)

            ? photoResponse.data

            : [];

        setPhotos(list);

        setActivePhoto(

          list.find(x => x.primaryPhoto) ||

          list[0] ||

          null

        );

      } catch (photoError) {

        console.log(

          "Photo loading failed",

          photoError

        );

      }





      // =================================================

      // INTEREST STATUS

      // =================================================

      try {

        const interestResponse =

          await api.get(

            "/requests/status/" + id

          );

        setInterestStatus(

          interestResponse.data

        );

      } catch (interestError) {

        console.log(

          "Interest status loading failed",

          interestError

        );

        setInterestStatus(

          "SEND_INTEREST"

        );

      }





      // =================================================

      // SHORTLIST STATUS

      // =================================================

      try {

        const shortlistResponse =

          await api.get(

            "/shortlists/status/" + id

          );

        setShortlistStatus(

          shortlistResponse.data

        );

      } catch (shortlistError) {

        console.log(

          "Shortlist status loading failed",

          shortlistError

        );

        setShortlistStatus(

          "SHORTLIST"

        );

      }

    } catch (x) {

      setError(

        x.response?.data?.message ||

        "Unable to load profile"

      );

    }

  };

  load();

}, [id]);

const sendInterest = async () => {

  if (

    interestStatus !== "SEND_INTEREST"

  ) {

    return;

  }

  setBusy(true);

  setMessage("");

  try {

    await api.post(

      "/requests/" + p.user.id

    );

    setInterestStatus(

      "INTEREST_SENT"

    );

    setMessage(

      "Interest sent successfully"

    );

    setTimeout(() => {

      setMessage("");

    }, 3000);

  } catch (x) {

    setMessage(

      x.response?.data?.message ||

      "Unable to send interest"

    );

  } finally {

    setBusy(false);

  }

};





const addShortlist = async () => {

  if (

    shortlistStatus !== "SHORTLIST"

  ) {

    return;

  }

  setBusy(true);

  setMessage("");

  try {

    await api.post(

      "/shortlists/" + p.user.id

    );

    setShortlistStatus(

      "SHORTLISTED"

    );

    setMessage(

      "Profile added to your shortlist"

    );

    setTimeout(() => {

      setMessage("");

    }, 3000);

  } catch (x) {

    setMessage(

      x.response?.data?.message ||

      "Unable to shortlist profile"

    );

  } finally {

    setBusy(false);

  }

};

  const act = async (fn, successText) => {

    setBusy(true);

    setMessage("");

    try {

      await fn();

      setMessage(successText);

      setTimeout(() => setMessage(""), 3500);

    } catch (x) {

      setMessage(x.response?.data?.message || "Action failed. Please try again.");

      setTimeout(() => setMessage(""), 3500);

    } finally {

      setBusy(false);

    }

  };

  if (error) {

    return (

      <div className="premium-profile-error">

        <div className="premium-profile-error-card">

          <div className="premium-error-icon">!</div>

          <h2>Profile unavailable</h2>

          <p>{error}</p>

          <button onClick={() => nav("/search")}>Back to Discover</button>

        </div>

      </div>

    );

  }

  if (!p) {

    return (

      <div className="premium-profile-loading">

        <div className="loading-spinner"></div>

        <p>Loading profile...</p>

      </div>

    );

  }

  const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Member";

  const age = calculateAge(p.dateOfBirth);

  const goswamiId = p.user?.goswamiId || "";

  const photoUrl = activePhoto ? `${API}${activePhoto.url}` : "";

  const location = [p.city, p.state].filter(Boolean).join(", ") || "India";

  {/*const contactMasked = p.mobileNumber ? `+91 ${String(p.mobileNumber).slice(0, 5)} XXXXX` : "+91 XXXXX XXXXX";*/}

  const contactMasked = p.mobileNumber

  ? `+91 ${String(p.mobileNumber)}`

  : "Not available";

  const emailMasked = p.user?.email ? `${String(p.user.email).slice(0, 3)}XXXXXXXX@${String(p.user.email).split("@")[1] || "gmail.com"}` : "XXXXXXXXXX@gmail.com";

  const Detail = ({ icon, label, value }) => value ? (

    <div className="premium-summary-detail">

      <span className="premium-detail-icon">{icon}</span>

      <div>

        <small>{label}</small>

        <strong>{value}</strong>

      </div>

    </div>

  ) : null;

  const Info = ({ label, value }) => (

    <div className="premium-info-row">

      <span>{label}</span>

      <strong>{value || "Not specified"}</strong>

    </div>

  );

  const Section = ({ icon, title, children }) => (

    <section className="premium-detail-section">

      <div className="premium-section-title">

        <span className="premium-section-icon">{icon}</span>

        <h2>{title}</h2>

      </div>

      {children}

    </section>

  );

  return (

    <div className="premium-profile-page">

      <div className="premium-profile-shell">

        <div className="premium-breadcrumb">

          <Link to="/search">Discover Matches</Link>

          <span>›</span>

          <span>{fullName}</span>

        </div>

        {message && (

          <div className="premium-action-message">✓ {message}</div>

        )}

        {/* PROFILE HERO */}

        <section className="premium-profile-hero">

          <div className="premium-photo-column">

            <div className="premium-main-photo-wrap">

              {photoUrl ? (

                <>

                  <img

                    src={photoUrl}

                    alt={fullName}

                    className="premium-main-photo"

                    onError={e => {

                      e.currentTarget.style.display = "none";

                      e.currentTarget.parentElement.classList.add("photo-fallback");

                    }}

                  />

                  <button

                    type="button"

                    className="premium-mobile-photo-open"

                    aria-label="Open photo"

                    onClick={() => setMobilePhotoViewerOpen(true)}

                  />

                </>

              ) : (

                <div className="premium-photo-placeholder">

                  <span>{p.firstName?.[0]?.toUpperCase() || "G"}</span>

                  <small>Photo not added</small>

                </div>

              )}

              {activePhoto?.primaryPhoto && <span className="premium-primary-badge">✓ Primary</span>}

              <button

                type="button"

                className="premium-photo-next"

                disabled={photos.length < 2}

                onClick={() => {

                  if (photos.length < 2) return;

                  const current = photos.findIndex(x => x.id === activePhoto?.id);

                  setActivePhoto(photos[(current + 1) % photos.length]);

                }}

                aria-label="Next photo"

              >›</button>

            </div>

            {photos.length > 1 && (

              <div className="premium-photo-thumbs">

                {photos.slice(0, 6).map(x => (

                  <button

                    type="button"

                    key={x.id}

                    className={`premium-thumb ${activePhoto?.id === x.id ? "active" : ""}`}

                    onClick={() => setActivePhoto(x)}

                  >

                    <img src={`${API}${x.url}`} alt="Profile thumbnail" />

                  </button>

                ))}

              </div>

            )}

          </div>

          <div className="premium-hero-content">

            <div className="premium-profile-heading">

              <div>

                <h1>{fullName}</h1>

                <p className="premium-id">Profile ID: <strong>{goswamiId || `GS${String(p.user?.id || p.id).padStart(4, "0")}`}</strong></p>

              </div>

              <span className="premium-online-pill">● Active profile</span>

            </div>

            <div className="premium-hero-summary">

              <Detail icon="◉" label="Age / Height" value={`${age ? `${age} yrs` : "Age not specified"}${p.height ? ` • ${formatHeight(p.height)}` : ""}`} />

              <Detail icon="♢" label="Marital Status" value={p.maritalStatus} />

              <Detail icon="⌖" label="Location" value={location} />

              <Detail icon="◈" label="Profession" value={p.profession} />

              <Detail icon="▣" label="Education" value={p.education} />

              <Detail icon="✦" label="Religion / Community" value={[p.religion, p.community].filter(Boolean).join(" • ")} />

            </div>

            <div className="premium-hero-divider"></div>

            <div className="premium-connect-row">

              <button

  className={

    interestStatus === "INTEREST_SENT" ||

    interestStatus === "INTEREST_ACCEPTED"

      ? "premium-connect-btn action-success"

      : "premium-connect-btn"

  }

  disabled={

    busy ||

    interestStatus !== "SEND_INTEREST"

  }

  onClick={sendInterest}

>

  {interestStatus === "LOADING"

    ? "Loading..."

    : interestStatus === "INTEREST_ACCEPTED"

      ? "Accepted"

      : interestStatus === "INTEREST_RECEIVED"

        ? "Interest Received"

        : interestStatus === "INTEREST_SENT"

          ? "Interest Sent"

          : busy

        ? "Sending..."

        : "♡ Connect Now"

  }

</button>

             <button

  className={

    shortlistStatus === "SHORTLISTED"

      ? "premium-secondary-btn action-success"

      : "premium-secondary-btn"

  }

  disabled={

    busy ||

    shortlistStatus !== "SHORTLIST"

  }

  onClick={addShortlist}

>

  {shortlistStatus === "LOADING"

    ? "Loading..."

    : shortlistStatus === "SHORTLISTED"

      ? "★ Shortlisted"

      : busy

        ? "Saving..."

        : "☆ Shortlist"

  }

</button>

              <button

                className="premium-secondary-btn"

                onClick={() => nav("/chat/" + p.user.id)}

              >

                💬 Message

              </button>

            </div>

            <p className="premium-safe-note">🔒 Your interest is shared privately with this profile.</p>

          </div>

        </section>

        {mobilePhotoViewerOpen && photoUrl && (

          <div

            className="premium-mobile-photo-viewer"

            role="dialog"

            aria-modal="true"

            aria-label={`${fullName} photos`}

            onClick={() => setMobilePhotoViewerOpen(false)}

          >

            <button

              type="button"

              className="premium-mobile-photo-viewer-close"

              aria-label="Close photo viewer"

              onClick={() => setMobilePhotoViewerOpen(false)}

            >

              ×

            </button>

            <div

              className="premium-mobile-photo-viewer-stage"

              onClick={e => e.stopPropagation()}

            >

              <img

                src={photoUrl}

                alt={fullName}

                className="premium-mobile-photo-viewer-image"

                draggable="false"

              />

              {photos.length > 1 && (

                <>

                  <button

                    type="button"

                    className="premium-mobile-photo-viewer-arrow left"

                    aria-label="Previous photo"

                    onClick={() => {

                      const current = photos.findIndex(x => x.id === activePhoto?.id);

                      setActivePhoto(photos[(current - 1 + photos.length) % photos.length]);

                    }}

                  >

                    ‹

                  </button>

                  <button

                    type="button"

                    className="premium-mobile-photo-viewer-arrow right"

                    aria-label="Next photo"

                    onClick={() => {

                      const current = photos.findIndex(x => x.id === activePhoto?.id);

                      setActivePhoto(photos[(current + 1) % photos.length]);

                    }}

                  >

                    ›

                  </button>

                </>

              )}

              <div className="premium-mobile-photo-viewer-count">

                {Math.max(1, photos.findIndex(x => x.id === activePhoto?.id) + 1)} / {Math.max(1, photos.length)}

              </div>

            </div>

            {photos.length > 1 && (

              <div className="premium-mobile-photo-viewer-thumbs" onClick={e => e.stopPropagation()}>

                {photos.slice(0, 6).map(x => (

                  <button

                    type="button"

                    key={x.id}

                    className={activePhoto?.id === x.id ? "active" : ""}

                    onClick={() => setActivePhoto(x)}

                  >

                    <img src={`${API}${x.url}`} alt="" />

                  </button>

                ))}

              </div>

            )}

          </div>

        )}

        {/* TABS */}

        <div className="premium-profile-tabs">

          <button className="active" type="button">Detailed Profile</button>

          <button type="button">Partner Preferences</button>

        </div>

        <div className="premium-profile-body">

          <main className="premium-profile-main">

            <Section icon="❝" title={`About ${p.firstName || "this member"}`}>

              <div className="premium-about-box">

                {p.aboutMe ? (

                  p.aboutMe.split(/\n+/).map((line, i) => <p key={i}>{line}</p>)

                ) : (

                  <p className="premium-muted">This member has not added an introduction yet.</p>

                )}

              </div>

            </Section>

            <Section icon="♡" title="Hobbies & Interests">

              <div className="premium-tag-list">

                {[

                  p.lifestyle && `Lifestyle: ${p.lifestyle}`,

                  p.foodPreference && `Food: ${p.foodPreference}`,

                  p.smoking && `Smoking: ${p.smoking}`,

                  p.drinking && `Drinking: ${p.drinking}`

                ].filter(Boolean).map((x, i) => <span key={i}>{x}</span>)}

                {!p.lifestyle && !p.foodPreference && !p.smoking && !p.drinking && <span>No interests added yet</span>}

              </div>

            </Section>

            <Section icon="☎" title="Contact Details">

              <div className="premium-contact-box">

                <div className="premium-contact-item">

                  <span className="contact-green">☎</span>

                  <div><small>Contact Number</small><strong>{contactMasked}</strong></div>

                </div>

                <div className="premium-contact-item">

                  <span className="contact-orange">✉</span>

                  <div><small>Email ID</small><strong>{emailMasked}</strong></div>

                </div>

                <div className="premium-upgrade-note">

                  <span>🔒</span>

                  <div><strong>Contact details are protected</strong><small>Upgrade to Premium to view full contact details.</small></div>

                  <Link to="/account-settings">Upgrade</Link>

                </div>

              </div>

            </Section>

            {/* WhatsApp Contact Button */}

{p.mobileNumber && (

  <div className="whatsapp-contact-box">

    <div className="whatsapp-contact-content">

      <div className="whatsapp-icon">

        ☎

      </div>

      <div>

        <strong>Interested in this profile?</strong>

        <small>Connect directly on WhatsApp</small>

      </div>

    </div>

    <a

      href={`https://wa.me/91${String(p.mobileNumber).replace(/\D/g, "")}?text=${encodeURIComponent(

        `Hi, I viewed your profile on GoswamiJodi. I would like to connect with you regarding the matrimonial profile.`

      )}`}

      target="_blank"

      rel="noopener noreferrer"

      className="whatsapp-button"

    >

      <span>WhatsApp</span>

      <span className="whatsapp-arrow">→</span>

    </a>

  </div>

)}

            <Section icon="◌" title="Lifestyle">

              <div className="premium-info-grid three">

                <Info label="Food Preference" value={p.foodPreference} />

                <Info label="Lifestyle" value={p.lifestyle} />

                <Info label="Smoking" value={p.smoking} />

                <Info label="Drinking" value={p.drinking} />

                <Info label="Body Type" value={p.bodyType} />

                <Info label="Marital Status" value={p.maritalStatus} />

              </div>

            </Section>

            <Section icon="◈" title="Background">

              <div className="premium-info-grid">

                <Info label="Religion" value={p.religion} />

                <Info label="Community" value={p.community} />

                <Info label="Sub Community" value={p.subCommunity} />

                <Info label="Mother Tongue" value={p.motherTongue} />

                <Info label="City" value={p.city} />

                <Info label="State" value={p.state} />

              </div>

            </Section>

            <Section icon="⌂" title="Family Details">

              <div className="premium-info-grid">

                <Info label="Father's Name" value={p.fatherName} />

                <Info label="Mother's Name" value={p.motherName} />

                <Info label="Family Type" value={p.familyType} />

                <Info label="Family Values" value={p.familyValues} />

                <Info label="Father's Occupation" value={p.fatherOccupation} />

                <Info label="Mother's Occupation" value={p.motherOccupation} />

                <Info label="Siblings" value={p.siblings !== null && p.siblings !== undefined ? String(p.siblings) : ""} />

                <Info label="Posted By" value="Self" />

              </div>

            </Section>

            <Section icon="✦" title="Astrology & Birth Details">

              <div className="premium-info-grid">

                <Info label="Time of Birth" value={p.timeOfBirth} />

                <Info label="Place of Birth" value={p.placeOfBirth} />

                <Info label="Manglik" value={p.manglik} />

                <Info label="Rashi" value={p.rashi} />

                <Info label="Nakshatra" value={p.nakshatra} />

              </div>

            </Section>

            <Section icon="▱" title="Education & Career">

              <div className="premium-info-grid">

                <Info label="Education" value={p.education} />

                <Info label="College / University" value={p.college} />

                <Info label="Profession" value={p.profession} />

                <Info label="Company" value={p.company} />

                <Info label="Annual Income" value={p.incomeRange} />

                <Info label="Country" value={p.country} />

              </div>

            </Section>

            <Section icon="♡" title="What They Are Looking For">

              <div className="premium-looking-box">

                <div className="looking-avatar">

                  {p.firstName?.[0]?.toUpperCase() || "U"}

                </div>

                <div>

                  <strong>Partner Preferences</strong>

                  <p>Compatibility and partner preferences are managed privately. Connect with this profile to take the conversation forward.</p>

                </div>

              </div>

            </Section>

            <div className="premium-bottom-connect">

              <h3>Interested in {p.firstName || "this profile"}?</h3>

              <p>Send an interest and start your journey towards a meaningful connection.</p>

             <button

  className={

    interestStatus === "INTEREST_SENT" ||

    interestStatus === "INTEREST_ACCEPTED"

      ? "premium-connect-btn action-success"

      : "premium-connect-btn"

  }

  disabled={

    busy ||

    interestStatus !== "SEND_INTEREST"

  }

  onClick={sendInterest}

>

  {interestStatus === "LOADING"

    ? "Loading..."

    : interestStatus === "INTEREST_ACCEPTED"

      ? "Accepted"

      : interestStatus === "INTEREST_RECEIVED"

        ? "Interest Received"

        : interestStatus === "INTEREST_SENT"

          ? "Interest Sent"

          : busy

        ? "Sending..."

        : "♡ Send Interest"

  }

</button>

            </div>

          </main>

          <aside className="premium-profile-sidebar">

            <div className="premium-side-card verification-card">

              <div className="side-card-heading"><span>✓</span><h3>Verifications</h3></div>

              <div className="verification-line">Mobile number <strong>Protected</strong></div>

              <div className="verification-line">Profile <strong>Active</strong></div>

            </div>

            <div className="premium-side-card">

              <h3>Profile Highlights</h3>

              <div className="side-stat"><span>📍</span><div><small>Lives in</small><strong>{location}</strong></div></div>

              <div className="side-stat"><span>💼</span><div><small>Works as</small><strong>{p.profession || "Professional"}</strong></div></div>

              <div className="side-stat"><span>🎓</span><div><small>Education</small><strong>{p.education || "Not specified"}</strong></div></div>

            </div>

            <div className="premium-side-card premium-privacy-card">

              <div className="privacy-shield">🛡️</div>

              <h3>Your Privacy Matters</h3>

              <p>Contact details are protected and shared only according to privacy settings.</p>

            </div>

            <div className="premium-side-card">

              <h3>Quick Actions</h3>

              <button onClick={() => nav("/search")}>← Back to Matches</button>

              <button onClick={() => nav("/shortlists")}>☆ My Shortlist</button>

              <button onClick={() => nav("/messages")}>💬 My Messages</button>

            </div>

          </aside>

        </div>

      </div>

    </div>

  );

}

function Chat({ id }) {

  const nav = useNavigate();

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [chatProfile, setChatProfile] = useState(null);

  const [chatPhotos, setChatPhotos] = useState([]);

  const [chatInterestStatus, setChatInterestStatus] = useState("LOADING");

  const [chatMenuOpen, setChatMenuOpen] = useState(false);

  const [contactOpen, setContactOpen] = useState(false);

  const [recording, setRecording] = useState(false);

  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [voiceSending, setVoiceSending] = useState(false);

  const [voiceError, setVoiceError] = useState("");

  const mediaRecorderRef = useRef(null);

  const voiceChunksRef = useRef([]);

  const recordingTimerRef = useRef(null);

  const currentUserId =

    localStorage.getItem("userId");

  const loadChat = async () => {

    try {

      const [messagesResponse, profileResponse, photosResponse, interestResponse] =

        await Promise.all([

          api.get("/chats/" + id + "/messages"),

          api.get("/profiles/user/" + id),

          api.get("/photos/user/" + id),

          api.get("/requests/status/" + id)

        ]);

      setMessages(messagesResponse.data || []);

      setChatProfile(profileResponse.data || null);

      setChatPhotos(photosResponse.data || []);

      setChatInterestStatus(String(interestResponse.data || "SEND_INTEREST"));

      await api.patch(

        "/chats/" + id + "/read"

      );

    } catch (x) {

      console.error(x);

      setError(

        x.response?.data?.message ||

        "Unable to load chat"

      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadChat();

    const currentUserId = localStorage.getItem("userId");

    const ws = new Client({

      brokerURL: `${API.replace(/^http/, "ws")}/ws`,

      // The server only accepts signed-in websocket connections.
      connectHeaders: { Authorization: `Bearer ${localStorage.getItem("token")}` },

      reconnectDelay: 5000,

      onConnect: () => {

        ws.subscribe(`/topic/chat/${currentUserId}`, async frame => {

          try {

            const message = JSON.parse(frame.body);

            if (Number(message.sender?.id) !== Number(id)) return;

            setMessages(prev => {

              if (prev.some(x => Number(x.id) === Number(message.id))) return prev;

              return [...prev, message];

            });

            await api.patch("/chats/" + id + "/read").catch(() => {});

          } catch (e) {

            console.error("Realtime chat message failed", e);

          }

        });

      },

      onStompError: frame => console.error("WebSocket error", frame.headers["message"])

    });

    ws.activate();

    return () => {

      ws.deactivate();

    };

  }, [id]);

  useEffect(() => {

    return () => {

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state !== "inactive") recorder.stop();

    };

  }, []);

  const startVoiceRecording = async () => {

    if (sending || voiceSending || recording) return;

    if (chatInterestStatus === "LOADING") {

      setVoiceError("Checking interest access. Please wait...");

      return;

    }

    if (chatInterestStatus === "SEND_INTEREST") {

      setVoiceError("Send an interest request before messaging this profile.");

      return;

    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {

      setVoiceError("Voice recording is not supported in this browser.");

      return;

    }

    try {

      setVoiceError("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const preferred = [

        "audio/webm;codecs=opus",

        "audio/webm",

        "audio/mp4",

        "audio/ogg;codecs=opus"

      ].find(type => MediaRecorder.isTypeSupported?.(type));

      const recorder = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);

      voiceChunksRef.current = [];

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = event => {

        if (event.data?.size) voiceChunksRef.current.push(event.data);

      };

      recorder.onerror = () => {

        setVoiceError("Unable to record voice message.");

        setRecording(false);

        stream.getTracks().forEach(track => track.stop());

      };

      recorder.onstop = async () => {

        stream.getTracks().forEach(track => track.stop());

        if (!voiceChunksRef.current.length) {

          setRecording(false);

          return;

        }

        const mime = recorder.mimeType || "audio/webm";

        const blob = new Blob(voiceChunksRef.current, { type: mime });

        if (blob.size < 1000) {

          setRecording(false);

          return;

        }

        setVoiceSending(true);

        try {

          const formData = new FormData();

          formData.append("toUserId", String(id));

          const extension = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";

          formData.append("file", blob, `voice-${Date.now()}.${extension}`);

          const response = await api.post("/chats/voice", formData, { timeout: 60000 });

          setMessages(prev => [...prev, response.data]);

        } catch (x) {

          console.error(x);

          setVoiceError(x.response?.data?.message || "Unable to send voice message");

        } finally {

          setVoiceSending(false);

          setRecording(false);

          voiceChunksRef.current = [];

        }

      };

      recorder.start(250);

      setRecording(true);

      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => setRecordingSeconds(v => v + 1), 1000);

    } catch (x) {

      console.error(x);

      setVoiceError(x.name === "NotAllowedError" ? "Microphone permission was denied." : "Unable to access the microphone.");

    }

  };

  const stopVoiceRecording = () => {

    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") return;

    if (recordingTimerRef.current) {

      clearInterval(recordingTimerRef.current);

      recordingTimerRef.current = null;

    }

    recorder.stop();

  };

  const formatRecordingTime = seconds => {

    const m = String(Math.floor(seconds / 60)).padStart(2, "0");

    const sec = String(seconds % 60).padStart(2, "0");

    return `${m}:${sec}`;

  };

  const blockProfile = async () => {

    try {

      await api.post("/blocks/" + id);

      setChatMenuOpen(false);

      nav("/messages");

    } catch (x) {

      setVoiceError(x.response?.data?.message || "Unable to block this profile");

      setChatMenuOpen(false);

    }

  };

  const send = async () => {

    if (!text.trim() || sending) {

      return;

    }

    if (chatInterestStatus === "LOADING") {

      setError("Checking interest access. Please wait...");

      return;

    }

    if (chatInterestStatus === "SEND_INTEREST") {

      setError("Send an interest request before messaging this profile.");

      return;

    }

    setSending(true);

    try {

      const r =

        await api.post(

          "/chats/messages",

          {

            toUserId: Number(id),

            content: text.trim()

          }

        );

      setMessages(m => [

        ...m,

        r.data

      ]);

      setText("");

    } catch (x) {

      console.error(x);

      setError(

        x.response?.data?.message ||

        "Unable to send message"

      );

    } finally {

      setSending(false);

    }

  };

  const chatName =

    chatProfile

      ? `${chatProfile.firstName || ""} ${chatProfile.lastName || ""}`.trim()

      : "";

  const primaryChatPhoto =

    chatPhotos.find(p => p.primaryPhoto) ||

    chatPhotos[0];

  const chatPhotoUrl =

    primaryChatPhoto?.url

      ? `${API}${primaryChatPhoto.url}`

      : "";

  const lastActiveAt =

    chatProfile?.user?.lastActiveAt;

  const isOnline =

    lastActiveAt &&

    (Date.now() - new Date(lastActiveAt).getTime()) < 5 * 60 * 1000;

  // Show Seen only on the latest message sent by the current user.
  // If the other person replies, their reply becomes the latest message,
  // so the previous Seen indicator automatically disappears.
  const lastMessage = messages[messages.length - 1];

  const shouldShowSeen = message => {
    const mine =
      String(message?.sender?.id) === String(currentUserId);

    const isLastMessage =
      String(message?.id) === String(lastMessage?.id);

    const isRead =
      message?.read === true ||
      message?.isRead === true ||
      !!message?.readAt;

    return mine && isLastMessage && isRead;
  };

  return (

    <div className="chat-page">

      <div className="chat card">

        <div className="chat-header">

          <button

            type="button"

            onClick={() =>

              nav("/messages")

            }

            aria-label="Back to messages"

          >

            ←

          </button>

          <div className="chat-profile-head">

            {chatPhotoUrl ? (

              <img

                src={chatPhotoUrl}

                alt={chatName || "Profile"}

                className="chat-header-photo"

              />

            ) : (

              <div className="chat-header-avatar">

                {chatName

                  ? chatName.charAt(0).toUpperCase()

                  : "U"}

              </div>

            )}

            <div className="chat-header-copy">

              <h2>

                {chatName || "Chat"}

              </h2>

              <span>

                {isOnline

                  ? "Online"

                  : formatLastSeen(lastActiveAt)}

              </span>

            </div>

            {isOnline && (

              <span

                className="chat-header-online-dot"

                aria-label="Online"

              />

            )}

          </div>

          <button

            type="button"

            className="chat-header-more"

            aria-label="More options"

            aria-expanded={chatMenuOpen}

            onClick={() => setChatMenuOpen(v => !v)}

          >

            <span>⋮</span>

          </button>

          {chatMenuOpen && (

            <>

              <button

                type="button"

                className="chat-menu-backdrop"

                aria-label="Close menu"

                onClick={() => setChatMenuOpen(false)}

              />

              <div className="chat-more-menu">

                <button type="button" onClick={() => { setChatMenuOpen(false); setContactOpen(true); }}>View Contact</button>

                <button type="button" onClick={() => { setChatMenuOpen(false); nav("/profile-view/" + id); }}>View Profile</button>

                <button type="button" onClick={blockProfile}>Block Profile</button>

                <button type="button" className="danger" onClick={() => { setChatMenuOpen(false); nav("/report-problem"); }}>Report this profile</button>

                <button type="button" onClick={() => setChatMenuOpen(false)}>Cancel</button>

              </div>

              <div className="chat-mobile-action-sheet">

                <button type="button" onClick={() => { setChatMenuOpen(false); setContactOpen(true); }}>View Contact</button>

                <button type="button" onClick={() => { setChatMenuOpen(false); nav("/profile-view/" + id); }}>View Profile</button>

                <button type="button" onClick={blockProfile}>Block Profile</button>

                <button type="button" className="danger" onClick={() => { setChatMenuOpen(false); nav("/report-problem"); }}>Report this profile</button>

                <button type="button" className="cancel" onClick={() => setChatMenuOpen(false)}>Cancel</button>

              </div>

            </>

          )}

        </div>

        {contactOpen && (

          <div className="chat-contact-overlay" onClick={() => setContactOpen(false)}>

            <div className="chat-contact-card" onClick={e => e.stopPropagation()}>

              <div className="chat-contact-head">

                <h3>Contact</h3>

                <button type="button" onClick={() => setContactOpen(false)} aria-label="Close">×</button>

              </div>

              {chatProfile?.contactVisible ? (

                <>

                  <div className="chat-contact-row"><span>Mobile</span><strong>{chatProfile.mobileNumber || chatProfile.user?.phone || "Not available"}</strong></div>

                  <div className="chat-contact-row"><span>Email</span><strong>{chatProfile.user?.email || "Not available"}</strong></div>

                </>

              ) : (

                <p className="chat-contact-private">Contact details are private. They can be viewed only when this profile allows contact visibility.</p>

              )}

            </div>

          </div>

        )}

        {error && (

          <div className="error">

            {error}

          </div>

        )}

        <div className="messages">

          {loading && (

            <p className="chat-loading">

              Loading messages...

            </p>

          )}

          {!loading &&

            messages.length === 0 && (

              <div className="chat-empty">

                <div>💬</div>

                <p>

                  No messages yet

                </p>

              </div>

            )}

          {messages.map(m => {

            const mine =

              String(m.sender.id) ===

              String(currentUserId);

            return (

              <div

                className={

                  mine

                    ? "message-row mine-row"

                    : "message-row theirs-row"

                }

                key={m.id}

              >

                <div

                  className={

                    mine

                      ? "message-bubble mine"

                      : "message-bubble theirs"

                  }

                >

                  {m.messageType === "VOICE" && m.audioUrl ? (

                    <div className="chat-voice-message">

                      <span className="chat-voice-icon" aria-hidden="true">🎤</span>

                      <audio controls preload="metadata" src={`${API}${m.audioUrl}`} />

                    </div>

                  ) : (

                    <div>{m.content}</div>

                  )}

                  {m.createdAt && (

                    <small>

                      {new Date(

                        m.createdAt

                      ).toLocaleTimeString([], {

                        hour: "2-digit",

                        minute: "2-digit"

                      })}

                    </small>

                  )}

                  {shouldShowSeen(m) && (

                    <span
                      className="message-seen"
                      style={{
                        marginLeft: "6px",
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#6b7280",
                        whiteSpace: "nowrap"
                      }}
                    >
                      Seen
                    </span>

                  )}

                </div>

              </div>

            );

          })}

        </div>

        {voiceError && <div className="chat-voice-error">{voiceError}</div>}

        <div className={`chatbox ${recording ? "is-recording" : ""}`}>

  <div className="chat-input-wrap">

    <input

      value={text}

      onChange={e => setText(e.target.value)}

      onKeyDown={e => {

        if (

          e.key === "Enter" &&

          !e.shiftKey

        ) {

          e.preventDefault();

          send();

        }

      }}

      placeholder="Write a message..."

    />

    {recording ? (

  <button

    type="button"

    className="voice-record-button recording"

    onClick={stopVoiceRecording}

    disabled={voiceSending}

    aria-label="Stop recording and send voice message"

  >

    <span className="voice-record-stop">■</span>

    <span className="voice-record-time">

      {formatRecordingTime(recordingSeconds)}

    </span>

  </button>

) : (

  <button

    type="button"

    className="voice-record-button"

    onClick={startVoiceRecording}

    disabled={sending || voiceSending}

    aria-label="Record voice message"

  >

    <svg

      className="voice-mic-svg"

      viewBox="0 0 24 24"

      aria-hidden="true"

    >

      <rect

        x="8"

        y="3"

        width="8"

        height="12"

        rx="4"

        fill="currentColor"

      />

      <path

        d="M5 11a7 7 0 0 0 14 0"

        fill="none"

        stroke="currentColor"

        strokeWidth="2"

        strokeLinecap="round"

      />

      <path

        d="M12 18v3M9 21h6"

        fill="none"

        stroke="currentColor"

        strokeWidth="2"

        strokeLinecap="round"

      />

    </svg>

  </button>

)}

  </div>





  <button

  className="primary"

  onClick={send}

  disabled={sending || recording || voiceSending}

>

  {voiceSending

    ? "Sending..."

    : sending

    ? "Sending..."

    : "Send"}

</button>

</div>

      </div>

    </div>

  );

}





function SendInterestModal({

  profile,

  photo,

  onClose,

  onSend,

  loading = false

}) {

  const [selected, setSelected] = useState("Hi! I found your profile interesting and would like to connect.");

  const [custom, setCustom] = useState("");

  const options = [

    "Hi! I found your profile interesting and would like to connect.",

    "I would like to know more about you.",

    "Looking forward to a meaningful conversation."

  ];

  const isCustom = selected === "__custom__";

  const message = isCustom ? custom.trim() : selected;

  const fullName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "this profile";

  const photoUrl = photo?.url ? `${API}${photo.url}` : "";

  // IMPORTANT: render the modal directly under <body>.

  // ProfileCard/list containers can create stacking contexts (transform,

  // overflow, etc.), which can otherwise put another profile card above

  // the modal. The portal guarantees the Send Interest sheet is the

  // top-most mobile layer and keeps the background completely behind it.

  useEffect(() => {

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {

      document.body.style.overflow = previousOverflow;

    };

  }, []);

  const modal = (

    <div className="mobile-interest-overlay" role="dialog" aria-modal="true" onClick={e => { e.stopPropagation(); onClose(); }}>

      <div className="mobile-interest-modal" onClick={e => e.stopPropagation()}>

        <div className="mobile-interest-head">

          <div className="mobile-interest-title">

            <span className="mobile-interest-plane" aria-hidden="true">

              <svg viewBox="0 0 24 24" width="20" height="20">

                <path d="M21.7 2.3 2.6 9.7c-.7.3-.7 1.3 0 1.6l7.2 2.9 2.9 7.2c.3.7 1.3.7 1.6 0l7.4-19.1c.3-.8-.5-1.5-1.3-1.2ZM11 13l8-7-6.1 8.9-.9 2.3L11 13Z" fill="currentColor"/>

              </svg>

            </span>

            <strong>Send Interest</strong>

          </div>

          <button type="button" className="mobile-interest-close" onClick={onClose} aria-label="Close">×</button>

        </div>

        <div className="mobile-interest-profile">

          {photoUrl ? <img src={photoUrl} alt={fullName} /> : <span>{fullName.charAt(0).toUpperCase()}</span>}

          <h3>Send Interest to<br />{fullName}?</h3>

          <p>Let them know you're interested<br />in connecting.</p>

        </div>

        <div className="mobile-interest-options">

          {options.map(option => (

            <button

              key={option}

              type="button"

              className={`mobile-interest-option ${selected === option ? "selected" : ""}`}

              onClick={() => setSelected(option)}

            >

              <span className="mobile-interest-radio">{selected === option ? "✓" : ""}</span>

              <span>{option}</span>

            </button>

          ))}

          <button

            type="button"

            className={`mobile-interest-option ${isCustom ? "selected" : ""}`}

            onClick={() => setSelected("__custom__")}

          >

            <span className="mobile-interest-radio">{isCustom ? "✓" : ""}</span>

            <span>Write a custom message...</span>

          </button>

          {isCustom && (

            <textarea

              className="mobile-interest-custom"

              value={custom}

              onChange={e => setCustom(e.target.value)}

              placeholder="Write your message..."

              autoFocus

              maxLength={500}

            />

          )}

        </div>

        <button

          type="button"

          className="mobile-interest-send"

          disabled={loading || !message}

          onClick={() => onSend(message)}

        >

          {loading ? "Sending..." : "Send Interest"}

        </button>

      </div>

    </div>

  );

  return createPortal(modal, document.body);

}

function EmailSmsAlertsPage() {

  const [emailAlert, setEmailAlert] = useState("Unsubscribe");

  const [smsAlert, setSmsAlert] = useState("Unsubscribe");

  const [saved, setSaved] = useState(false);

  const saveAlerts = () => {

    localStorage.setItem(

      "goswami_email_sms_alerts",

      JSON.stringify({

        emailAlert,

        smsAlert

      })

    );

    setSaved(true);

    setTimeout(() => {

      setSaved(false);

    }, 2500);

  };

  return (

    <div className="alerts-page">

      <div className="alerts-container">

        {/* PAGE HEADER - ONLY ONE */}

        <div className="alerts-page-header">

          <div className="alerts-eyebrow">

            GOSWAMI JODI

          </div>

          <h1>Email / SMS Alerts</h1>

          <p>

            Manage your email and SMS notifications and choose

            how often you would like to receive matrimonial updates.

          </p>

        </div>





        {/* MY ALERTS */}

        <div className="alerts-card">

          <div className="my-alerts-heading">

            My Alerts

          </div>





          {/* MATCH MAIL */}

          <div className="alert-box">

            <div className="alert-box-header">

              <div>

                <h2>

                  Match Mail &amp; Photo Match Mail

                </h2>

                <p>

                  Personalized matches for you delivered via email

                  as often as you like. A powerful way to stay

                  updated with compatible matrimonial profiles.

                </p>

              </div>

              <span className="alert-arrow">

              </span>

            </div>





            <div className="alert-content">

              <div className="alert-label">

                Email Alert

              </div>

              <div className="alert-line"></div>

              <div className="alert-options">

                {[

                  "Daily",

                  "Tri-Weekly",

                  "Weekly",

                  "Unsubscribe"

                ].map(option => (

                  <label

                    key={option}

                    className="alert-option"

                  >

                    <input

                      type="radio"

                      name="emailAlert"

                      checked={emailAlert === option}

                      onChange={() => setEmailAlert(option)}

                    />

                    <span className="radio-circle"></span>

                    <span>{option}</span>

                  </label>

                ))}

              </div>

            </div>

          </div>





          {/* SMS */}

          <div className="alert-box">

            <div className="alert-box-header">

              <div>

                <h2>

                  SMS Match Alerts

                </h2>

                <p>

                  Receive important match and profile updates

                  on your registered mobile number.

                </p>

              </div>

              <span className="alert-arrow">

              </span>

            </div>





            <div className="alert-content">

              <div className="alert-label">

                SMS Alert

              </div>

              <div className="alert-line"></div>

              <div className="alert-options">

                {[

                  "Daily",

                  "Tri-Weekly",

                  "Weekly",

                  "Unsubscribe"

                ].map(option => (

                  <label

                    key={option}

                    className="alert-option"

                  >

                    <input

                      type="radio"

                      name="smsAlert"

                      checked={smsAlert === option}

                      onChange={() => setSmsAlert(option)}

                    />

                    <span className="radio-circle"></span>

                    <span>{option}</span>

                  </label>

                ))}

              </div>

            </div>

          </div>





          {/* BUTTONS */}

          <div className="alerts-actions">

            <button

              type="button"

              className="alerts-cancel"

              onClick={() => {

                setEmailAlert("Unsubscribe");

                setSmsAlert("Unsubscribe");

              }}

            >

              Cancel

            </button>

            <button

              type="button"

              className="alerts-save"

              onClick={saveAlerts}

            >

              Save Changes

              <span>→</span>

            </button>

          </div>





          {saved && (

            <div className="alerts-success">

              ✓ Alert preferences saved successfully

            </div>

          )}

        </div>





        {/* PRIVACY */}

        <div className="alerts-privacy">

          <div className="privacy-icon">

            🔒

          </div>

          <div>

            <h3>Your privacy matters</h3>

            <p>

              Your email and mobile number are kept private.

              You can change your notification preferences anytime.

            </p>

          </div>

        </div>

      </div>

    </div>

  );

}

function JodiLivePage() {

  const defaultSettings = {

    push: true,

    email: true,

    sms: true,

    whatsapp: true,

    call: true

  };

  const [settings, setSettings] = useState(defaultSettings);

  const [saved, setSaved] = useState(false);

  useEffect(() => {

    const savedSettings = localStorage.getItem(

      "goswami_shaadi_live_settings"

    );

    if (savedSettings) {

      try {

        setSettings(JSON.parse(savedSettings));

      } catch (error) {

        console.error("Unable to load Jodi Live settings");

      }

    }

  }, []);

  const toggleSetting = (key) => {

    setSettings(prev => ({

      ...prev,

      [key]: !prev[key]

    }));

    setSaved(false);

  };

  const resetSettings = () => {

    setSettings(defaultSettings);

    setSaved(false);

  };

  const updateSettings = () => {

    localStorage.setItem(

      "goswami_shaadi_live_settings",

      JSON.stringify(settings)

    );

    setSaved(true);

    setTimeout(() => {

      setSaved(false);

    }, 3000);

  };

  const CommunicationRow = ({ label, value, settingKey }) => (

    <div

      style={{

        height: "60px",

        display: "flex",

        alignItems: "center",

        justifyContent: "space-between",

        borderBottom: "1px solid #eeeeee"

      }}

    >

      <span

        style={{

          fontSize: "15px",

          color: "#333"

        }}

      >

        {label}

      </span>

      <button

        type="button"

        onClick={() => toggleSetting(settingKey)}

        style={{

          width: "34px",

          height: "18px",

          border: "none",

          borderRadius: "20px",

          background: value ? "#65c9da" : "#c9c9c9",

          position: "relative",

          padding: 0,

          cursor: "pointer",

          transition: "0.2s"

        }}

      >

        <span

          style={{

            width: "18px",

            height: "18px",

            position: "absolute",

            top: 0,

            left: value ? "16px" : 0,

            borderRadius: "50%",

            background: "#fff",

            boxShadow: "0 1px 4px rgba(0,0,0,.25)",

            transition: "0.2s"

          }}

        />

      </button>

    </div>

  );

  return (

    <div

      style={{

        minHeight: "calc(100vh - 76px)",

        background: "#f5f5f5",

        padding: "38px 20px 60px",

        boxSizing: "border-box"

      }}

    >

      <div

        style={{

          width: "100%",

          maxWidth: "760px",

          margin: "0 auto"

        }}

      >

        {/* PAGE HEADER */}

        <div style={{ marginBottom: "22px" }}>

          <div

            style={{

              display: "flex",

              alignItems: "center",

              gap: "10px"

            }}

          >

            <h1

              style={{

                margin: 0,

                fontSize: "30px",

                fontWeight: 600,

                color: "#333"

              }}

            >

              Jodi Live

            </h1>

            <span

              style={{

                background: "#35aeea",

                color: "#fff",

                fontSize: "11px",

                fontWeight: 700,

                padding: "4px 9px",

                borderRadius: "12px"

              }}

            >

              NEW

            </span>

          </div>

          <p

            style={{

              margin: "8px 0 0",

              color: "#777",

              fontSize: "14px"

            }}

          >

            Edit your Communication Preferences

          </p>

        </div>





        {/* MAIN CARD */}

        <div

          style={{

            background: "#fff",

            border: "1px solid #ddd",

            boxShadow: "0 2px 8px rgba(0,0,0,.06)"

          }}

        >

          {/* CARD HEADER */}

          <div

            style={{

              display: "flex",

              justifyContent: "space-between",

              alignItems: "flex-start",

              padding: "28px 38px 25px",

              borderBottom: "1px solid #e5e5e5"

            }}

          >

            <div>

              <h2

                style={{

                  margin: "0 0 10px",

                  fontSize: "18px",

                  fontWeight: 600,

                  color: "#333"

                }}

              >

                Edit your Communication Preferences

              </h2>

              <p

                style={{

                  margin: 0,

                  maxWidth: "650px",

                  fontSize: "13px",

                  lineHeight: 1.6,

                  color: "#777"

                }}

              >

                Please select the communication channels on which

                you would want to receive updates about Jodi Live

                events.

              </p>

            </div>

            <span

              style={{

                fontSize: "22px",

                color: "#777"

              }}

            >

              ⌃

            </span>

          </div>





          {/* COMMUNICATION SETTINGS */}

          <div style={{ padding: "10px 60px" }}>

            <CommunicationRow

              label="Push Notification"

              value={settings.push}

              settingKey="push"

            />

            <CommunicationRow

              label="Email"

              value={settings.email}

              settingKey="email"

            />

            <CommunicationRow

              label="SMS"

              value={settings.sms}

              settingKey="sms"

            />

            <CommunicationRow

              label="WhatsApp"

              value={settings.whatsapp}

              settingKey="whatsapp"

            />

            <CommunicationRow

              label="Call"

              value={settings.call}

              settingKey="call"

            />

          </div>





          {/* BUTTONS */}

          <div

            style={{

              display: "flex",

              justifyContent: "center",

              gap: "10px",

              padding: "24px 20px 30px",

              borderTop: "1px solid #eeeeee"

            }}

          >

            <button

              type="button"

              onClick={resetSettings}

              style={{

                minWidth: "125px",

                height: "42px",

                borderRadius: "22px",

                fontSize: "14px",

                fontWeight: 600,

                cursor: "pointer",

                background: "#fff",

                color: "#18a9c5",

                border: "1px solid #18a9c5"

              }}

            >

              Reset

            </button>

            <button

              type="button"

              onClick={updateSettings}

              style={{

                minWidth: "125px",

                height: "42px",

                borderRadius: "22px",

                fontSize: "14px",

                fontWeight: 600,

                cursor: "pointer",

                background: "#45c5d8",

                color: "#fff",

                border: "1px solid #45c5d8"

              }}

            >

              Update

            </button>

          </div>





          {/* SUCCESS */}

          {saved && (

            <div

              style={{

                margin: "0 38px 25px",

                padding: "12px 16px",

                borderRadius: "6px",

                background: "#eafaf0",

                color: "#21884b",

                textAlign: "center",

                fontSize: "14px"

              }}

            >

              Your Jodi Live settings have been successfully updated.

            </div>

          )}

        </div>





        {/* PRIVACY */}

        <div

          style={{

            display: "flex",

            alignItems: "center",

            gap: "16px",

            marginTop: "18px",

            padding: "20px 25px",

            background: "#fff",

            border: "1px solid #e2e2e2"

          }}

        >

          <div

            style={{

              width: "42px",

              height: "42px",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              borderRadius: "50%",

              background: "#f1fbfd",

              fontSize: "20px"

            }}

          >

            🔒

          </div>

          <div>

            <h3

              style={{

                margin: "0 0 5px",

                fontSize: "15px",

                color: "#333"

              }}

            >

              Your privacy matters

            </h3>

            <p

              style={{

                margin: 0,

                fontSize: "13px",

                lineHeight: 1.5,

                color: "#777"

              }}

            >

              You can update your communication preferences

              anytime. Your contact information remains private.

            </p>

          </div>

        </div>

      </div>

    </div>

  );

}

function App() {

  const location = useLocation();

  const isAstroRoute = location.pathname.startsWith("/astro-chat") || location.pathname === "/astro-privacy-policy" || location.pathname === "/astro-terms";
  // The pages the app links to must not lead on to the membership page, so they have no site menu.
  const noSiteMenu = isAstroRoute || ["/privacy-policy", "/terms-conditions", "/child-safety", "/delete-account"].includes(location.pathname);

  useEffect(() => {

    if (!localStorage.getItem("token")) return;

    const beat = () => {

      if (localStorage.getItem("token")) {

        api.post("/auth/heartbeat").catch(() => {});

      }

    };

    beat();

    const timer = setInterval(beat, 60000);

    return () => clearInterval(timer);

  }, []);

  const protectedRoute = (el) =>

    localStorage.getItem("token")

      ? el

      : <Navigate to="/login" />;

  return (

    <>

      {!noSiteMenu && <Header />}

      <Routes>

        <Route

          path="/login"

          element={<Auth mode="login" />}

        />

        <Route

          path="/register"

          element={<Auth mode="register" />}

        />

        <Route

  path="/biodata"

  element={protectedRoute(<Biodata />)}

/>





<Route

  path="/report-profile"

  element={protectedRoute(<ReportProfile />)}

/>

<Route

  path="/privacy"

  element={protectedRoute(<PrivacySettings />)}

/>

<Route

  path="/mental-wellbeing"

  element={protectedRoute(<MentalWellbeing />)}

/>

<Route

  path="/astro-chat"

  element={protectedRoute(<AstroChat />)}

/>

<Route

  path="/privacy-policy"

  element={<PrivacyPolicyPage />}

/>

<Route

  path="/terms-conditions"

  element={<TermsPage />}

/>

<Route
  path="/child-safety"
  element={<ChildSafetyPage />}
/>
<Route
  path="/delete-account"
  element={<DeleteAccountPage />}
/>
<Route

  path="/astro-privacy-policy"

  element={<AstroLegalPage type="privacy" />}

/>

<Route

  path="/astro-terms"

  element={<AstroLegalPage type="terms" />}

/>

<Route

  path="/astro-chat/recharge/:id"

  element={protectedRoute(<AstroRecharge />)}

/>

<Route

  path="/astro-chat/payment/:amount"

  element={protectedRoute(<AstroPayment />)}

/>

<Route

  path="/astro-chat/session/:id"

  element={protectedRoute(<AstroChatSession />)}

/>

<Route

  path="/safe-online"

  element={<SafetyCentre />}

/>

<Route

  path="/safety-tips"

  element={<SafetyTips />}

/> 

        <Route

  path="/hide-delete-profile"

  element={protectedRoute(<HideDeleteProfilePage />)}

/>

<Route

  path="/privacy-options"

  element={protectedRoute(<PrivacyOptionsPage />)}

/>

<Route

  path="/hidden-blocked-profiles"

  element={protectedRoute(<HiddenBlockedProfilesPage />)}

/>

<Route

  path="/report-problem"

  element={protectedRoute(<ReportProblemPage />)}

/>

<Route

  path="/jodi-live"

  element={protectedRoute(<JodiLivePage />)}

/>

<Route

  path="/astro-details"

  element={protectedRoute(<AstroDetailsPage />)}

/>

<Route

  path="/account-settings"

  element={protectedRoute(<AccountSettingsPage />)}

/>

<Route

  path="/contact-filters"

  element={

    <Shell>

      <ContactFilters />

    </Shell>

  }

/>





        <Route

          path="/forgot-password"

          element={<ForgotPassword />}

        />

        <Route

          path="/"

          element={protectedRoute(<Home />)}

        />

        <Route

          path="/profile"

          element={protectedRoute(<MyProfileView />)}

        />

        <Route

         path="/contact-settings"

         element={protectedRoute(<ContactSettings />)}

        />

        <Route

          path="/profile/edit"

          element={protectedRoute(<Profile />)}

        />

      <Route

  path="/email-sms-alerts"

  element={<EmailSmsAlertsPage />}

/>

        <Route

  path="/profile/photos"

  element={protectedRoute(<ProfilePhotos />)}

/>

        <Route

          path="/profile/edit/about-me"

          element={protectedRoute(<AboutMe />)}

         />

        <Route

          path="/profile/edit/interests-hobbies"

          element={protectedRoute(<InterestsHobbiesEdit />)}

        />

        <Route

  path="/profile/edit/basic-details"

  element={protectedRoute(<BasicDetails />)}

/>

         <Route

           path="/profile/edit/religious-details"

           element={protectedRoute(<ReligiousDetails />)}

         />

         <Route

           path="/profile/edit/family-details"

           element={protectedRoute(<FamilyDetails />)}

          />

          <Route

           path="/profile/edit/education-career"

           element={protectedRoute(<EducationCareer />)}

          />

          <Route

            path="/profile/edit/location"

            element={protectedRoute(<LocationDetails />)}

           />

















        <Route

          path="/preferences"

          element={protectedRoute(<Preferences />)}

        />

        <Route

          path="/search"

          element={protectedRoute(<Search />)}

        />

        <Route

          path="/requests"

          element={protectedRoute(<Requests />)}

        />

        <Route

          path="/premium"

          element={protectedRoute(<Premium />)}

        />





        <Route

          path="/shortlists"

          element={protectedRoute(<Shortlists />)}

        />

        <Route

         path="/messages"

         element={protectedRoute(<Messages />)}

        />

        <Route

          path="/notifications"

          element={protectedRoute(<Notifications />)}

        />

        <Route

          path="/profile-view/:id"

          element={protectedRoute(<ViewRoute />)}

        />

        <Route

          path="/chat/:id"

          element={protectedRoute(<ChatRoute />)}

        />

        <Route

          path="/about"

          element={<div className="container"><About /></div>}

        />

        {/* FULL WIDTH HELP PAGES */}

        <Route

          path="/help"

          element={<Help />}

        />

        <Route

          path="/help-support"

          element={<HelpSupport />}

        />

      </Routes>

      {!noSiteMenu && <MobileBottomNav />}

    </>

  );

}

function HideDeleteProfilePage() {

  const nav = useNavigate();

  const [profileVisible, setProfileVisible] = useState(true);

  const [loading, setLoading] = useState(true);

  const [showHideModal, setShowHideModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [hideDuration, setHideDuration] = useState("1 week");

  const [deleteReason, setDeleteReason] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {

    api.get("/profiles/me")

      .then(r => {

        setProfileVisible(r.data.profileVisible !== false);

      })

      .catch(() => {

        setError("Unable to load profile settings.");

      })

      .finally(() => {

        setLoading(false);

      });

  }, []);

  const hideProfile = async () => {

    setMessage("");

    setError("");

    try {

      const r = await api.get("/profiles/me");

      await api.put("/profiles/me", {

        ...r.data,

        profileVisible: false

      });

      setProfileVisible(false);

      setShowHideModal(false);

      setMessage(`Your profile has been hidden for ${hideDuration}.`);

    } catch (x) {

      setError(

        x.response?.data?.message ||

        "Unable to hide your profile."

      );

    }

  };

  const showProfile = async () => {

    setMessage("");

    setError("");

    try {

      const r = await api.get("/profiles/me");

      await api.put("/profiles/me", {

        ...r.data,

        profileVisible: true

      });

      setProfileVisible(true);

      setMessage("Your profile is visible again.");

    } catch (x) {

      setError(

        x.response?.data?.message ||

        "Unable to show your profile."

      );

    }

  };

  const deleteProfile = async () => {

    if (!deleteReason) {

      setError("Please select a reason before deleting your profile.");

      return;

    }

    setMessage("");

    setError("");

    try {

      await api.post("/account/delete", {
        password: deletePassword,
        reason: deleteReason
      });

      localStorage.clear();

      nav("/login", { replace: true });

    } catch (x) {

      setError(

        x.response?.data?.message ||

        "Profile deletion failed."

      );

    }

  };

  if (loading) {

    return (

      <div className="hide-delete-page">

        <div className="hide-delete-loading">

          Loading your profile settings...

        </div>

      </div>

    );

  }

  return (

    <div className="hide-delete-page">

      <div className="hide-delete-container">

        <div className="hide-delete-header">

          <div className="hide-delete-eyebrow">

            ACCOUNT SETTINGS

          </div>

          <h1>Hide / Delete Profile</h1>

          <p>

            Manage your profile visibility or permanently

            remove your GoswamiJodi profile.

          </p>

        </div>

        {message && (

          <div className="hide-delete-success">

            ✓ {message}

          </div>

        )}

        {error && (

          <div className="hide-delete-error">

            {error}

          </div>

        )}

        {/* HIDE PROFILE */}

        <div className="hd-card">

          <div className="hd-card-icon hide-icon">

            👁

          </div>

          <div className="hd-card-content">

            <h2>Hide Profile</h2>

            <p className="hd-status">

              Your profile is currently{" "}

              <strong>

                {profileVisible ? "visible" : "hidden"}

              </strong>

            </p>

            <p className="hd-description">

              When you hide your profile, it will not appear

              in Discover, Search or Matches listings.

              You can make your profile visible again anytime.

            </p>

          </div>

          <button

            className="hd-action hide-action"

            onClick={() => {

              if (profileVisible) {

                setShowHideModal(true);

              } else {

                showProfile();

              }

            }}

          >

            {profileVisible ? "Hide" : "Show"}

          </button>

        </div>





        {/* DELETE PROFILE */}

        <div className="hd-card delete-card">

          <div className="hd-card-icon delete-icon">

            🗑

          </div>

          <div className="hd-card-content">

            <h2>Delete Profile</h2>

            <p className="hd-status">

              Permanently remove your GoswamiJodi profile

            </p>

            <p className="hd-description">

              Deleting your profile is permanent. Your profile

              information will no longer be available.

            </p>

          </div>

          <button

            className="hd-action delete-action"

            onClick={() => {

              setDeleteReason("");

              setShowDeleteModal(true);

            }}

          >

            Delete

          </button>

        </div>

      </div>





      {/* ================= HIDE MODAL ================= */}

      {showHideModal && (

        <div

          className="hd-modal-overlay"

          onClick={() => setShowHideModal(false)}

        >

          <div

            className="hd-modal"

            onClick={e => e.stopPropagation()}

          >

            <button

              className="hd-modal-back"

              onClick={() => setShowHideModal(false)}

            >

              ←

            </button>

            <div className="hd-modal-icon hide-modal-icon">

              👁

            </div>

            <h2>Hide Profile</h2>

            <p className="hd-modal-subtitle">

              Hiding your Profile will make it invisible.

            </p>

            <div className="hd-modal-divider"></div>

            <h3>

              How long would you like to hide your profile for?

            </h3>

            <div className="duration-options">

              {["1 week", "2 weeks", "1 month"].map(option => (

                <button

                  key={option}

                  className={

                    hideDuration === option

                      ? "duration-option selected"

                      : "duration-option"

                  }

                  onClick={() => setHideDuration(option)}

                >

                  <span className="duration-radio">

                    {hideDuration === option ? "✓" : ""}

                  </span>

                  <span>{option}</span>

                </button>

              ))}

            </div>

            <button

              className="hd-confirm-hide"

              onClick={hideProfile}

            >

              Hide my Profile

            </button>

          </div>

        </div>

      )}





      {/* ================= DELETE MODAL ================= */}

      {showDeleteModal && (

        <div

          className="hd-modal-overlay"

          onClick={() => setShowDeleteModal(false)}

        >

          <div

            className="hd-modal delete-modal"

            onClick={e => e.stopPropagation()}

          >

            <button

              className="hd-modal-back"

              onClick={() => setShowDeleteModal(false)}

            >

              ←

            </button>

            <div className="hd-modal-icon delete-modal-icon">

              🗑

            </div>

            <h2>

              Why do you want to delete your Profile?

            </h2>

            <div className="delete-reasons">

              {[

                "Found My Match",

                "Taking a break",

                "Unsatisfactory experience",

                "Reason not mentioned here"

              ].map(reason => (

                <button

                  key={reason}

                  className={

                    deleteReason === reason

                      ? "delete-reason selected"

                      : "delete-reason"

                  }

                  onClick={() => setDeleteReason(reason)}

                >

                  <span>{reason}</span>

                  <span className="reason-arrow">

                    ›

                  </span>

                </button>

              ))}

            </div>

            <input
              className="hd-delete-password"
              type="password"
              placeholder="Enter your password to confirm"
              autoComplete="current-password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", border: "1px solid #d8dbe3", borderRadius: 10, marginBottom: 10 }}
            />
            {error && <p className="delete-help" style={{ color: "#c0263f" }}>{error}</p>}
            <p className="delete-help">

              Having trouble using GoswamiJodi?

            </p>

            <button

              className="hd-confirm-delete"

              disabled={!deleteReason || !deletePassword}

              onClick={deleteProfile}

            >

              Permanently Delete Profile

            </button>

          </div>

        </div>

      )}

    </div>

  );

}

function AccountSettingsPage() {

  const nav = useNavigate();

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);

  const [showEmailModal, setShowEmailModal] = useState(false);

  const [editEmail, setEditEmail] = useState("");

  const [emailSaving, setEmailSaving] = useState(false);

  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {

    const savedEmail = localStorage.getItem("userEmail");

    if (savedEmail) {

      setEmail(savedEmail);

      setLoading(false);

      return;

    }

    api.get("/profiles/me")

      .then((r) => {

        const profileEmail =

          r.data?.email ||

          r.data?.user?.email ||

          "";

        setEmail(profileEmail);

        if (profileEmail) {

          localStorage.setItem("userEmail", profileEmail);

        }

      })

      .catch(() => {

        setEmail("");

      })

      .finally(() => {

        setLoading(false);

      });

  }, []);

  if (loading) {

    return (

      <div className="account-settings-page">

        <div className="account-settings-container">

          <div className="account-settings-loading">

            Loading account settings...

          </div>

        </div>

      </div>

    );

  }

  return (

    <>

      <div className="account-settings-page">

        <div className="account-settings-container">

          {/* PAGE HEADER */}

          <div className="account-settings-heading">

            <div className="account-settings-eyebrow">

              MY GOSWAMIJODI

            </div>

            <h1>Settings</h1>

            <p>

              Manage your GoswamiJodi account settings

              and registered email address.

            </p>

          </div>





          {/* ACCOUNT SETTINGS */}

          <div className="account-settings-card">

            <div className="account-settings-card-header">

              <div>

                <h2>Account Settings</h2>

                <p>

                  Manage the email address associated with

                  your GoswamiJodi account.

                </p>

              </div>

              <span className="account-settings-chevron">

                ⌃

              </span>

            </div>





            {/* EMAIL ROW */}

            <div className="account-email-row">

              <div className="account-email-label">

                Update Email Id:

              </div>

              <div className="account-email-value">

                {email || "No email address available"}

              </div>

              <button

                type="button"

                className="account-email-edit"

                onClick={() => {

                  setEditEmail(email);

                  setEmailMessage("");

                  setShowEmailModal(true);

                }}

              >

                Edit

              </button>

            </div>

          </div>





          {/* OTHER SETTINGS */}

          <div

            className="account-settings-row"

            onClick={() => nav("/contact-settings")}

          >

            <span>My Contact Settings</span>

            <span>⌄</span>

          </div>

          <div

            className="account-settings-row"

            onClick={() => nav("/contact-filters")}

          >

            <span>Contact Filters</span>

            <span>⌄</span>

          </div>

          <div

            className="account-settings-row"

            onClick={() => nav("/astro-details")}

          >

            <span>Astro Details</span>

            <span>⌄</span>

          </div>

          <div

            className="account-settings-row"

            onClick={() => nav("/email-sms-alerts")}

          >

            <span>Email / SMS Alerts</span>

            <span>⌄</span>

          </div>

          <div

            className="account-settings-row"

            onClick={() => nav("/privacy-options")}

          >

            <span>Privacy Options</span>

            <span>⌄</span>

          </div>

          <div

            className="account-settings-row"

            onClick={() => nav("/jodi-live")}

          >

            <span>

              Jodi Live

              <b className="account-new-badge">NEW</b>

            </span>

            <span>⌄</span>

          </div>

        </div>

      </div>





      {/* =====================================================

          EDIT EMAIL MODAL

          IMPORTANT: THIS MUST BE INSIDE THE RETURN

         \\===================================================== */}

      {showEmailModal && (

        <div

          className="email-edit-overlay"

          onClick={() => setShowEmailModal(false)}

        >

          <div

            className="email-edit-modal"

            onClick={(e) => e.stopPropagation()}

          >

            {/* CLOSE */}

            <button

              type="button"

              className="email-modal-close"

              onClick={() => setShowEmailModal(false)}

            >

              ×

            </button>





            {/* EMAIL ICON */}

            <div className="email-modal-icon">

              ✉

            </div>





            {/* TITLE */}

            <h2>

              Edit your Email ID

            </h2>





            {/* SUBTITLE */}

            <p className="email-modal-subtitle">

              Confirm and verify your email to avoid losing

              access to your account &amp; Matches

            </p>





            {/* EMAIL INPUT */}

            <div className="email-input-wrapper">

              <label>

                Email ID

              </label>

              <input

                type="email"

                value={editEmail}

                onChange={(e) => {

                  setEditEmail(e.target.value);

                  setEmailMessage("");

                }}

                placeholder="Enter your email address"

              />

            </div>





            {/* MESSAGE */}

            {emailMessage && (

              <div className="email-modal-message">

                {emailMessage}

              </div>

            )}





            {/* CONFIRM BUTTON */}

            <button

              type="button"

              className="email-confirm-button"

              disabled={

                !editEmail.trim() ||

                editEmail === email ||

                emailSaving

              }

              onClick={async () => {

                if (!editEmail.trim()) {

                  setEmailMessage(

                    "Please enter your email address."

                  );

                  return;

                }

                setEmailSaving(true);

                setEmailMessage("");

                try {

                  /*

                   * Temporary frontend update.

                   * Backend email verification can be

                   * connected here later.

                   */

                  setEmail(editEmail);

                  localStorage.setItem(

                    "userEmail",

                    editEmail

                  );

                  setEmailMessage(

                    "Email ID updated successfully."

                  );

                  setTimeout(() => {

                    setShowEmailModal(false);

                    setEmailMessage("");

                  }, 1200);

                } catch (err) {

                  setEmailMessage(

                    "Unable to update email. Please try again."

                  );

                } finally {

                  setEmailSaving(false);

                }

              }}

            >

              {emailSaving

                ? "Saving..."

                : "Confirm Email"}

            </button>

          </div>

        </div>

      )}

    </>

  );

}

function AstroDetailsPage() {

  const [openSection, setOpenSection] = useState(null);

  const [privacy, setPrivacy] = useState(

    localStorage.getItem("astroPrivacy") || "all"

  );

  const [astro, setAstro] = useState({

  timeOfBirth: "",

  placeOfBirth: "",

  manglik: "",

  nakshatra: "",

  rashi: ""

});

useEffect(() => {

  api.get("/profiles/me")

    .then(res => {

      setAstro({

        timeOfBirth: res.data.timeOfBirth || "",

        placeOfBirth: res.data.placeOfBirth || "",

        manglik: res.data.manglik || "",

        nakshatra: res.data.nakshatra || "",

        rashi: res.data.rashi || ""

      });

    })

    .catch(err => {

      console.error("Failed to load astro details:", err);

    });

}, []);





  const [editMode, setEditMode] = useState(false);

  const toggleSection = (section) => {

    setOpenSection(

      openSection === section ? null : section

    );

  };

  const savePrivacy = () => {

    localStorage.setItem("astroPrivacy", privacy);

    setOpenSection(null);

  };

  const saveAstroDetails = () => {

    localStorage.setItem("astroTimeOfBirth", astro.timeOfBirth);

    localStorage.setItem("astroPlaceOfBirth", astro.placeOfBirth);

    localStorage.setItem("astroManglik", astro.manglik);

    localStorage.setItem("astroNakshatra", astro.nakshatra);

    localStorage.setItem("astroRashi", astro.rashi);

    setEditMode(false);

    setOpenSection(null);

  };

  return (

    <div className="astro-page">

      <div className="astro-container">

        {/* PAGE HEADER */}

        <div className="astro-page-header">

          <div className="astro-eyebrow">

            MY GOSWAMIJODI

          </div>

          <h1>Astro Details</h1>

          <p>

            Manage your astrology details and privacy settings.

          </p>

        </div>





        {/* MAIN ASTRO CARD */}

        <div className="astro-main-card">

          <div className="astro-main-title">

            Astro Details

          </div>





          {/* =========================

              ASTRO PRIVACY SETTINGS

             \\========================= */}

          <div className="astro-inner-card">

            <button

              type="button"

              className="astro-inner-header"

              onClick={() => toggleSection("privacy")}

            >

              <div>

                <h3>

                  Astro Privacy Settings

                </h3>

                <p>

                  {privacy === "all"

                    ? "Visible to all Members"

                    : privacy === "accepted"

                    ? "Visible to contacted and accepted Members"

                    : "Hide from all"}

                </p>

              </div>

              <span>

                {openSection === "privacy" ? "⌃" : "⌄"}

              </span>

            </button>





            {openSection === "privacy" && (

              <div className="astro-expanded-content">

                <label className="astro-radio-row">

                  <input

                    type="radio"

                    name="astroPrivacy"

                    value="all"

                    checked={privacy === "all"}

                    onChange={(e) =>

                      setPrivacy(e.target.value)

                    }

                  />

                  <span>

                    Visible to all Members

                  </span>

                </label>





                <label className="astro-radio-row">

                  <input

                    type="radio"

                    name="astroPrivacy"

                    value="accepted"

                    checked={privacy === "accepted"}

                    onChange={(e) =>

                      setPrivacy(e.target.value)

                    }

                  />

                  <span>

                    Visible to contacted and accepted Members

                  </span>

                </label>





                <label className="astro-radio-row">

                  <input

                    type="radio"

                    name="astroPrivacy"

                    value="hidden"

                    checked={privacy === "hidden"}

                    onChange={(e) =>

                      setPrivacy(e.target.value)

                    }

                  />

                  <span>

                    Hide from all

                  </span>

                </label>





                <div className="astro-action-buttons">

                  <button

                    type="button"

                    className="astro-cancel-btn"

                    onClick={() => setOpenSection(null)}

                  >

                    Cancel

                  </button>

                  <button

                    type="button"

                    className="astro-save-btn"

                    onClick={savePrivacy}

                  >

                    Save

                  </button>

                </div>

              </div>

            )}

          </div>





          {/* =========================

              ASTRO DETAILS

             \\========================= */}

          <div className="astro-inner-card">

            <div

              className="astro-inner-header"

              onClick={() => toggleSection("details")}

            >

              <div className="astro-title-with-edit">

                <h3>

                  Astro Details

                </h3>

                <button

                  type="button"

                  className="astro-edit-btn"

                  onClick={(e) => {

                    e.stopPropagation();

                    setEditMode(true);

                    setOpenSection("details");

                  }}

                >

                  EDIT

                </button>

              </div>

              <span>

                {openSection === "details" ? "⌃" : "⌄"}

              </span>

            </div>





            {openSection === "details" && (

              <div className="astro-expanded-content">

                {!editMode ? (

                  <>

                    <div className="astro-detail-row">

                      <div className="astro-detail-icon">

                        ◷

                      </div>

                      <div>

                        <small>Time of Birth</small>

                        <strong>

                          {astro.timeOfBirth}

                        </strong>

                      </div>

                    </div>





                    <div className="astro-detail-row">

                      <div className="astro-detail-icon">

                        📍

                      </div>

                      <div>

                        <small>Place of Birth</small>

                        <strong>

                          {astro.placeOfBirth}

                        </strong>

                      </div>

                    </div>





                    <div className="astro-detail-row">

                      <div className="astro-detail-icon">

                        ◉

                      </div>

                      <div>

                        <small>Manglik</small>

                        <strong>

                          {astro.manglik}

                        </strong>

                      </div>

                    </div>





                    <div className="astro-detail-row">

                      <div className="astro-detail-icon">

                        ✦

                      </div>

                      <div>

                        <small>Nakshatra</small>

                        <strong>

                          {astro.nakshatra}

                        </strong>

                      </div>

                    </div>





                    <div className="astro-detail-row">

                      <div className="astro-detail-icon">

                        ◈

                      </div>

                      <div>

                        <small>Rashi</small>

                        <strong>

                          {astro.rashi}

                        </strong>

                      </div>

                    </div>

                  </>

                ) : (

                  <div className="astro-edit-form">

                    <div className="astro-form-group">

                      <label>Time of Birth</label>

                      <input

                        type="text"

                        value={astro.timeOfBirth}

                        onChange={(e) =>

                          setAstro({

                            ...astro,

                            timeOfBirth: e.target.value

                          })

                        }

                        placeholder="Example: 11:00 AM"

                      />

                    </div>





                    <div className="astro-form-group">

                      <label>Place of Birth</label>

                      <input

                        type="text"

                        value={astro.placeOfBirth}

                        onChange={(e) =>

                          setAstro({

                            ...astro,

                            placeOfBirth: e.target.value

                          })

                        }

                        placeholder="Enter place of birth"

                      />

                    </div>





                    <div className="astro-form-group">

                      <label>Manglik</label>

                      <select

                        value={astro.manglik}

                        onChange={(e) =>

                          setAstro({

                            ...astro,

                            manglik: e.target.value

                          })

                        }

                      >

                        <option value="No">No</option>

                        <option value="Yes">Yes</option>

                      </select>

                    </div>





                    <div className="astro-form-group">

                      <label>Nakshatra</label>

                      <input

                        type="text"

                        value={astro.nakshatra}

                        onChange={(e) =>

                          setAstro({

                            ...astro,

                            nakshatra: e.target.value

                          })

                        }

                      />

                    </div>





                    <div className="astro-form-group">

                      <label>Rashi</label>

                      <input

                        type="text"

                        value={astro.rashi}

                        onChange={(e) =>

                          setAstro({

                            ...astro,

                            rashi: e.target.value

                          })

                        }

                      />

                    </div>





                    <div className="astro-action-buttons">

                      <button

                        type="button"

                        className="astro-cancel-btn"

                        onClick={() => {

                          setEditMode(false);

                          setOpenSection(null);

                        }}

                      >

                        Cancel

                      </button>

                      <button

                        type="button"

                        className="astro-save-btn"

                        onClick={saveAstroDetails}

                      >

                        Save

                      </button>

                    </div>

                  </div>

                )}

              </div>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}

function ProfilePhotos() {

  const [photos, setPhotos] = useState([]);

  const [uploading, setUploading] = useState(false);

  const [actionId, setActionId] = useState(null);

  const [msg, setMsg] = useState("");

  const loadPhotos = async () => {

    try {

      const r = await api.get("/photos");

      setPhotos(Array.isArray(r.data) ? r.data : []);

    } catch (e) {

      console.error(e);

    }

  };

  useEffect(() => {

    loadPhotos();

  }, []);

  const upload = async (e) => {

    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

      setMsg("Please select a valid image file.");

      return;

    }

    if (file.size > 10 * 1024 * 1024) {

      setMsg("Image size should be less than 10 MB.");

      return;

    }

    setUploading(true);

    setMsg("");

    try {

      const formData = new FormData();

      formData.append("file", file);

      await api.post("/photos", formData, {

        headers: {

          "Content-Type": "multipart/form-data"

        }

      });

      await loadPhotos();

      setMsg("✓ Photo uploaded successfully");

    } catch (x) {

      setMsg(

        x.response?.data?.message ||

        "Failed to upload photo"

      );

    } finally {

      setUploading(false);

      e.target.value = "";

    }

  };

  const deletePhoto = async (id) => {

    setActionId(id);

    setMsg("");

    try {

      await api.delete("/photos/" + id);

      await loadPhotos();

      setMsg("✓ Photo deleted successfully");

    } catch (x) {

      setMsg(

        x.response?.data?.message ||

        "Failed to delete photo"

      );

    } finally {

      setActionId(null);

    }

  };

  const setPrimary = async (id) => {

    setActionId(id);

    setMsg("");

    try {

      await api.patch("/photos/" + id + "/primary");

      await loadPhotos();

      setMsg("✓ Primary photo updated successfully");

    } catch (x) {

      setMsg(

        x.response?.data?.message ||

        "Failed to update primary photo"

      );

    } finally {

      setActionId(null);

    }

  };

  return (

    <div className="photo-manager-page">

      <div className="photo-manager-container">

        <div className="photo-manager-header">

          <div>

            <span className="photo-eyebrow">

              YOUR PROFILE

            </span>

            <h1>Manage Profile Photos</h1>

            <p>

              Add your best photos to make your profile more attractive

              and help potential matches know you better.

            </p>

          </div>

          <div className="photo-header-icon">

            📷

          </div>

        </div>





        {msg && (

          <div className="photo-success">

            {msg}

          </div>

        )}





        <div className="photo-manager-card">

          <div className="photo-card-header">

            <div>

              <h2>

                Profile Photos

              </h2>

              <p>

                {photos.length}/10 photos added

              </p>

            </div>

          </div>





          {photos.length > 0 ? (

            <div className="photo-manager-grid">

              {photos.map(photo => (

                <div

                  className="photo-manager-item"

                  key={photo.id}

                >

                  <div className="photo-manager-image">

                    <img

                      src={`${API}${photo.url}`}

                      alt="Profile"

                      onError={(e) => {

                        e.currentTarget.style.display = "none";

                      }}

                    />

                    {photo.primaryPhoto && (

                      <span className="primary-photo-label">

                        ✓ Primary

                      </span>

                    )}

                  </div>





                  <div className="photo-manager-actions">

                    {!photo.primaryPhoto && (

                      <button

                        type="button"

                        disabled={actionId === photo.id}

                        onClick={() => setPrimary(photo.id)}

                        className="set-primary-btn"

                      >

                        {actionId === photo.id

                          ? "Updating..."

                          : "Set Primary"}

                      </button>

                    )}





                    <button

                      type="button"

                      disabled={actionId === photo.id}

                      onClick={() => deletePhoto(photo.id)}

                      className="delete-photo-btn"

                    >

                      {actionId === photo.id

                        ? "Deleting..."

                        : "Delete"}

                    </button>

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="photo-empty-state">

              <div className="photo-empty-icon">

                📷

              </div>

              <h3>

                No photos added yet

              </h3>

              <p>

                Add your first profile photo to make your

                matrimonial profile stand out.

              </p>

            </div>

          )}





          {photos.length < 10 && (

            <div className="photo-upload-box">

              <label className="photo-upload-button">

                {uploading

                  ? "Uploading..."

                  : "+ Add New Photo"}

                <input

                  type="file"

                  accept="image/*"

                  onChange={upload}

                  disabled={uploading}

                  hidden

                />

              </label>

              <p>

                JPG, JPEG or PNG · Maximum 10 MB

              </p>

            </div>

          )}

        </div>





        <div className="photo-manager-footer">

          <Link

            to="/profile"

            className="photo-back-button"

          >

            ← Back to Profile

          </Link>

          <span>

            You can add up to 10 photos

          </span>

        </div>

      </div>

    </div>

  );

}

function SafetyTips() {

  const nav = useNavigate();

  return (

    <>

      <style>{`

        .goswami-safety-tips-page { min-height:100vh; background:#fff; color:#202b49; padding-bottom:90px; font-family:inherit; }

        .gst-header { position:sticky; top:0; z-index:20; height:64px; display:flex; align-items:center; gap:14px; padding:0 20px; background:rgba(255,255,255,.96); backdrop-filter:blur(14px); border-bottom:1px solid #edf0f5; }

        .gst-back { border:0; background:transparent; font-size:31px; line-height:1; color:#263352; padding:0; cursor:pointer; }

        .gst-header h1 { margin:0; font-size:25px; font-weight:750; letter-spacing:-.4px; }

        .gst-wrap { max-width:760px; margin:0 auto; padding:18px 18px 35px; }

        .gst-hero { overflow:hidden; border:1px solid #ececf0; border-radius:24px; background:linear-gradient(135deg,#fff6f7,#f4fbfc); box-shadow:0 12px 32px rgba(30,45,75,.07); }

        .gst-hero-img { width:100%; height:190px; object-fit:cover; display:block; }

        .gst-hero-body { padding:20px 20px 22px; }

        .gst-brand { font-size:13px; font-weight:800; color:#d32859; letter-spacing:.3px; }

        .gst-hero h2 { margin:8px 0 9px; font-size:31px; line-height:1.08; letter-spacing:-.8px; }

        .gst-hero p { margin:0; color:#687080; font-size:15px; line-height:1.55; }

        .gst-section-title { margin:27px 4px 13px; font-size:21px; font-weight:800; }

        .gst-tip { display:flex; gap:15px; align-items:flex-start; padding:17px; margin-bottom:12px; background:#fff; border:1px solid #e9ebf0; border-radius:19px; box-shadow:0 7px 22px rgba(35,48,75,.05); }

        .gst-icon { width:46px; height:46px; flex:0 0 46px; display:grid; place-items:center; border-radius:15px; background:#eef9fb; font-size:24px; }

        .gst-tip h3 { margin:0 0 5px; font-size:17px; color:#27334f; }

        .gst-tip p { margin:0; color:#717783; font-size:14px; line-height:1.55; }

        .gst-do { color:#159db1; font-weight:750; font-size:13px; margin-top:8px; display:block; }

        .gst-support { margin-top:27px; padding:20px; border-radius:21px; background:linear-gradient(135deg,#f6fcfd,#fff7fa); border:1px solid #e8edf0; }

        .gst-support h2 { margin:0 0 5px; font-size:21px; }

        .gst-support > p { margin:0 0 15px; color:#707682; font-size:14px; line-height:1.5; }

        .gst-contact { display:flex; align-items:center; gap:12px; text-decoration:none; color:inherit; padding:10px 0; }

        .gst-contact-icon { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; background:#fff; border:1px solid #e4e8ed; font-size:19px; }

        .gst-contact small { display:block; color:#7a808b; font-size:12px; margin-bottom:2px; }

        .gst-contact strong { color:#159db1; font-size:15px; }

        .gst-footer { margin-top:20px; padding:17px 18px; border-radius:18px; background:#202a45; color:#fff; display:flex; align-items:center; gap:12px; }

        .gst-footer-badge { width:38px; height:38px; border-radius:50%; display:grid; place-items:center; background:#fff; color:#17a6b8; font-weight:900; }

        .gst-footer strong { display:block; font-size:14px; }

        .gst-footer span { display:block; margin-top:3px; font-size:12px; opacity:.72; }

        @media (max-width:700px) { .goswami-safety-tips-page { width:100%; } .gst-wrap { padding-left:16px; padding-right:16px; } .gst-hero-img { height:180px; } .gst-hero h2 { font-size:28px; } }

        @media (min-width:701px) { .goswami-safety-tips-page { max-width:1100px; margin:0 auto; } .gst-wrap { padding:28px 30px 50px; } .gst-hero-img { height:270px; } }

      `}</style>

      <div className="goswami-safety-tips-page">

        <header className="gst-header">

          <button type="button" className="gst-back" onClick={() => nav("/safe-online")} aria-label="Back to Safety Centre">←</button>

          <h1>Safety Tips</h1>

        </header>

        <main className="gst-wrap">

          <section className="gst-hero">

            <img className="gst-hero-img" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85" alt="Couple talking safely" />

            <div className="gst-hero-body">

              <span className="gst-brand">GoswamiJodi.com</span>

              <h2>Stay Safe. Connect with Confidence.</h2>

              <p>Take your time, protect your personal information and make every connection at your own pace.</p>

            </div>

          </section>

          <h2 className="gst-section-title">Smart Safety Guidelines</h2>

          <div className="gst-tip"><div className="gst-icon">🛡️</div><div><h3>Take Your Time</h3><p>Build trust gradually. Learn about a person before moving conversations offline or making important decisions.</p><span className="gst-do">Stay comfortable at every step</span></div></div>

          <div className="gst-tip"><div className="gst-icon">🔐</div><div><h3>Protect Personal Information</h3><p>Never share passwords, OTPs, UPI PINs, card PINs or sensitive account information with another member.</p><span className="gst-do">Keep private details private</span></div></div>

          <div className="gst-tip"><div className="gst-icon">⚠️</div><div><h3>Be Alert About Money Requests</h3><p>Be cautious if someone asks for money, investments, urgent financial help or payment outside normal platform processes.</p><span className="gst-do">Never send money under pressure</span></div></div>

          <div className="gst-tip"><div className="gst-icon">🤝</div><div><h3>Verify Before Meeting</h3><p>Use reasonable verification and choose a public place for an initial meeting. Tell someone you trust about your plans.</p><span className="gst-do">Meet safely and thoughtfully</span></div></div>

          <div className="gst-tip"><div className="gst-icon">🚩</div><div><h3>Report Suspicious Behaviour</h3><p>If a profile behaves abusively, deceptively or suspiciously, use the platform's reporting and support options.</p><span className="gst-do">Your report can help protect others</span></div></div>

          <section className="gst-support">

            <h2>We're Here For You</h2>

            <p>If you need assistance, contact GoswamiJodi support.</p>

            <a className="gst-contact" href="tel:9142764834"><span className="gst-contact-icon">☎</span><span><small>Helpline</small><strong>9142764834</strong></span></a>

            <a className="gst-contact" href="mailto:akgoswami0143@gmail.com"><span className="gst-contact-icon">✉</span><span><small>Email</small><strong>akgoswami0143@gmail.com</strong></span></a>

            <a className="gst-contact" href="https://cybercrime.gov.in" target="_blank" rel="noreferrer"><span className="gst-contact-icon">◎</span><span><small>Cyber Crime Portal</small><strong>cybercrime.gov.in</strong></span></a>

            <a className="gst-contact" href="tel:1930"><span className="gst-contact-icon">☎</span><span><small>Cyber Crime Helpline</small><strong>1930</strong></span></a>

          </section>

          <div className="gst-footer"><div className="gst-footer-badge">✓</div><div><strong>Stay Safe, Connect with Trust</strong><span>GoswamiJodi.com</span></div></div>

        </main>

      </div>

    </>

  );

}

function SafetyCentre() {

  const nav = useNavigate();

  return (

    <div className="safety-centre-page">

      {/* HEADER */}

      <div className="safety-centre-header">

        <button

          className="safety-back-button"

          onClick={() => nav("/messages")}

        >

          ←

        </button>

        <h1>Safety Centre</h1>

      </div>





      {/* PREMIUM HERO */}

      <section className="sc-hero">

        <div className="sc-hero-text">

          <span className="sc-brand">

            GoswamiJodi.com

          </span>

          <h2>

            Your Safety

            <br />

            Our Priority

          </h2>

          <p>

            We are committed to providing a safe,

            respectful and genuine platform for

            meaningful connections.

          </p>

        </div>

        <div className="sc-hero-image">

          <img

            src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=700&q=85"

            alt="Happy couple"

          />

          <div className="sc-check">

            ✓

          </div>

        </div>

        <div className="sc-hero-footer">

          <strong>

            Find out how GoswamiJodi.com

            builds a safer space for love.

          </strong>

          <span>›</span>

        </div>

      </section>





      {/* SAFETY TIPS */}

      <button

        className="sc-card"

        onClick={() => nav("/safety-tips")}

      >

        <div className="sc-icon blue">

          🛡️

        </div>

        <div>

          <h3>Safety Tips</h3>

          <p>

            Follow practical guidelines to protect

            yourself while connecting with potential

            matches.

          </p>

          <span>Know More&nbsp; ›</span>

        </div>

      </button>





      {/* REPORT */}

      <button

        className="sc-card"

        onClick={() => nav("/report-profile")}

      >

        <div className="sc-icon red">

          ⚠️

        </div>

        <div>

          <h3>Report a Profile</h3>

          <p>

            Report suspicious or inappropriate

            behavior, money requests or blackmail.

          </p>

          <span>Know More&nbsp; ›</span>

        </div>

      </button>





      {/* PRIVACY */}

      <button

        className="sc-card"

        onClick={() => nav("/privacy")}

      >

        <div className="sc-icon purple">

          ⚙️

        </div>

        <div>

          <h3>Privacy Settings</h3>

          <p>

            Manage who sees your photos, contact

            information and profile.

          </p>

          <span>Know More&nbsp; ›</span>

        </div>

      </button>





      {/* MENTAL WELLBEING */}

      <button

        className="sc-card"

        onClick={() => nav("/mental-wellbeing")}

      >

        <div className="sc-icon green">

          ♡

        </div>

        <div>

          <h3>Mental Wellbeing</h3>

          <p>

            Take care of yourself while making

            important relationship decisions.

          </p>

          <span>Know More&nbsp; ›</span>

        </div>

      </button>





      {/* SUPPORT */}

      <section className="sc-support">

        <h2>We're Here For You!</h2>

        <p className="sc-support-subtitle">

          If you ever feel unsafe or need assistance,

          our team is here to support you.

        </p>





        <div className="sc-support-card">

          <h3>GoswamiJodi.com Support</h3>

          <a href="tel:9142764834">

            <span>☎</span>

            <div>

              <small>Helpline</small>

              <strong>9142764834</strong>

            </div>

          </a>

          <a href="mailto:akgoswami0143@gmail.com">

            <span>✉</span>

            <div>

              <small>Email</small>

              <strong>akgoswami0143@gmail.com</strong>

            </div>

          </a>

        </div>





        <div className="sc-support-card">

          <h3>Cyber Crime Reporting</h3>

          <a

            href="https://cybercrime.gov.in"

            target="_blank"

            rel="noreferrer"

          >

            <span>◎</span>

            <div>

              <small>Cyber Crime Portal</small>

              <strong>cybercrime.gov.in</strong>

            </div>

          </a>

          <a href="tel:1930">

            <span>☎</span>

            <div>

              <small>Helpline</small>

              <strong>1930</strong>

            </div>

          </a>

          <a href="tel:181">

            <span>☎</span>

            <div>

              <small>Women's Helpline</small>

              <strong>181</strong>

            </div>

          </a>

        </div>

      </section>





      {/* PREMIUM FOOTER */}

      <div className="sc-footer">

        <div className="sc-footer-icon">

          ✓

        </div>

        <div>

          <strong>

            Stay Safe, Connect with Trust

          </strong>

          <span>

            GoswamiJodi.com

          </span>

        </div>

        <b>♥</b>

      </div>

    </div>

  );

}

function SafetyCard({

  icon,

  title,

  description,

  onClick

}) {

  return (

    <button

      type="button"

      className="safety-info-card"

      onClick={onClick}

    >

      <div className="safety-card-icon">

        {icon}

      </div>

      <div className="safety-card-content">

        <h3>{title}</h3>

        <p>{description}</p>

        <span className="safety-know-more">

          Know More

          <b>›</b>

        </span>

      </div>

    </button>

  );

}

function SafetyDetailPage({

  type,

  title,

  subtitle,

  icon,

  theme,

  image,

  sections

}) {

  const nav = useNavigate();

  return (

    <div className="safety-detail-page">

      {/* HEADER */}

      <div className="safety-detail-header">

        <button

          type="button"

          onClick={() => nav("/safe-online")}

          className="safety-detail-back"

        >

          ←

        </button>

        <div>

          <span>GoswamiJodi.com</span>

          <h1>{title}</h1>

        </div>

      </div>



      {/* HERO */}

      <section className={`safety-detail-hero ${theme}`}>

        <div className="safety-detail-hero-icon">

          {icon}

        </div>

        <div>

          <h2>{subtitle}</h2>

          <p>

            Your safety, privacy and peace of mind

            matter to GoswamiJodi.com.

          </p>

        </div>

      </section>



      {/* IMAGE */}

      {image && (

        <div className="safety-detail-image">

          <img

            src={image}

            alt={title}

          />

          <div className="safety-image-badge">

            ✓

          </div>

        </div>

      )}



      {/* SECTIONS */}

      <section className="safety-detail-content">

        {sections.map((section, index) => (

          <div

            className="safety-detail-section"

            key={index}

          >

            <div className={`detail-number ${theme}`}>

              {String(index + 1).padStart(2, "0")}

            </div>

            <div className="detail-section-body">

              <h3>

                {section.title}

              </h3>

              <p>

                {section.description}

              </p>

              {section.points && (

                <ul>

                  {section.points.map(

                    (point, pointIndex) => (

                      <li key={pointIndex}>

                        <span>✓</span>

                        {point}

                      </li>

                    )

                  )}

                </ul>

              )}

            </div>

          </div>

        ))}

      </section>



      {/* SUPPORT */}

      <section className="safety-detail-support">

        <div className="detail-support-icon">

          ?

        </div>

        <div>

          <h3>Need Help?</h3>

          <p>

            Our support team is here to help you.

          </p>

          <div className="detail-support-actions">

            <a href="tel:9142764834">

              ☎ 9142764834

            </a>

            <a href="mailto:akgoswami0143@gmail.com">

              ✉ Email Support

            </a>

          </div>

        </div>

      </section>



      {/* FOOTER */}

      <div className="safety-detail-footer">

        <span>✓</span>

        <div>

          <strong>

            Stay Safe with GoswamiJodi.com

          </strong>

          <small>

            Connect with confidence and trust.

          </small>

        </div>

      </div>

    </div>

  );

}

function SafetyDetailHeader({ title, subtitle, onBack }) {

  return (

    <div className="safety-detail-header">

      <button

        type="button"

        className="safety-detail-back"

        onClick={onBack}

        aria-label="Go back"

      >

        ←

      </button>

      <div>

        <div className="safety-detail-brand">

          GoswamiJodi.com

        </div>

        <h1>{title}</h1>

        {subtitle && <p>{subtitle}</p>}

      </div>

    </div>

  );

}



/* =========================================================

   REPORT A PROFILE

\========================================================= */

function ReportProfile() {

  const nav = useNavigate();

  const [selected, setSelected] = useState("");

  const [message, setMessage] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const reasons = [

    "Fake or suspicious profile",

    "Asking for money",

    "Harassment or inappropriate messages",

    "Blackmail or threats",

    "Wrong or misleading information",

    "Other"

  ];

  const submitReport = () => {

    if (!selected) {

      setMessage("Please select a reason before submitting.");

      return;

    }

    setSubmitted(true);

    setMessage(

      "Thank you. Your report has been submitted for review."

    );

  };

  return (

    <div className="safety-detail-page">

      <SafetyDetailHeader

        title="Report a Profile"

        subtitle="Help us keep GoswamiJodi.com safe and trustworthy."

        onBack={() => nav("/safe-online")}

      />

      <main className="safety-detail-content">

        {/* HERO */}

        <section className="safety-detail-hero report-hero">

          <div className="safety-detail-hero-icon">

            ⚑

          </div>

          <div>

            <span className="safety-eyebrow">

              YOUR SAFETY MATTERS

            </span>

            <h2>

              See something suspicious?

            </h2>

            <p>

              If a profile behaves suspiciously, asks for money,

              sends inappropriate messages or appears fake,

              you can report it.

            </p>

          </div>

        </section>



        {/* WARNING */}

        <section className="safety-highlight-card">

          <div className="safety-highlight-icon">

            ⚠

          </div>

          <div>

            <h3>Never send money</h3>

            <p>

              Be careful if someone asks for money, investment,

              OTPs, banking information or urgent financial help.

            </p>

          </div>

        </section>



        {/* HOW TO REPORT */}

        <section className="safety-section-card">

          <div className="safety-section-title">

            <span>01</span>

            <h2>When should you report?</h2>

          </div>

          <div className="safety-check-list">

            <div>

              <span>✓</span>

              <p>Profile appears fake or misleading</p>

            </div>

            <div>

              <span>✓</span>

              <p>Someone repeatedly sends unwanted messages</p>

            </div>

            <div>

              <span>✓</span>

              <p>Someone asks for money or financial information</p>

            </div>

            <div>

              <span>✓</span>

              <p>You receive threats, blackmail or abusive messages</p>

            </div>

            <div>

              <span>✓</span>

              <p>Someone is pretending to be another person</p>

            </div>

          </div>

        </section>



        {/* REPORT FORM */}

        <section className="safety-section-card report-form-card">

          <div className="safety-section-title">

            <span>02</span>

            <div>

              <h2>Report this behaviour</h2>

              <p>

                Select the reason that best describes the issue.

              </p>

            </div>

          </div>



          <div className="report-reasons">

            {reasons.map((reason) => (

              <button

                key={reason}

                type="button"

                className={

                  selected === reason

                    ? "report-reason selected"

                    : "report-reason"

                }

                onClick={() => {

                  setSelected(reason);

                  setMessage("");

                }}

              >

                <span className="report-radio">

                  {selected === reason ? "✓" : ""}

                </span>

                <span>{reason}</span>

                <b>›</b>

              </button>

            ))}

          </div>



          {message && (

            <div

              className={

                submitted

                  ? "report-success"

                  : "report-error"

              }

            >

              {submitted ? "✓ " : "⚠ "}

              {message}

            </div>

          )}



          {!submitted && (

            <button

              type="button"

              className="report-submit-button"

              onClick={submitReport}

            >

              Submit Report

              <span>→</span>

            </button>

          )}

        </section>



        {/* SAFETY NOTE */}

        <section className="safety-bottom-note">

          <span>🚩</span>

          <div>

            <strong>Your report is important</strong>

            <p>

              Please provide genuine information. Reports help

              us maintain a safer matrimonial community.

            </p>

          </div>

        </section>



        {/* SUPPORT */}

        <section className="safety-support-mini">

          <h2>Need immediate help?</h2>

          <p>

            Contact GoswamiJodi.com support if you need

            assistance with a safety concern.

          </p>

          <a href="tel:9142764834">

            ☎ <strong>9142764834</strong>

          </a>

          <a href="mailto:akgoswami0143@gmail.com">

            ✉ <strong>akgoswami0143@gmail.com</strong>

          </a>

        </section>

      </main>

    </div>

  );

}



/* =========================================================

   PRIVACY SETTINGS

\========================================================= */

function PrivacySettings() {

  const nav = useNavigate();

  const [photoVisibility, setPhotoVisibility] = useState(true);

  const [contactVisibility, setContactVisibility] = useState(false);

  const [profileVisibility, setProfileVisibility] = useState(true);

  const [saved, setSaved] = useState(false);

  const saveSettings = () => {

    localStorage.setItem(

      "goswami_privacy_settings",

      JSON.stringify({

        photoVisibility,

        contactVisibility,

        profileVisibility

      })

    );

    setSaved(true);

    setTimeout(() => {

      setSaved(false);

    }, 2200);

  };

  return (

    <div className="safety-detail-page">

      <SafetyDetailHeader

        title="Privacy Settings"

        subtitle="Control what other members can see."

        onBack={() => nav("/safe-online")}

      />

      <main className="safety-detail-content">

        {/* HERO */}

        <section className="safety-detail-hero privacy-hero">

          <div className="safety-detail-hero-icon">

            🔐

          </div>

          <div>

            <span className="safety-eyebrow">

              PRIVACY CONTROL

            </span>

            <h2>

              Your privacy, your choice.

            </h2>

            <p>

              Manage your profile visibility and decide what

              information you want to share with other members.

            </p>

          </div>

        </section>



        {/* SETTINGS */}

        <section className="privacy-settings-card">

          <div className="privacy-card-heading">

            <div>

              <span>GOSWAMIJODI</span>

              <h2>Profile Privacy</h2>

            </div>

            <div className="privacy-lock">

              🔒

            </div>

          </div>



          {/* PROFILE */}

          <div className="privacy-setting-row">

            <div className="privacy-setting-icon">

              👤

            </div>

            <div className="privacy-setting-info">

              <strong>Profile Visibility</strong>

              <p>

                Allow other members to discover your profile.

              </p>

            </div>

            <button

              type="button"

              className={

                profileVisibility

                  ? "privacy-toggle active"

                  : "privacy-toggle"

              }

              onClick={() =>

                setProfileVisibility(!profileVisibility)

              }

              aria-label="Toggle profile visibility"

            >

              <span />

            </button>

          </div>



          {/* PHOTO */}

          <div className="privacy-setting-row">

            <div className="privacy-setting-icon">

              📷

            </div>

            <div className="privacy-setting-info">

              <strong>Photo Visibility</strong>

              <p>

                Allow members to view your profile photos.

              </p>

            </div>

            <button

              type="button"

              className={

                photoVisibility

                  ? "privacy-toggle active"

                  : "privacy-toggle"

              }

              onClick={() =>

                setPhotoVisibility(!photoVisibility)

              }

              aria-label="Toggle photo visibility"

            >

              <span />

            </button>

          </div>



          {/* CONTACT */}

          <div className="privacy-setting-row">

            <div className="privacy-setting-icon">

              ☎

            </div>

            <div className="privacy-setting-info">

              <strong>Contact Information</strong>

              <p>

                Control whether your contact details are visible.

              </p>

            </div>

            <button

              type="button"

              className={

                contactVisibility

                  ? "privacy-toggle active"

                  : "privacy-toggle"

              }

              onClick={() =>

                setContactVisibility(!contactVisibility)

              }

              aria-label="Toggle contact visibility"

            >

              <span />

            </button>

          </div>

        </section>



        {/* INFO */}

        <section className="privacy-info-card">

          <div>🛡️</div>

          <div>

            <h3>Share only what you're comfortable with</h3>

            <p>

              Avoid sharing passwords, OTPs, UPI PINs, card

              PINs or other sensitive information with anyone.

            </p>

          </div>

        </section>



        {saved && (

          <div className="privacy-saved">

            ✓ Privacy settings saved

          </div>

        )}



        <button

          type="button"

          className="privacy-save-button"

          onClick={saveSettings}

        >

          Save Privacy Settings

          <span>→</span>

        </button>



        <section className="safety-bottom-note">

          <span>🔒</span>

          <div>

            <strong>Privacy is important</strong>

            <p>

              You can change these settings whenever you want.

            </p>

          </div>

        </section>

      </main>

    </div>

  );

}



/* =========================================================

   MENTAL WELLBEING

\========================================================= */

/* =========================================================

   MENTAL WELLBEING

\========================================================= */

function MentalWellbeing() {

  const nav = useNavigate();

  const tips = [

    {

      number: "01",

      title: "Take your time",

      text:

        "You don’t have to rush a conversation, meeting or relationship. Get to know someone at your own pace.",

    },

    {

      number: "02",

      title: "Set healthy boundaries",

      text:

        "It is okay to say no when something makes you uncomfortable. Respectful communication should always work both ways.",

    },

    {

      number: "03",

      title: "Stay connected with trusted people",

      text:

        "Before meeting someone offline, consider telling a trusted friend or family member about your plans.",

    },

    {

      number: "04",

      title: "Don’t ignore discomfort",

      text:

        "If something feels wrong or makes you uncomfortable, step back and use the available safety and reporting options.",

    },

  ];

  return (

    <div className="mw-page">

      {/* ================= HEADER ================= */}

      <header className="mw-header">

        <button

          type="button"

          className="mw-back"

          onClick={() => nav("/safe-online")}

          aria-label="Back to Safety Centre"

        >

          ←

        </button>

        <div className="mw-header-text">

          <div className="mw-brand">

            <span>Goswami</span>Jodi.com

          </div>

          <h1>Mental Wellbeing</h1>

          <p>

            Take care of yourself during your matchmaking journey.

          </p>

        </div>

      </header>



      <main className="mw-container">

        {/* ================= HERO ================= */}

        <section className="mw-hero-image-card">

          <img

  src={`${import.meta.env.BASE_URL}images/mental-wellbeing-hero.png`}

  alt="Mental wellbeing"

  className="mw-hero-image"

/>

        </section>



        {/* ================= INTRO ================= */}

        <section className="mw-intro-card">

          <div className="mw-intro-icon">

            ♡

          </div>

          <div className="mw-intro-content">

            <div className="mw-eyebrow">

              TAKE CARE OF YOURSELF

            </div>

            <h2>

              Your wellbeing matters.

            </h2>

            <p>

              Finding a life partner should be a positive

              experience. Take your time and stay comfortable

              throughout your journey.

            </p>

          </div>

        </section>



        {/* ================= TIPS ================= */}

        <section className="mw-tips">

          {tips.map((tip) => (

            <div

              className="mw-tip-card"

              key={tip.number}

            >

              <div className="mw-tip-number">

                {tip.number}

              </div>

              <div className="mw-tip-content">

                <h3>

                  {tip.title}

                </h3>

                <p>

                  {tip.text}

                </p>

              </div>

              <div className="mw-tip-arrow">

                ›

              </div>

            </div>

          ))}

        </section>



        {/* ================= FINDING THE ONE ================= */}

        <section className="mw-time-card">

          <div className="mw-time-content">

            <h2>

              Finding "The One" Takes Time

            </h2>

            <p>

              Finding your perfect match on GoswamiJodi.com

              takes effort, but here’s how you can improve

              your chances:

            </p>

            <div className="mw-check-list">

              <div>

                <span>✓</span>

                <p>

                  Keep your profile updated with the latest information

                </p>

              </div>

              <div>

                <span>✓</span>

                <p>

                  Get verified to show you are a genuine member

                </p>

              </div>

              <div>

                <span>✓</span>

                <p>

                  Keep your preferences flexible to explore a wider

                  range of profiles

                </p>

              </div>

            </div>

          </div>



          <div className="mw-time-image">

            <img

              src="/images/mental-wellbeing-illustration.png"

              alt="Mental wellbeing illustration"

            />

          </div>

        </section>



        {/* ================= SUPPORT ================= */}

        <section className="mw-support">

          <div className="mw-support-icon">

            <span>♧</span>

          </div>

          <div className="mw-support-text">

            <h2>

              We’re Here For You!

            </h2>

            <p>

              If you need assistance with a safety concern,

              our support team is always available.

            </p>

          </div>

          <div className="mw-support-actions">

            <a href="tel:9142764834">

              <span>☎</span>

              9142764834

            </a>

            <a href="mailto:akgoswami0143@gmail.com">

              <span>✉</span>

              akgoswami0143@gmail.com

            </a>

          </div>

        </section>



        {/* ================= FINAL MESSAGE ================= */}

        <section className="mw-final-card">

          <div className="mw-final-icon">

            ♢

          </div>

          <div className="mw-final-content">

            <strong>

              Remember, you are not alone.

            </strong>

            <span>

              Take care of yourself and connect with confidence.

            </span>

          </div>

          <div className="mw-you-matter">

            You

            <br />

            Matter ♡

          </div>

        </section>

      </main>

    </div>

  );

}

function ViewRoute(){const {id}=useParams();return <ViewProfile id={id}/>}

function ChatRoute(){const {id}=useParams();return <Chat id={id}/>}

export default App;