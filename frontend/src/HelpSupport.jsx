import React, { useMemo, useState } from "react";

const SUPPORT_PHONE = "9973776162";
const SUPPORT_WHATSAPP = "919973776162";
const SUPPORT_MESSAGE = "Hello GoswamiJodi Support, I need help with my account.";
const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;

const categories = [

  {

    title: "Profile & Account",

    text: "Manage your profile, photos, preferences, login and account settings.",

    icon: "👤",

  },

  {

    title: "Matches & Connections",

    text: "Find suitable profiles, update preferences and manage shortlists.",

    icon: "💞",

  },

  {

    title: "Interests & Requests",

    text: "Get help with sending, accepting, declining and managing requests.",

    icon: "💌",

  },

  {

    title: "Messages & Notifications",

    text: "Get help with chat, unread messages, notifications and blocking.",

    icon: "💬",

  },

  {

    title: "Premium Membership",

    text: "Understand Gold, Diamond, Platinum Plus and premium features.",

    icon: "👑",

  },

  {

    title: "Privacy & Safety",

    text: "Protect your account, report suspicious profiles and control visibility.",

    icon: "🛡️",

  },

  {

    title: "Payments & Billing",

    text: "Get help with payment status, deductions, billing and membership activation.",

    icon: "💳",

  },

  {

    title: "Technical Help",

    text: "Troubleshoot loading, buttons, photo upload and other website issues.",

    icon: "🛠️",

  },

];

