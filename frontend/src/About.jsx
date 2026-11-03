import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="about-page">

      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-content">

          <div className="about-badge">
            ❤️ TRUST • VALUES • TOGETHERNESS
          </div>

          <h1>
            Where <span>Hearts</span> Meet,
            <br />
            Families Connect
          </h1>

          <p>
            GoswamiJodi is a matrimonial platform created
            for individuals and families looking for meaningful,
            compatible and lasting relationships.
          </p>

          <div className="about-hero-buttons">
            <Link to="/register" className="about-primary-btn">
              Create Your Profile →
            </Link>

            <Link to="/search" className="about-secondary-btn">
              Discover Matches
            </Link>
          </div>

        </div>

        <div className="about-hero-card">

          <div className="hero-heart">
            ❤️
          </div>

          <h3>Find Someone Special</h3>

          <p>
            Because the right relationship is not just about
            finding a person. It's about finding a family,
            friendship and a future together.
          </p>

          <div className="hero-stat-row">
            <div>
              <strong>2024</strong>
              <span>Founded</span>
            </div>

            <div>
              <strong>100%</strong>
              <span>Relationship Focused</span>
            </div>
          </div>

        </div>
      </section>


      {/* TRUST STRIP */}
      <section className="about-trust-strip">

        <div className="trust-item">
          <span>🛡️</span>
          <div>
            <strong>Privacy First</strong>
            <small>Your personal information matters</small>
          </div>
        </div>

        <div className="trust-item">
          <span>💎</span>
          <div>
            <strong>Premium Experience</strong>
            <small>Designed for meaningful connections</small>
          </div>
        </div>

        <div className="trust-item">
          <span>❤️</span>
          <div>
            <strong>Serious Relationships</strong>
            <small>Built for marriage-minded individuals</small>
          </div>
        </div>

        <div className="trust-item">
          <span>🤝</span>
          <div>
            <strong>Family Values</strong>
            <small>Because families matter too</small>
          </div>
        </div>

      </section>


      {/* ABOUT SECTION */}
      <section className="about-main-section">

        <div className="about-section-label">
          ABOUT GOSWAMIJODI
        </div>

        <h2>
          A Modern Matrimonial Platform
          <br />
          Built on <span>Trust & Values</span>
        </h2>

        <p className="about-lead">
          At GoswamiJodi, we believe that marriage is more than
          two people coming together. It is the beginning of a
          lifelong journey where two individuals, two families and
          two dreams become one.
        </p>

        <p>
          Our platform is designed to make the search for a life
          partner simple, respectful and meaningful. We combine
          modern technology with traditional values to create a
          matrimonial experience where compatibility, trust and
          family values come first.
        </p>

      </section>


      {/* MISSION / VISION */}
      <section className="about-cards-section">

        <div className="about-info-card">

          <div className="about-card-icon">
            🎯
          </div>

          <div>
            <span>OUR MISSION</span>

            <h3>
              Helping You Find
              Your Right Life Partner
            </h3>

            <p>
              Our mission is to create a trusted matrimonial
              platform where people can discover compatible
              partners based on values, personality, lifestyle,
              expectations and family background.
            </p>
          </div>

        </div>


        <div className="about-info-card">

          <div className="about-card-icon">
            💡
          </div>

          <div>
            <span>OUR VISION</span>

            <h3>
              Making Matrimony
              More Meaningful
            </h3>

            <p>
              We envision a future where finding a life partner
              is not stressful or complicated, but a secure,
              transparent and enjoyable journey for individuals
              and families.
            </p>
          </div>

        </div>

      </section>


      {/* WHY US */}
      <section className="why-goswami">

        <div className="about-section-label">
          WHY GOSWAMIJODI
        </div>

        <h2>
          More Than Just a
          <span> Matrimonial Website</span>
        </h2>

        <p className="why-subtitle">
          We are building an experience where trust comes before
          matches and meaningful relationships come before numbers.
        </p>


        <div className="why-grid">

          <div className="why-card">
            <div></div>
            <h3>Privacy & Security</h3>
            <p>
              Your profile and personal information are handled
              with privacy and respect.
            </p>
          </div>


          <div className="why-card">
            <div></div>
            <h3>Meaningful Matches</h3>
            <p>
              Discover profiles based on compatibility,
              preferences and important life values.
            </p>
          </div>


          <div className="why-card">
            <div></div>
            <h3>Family Friendly</h3>
            <p>
              A matrimonial experience that respects Indian
              family values and traditions.
            </p>
          </div>


          <div className="why-card">
            <div></div>
            <h3>Premium Experience</h3>
            <p>
              Clean design, powerful features and a modern
              experience for serious members.
            </p>
          </div>

        </div>

      </section>


      {/* PROMISE */}
      <section className="about-promise">

        <div className="promise-content">

          <div className="about-section-label">
            OUR PROMISE
          </div>

          <h2>
            Your Journey Deserves
            <br />
            <span>Trust, Respect & Care</span>
          </h2>

          <p>
            Every profile represents a real person with dreams,
            expectations and a family. We believe every interaction
            should be respectful, secure and meaningful.
          </p>

          <div className="promise-list">

            <div>
              <span></span>
              <strong>Respectful Connections</strong>
            </div>

            <div>
              <span></span>
              <strong>Privacy Focused Experience</strong>
            </div>

            <div>
              <span></span>
              <strong>Marriage-Minded Community</strong>
            </div>

            <div>
              <span></span>
              <strong>Family & Cultural Values</strong>
            </div>

          </div>

        </div>

      </section>


      {/* FOUNDER */}
      <section className="founder-section">

        <div className="founder-avatar">
          AK
        </div>

        <div className="founder-content">

          <span>FOUNDER & CEO</span>

          <h2>Arun Kumar</h2>

          <p>
            "I believe finding a life partner should be a journey
            built on trust, understanding and shared values — not
            just a search through profiles."
          </p>

          <strong>
            Founder, GoswamiJodi
          </strong>

        </div>

      </section>


      {/* CONTACT */}
      <section className="about-contact">

        <div>
          <span className="about-section-label">
            HAVE QUESTIONS?
          </span>

          <h2>
            We're Here to
            <span> Help You</span>
          </h2>

          <p>
            Whether you need help with your profile, membership,
            privacy or finding the right match, our team is here
            to assist you.
          </p>
        </div>


        <div className="contact-box">

          <div className="contact-icon">
            📞
          </div>

          <div>
            <small>CALL US</small>

            <a href="tel:9142564834">
              9142764834
            </a>

            <p>
              GoswamiJodi Support
            </p>
          </div>

        </div>

      </section>


      {/* CTA */}
      <section className="about-final-cta">

        <div className="cta-heart">
          ❤️
        </div>

        <h2>
          Your Forever Could
          <br />
          Start With One Click
        </h2>

        <p>
          Create your profile, discover meaningful matches
          and take the first step towards your future.
        </p>

        <div className="cta-buttons">

          <Link to="/register">
            Join GoswamiJodi
          </Link>

          <Link to="/search">
            Explore Matches
          </Link>

        </div>

      </section>

    </div>
  );
}