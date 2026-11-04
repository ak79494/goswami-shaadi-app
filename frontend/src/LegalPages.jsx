import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

// Google Play requires these pages to be public, and the app links to them. They must not
// lead on to the membership page (see "Administrative pages" in Google's Payments policy),
// so they have no site menu or links to the rest of the website.

const SUPPORT_EMAIL = "support@goswamijodi.com";
const SUPPORT_PHONE = "+91 99737 76162";

function LegalShell({ title, updated, children }) {
  const nav = useNavigate();
  return (
    <div className="site-legal-page">
      <header className="site-legal-header">
        <button type="button" className="site-legal-back" onClick={() => nav(-1)} aria-label="Go back">←</button>
        <div className="site-legal-brand"><strong><span>Goswami</span>Jodi</strong><small>Goswami Community Matrimony</small></div>
      </header>
      <main className="site-legal-content">
        <div className="site-legal-badge">GoswamiJodi</div>
        <h1>{title}</h1>
        {updated && <p className="site-legal-updated">Last updated: {updated}</p>}
        {children}
      </main>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="November 2026">
      <p className="site-legal-intro">Your privacy matters to GoswamiJodi. This policy explains what we collect, why we collect it, who can see it and how you can delete it when you use the GoswamiJodi app and website.</p>

      <h2>1. About GoswamiJodi</h2>
      <p>GoswamiJodi is a matrimonial service run by Arun Goswami in India. It is for people aged 18 or over who are looking for a marriage partner. It is not a dating service.</p>

      <h2>2. Information We Collect</h2>
      <p><b>Account details:</b> your email address, mobile number, gender and password. We store passwords in a scrambled form that we cannot read.</p>
      <p><b>Profile details you choose to add:</b> your name, date of birth, photos, location, height, education, occupation, income, family details, religion, community, horoscope details, lifestyle, hobbies and partner preferences.</p>
      <p><b>What you do on the service:</b> your messages, voice notes, interests, shortlists, blocks, reports and help requests, the profiles you visit, and when you were last active.</p>
      <p><b>Calls:</b> voice and video calls connect directly between two phones where possible and otherwise pass through a relay server. We do not record calls. A line showing the type and length of each call is saved in your chat.</p>
      <p><b>Payments:</b> the plan, amount, payment reference and date. We never see or store your UPI PIN, card details or bank login.</p>
      <p><b>Permissions on your phone:</b> the microphone for calls and voice notes, the camera for video calls and profile photos, and notifications for messages and calls. The app only sees the photos you pick yourself.</p>

      <h2>3. Who Can See Your Information</h2>
      <p>Other registered members can see your profile and photos, unless you hide your profile in your privacy settings. Your mobile number is shown only to Premium members, as your privacy settings allow, and you can hide it completely. Your email address and password are never shown to other members.</p>

      <h2>4. How We Use Information</h2>
      <p>We use your information to run your account, show profiles and matches, deliver messages and calls, provide Premium features, give support, keep members safe and prevent fraud.</p>

      <h2>5. Communication</h2>
      <p>We send emails for password reset codes and notifications in the app for activity on your account. Our team may call or message you on WhatsApp if you ask for help.</p>

      <h2>6. Sharing Information</h2>
      <p>We do not sell your information. We share it only with:</p>
      <p>Other members, as described in section 3; companies that run our service for us, for hosting (DigitalOcean), email (Google) and notifications (Google Firebase); an astrologer on WhatsApp, only if you choose to send them your details from Astro Chat; and authorities, when the law, a court or a government order requires it or to protect members' safety.</p>

      <h2>7. Security</h2>
      <p>All information travels over encrypted connections, and we take reasonable steps to protect it. No internet service can guarantee complete security.</p>

      <h2>8. Keeping and Deleting Your Information</h2>
      <p>We keep your information while your account is open. You can delete your account at any time:</p>
      <p><b>In the app:</b> open the Profile tab, go to Account and tap Delete account.</p>
      <p><b>On the web, without the app:</b> go to goswamijodi.com/delete-account.</p>
      <p>This permanently deletes your profile, photos, partner preferences, chats, voice notes, call history, interests, shortlists, blocks, reports and notifications. Your chats are removed for the members you talked to as well. Copies in our backups are overwritten within 30 days.</p>
      <p>We keep payment records (plan, amount, payment reference and date), without your name or contact details, because tax rules require them.</p>

      <h2>9. Children</h2>
      <p>GoswamiJodi is not for anyone under 18, and we remove profiles of anyone under 18. Read our Child Safety Standards at goswamijodi.com/child-safety.</p>

      <h2>10. Your Choices</h2>
      <p>You can see and change your profile, hide your profile, hide your mobile number, block members and delete your account yourself. For anything else about your information, contact us below.</p>

      <h2>11. Changes</h2>
      <p>We may update this policy when our service or the law changes. The date at the top shows the latest version.</p>

      <h2>12. Contact and Grievance Officer</h2>
      <p>For privacy questions or complaints, contact our Grievance Officer, Arun Goswami, at {SUPPORT_EMAIL} or {SUPPORT_PHONE}. We acknowledge complaints within 24 hours and aim to resolve them within 15 days.</p>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" updated="November 2026">
      <p className="site-legal-intro">These Terms &amp; Conditions govern your use of the GoswamiJodi app and website. By registering or using the service, you agree to these terms and to applicable law.</p>

      <h2>1. Purpose of the Service</h2>
      <p>GoswamiJodi is strictly for genuine matrimonial matchmaking. It is not a dating website, and it is not for advertising, recruitment, lead generation or commercial solicitation.</p>

      <h2>2. Eligibility</h2>
      <p>You must be at least 18 years old and legally able to marry, and you must give truthful information. If a family member manages a profile, they must have that person's permission.</p>

      <h2>3. Account &amp; Profile Accuracy</h2>
      <p>You are responsible for your account and the accuracy of your profile. Impersonation, fake identities, materially false information and unauthorized duplicate profiles are prohibited.</p>

      <h2>4. Unacceptable Behaviour</h2>
      <p>You must not harass, threaten, stalk, abuse, deceive, impersonate, spam, exploit or defraud other members. Advertising, bulk messaging, collecting other members' data and any unlawful activity are prohibited.</p>

      <h2>5. Unacceptable Content</h2>
      <p>Upload only photos, text and other content that you have the right to use. Content that is unlawful, hateful, threatening, sexually explicit, defamatory, misleading or that invades someone's privacy is not allowed. We have zero tolerance for anything that sexually exploits or endangers children.</p>

      <h2>6. Reporting and Blocking</h2>
      <p>To report or block a member, open their profile, tap ⋯ and choose Report profile or Block. Our team reviews reports and may remove content and suspend or close accounts.</p>

      <h2>7. Privacy &amp; Personal Information</h2>
      <p>Your use is also governed by the GoswamiJodi Privacy Policy. Never share passwords, OTPs, UPI PINs or card PINs with anyone. Take care before sharing phone numbers, addresses, email addresses or social media details.</p>

      <h2>8. Requests, Matches &amp; Chats</h2>
      <p>Requests, matches and chats are communication tools. GoswamiJodi does not guarantee that another member is genuine, compatible, available or suitable for marriage. Please verify identity, background, family, employment and other important claims yourself.</p>

      <h2>9. Safety &amp; Fraud Prevention</h2>
      <p>Never send money just because another member asks. Be careful with urgent money requests, investments, OTP requests or attempts to move the conversation off the service immediately. Report anything suspicious.</p>

      <h2>10. Premium Membership</h2>
      <p>Premium memberships are sold on our website. The plan, price and length are shown before you pay. Premium starts once our team has confirmed your payment and ends on the date shown in your account.</p>

      <h2>11. Payments &amp; Refunds</h2>
      <p>Report a failed or incorrect payment to us with the payment reference. Any refund depends on the plan and the payment status. Deleting your account ends your membership. Never share payment credentials with anyone claiming to represent GoswamiJodi.</p>

      <h2>12. Our Name and Software</h2>
      <p>You may not copy, scrape, resell, reverse engineer or commercially exploit the service, its name, design or content without permission.</p>

      <h2>13. Service Availability</h2>
      <p>We aim to keep the service running, but we can't guarantee it will always be available. Maintenance, network problems, device issues or other services we depend on may affect access.</p>

      <h2>14. Suspension &amp; Closing Accounts</h2>
      <p>We may suspend or close accounts for suspected fraud, misuse, security risks, breaking these terms, unlawful conduct or activity that may harm members or the service. You can delete your account at any time in the app or at goswamijodi.com/delete-account.</p>

      <h2>15. Matchmaking Disclaimer</h2>
      <p>GoswamiJodi helps members find and talk to each other. We do not guarantee marriage, compatibility, the truth of another member's claims or the outcome of any interaction. You are responsible for your own decisions and checks.</p>

      <h2>16. Changes to These Terms</h2>
      <p>We may update these terms when the service or the law changes. If you keep using the service after an update, you accept the new version to the extent the law allows.</p>

      <h2>17. Governing Law &amp; Grievance Officer</h2>
      <p>These terms are governed by Indian law. For complaints, contact our Grievance Officer, Arun Goswami, at {SUPPORT_EMAIL} or {SUPPORT_PHONE}. We acknowledge complaints within 24 hours and aim to resolve them within 15 days.</p>
    </LegalShell>
  );
}

