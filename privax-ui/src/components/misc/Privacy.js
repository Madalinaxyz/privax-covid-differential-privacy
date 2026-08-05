import React from 'react'
import { Link } from 'react-router-dom'
import './Privacy.css'

const Privacy = () => {
  const lastUpdated = 'June 2026'

  return (
    <main className="privacy">
      <section className="privacy-hero">
        <div className="privacy-hero-inner">
          <div className="privacy-kicker">Privacy &amp; data</div>
          <h1 className="privacy-title">
            What we collect, what we don't, and{' '}
            <span className="privacy-accent">why the math matters.</span>
          </h1>
          <p className="privacy-lead">
            Privax is built on a simple promise: your experience can be part of
            the data without ever becoming part of <em>you</em>. This page
            explains exactly how.
          </p>
          <div className="privacy-meta">Last updated · {lastUpdated}</div>
        </div>
      </section>

      <section className="privacy-section">
        <div className="privacy-inner">
          <div className="privacy-section-kicker">In one paragraph</div>
          <p className="privacy-body privacy-body--lead">
            When you submit a side-effect report, Privax stores the clinical
            details (age, vaccine, symptoms, severity, city, free-text note) and
            nothing that ties them back to you. When anyone — including you —
            views the public reports, the data is passed through a
            differentially-private layer that adds calibrated mathematical noise
            before it ever reaches the browser. No raw rows leave the database
            unmodified.
          </p>
        </div>
      </section>

      <section className="privacy-section privacy-section--alt">
        <div className="privacy-inner privacy-grid">
          <div className="privacy-card privacy-card--collect">
            <h3 className="privacy-card-title">What we collect</h3>
            <ul className="privacy-list">
              <li>Age (numeric)</li>
              <li>Vaccine name (from a fixed list)</li>
              <li>Symptoms (from a fixed list)</li>
              <li>Severity (mild / moderate / severe / fatal)</li>
              <li>City (from a fixed list)</li>
              <li>Optional free-text note</li>
              <li>Timestamp of submission</li>
            </ul>
          </div>
          <div className="privacy-card privacy-card--avoid">
            <h3 className="privacy-card-title">What we never collect</h3>
            <ul className="privacy-list">
              <li>Name, address, phone, email tied to a report</li>
              <li>Government IDs or health-system identifiers</li>
              <li>Precise location, GPS, or IP-derived coordinates</li>
              <li>Browser fingerprints or advertising identifiers</li>
              <li>Anything that links a report to an account</li>
              <li>Anything we sell, share, or hand over for advertising</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="privacy-section">
        <div className="privacy-inner">
          <div className="privacy-section-kicker">The math</div>
          <h2 className="privacy-h2">Differential privacy, plainly.</h2>
          <p className="privacy-body">
            Every chart, count, and table on Privax is processed through a
            differential-privacy layer before it's rendered. The layer adds
            Laplace-distributed random noise to the data — small enough that the
            overall shape stays honest, large enough that no single report can
            be reverse-engineered out of an aggregate.
          </p>
          <p className="privacy-body">
            You control how much noise with the{' '}
            <strong>epsilon (ε) slider</strong> on every report view. Lower ε
            means more privacy and more noise; higher ε means less noise and
            less privacy. The default is calibrated to protect individuals
            without hiding the population-level signal.
          </p>
          <p className="privacy-body privacy-body--quiet">
            For the curious: we use the Laplace mechanism with sensitivity 1 for
            counts, applied per category. The implementation is open source and
            linked at the bottom of every page.
          </p>
        </div>
      </section>

      <section className="privacy-section privacy-section--dark">
        <div className="privacy-inner">
          <div className="privacy-section-kicker privacy-section-kicker--light">
            Your rights
          </div>
          <h2 className="privacy-h2 privacy-h2--light">
            You're in control of what you contribute.
          </h2>
          <div className="privacy-rights">
            <div className="privacy-right">
              <h4>Submit freely</h4>
              <p>
                You don't need an account to submit a report. No verification,
                no email collection.
              </p>
            </div>
            <div className="privacy-right">
              <h4>Read anonymously</h4>
              <p>
                Browsing the reports, map, and blog requires no login and no
                tracking cookies.
              </p>
            </div>
            <div className="privacy-right">
              <h4>Ask for removal</h4>
              <p>
                Because reports are de-identified at submission, individual
                removal isn't always possible — but we'll do our best when you
                provide enough context.
              </p>
            </div>
            <div className="privacy-right">
              <h4>Read the source</h4>
              <p>
                The full pipeline — collection, storage, DP layer, frontend — is
                public on GitHub. Audit anything.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="privacy-section">
        <div className="privacy-inner">
          <div className="privacy-section-kicker">Cookies &amp; analytics</div>
          <p className="privacy-body">
            Privax uses one cookie-equivalent: a <code>localStorage</code> entry
            that remembers you're logged in. That's it. No analytics scripts, no
            third-party trackers, no advertising pixels, no behavioral
            fingerprinting.
          </p>
        </div>
      </section>

      <section className="privacy-section privacy-section--note">
        <div className="privacy-inner">
          <div className="privacy-section-kicker">An honest note</div>
          <p className="privacy-body privacy-body--italic">
            Privax is a thesis and research project, built by one person who
            cared enough to build it. It is not a medical device, not a public
            health registry, and not a substitute for a doctor. If you are
            experiencing severe symptoms, contact your clinician. If you want to
            contribute to formal pharmacovigilance, your country's adverse-event
            reporting system (VAERS, EudraVigilance, VigiAccess) is the right
            place. Privax exists for the experiences those systems weren't built
            to hold.
          </p>
        </div>
      </section>

      <section className="privacy-section privacy-section--cta">
        <div className="privacy-inner privacy-cta">
          <p className="privacy-cta-line">
            Questions about how your data is handled?
          </p>
          <div className="privacy-cta-actions">
            <Link to="/about" className="privacy-btn privacy-btn--primary">
              Read the methodology →
            </Link>
            <a
              href="https://github.com/Madalinaxyz/privax-differential-privacy-reporting"
              target="_blank"
              rel="noopener noreferrer"
              className="privacy-btn privacy-btn--ghost"
            >
              Read the source
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Privacy
