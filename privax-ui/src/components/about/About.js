import React from 'react'
import { Link } from 'react-router-dom'
import './about.css'

/* ── Inline icons (no external dependency) ── */
const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const X = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const DOES = [
  'Collects anonymous post-vaccine experiences',
  'Aggregates reports into privacy-protected statistics',
  'Applies differential privacy to every public number',
  'Lets you adjust the privacy/accuracy trade-off live',
  'Documents the lived experience of vaccinated people',
  'Makes its methodology and code openly auditable',
]

const DOES_NOT = [
  'Take a position for or against vaccines',
  'Store personally identifying information with your report',
  'Sell, share, or monetize your data',
  'Claim that your symptom was caused by the vaccine',
  'Replace medical advice or clinical diagnosis',
  'Allow re-identification of any individual reporter',
]

const STEPS = [
  {
    n: '01',
    title: 'You submit a report.',
    body: 'Anonymously or signed in — your choice. You provide what you experienced: symptoms, severity, duration, vaccine, city. Nothing else is required.',
  },
  {
    n: '02',
    title: 'Your report is stored without identifying you.',
    body: 'Reports are saved to a database, but no personal identifiers (name, address, IP) are stored alongside them. If you submitted anonymously, even the optional account link is absent.',
  },
  {
    n: '03',
    title: 'Statistics are computed — with calibrated noise.',
    body: 'When the platform displays aggregate counts (by city, by vaccine, by severity), it adds mathematically-tuned Laplace noise. The amount of noise is governed by an epsilon parameter that you can adjust.',
  },
  {
    n: '04',
    title: 'You see patterns, not people.',
    body: 'The map, the table, the comparisons — they reflect real submissions, but no observer can determine whether any specific individual is in the dataset. That is the differential-privacy guarantee.',
  },
]

const REPO_URL = 'https://github.com/Madalinaxyz/privax-differential-privacy-reporting'