export function ChildSafetyPage() {
  return (
    <LegalShell title="Child Safety Standards" updated="November 2026">
      <p className="site-legal-intro">GoswamiJodi has zero tolerance for child sexual abuse and exploitation (CSAE). These standards apply to the GoswamiJodi app and website.</p>

      <h2>Our Rules</h2>
      <p>GoswamiJodi is only for people aged 18 or over. Members must confirm they are 18 or over when they register, and a profile can't be created with a date of birth under 18.</p>
      <p>We prohibit child sexual abuse material, grooming, sexualising minors, and any attempt to use the service to contact or exploit a minor.</p>

      <h2>What We Do</h2>
      <p>Our team reviews every child safety report. We remove the content, suspend the account, preserve evidence where the law requires it and report it to the authorities, including India's National Cyber Crime Reporting Portal (cybercrime.gov.in).</p>

      <h2>How to Report</h2>
      <p><b>In the app:</b> open the member's profile, tap ⋯, choose Report profile, then Under 18 or child safety concern.</p>
      <p><b>In Help &amp; Support:</b> request a call back and choose Report a safety concern.</p>
      <p><b>By email:</b> write to {SUPPORT_EMAIL}.</p>
      <p>If a child is in immediate danger, call 112 or Childline on 1098.</p>

      <h2>Child Safety Contact</h2>
      <p>Arun Goswami, GoswamiJodi. Email: {SUPPORT_EMAIL}. Phone: {SUPPORT_PHONE}.</p>
    </LegalShell>
  );
}