const helpArticles = [

  {

    category: "Profile & Account",

    q: "How do I create my GoswamiJodi profile?",

    a: "Open Registration, enter your basic details and complete the profile information. Add your photo, family, education, career and location details so other members can understand your profile better.",

    keywords: ["create profile", "registration", "register", "account", "profile banana", "profile create"],

  },

  {

    category: "Profile & Account",

    q: "How can I edit my profile?",

    a: "Open My Profile and choose Edit Profile. You can update personal, family, education, career, location and other profile details, then save the changes.",

    keywords: ["edit profile", "update profile", "profile change", "profile edit", "profile update"],

  },

  {

    category: "Profile & Account",

    q: "How can I change my name, age or basic details?",

    a: "Open Edit Profile and update the fields that are available for editing. If a particular field is locked or cannot be changed, contact support with the details you want corrected.",

    keywords: ["name change", "age change", "basic details", "personal details", "galat age", "wrong age"],

  },

  {

    category: "Profile & Account",

    q: "How do I upload my profile photo?",

    a: "Open My Profile, go to the photo section, choose Upload Photo and select a clear image. Use a genuine photo and make sure the image format and size are accepted by the website.",

    keywords: ["photo upload", "profile photo", "image upload", "photo add", "photo lagana", "photo kaise lagaye"],

  },

  {

    category: "Profile & Account",

    q: "My profile photo is not showing. What should I do?",

    a: "Refresh the page and check the photo section again. If the upload completed but the photo is still missing, try uploading the image again. If the problem continues, contact support.",

    keywords: ["photo not showing", "photo missing", "image not visible", "photo nahi aa rahi", "photo show nahi"],

  },

  {

    category: "Profile & Account",

    q: "I forgot my password. How can I login?",

    a: "Use the login page's password recovery option if it is available. Complete the verification steps and create a new password. Never share your password or OTP with another person.",

    keywords: ["forgot password", "password", "login", "sign in", "password bhul gaya", "login nahi ho raha"],

  },

  {

    category: "Profile & Account",

    q: "I am not receiving my OTP.",

    a: "Check that your registered mobile number is correct and that your phone has network access. Wait briefly and request another OTP. Never share an OTP with anyone.",

    keywords: ["otp", "otp not received", "otp nahi aa raha", "verification code", "mobile verification"],

  },

  {

    category: "Profile & Account",

    q: "How can I change my mobile number or email?",

    a: "Open your account/profile settings and use the available contact-detail option. If the field cannot be changed from the website, contact support for account verification and assistance.",

    keywords: ["mobile number", "phone number", "email change", "email update", "number change"],

  },

  {

    category: "Profile & Account",

    q: "How can I improve my profile?",

    a: "Use a clear genuine photo, complete your personal and family information, add education and career details, and keep your partner preferences accurate. A complete profile generally gives other members better context.",

    keywords: ["profile improve", "profile better", "complete profile", "profile strong", "profile tips"],

  },

  {

    category: "Matches & Connections",

    q: "How can I find suitable matches?",

    a: "Open Discover Matches and use your partner preferences such as age, location, education, profession and other available filters. Review profiles and shortlist suitable members.",

    keywords: ["matches", "find match", "suitable match", "search profiles", "match nahi mil raha", "rishta search"],

  },

  {

    category: "Matches & Connections",

    q: "How do I search profiles?",

    a: "Go to Discover/Search and set the filters that matter to you. Apply the search and review the matching profiles. You can adjust the filters if the result set is too small or too broad.",

    keywords: ["search profile", "profile search", "discover", "find profiles", "search"],

  },

  {

    category: "Matches & Connections",

    q: "How can I change my partner preferences?",

    a: "Open your preference/settings area and update the age, location, education, profession or other partner-preference fields available to you. Save the changes and search again.",

    keywords: ["partner preference", "preferences", "age preference", "location preference", "preference change"],

  },

  {

    category: "Matches & Connections",

    q: "Why am I seeing profiles I already viewed?",

    a: "Search results can overlap when your filters are broad. Tighten your preferences or use shortlist/interaction features to keep track of profiles you are interested in.",

    keywords: ["same profile", "repeated profiles", "already viewed", "duplicate profile", "same match"],

  },

  {

    category: "Matches & Connections",

    q: "How do I shortlist a profile?",

    a: "Open the member profile and use the Shortlist option if it is available. The profile can then be found from your shortlist area for easier follow-up.",

    keywords: ["shortlist", "save profile", "favorite profile", "shortlist profile"],

  },

  {

    category: "Matches & Connections",

    q: "Why are there no suitable matches?",

    a: "Try widening one or two filters, especially location or age, and make sure your partner preferences are saved correctly. If there are still no results, contact support.",

    keywords: ["no matches", "no suitable match", "empty search", "match nahi mil raha", "results nahi"],

  },

  {

    category: "Interests & Requests",

    q: "How do I send an interest?",

    a: "Open the profile you are interested in and select Send Interest. After sending, you can track the request from the Requests/Interest area.",

    keywords: ["send interest", "interest send", "request send", "interest bhejna", "interest kaise bheje"],

  },

  {

    category: "Interests & Requests",

    q: "How do I accept an interest request?",

    a: "Open your received requests/interests, review the member profile and choose Accept when you are comfortable proceeding.",

    keywords: ["accept interest", "accept request", "request accept", "interest accept", "request kaise accept"],

  },

  {

    category: "Interests & Requests",

    q: "How do I decline a request?",

    a: "Open the received request and use the Decline/Reject action if you do not want to proceed. Decline respectfully and avoid sharing unnecessary personal information.",

    keywords: ["decline request", "reject request", "interest decline", "request reject", "mana karna"],

  },

  {

    category: "Interests & Requests",

    q: "Where can I see the requests I sent?",

    a: "Open the Requests/Interest section and select the Sent area to view requests that you have sent and their current status.",

    keywords: ["sent requests", "requests sent", "sent interest", "my requests", "request status"],

  },

  {

    category: "Interests & Requests",

    q: "Why is my interest request not changing status?",

    a: "Refresh the Requests page and check the profile again. If the status remains unchanged after the other member has responded, contact support with the relevant profile/request details.",

    keywords: ["request status", "interest status", "pending request", "status not update", "request pending"],

  },

  {

    category: "Messages & Notifications",

    q: "How do I send a message to a member?",

    a: "Open the member's profile or Messages section and open the conversation. Type your message and send it. Keep communication respectful and do not share sensitive financial information.",

    keywords: ["send message", "chat", "message send", "conversation", "message kaise bheje"],

  },

  {

    category: "Messages & Notifications",

    q: "Why is my message not sending?",

    a: "Check your internet connection, refresh the conversation and try again. If the problem continues, check whether the member is still available to communicate and contact support if needed.",

    keywords: ["message not sending", "chat not working", "message failed", "msg nahi ja raha", "message error"],

  },

  {

    category: "Messages & Notifications",

    q: "I have an unread message. Where can I see it?",

    a: "Open Messages. Conversations with unread messages are highlighted so you can open the conversation and read the latest message.",

    keywords: ["unread message", "new message", "message notification", "unread", "msg nahi mila"],

  },

  {

    category: "Messages & Notifications",

    q: "Why am I not getting notifications?",

    a: "Check your browser/device notification permissions and account notification settings. Refresh the page and verify that your internet connection is working.",

    keywords: ["notification", "notifications", "alert", "notification not coming", "notification nahi aa raha"],

  },

  {

    category: "Messages & Notifications",

    q: "How can I block a member?",

    a: "Use the available Block option from the member profile or conversation. Blocking is useful when you do not want further communication from a member.",

    keywords: ["block", "block member", "stop message", "member block", "block karna"],

  },

  {

    category: "Premium Membership",

    q: "What is Premium Membership?",

    a: "Premium membership provides paid features according to the plan selected on GoswamiJodi. Open the Premium page to see the current plans and features available to your account.",

    keywords: ["premium", "membership", "paid plan", "premium kya hai", "premium benefits"],

  },

  {

    category: "Premium Membership",

    q: "What are Gold, Diamond and Platinum Plus plans?",

    a: "Open the Premium page to view the current Gold, Diamond and Platinum Plus plans, their duration, price and included benefits before selecting a plan.",

    keywords: ["gold", "diamond", "platinum", "platinum plus", "plans", "premium plans"],

  },

  {

    category: "Premium Membership",

    q: "How can I upgrade to Premium?",

    a: "Open the Premium page, select the plan you want and follow the payment instructions shown there. After successful verification, the membership status is updated according to the payment flow configured for the website.",

    keywords: ["upgrade", "buy premium", "premium purchase", "membership buy", "premium activate"],

  },

  {

    category: "Premium Membership",

    q: "I paid for Premium but it is not active.",

    a: "First refresh the Premium page and check the membership status. Payment confirmation may need a short time depending on the configured payment verification process. If the payment is successful but membership remains inactive, contact support with your transaction/order details.",

    keywords: ["premium not active", "paid but not active", "membership not active", "premium activate nahi", "payment successful"],

  },

  {

    category: "Premium Membership",

    q: "How can I check my Premium status?",

    a: "Open the Premium/Membership area and check the current plan and activation status shown for your account.",

    keywords: ["premium status", "membership status", "plan status", "premium active"],

  },

  {

    category: "Payments & Billing",

    q: "My payment was deducted but Premium is not active.",

    a: "Do not make repeated payments immediately. Refresh the Premium page and check the order/payment status. If the amount was deducted and the membership is still inactive, contact support with the transaction reference/order details so the payment can be checked.",

    keywords: ["payment deducted", "money deducted", "paid but inactive", "amount deducted", "payment successful"],

  },

  {

    category: "Payments & Billing",

    q: "My payment is showing as pending.",

    a: "Wait for the payment verification process to complete and refresh the order/Premium status. If it remains pending for an extended period, contact support with your order or transaction reference.",

    keywords: ["payment pending", "transaction pending", "payment status", "pending payment"],

  },

  {

    category: "Payments & Billing",

    q: "I was charged twice. What should I do?",

    a: "Do not make another payment. Keep both transaction references or screenshots and contact support so the duplicate charge can be reviewed.",

    keywords: ["charged twice", "double payment", "duplicate payment", "two payments", "payment double"],

  },

  {

    category: "Payments & Billing",

    q: "How can I get help with a payment or transaction?",

    a: "Keep your order ID/transaction reference, payment date and amount ready, then contact GoswamiJodi support. Never share your UPI PIN, OTP or banking password with support or another member.",

    keywords: ["payment help", "transaction help", "upi payment", "billing", "payment problem"],

  },

  {

    category: "Privacy & Safety",

    q: "How can I change my privacy settings?",

    a: "Open My GoswamiJodi and go to Privacy Options to manage available profile-visibility and privacy preferences.",

    keywords: ["privacy", "privacy settings", "profile visibility", "hide profile", "private profile"],

  },

  {

    category: "Privacy & Safety",

    q: "How can I hide my profile?",

    a: "Open Privacy Options and use the profile visibility/hide option if it is available for your account. If you cannot find the option, contact support.",

    keywords: ["hide profile", "profile hide", "visibility", "profile invisible"],

  },

  {

    category: "Privacy & Safety",

    q: "I found a fake or suspicious profile. How do I report it?",

    a: "Use the Report option available on the profile/conversation if present and provide the reason. You can also contact support with the profile details. Do not send money to suspicious members.",

    keywords: ["fake profile", "report profile", "scam", "fraud", "suspicious profile", "fake account"],

  },

  {

    category: "Privacy & Safety",

    q: "Someone is asking me for money. What should I do?",

    a: "Do not send money and do not share banking details, UPI PIN, OTP or passwords. Stop the interaction, block/report the member where possible and contact GoswamiJodi support.",

    keywords: ["money", "asking money", "scam", "fraud", "paise mang raha", "money demand"],

  },

  {

    category: "Privacy & Safety",

    q: "Someone is harassing me on the platform.",

    a: "Stop engaging with the person, use Block/Report if available and preserve relevant screenshots/details. Contact support so the issue can be reviewed.",

    keywords: ["harassment", "abuse", "threat", "bad message", "pareshan", "harass"],

  },

  {

    category: "Privacy & Safety",

    q: "Should I share my OTP, password or UPI PIN?",

    a: "No. Never share your OTP, password, UPI PIN, card PIN or banking credentials with another member or anyone claiming to help you.",

    keywords: ["otp", "password", "upi pin", "banking details", "security", "safe"],

  },

  {

    category: "Technical Help",

    q: "The website is not loading properly. What should I do?",

    a: "Refresh the page, check your internet connection and try again. If possible, try another browser or clear the browser cache. If the issue continues, contact support with a screenshot.",

    keywords: ["website not loading", "page not loading", "site problem", "loading", "website error"],

  },

  {

    category: "Technical Help",

    q: "A button is not working.",

    a: "Refresh the page and try again. Check whether all required fields are completed. If the button still does not respond, note the page name and send a screenshot to support.",

    keywords: ["button not working", "button", "click not working", "action not working"],

  },

  {

    category: "Technical Help",

    q: "My profile changes are not updating.",

    a: "Make sure the save/update action completed successfully, then refresh the profile. If the old data still appears, try again and contact support if the problem persists.",

    keywords: ["not updating", "changes not saved", "save not working", "profile update problem"],

  },

  {

    category: "Technical Help",

    q: "Photo upload is failing.",

    a: "Check the image format and size, use a clear standard image and try again. Refresh the page if necessary. If the upload continues to fail, contact support with the image/error details.",

    keywords: ["photo upload failed", "upload error", "image upload error", "photo upload problem"],

  },

  {

    category: "Technical Help",

    q: "I see an error message on the website.",

    a: "Take a screenshot of the error, note the page where it happened and refresh once. If the same error continues, send the screenshot and page name to support.",

    keywords: ["error", "error message", "bug", "technical issue", "website bug"],

  },

];