export default function About() {
  return (
    <div className="about-page">

      {/* ── Hero ── */}
      <header className="about-hero">
        <span className="about-eyebrow">About Privax</span>
        <h1 className="about-title">
          A platform for the experiences <span className="about-glow">no one wrote down.</span>
        </h1>
        <p className="about-lead">
          Privax exists because the system designed to listen to people after vaccination
          didn't — and because the absence of that listening has real consequences for
          science, for trust, and for everyone who walks into a clinic next.
        </p>
      </header>

      {/* ── The story ── */}
      <section className="about-section">
        <span className="about-section-label">The story</span>
        <h2>Built from a personal experience of being invisible.</h2>
        <div className="about-prose">
          <p>
            Privax started after months of doctors' appointments where the same answer kept
            coming back: <em>"it's probably anxiety."</em> Tremors, panic attacks, body aches
            that lasted long after the world moved on. Real symptoms, real disruption — and a
            medical system that had nowhere to put them.
          </p>
          <p>
            Official adverse-event registries exist. VAERS in the US, EudraVigilance in the EU,
            WHO's VigiAccess globally. They do important work. But for a wide middle of patients
            with experiences that aren't clinically confirmed and aren't extreme enough to make
            headlines, the path from <em>"I felt this"</em> to <em>"this is recorded somewhere a
            researcher can find it"</em> is essentially closed.
          </p>
          <p>
            Privax is that path. Anonymous, transparent, mathematically protected, and built by
            someone who knows the cost of being unheard.
          </p>
        </div>
      </section>

      {/* ── What we do / don't do ── */}
      <section className="about-section">
        <span className="about-section-label">Our scope</span>
        <h2>What Privax is — and isn't.</h2>
        <div className="about-binary">
          <div className="about-binary-col about-does">
            <div className="about-binary-head">
              <span className="about-binary-icon"><Check /></span>
              <span>Privax does</span>
            </div>
            <ul>
              {DOES.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
          <div className="about-binary-col about-doesnt">
            <div className="about-binary-head">
              <span className="about-binary-icon about-binary-icon-x"><X /></span>
              <span>Privax does not</span>
            </div>
            <ul>
              {DOES_NOT.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Methodology ── */}
      <section className="about-section">
        <span className="about-section-label">Methodology</span>
        <h2>How it works, end to end.</h2>
        <p className="about-section-sub">
          Four steps, each designed to be auditable. The full source code is{' '}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">open on GitHub</a>{' '}
          — anyone can verify these claims line by line.
        </p>
        <ol className="about-steps">
          {STEPS.map((s) => (
            <li key={s.n} className="about-step">
              <span className="about-step-num">{s.n}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── DP commitment ── */}
      <section className="about-section about-section-dark">
        <span className="about-section-label about-label-light">Privacy by design</span>
        <h2 className="about-h2-light">
          The math that makes <span className="about-glow">"anonymous"</span> mean something.
        </h2>
        <div className="about-prose about-prose-light">
          <p>
            Standard anonymization fails. Even datasets stripped of names and addresses have
            been re-identified using little more than a zip code, a birth date, and a hospital
            visit. Privax solves this with <strong>differential privacy</strong> — a peer-reviewed
            mathematical framework that guarantees no observer can determine whether any specific
            person is in the dataset, no matter how clever or well-resourced they are.
          </p>
          <p>
            Every aggregate query you run on Privax passes through a Laplace noise layer
            controlled by an epsilon parameter. Lower epsilon → more noise → stronger individual
            privacy. Higher epsilon → less noise → sharper statistics. You can see and adjust
            this trade-off live on every chart.
          </p>
          <p>
            This is the same technique used by Apple, Google, and the U.S. Census Bureau. If
            you want the technical detail, the{' '}
            <Link to="/blog/understanding-the-epsilon-slider" className="about-link-light">
              Understanding the epsilon slider
            </Link>{' '}
            essay walks through it without math.
          </p>
        </div>
      </section>

      {/* ── Open & verifiable ── */}
      <section className="about-section">
        <span className="about-section-label">Open by default</span>
        <h2>If you don't trust the promise, audit the code.</h2>
        <p className="about-section-sub">
          The entire Privax stack — frontend, backend, differential-privacy implementation, database
          schema — is public. Anyone with the technical background can verify that what we claim
          to do is what the software actually does.
        </p>
        <div className="about-cta-row">
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="about-btn about-btn-primary">
            View the source on GitHub <ArrowRight />
          </a>
        </div>
      </section>

      {/* ── Roadmap ── */}
      <section className="about-section">
        <span className="about-section-label">What's next</span>
        <h2>The platform is alive.</h2>
        <div className="about-roadmap">
          <div className="about-roadmap-item">
            <span className="about-roadmap-status about-status-shipped">Shipped</span>
            <div>
              <h4>Differential privacy on aggregate queries</h4>
              <p>Laplace noise on every grouped count, with a user-adjustable epsilon slider.</p>
            </div>
          </div>
          <div className="about-roadmap-item">
            <span className="about-roadmap-status about-status-shipped">Shipped</span>
            <div>
              <h4>Interactive city map with severity breakdown</h4>
              <p>Romanian cities visualized with vaccine + severity filters.</p>
            </div>
          </div>
          <div className="about-roadmap-item">
            <span className="about-roadmap-status about-status-progress">In progress</span>
            <div>
              <h4>Per-vaccine deep-dive pages</h4>
              <p>One page per vaccine with patterns, recovery curves, and demographic breakdowns.</p>
            </div>
          </div>
          <div className="about-roadmap-item">
            <span className="about-roadmap-status about-status-planned">Planned</span>
            <div>
              <h4>Personal dashboard ("My Reports")</h4>
              <p>See your own submissions and how they compare to the aggregate.</p>
            </div>
          </div>
          <div className="about-roadmap-item">
            <span className="about-roadmap-status about-status-planned">Planned</span>
            <div>
              <h4>Multi-language support</h4>
              <p>Romanian, English, French, German — for European patients in their own language.</p>
            </div>
          </div>
          <div className="about-roadmap-item">
            <span className="about-roadmap-status about-status-planned">Planned</span>
            <div>
              <h4>Researcher API access</h4>
              <p>Authenticated endpoints for academic use, with proper attribution and citation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Built by ── */}
      <section className="about-section about-section-personal">
        <span className="about-section-label">The person behind it</span>
        <h2>Built by a patient, for patients.</h2>
        <div className="about-prose">
          <p>
            Privax is an independent project. It is not affiliated with any pharmaceutical
            company, government agency, or political organization. It is also not affiliated
            with any anti-vaccine group — the platform exists because every honest report
            <em> strengthens</em> the case for vaccines that work, by surfacing the side effects
            so they can be understood and addressed.
          </p>
          <p>
            I built this because I was tired of being told my experience was anxiety. If you
            were told the same, this platform is yours too.
          </p>
        </div>
        <p className="about-signature">— The patient who built Privax</p>
      </section>

      {/* ── Closing CTA ── */}
      <section className="about-finale">
        <h2>Your experience belongs in the picture.</h2>
        <p>
          Whether you spent days, weeks, or years dealing with side effects — or none at all —
          your record matters. The next pandemic depends on the listening we build today.
        </p>
        <div className="about-cta-row about-cta-center">
          <Link to="/reports" className="about-btn about-btn-primary">
            Submit a report <ArrowRight />
          </Link>
          <Link to="/blog" className="about-btn about-btn-ghost">
            Read the journal
          </Link>
        </div>
      </section>
    </div>
  )
}