const REASONS = ["Found my match", "Taking a break", "Not happy with the app", "Something else"];

export function DeleteAccountPage() {
  const [form, setForm] = useState({ email: "", password: "", reason: "" });
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const change = field => e => setForm({ ...form, [field]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/auth/delete-account", form);
      localStorage.clear();
      setDone(true);
    } catch (x) {
      setError(x.response?.data?.message || "We couldn't delete the account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <LegalShell title="Account deleted">
        <p className="site-legal-intro">Your GoswamiJodi account and your data have been deleted. You can now uninstall the app.</p>
      </LegalShell>
    );
  }

  return (
    <LegalShell title="Delete Your GoswamiJodi Account">
      <p className="site-legal-intro">Use this page to delete your GoswamiJodi account without the app. This can't be undone. You can also do this in the app: open the Profile tab, go to Account and tap Delete account.</p>

      <h2>What Gets Deleted</h2>
      <p>Your profile, photos, partner preferences, chats, voice notes, call history, interests, shortlists, blocks, reports and notifications. Your chats are removed for the members you talked to as well. Copies in our backups are overwritten within 30 days.</p>

      <h2>What We Keep</h2>
      <p>Payment records (plan, amount, payment reference and date), without your name or contact details, because tax rules require them.</p>

      <h2>Delete Your Account</h2>
      <form className="site-legal-form" onSubmit={submit}>
        <label>Email address
          <input type="email" required autoComplete="email" value={form.email} onChange={change("email")} />
        </label>
        <label>Password
          <input type="password" required autoComplete="current-password" value={form.password} onChange={change("password")} />
        </label>
        <label>Why are you leaving? (optional)
          <select value={form.reason} onChange={change("reason")}>
            <option value="">Choose a reason</option>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="site-legal-check">
          <input type="checkbox" required checked={sure} onChange={e => setSure(e.target.checked)} />
          I understand that this permanently deletes my account.
        </label>
        {error && <p className="site-legal-error">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Deleting…" : "Delete my account"}</button>
      </form>

      <h2>Forgot Your Password?</h2>
      <p>Reset it with Forgot password on the app's login screen, or email {SUPPORT_EMAIL} from your registered email address and we will delete your account within 30 days.</p>
    </LegalShell>
  );
}