const faqs = [

  helpArticles[0],

  helpArticles[9],

  helpArticles[11],

  helpArticles[18],

  helpArticles[26],

  helpArticles[33],

  helpArticles[37],

  helpArticles[39],

];

const normalize = (value = "") =>

  value

    .toLowerCase()

    .normalize("NFKD")

    .replace(/[^\p{L}\p{N}\s]/gu, " ")

    .replace(/\s+/g, " ")

    .trim();

const STOP_WORDS = new Set([

  "how", "can", "i", "do", "the", "is", "my", "a", "an", "to", "for",

  "what", "where", "why", "me", "on", "in", "of", "and", "or", "please",

  "hai", "h", "ka", "ke", "ki", "ko", "me", "mera", "meri", "mere",

  "mujhe", "kya", "kaise", "karo", "karu", "hai", "ho", "raha", "rha",

]);

const getSearchScore = (article, query) => {

  const q = normalize(query);

  if (!q) return 0;

  const tokens = q

    .split(" ")

    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  const question = normalize(article.q);

  const answer = normalize(article.a);

  const category = normalize(article.category);

  const keywords = article.keywords.map(normalize);

  const fullText = `${question} ${answer} ${category} ${keywords.join(" ")}`;

  let score = 0;

  if (question === q) score += 200;

  if (question.includes(q)) score += 100;

  if (fullText.includes(q)) score += 40;

  tokens.forEach((token) => {

    if (question.includes(token)) score += 22;

    else if (keywords.some((keyword) => keyword.includes(token))) score += 18;

    else if (category.includes(token)) score += 12;

    else if (answer.includes(token)) score += 7;

  });

  keywords.forEach((keyword) => {

    if (keyword === q) score += 80;

  });

  return score;

};

export default function HelpSupport() {

  const [search, setSearch] = useState("");

  const [openFaq, setOpenFaq] = useState(null);

  const normalizedSearch = normalize(search);

  const searchResults = useMemo(() => {

    if (!normalizedSearch) return [];

    return helpArticles

      .map((article) => ({

        ...article,

        score: getSearchScore(article, normalizedSearch),

      }))

      .filter((article) => article.score > 0)

      .sort((a, b) => b.score - a.score)

      .slice(0, 8);

  }, [normalizedSearch]);

  const filteredCategories = useMemo(() => {

    if (!normalizedSearch) return categories;

    return categories.filter((item) => {

      const categoryText = normalize(`${item.title} ${item.text}`);

      return (

        categoryText.includes(normalizedSearch) ||

        helpArticles.some(

          (article) =>

            article.category === item.title &&

            getSearchScore(article, normalizedSearch) > 0

        )

      );

    });

  }, [normalizedSearch]);

  const filteredFaqs = useMemo(() => {

    if (!normalizedSearch) return faqs;

    return faqs.filter(

      (faq) => getSearchScore(faq, normalizedSearch) > 0

    );

  }, [normalizedSearch]);

  const handleSearch = (value) => {

    setSearch(value);

    setOpenFaq(null);

  };

  const scrollToSearchResults = () => {

    requestAnimationFrame(() => {

      document

        .getElementById("help-search-results")

        ?.scrollIntoView({ behavior: "smooth", block: "start" });

    });

  };

  const runSearch = (value) => {

    handleSearch(value);

    if (value) scrollToSearchResults();

  };

  const toggleFaq = (index) => {

    setOpenFaq(openFaq === index ? null : index);

  };

  return (

    <div className="premium-help-page">

      <section className="help-hero">

        <div className="help-hero-content">

          <div className="help-small-badge">GOSWAMIJODI SUPPORT</div>

          <h1>

            <span className="help-heading-dark">How can we </span>

            <span>help you?</span>

          </h1>

          <p>

            Ask your question in normal language. Search works with common

            English, Hindi/Hinglish words and GoswamiJodi help topics.

          </p>

          <form

            className="help-search-form"

            onSubmit={(e) => {

              e.preventDefault();

              scrollToSearchResults();

            }}

          >

            <div className="help-search-box">

              <span className="help-search-icon">��</span>

              <input

                type="text"

                name="helpSearch"

                autoComplete="off"

                placeholder="Ask anything... e.g. how to delete profile ?"

                value={search}

                onChange={(e) => handleSearch(e.target.value)}

              />

              {search && (

                <button

                  type="button"

                  className="help-clear"

                  aria-label="Clear search"

                  onClick={() => handleSearch("")}

                >

                  ×

                </button>

              )}

              <button type="submit" className="help-search-submit">

                Search

              </button>

            </div>

          </form>

          <div className="help-quick-links">

            <span>Popular:</span>

            <button type="button" onClick={() => runSearch("Profile")}>

              Profile

            </button>

            <button type="button" onClick={() => runSearch("Premium")}>

              Premium

            </button>

            <button type="button" onClick={() => runSearch("Payment")}>

              Payment

            </button>

            <button type="button" onClick={() => runSearch("Interest")}>

              Interest

            </button>

            <button type="button" onClick={() => runSearch("Privacy")}>

              Privacy

            </button>

            <button type="button" onClick={() => runSearch("Login")}>

              Login

            </button>

          </div>

        </div>

        <div className="help-hero-card">

          <div className="help-shield">🛡️</div>

          <h3>We're Here For You</h3>

          <p>

            Your journey towards finding a meaningful life partner should feel

            safe, simple and supported.

          </p>

          <div className="help-contact-mini">

            <span>��</span>

            <div>

              <small>SUPPORT HELPLINE</small>

              <strong>{SUPPORT_PHONE}</strong>

            </div>

          </div>

        </div>

      </section>

      {normalizedSearch && (

        <section className="help-search-results-section" id="help-search-results">

          <div className="help-section-heading">

            <div className="help-label">SEARCH RESULTS</div>

            <h2>

              Help for <span>"{search}"</span>

            </h2>

            <p>

              We found the closest solutions from the GoswamiJodi help

              centre.

            </p>

          </div>

          {searchResults.length > 0 ? (

            <div className="help-search-results-grid">

              {searchResults.map((article, index) => (

                <article className="help-result-card" key={`${article.q}-${index}`}>

                  <div className="help-result-top">

                    <span className="help-result-category">

                      {article.category}

                    </span>

                    <span className="help-result-number">

                      \#{index + 1}

                    </span>

                  </div>

                  <h3>{article.q}</h3>

                  <p>{article.a}</p>

                  <div className="help-result-footer">

                    <span>✓ Solution available</span>

                    <button

                      type="button"

                      onClick={() => {

                        setSearch(article.q);

                        window.setTimeout(() => scrollToSearchResults(), 0);

                      }}

                    >

                      View solution

                    </button>

                  </div>

                </article>

              ))}

            </div>

          ) : (

            <div className="help-no-result help-no-result-large">

              <div>��</div>

              <h3>No exact solution found</h3>

              <p>

                Try words like <b>payment</b>, <b>premium</b>,{" "}

                <b>password</b>, <b>interest</b>, <b>message</b>,{" "}

                <b>photo</b>, <b>privacy</b> or <b>match</b>.

              </p>

              <a href={SUPPORT_WHATSAPP_URL} className="help-no-result-call">

                📞 Talk to Support

              </a>

            </div>

          )}

        </section>

      )}

      <section className="help-stats">

        <div className="help-stat">

          <span>��</span>

          <strong>Privacy First</strong>

          <small>Your information matters</small>

        </div>

        <div className="help-stat">

          <span>��</span>

          <strong>Member Focused</strong>

          <small>Support when you need it</small>

        </div>

        <div className="help-stat">

          <span>⚡</span>

          <strong>Quick Assistance</strong>

          <small>Simple and helpful guidance</small>

        </div>

        <div className="help-stat">

          <span>✓</span>

          <strong>Support Team</strong>

          <small>Here for your journey</small>

        </div>

      </section>

      <section className="help-content-section">

        <div className="help-section-heading">

          <div className="help-label">EXPLORE SUPPORT</div>

          <h2>What can we help you with?</h2>

          <p>

            Choose a category or type your question above to get a relevant

            solution.

          </p>

        </div>

        <div className="help-category-grid">

          {filteredCategories.length > 0 ? (

            filteredCategories.map((item) => (

              <div className="help-category-card" key={item.title}>

                <div className="help-category-icon">{item.icon}</div>

                <div className="help-category-content">

                  <h3>{item.title}</h3>

                  <p>{item.text}</p>

                  <button

                    type="button"

                    onClick={() => runSearch(item.title)}

                  >

                    Explore Help <span>→</span>

                  </button>

                </div>

              </div>

            ))

          ) : (

            <div className="help-no-result">

              <div>��</div>

              <h3>No help category found</h3>

              <p>Try another search term or contact our support team.</p>

            </div>

          )}

        </div>

      </section>

      <section className="help-faq-section">

        <div className="help-section-heading">

          <div className="help-label">QUICK ANSWERS</div>

          <h2>Frequently Asked Questions</h2>

          <p>Find answers to common GoswamiJodi questions.</p>

        </div>

        <div className="help-faq-list">

          {filteredFaqs.length > 0 ? (

            filteredFaqs.map((faq, index) => (

              <div

                className={`help-faq-item ${

                  openFaq === index ? "active" : ""

                }`}

                key={faq.q}

              >

                <button

                  type="button"

                  className="help-faq-question"

                  onClick={() => toggleFaq(index)}

                >

                  <span>{faq.q}</span>

                  <b>{openFaq === index ? "−" : "+"}</b>

                </button>

                {openFaq === index && (

                  <div className="help-faq-answer">{faq.a}</div>

                )}

              </div>

            ))

          ) : (

            <div className="help-no-result">

              <div>��</div>

              <h3>No matching FAQ</h3>

              <p>

                Your search result is shown above. Try another question if you

                need a different solution.

              </p>

            </div>

          )}

        </div>

      </section>

      <section className="help-safety">

        <div className="help-safety-icon">��</div>

        <div className="help-safety-content">

          <div className="help-label">YOUR SAFETY MATTERS</div>

          <h2>

            Stay Safe While Finding <span>Your Life Partner</span>

          </h2>

          <p>

            Never share your password, OTP, UPI PIN, banking information or

            other sensitive details with anyone. Take your time, communicate

            respectfully and report anything suspicious.

          </p>

          <div className="help-safety-points">

            <div>

              <span>✓</span>

              <strong>Protect your personal information</strong>

            </div>

            <div>

              <span>✓</span>

              <strong>Never share OTP or passwords</strong>

            </div>

            <div>

              <span>✓</span>

              <strong>Report suspicious profiles</strong>

            </div>

          </div>

        </div>

      </section>

      <section className="help-contact-section">

        <div className="help-contact-heading">

          <div className="help-label">NEED MORE HELP?</div>

          <h2>

            Talk to Our <span>Support Team</span>

          </h2>

          <p>

            Couldn't find what you were looking for? Our support team is ready

            to assist you.

          </p>

        </div>

        <div className="help-contact-card">

          <div className="help-call-icon">��</div>

          <div>

            <small>GOSWAMIJODI SUPPORT</small>

            <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer">{SUPPORT_PHONE}</a>

            <p>Click the number to call our support team.</p>

          </div>

          <a

            href={SUPPORT_WHATSAPP_URL}

            className="help-call-button"

          >

            Call Support

          </a>

        </div>

      </section>

      <section className="help-final-cta">

        <div className="help-final-heart">❤️</div>

        <h2>

          We're With You

          <br />

          Every Step of the Way

        </h2>

        <p>

          Finding your life partner is a special journey. GoswamiJodi is

          here to make it simpler, safer and more meaningful.

        </p>

        <div className="help-final-buttons">

          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer">📞 Contact Support</a>

          <button

            type="button"

            onClick={() =>

              window.scrollTo({

                top: 0,

                behavior: "smooth",

              })

            }

          >

            ↑ Back to Top

          </button>

        </div>

      </section>

    </div>

  );

}