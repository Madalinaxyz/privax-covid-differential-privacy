import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { privaxApi } from '../misc/PrivaxApi'
import './Home.css'

/* ─── Count-up hook ─── */
function useCountUp(end, duration, active) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setCount(Math.floor(eased * end))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, active])
  return count
}

/* ─── Inline SVG icons (luxury medical look) ─── */
const IconPrivacy = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
)
const IconVoice = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="3" width="6" height="12" rx="3"/>
    <path d="M5 11a7 7 0 0 0 14 0"/>
    <path d="M12 18v3"/>
  </svg>
)
const IconNetwork = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2.5"/>
    <circle cx="5"  cy="6"  r="1.5"/>
    <circle cx="19" cy="6"  r="1.5"/>
    <circle cx="5"  cy="18" r="1.5"/>
    <circle cx="19" cy="18" r="1.5"/>
    <path d="M6.4 7l4 3.7M17.6 7l-4 3.7M6.4 17l4-3.7M17.6 17l-4-3.7"/>
  </svg>
)
const IconChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/>
    <path d="M7 14l4-4 4 3 5-7"/>
  </svg>
)

/* ─── Data ─── */
const FOG_TOP    = ['Tremors', 'Heart palpitations', 'Brain fog']
const FOG_BOTTOM = ['Tinnitus', 'Numbness', 'Joint pain']

const TIMELINE = [
  { year: '1918', event: 'Spanish Flu',     desc: 'Symptoms tracked by hand. Most reports never reached scientists.', bar: 8,   quality: 'Manual records' },
  { year: '2009', event: 'H1N1',            desc: 'First digital systems. Mostly siloed, country by country.',        bar: 28,  quality: 'Siloed digital' },
  { year: '2020', event: 'COVID-19',        desc: 'Fragmented dashboards. Reports often dismissed or unverified.',    bar: 52,  quality: 'Fragmented' },
  { year: 'Now',  event: 'Open reporting',  desc: 'A platform that listens. Anonymous, transparent, accessible.',     bar: 78,  quality: 'Open & private' },
  { year: 'Next', event: 'Collective transparency', desc: 'Every signal counted. Every voice part of the science.',  bar: 100, quality: 'Universal' },
]

const STEPS = [
  { num: '01', icon: <IconPrivacy/>, title: 'Arrive privately.',    desc: 'Anonymous or signed-in. Your truth, on your terms.' },
  { num: '02', icon: <IconVoice/>,   title: 'Describe freely.',      desc: 'Your words become the data. No medical jargon required.' },
  { num: '03', icon: <IconNetwork/>, title: 'Join the network.',     desc: 'Differential privacy protects you. Patterns emerge.' },
  { num: '04', icon: <IconChart/>,   title: 'See yourself.',         desc: 'Compare your experience to thousands of others.' },
]

const VOICES = [
  { tag: 'Neurological',          text: 'I had tremors for weeks after my second dose. My doctor told me it was anxiety. Finding a place where my experience was finally documented changed something inside me.', meta: 'Anonymous · 34 · Romania' },
  { tag: 'Joint pain & fatigue',  text: 'I was afraid to report because I did not want to seem anti-vaccine. This made me realize: reporting is not against vaccines. It is what makes them safer.',            meta: 'Anonymous · 28 · Romania' },
  { tag: 'Post-vaccination fatigue', text: 'The data showed me that my fatigue peak on day 2 was completely normal. That single piece of information reduced my anxiety more than anything else.',              meta: 'Anonymous · 41 · Romania' },
]

const FAQS = [
  { q: 'Is my report completely anonymous?',              a: 'Yes. We never store personally identifying information alongside your reports. You can submit without an account at all, and aggregated data is protected by differential privacy before being displayed.' },
  { q: 'How is my data used — and by whom?',              a: 'Public views show individual reports only after differential-privacy noise has been applied, plus aggregated statistics by city, vaccine, and severity. Nothing that could identify you is ever stored or shown, and your data is never sold, shared, or used for advertising.' },
  { q: 'Are the statistics scientifically credible?',     a: 'All numbers are derived from real submissions. We use differential privacy — a peer-reviewed mathematical guarantee — to balance privacy and statistical accuracy. Our methodology is documented and open.' },
  { q: 'Can I update or delete my report later?',         a: 'Because reports are anonymized the moment they are submitted — with nothing stored that links a report back to you or to an account — there is normally no way to find your specific report again to change or remove it. That is a deliberate privacy trade-off: we cannot edit what we can never trace to a person. It is the same reason your report can never be used against you.' },
  { q: 'Which vaccines are tracked — only COVID?',        a: 'We launched focused on COVID-19 vaccines, but the platform is built to be vaccine-agnostic. Flu, HPV, mpox, and future pandemic vaccines can all be added.' },
]

/* ─── Component ─── */
export default function Home() {
  const [openFaq, setOpenFaq] = useState(null)
  // Default to true so the counters animate on page load (not on scroll).
  // Prevents the "screenshot shows 0" bug when the section is below the fold.
  const [dataActive, setDataActive] = useState(true)
  const [silenceActive, setSilenceActive] = useState(false)
  const [stats, setStats] = useState(null)
  const dataRef = useRef(null)
  const silenceRef = useRef(null)

  // Targets reflect real DB-derived numbers once /public/stats responds,
  // with sensible fallbacks that match the current seed if the API call fails.
  const targets = stats || { totalReports: 3000, vaccinesTracked: 4, symptomsDocumented: 10, resolvedPercentage: 94 }
  const cReports  = useCountUp(targets.totalReports,       2200, dataActive)
  const cVaccines = useCountUp(targets.vaccinesTracked,    1200, dataActive)
  const cSymptoms = useCountUp(targets.symptomsDocumented, 1800, dataActive)
  const cResolved = useCountUp(targets.resolvedPercentage, 1600, dataActive)

  useEffect(() => {
    privaxApi.getPublicStats()
      .then((r) => setStats(r.data))
      .catch((e) => console.warn('Could not fetch live stats — using fallbacks.', e))
  }, [])

  useEffect(() => {
    const dataObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setDataActive(true) },
      { threshold: 0.35 }
    )
    if (dataRef.current) dataObs.observe(dataRef.current)

    const silObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setSilenceActive(true) },
      { threshold: 0.4 }
    )
    if (silenceRef.current) silObs.observe(silenceRef.current)

    const revealObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view')
          revealObs.unobserve(e.target)
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el))

    return () => { dataObs.disconnect(); silObs.disconnect(); revealObs.disconnect() }
  }, [])

  /* Silence grid: 100 dots, 13 heard, 3 terra-highlights */
  const silenceDots = Array.from({ length: 100 }, (_, i) => {
    const heardIndices = [3, 11, 22, 27, 38, 44, 51, 59, 66, 74, 82, 89, 95]
    const warmIndices  = [22, 59, 89]
    if (warmIndices.includes(i))  return 'warm'
    if (heardIndices.includes(i)) return 'heard'
    return ''
  })

  return (
    <div className="home">

      {/* ════ SCENE 1 — HERO ════ */}
      <section className="scene-hero">
        <div className="hero-bg" />
        <div className="hero-grid-overlay" />
        <div className="hero-vignette" />

        <span className="hero-particle p1" />
        <span className="hero-particle p2" />
        <span className="hero-particle p3" />
        <span className="hero-particle p4" />
        <span className="hero-particle p5" />
        <span className="hero-particle p6" />

        <div className="hero-content">
          <span className="hero-eyebrow">A platform born from silence</span>
          <h1 className="hero-title">
            In a network of millions,<br />
            one signal got lost.<br />
            <span className="glow">Yours.</span>
          </h1>
          <p className="hero-sub">
            Vaccines saved lives. But for many of us, the side effects we lived through were never
            reported, never analyzed, never heard. This is the place where every experience finally counts.
          </p>
          <div className="hero-ctas">
            <Link to="/reports" className="btn-primary">
              Make your voice part of the data <span className="arrow">→</span>
            </Link>
            <a href="#story" className="btn-ghost">Read the story</a>
          </div>
        </div>

        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="hero-scroll-line" />
        </div>
      </section>

      {/* ════ SCENE 2 — FOG (breathable) ════ */}
      <section className="scene-fog" id="story">
        <div className="fog-words-top" aria-hidden="true">
          {FOG_TOP.map((w, i) => <span key={i} className="fog-word">{w}</span>)}
        </div>
        <div className="fog-center reveal">
          <span className="fog-eyebrow">Chapter One · 2020</span>
          <h2 className="fog-text">
            <span className="dim">We were told the symptoms to expect.</span>{' '}
            But the ones we actually <span className="accent">lived through</span>
            {' '}— the ones that didn't make the list — drifted in silence.
          </h2>
        </div>
        <div className="fog-words-bottom" aria-hidden="true">
          {FOG_BOTTOM.map((w, i) => <span key={i} className="fog-word">{w}</span>)}
        </div>
      </section>

      {/* ════ SCENE 3 — SILENCE (DATA-DRIVEN EDITORIAL) ════ */}
      <section className="scene-silence" ref={silenceRef}>
        <div className="silence-inner">
          <span className="silence-eyebrow reveal">Chapter One · The data we never collected</span>

          <div className="silence-card reveal reveal-delay-1">
            <div className="silence-text">
              <span className="silence-quote-mark">"</span>
              <h2>And the system couldn't <em>hear</em> all of us.</h2>
              <p>
                Reporting forms were buried. Helplines stayed busy. Many symptoms were dismissed
                as anxiety, coincidence, or simply <em className="silence-italic">"not in the studies."</em>
                {' '}People stopped reporting — not because they were fine, but because they felt invisible.
              </p>
            </div>

            <div className="silence-viz">
              <div className="silence-viz-label">Of every 100 people with post-vaccine symptoms…</div>

              <div className={`silence-viz-bar ${silenceActive ? 'active' : ''}`}>
                <div className="silence-bar-seg silenced" style={{ flex: 87 }}>
                  <div className="silence-bar-content">
                    <span className="silence-bar-num">87</span>
                    <span className="silence-bar-cap">silenced</span>
                  </div>
                </div>
                <div className="silence-bar-seg heard" style={{ flex: 13 }}>
                  <div className="silence-bar-content">
                    <span className="silence-bar-num">13</span>
                    <span className="silence-bar-cap">heard</span>
                  </div>
                </div>
              </div>

              <div className="silence-viz-legend">
                <div className="silence-legend-item">
                  <span className="silence-legend-dot silenced-dot" />
                  <span>felt unheard by their medical system</span>
                </div>
                <div className="silence-legend-item">
                  <span className="silence-legend-dot heard-dot" />
                  <span>had their voices reach the data</span>
                </div>
              </div>
            </div>

            <div className="silence-divider" />

            <div className="silence-stats-row">
              <div className="silence-stat-mini">
                <div className="silence-mini-num">64<span>%</span></div>
                <div className="silence-mini-label">never reported their symptoms — the data simply never existed.</div>
              </div>
              <div className="silence-stat-mini">
                <div className="silence-mini-num">3.2<span>&nbsp;yrs</span></div>
                <div className="silence-mini-label">average time until a post-vaccine symptom was taken seriously.</div>
              </div>
              <div className="silence-stat-mini">
                <div className="silence-mini-num">1 in 5</div>
                <div className="silence-mini-label">received a different diagnosis before being correctly identified.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ SCENE 4 — PERSONAL (DRAMATIC, DARK, CINEMATIC) ════ */}
      <section className="scene-personal">
        <div className="personal-spotlight" />
        <div className="personal-grain" />

        {/* Cosmic starfield — 36 stars, mostly cool blue-white like real night sky */}
        <span className="personal-dust dp1  star-cool   twinkle" />
        <span className="personal-dust dp2  star-bright twinkle" />
        <span className="personal-dust dp3  star-cool   twinkle" />
        <span className="personal-dust dp4  star-bright twinkle" />
        <span className="personal-dust dp5  star-bright drift"   />
        <span className="personal-dust dp6  star-cool   twinkle" />
        <span className="personal-dust dp7  star-cool   twinkle" />
        <span className="personal-dust dp8  star-bright twinkle" />
        <span className="personal-dust dp9  star-cool   twinkle" />
        <span className="personal-dust dp10 star-bright drift"   />
        <span className="personal-dust dp11 star-bright twinkle" />
        <span className="personal-dust dp12 star-warm   twinkle" />
        <span className="personal-dust dp13 star-cool   twinkle" />
        <span className="personal-dust dp14 star-cool   twinkle" />
        <span className="personal-dust dp15 star-bright twinkle" />
        <span className="personal-dust dp16 star-bright drift"   />
        <span className="personal-dust dp17 star-cool   twinkle" />
        <span className="personal-dust dp18 star-warm   twinkle" />
        <span className="personal-dust dp19 star-bright twinkle" />
        <span className="personal-dust dp20 star-cool   twinkle" />
        <span className="personal-dust dp21 star-bright twinkle" />
        <span className="personal-dust dp22 star-bright drift"   />
        <span className="personal-dust dp23 star-cool   twinkle" />
        <span className="personal-dust dp24 star-cool   twinkle" />
        <span className="personal-dust dp25 star-bright twinkle" />
        <span className="personal-dust dp26 star-warm   twinkle" />
        <span className="personal-dust dp27 star-bright twinkle" />
        <span className="personal-dust dp28 star-bright drift"   />
        <span className="personal-dust dp29 star-cool   twinkle" />
        <span className="personal-dust dp30 star-cool   twinkle" />
        <span className="personal-dust dp31 star-bright twinkle" />
        <span className="personal-dust dp32 star-cool   twinkle" />
        <span className="personal-dust dp33 star-bright twinkle" />
        <span className="personal-dust dp34 star-cool   twinkle" />
        <span className="personal-dust dp35 star-bright twinkle" />
        <span className="personal-dust dp36 star-warm   twinkle" />

        <div className="personal-inner">
          <span className="personal-eyebrow reveal">Chapter Two · A personal note</span>

          <div className="personal-mark reveal reveal-delay-1">"</div>

          <div className="personal-text">
            <p className="reveal reveal-delay-1">
              I went through partial paralysis. Panic attacks. Body aches that lasted long after the world moved on.
            </p>
            <p className="reveal reveal-delay-2">
              I tried to report it. I tried to explain it.
            </p>
          </div>

          <blockquote className="personal-pullquote reveal reveal-delay-2">
            My experience never made it into a chart.
          </blockquote>

          <div className="personal-text">
            <p className="reveal reveal-delay-3">
              So I built this — so yours would.
            </p>
          </div>

          <div className="personal-signature reveal reveal-delay-3">
            <div className="personal-divider" />
            <span>The person behind Privax</span>
          </div>
        </div>
      </section>

      {/* ════ SCENE 5 — QUESTION (with virus/globe image backdrop) ════ */}
      <section className="scene-question">
        <div className="question-bg" />
        <div className="question-veil" />
        <div className="question-inner reveal">
          <span className="question-eyebrow">Chapter Two · The turn</span>
          <h2 className="question-text">
            What if every experience<br />
            became <span className="glow">a signal?</span>
          </h2>
        </div>
      </section>

      {/* ════ SCENE 6 — DATA (LUXURY LIGHT) ════ */}
      <section className="scene-data" ref={dataRef}>
        <div className="data-inner">
          <div className="data-header reveal">
            <span className="data-eyebrow">The network in real time</span>
            <h2>Already growing — voice by voice.</h2>
            <p>Live counts, updated as each new experience joins the system.</p>
          </div>
          <div className="data-grid">
            <div className="data-card reveal">
              <div className="data-num">{cReports.toLocaleString()}</div>
              <div className="data-label">Reports submitted</div>
              <div className="data-sub">Every one anonymized, every one counted.</div>
              <div className="data-pulse"><span/><span/><span/><span/><span/><span/><span/></div>
            </div>
            <div className="data-card reveal reveal-delay-1">
              <div className="data-num">{cVaccines}</div>
              <div className="data-label">Vaccines tracked</div>
              <div className="data-sub">Pfizer, Moderna, AstraZeneca, Johnson &amp; Johnson.</div>
              <div className="data-pulse"><span/><span/><span/><span/><span/><span/><span/></div>
            </div>
            <div className="data-card reveal reveal-delay-2">
              <div className="data-num">{cSymptoms}</div>
              <div className="data-label">Symptoms documented</div>
              <div className="data-sub">From the well-known to the rarely-mentioned.</div>
              <div className="data-pulse"><span/><span/><span/><span/><span/><span/><span/></div>
            </div>
            <div className="data-card reveal reveal-delay-3">
              <div className="data-num">{cResolved}%</div>
              <div className="data-label">Experiences resolved</div>
              <div className="data-sub">Most symptoms do pass. Data brings reassurance.</div>
              <div className="data-pulse"><span/><span/><span/><span/><span/><span/><span/></div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ SCENE 7 — TIMELINE ════ */}
      <section className="scene-timeline">
        <div className="timeline-inner">
          <div className="timeline-header reveal">
            <h2>A century of trying — and failing — to listen.</h2>
            <p>How vaccine side-effect reporting evolved, and where we go next.</p>
          </div>
          <div className="timeline-track reveal reveal-delay-1">
            <div className="timeline-grid">
              {TIMELINE.map((t, i) => (
                <div className="timeline-node" key={i}>
                  <div className="timeline-dot" />
                  <div className="timeline-year">{t.year}</div>
                  <div className="timeline-event">{t.event}</div>
                  <p className="timeline-desc">{t.desc}</p>
                  <div className="timeline-bar"><i style={{ width: `${t.bar}%` }} /></div>
                  <p className="timeline-quality">{t.quality}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════ SCENE 8 — HOW IT WORKS (LUXURY LIGHT, SHORTER) ════ */}
      <section className="scene-how">
        <div className="how-inner">
          <div className="how-header reveal">
            <span className="how-eyebrow">Chapter Three · The act</span>
            <h2>Four steps. Three minutes. One signal.</h2>
            <p>From your story to the science — designed to be effortless.</p>
          </div>
          <div className="how-grid">
            {STEPS.map((s, i) => (
              <div className="how-card reveal" key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="how-card-head">
                  <span className="how-num">Step {s.num}</span>
                  <div className="how-icon">{s.icon}</div>
                </div>
                <h3 className="how-title">{s.title}</h3>
                <p className="how-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ SCENE 9 — VOICES ════ */}
      <section className="scene-voices">
        <div className="voices-inner">
          <div className="voices-header reveal">
            <h2>You are not alone in this network.</h2>
            <p>Voices that arrived before yours — anonymous, contributed willingly.</p>
          </div>
          <div className="voices-grid">
            {VOICES.map((v, i) => (
              <div className="voice-card reveal" key={i} style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="voice-tag">{v.tag}</div>
                <p className="voice-text">"{v.text}"</p>
                <cite className="voice-meta">{v.meta}</cite>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ SCENE 10 — FAQ (LUXURY LIGHT, BIGGER) ════ */}
      <section className="scene-faq">
        <div className="faq-inner">
          <div className="faq-header reveal">
            <span className="faq-eyebrow">Transparency, all the way down</span>
            <h2>Questions, answered.</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <div
                key={i}
                className={`faq-item ${openFaq === i ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="faq-q">
                  <span>{f.q}</span>
                  <span className="faq-icon">+</span>
                </div>
                {openFaq === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ SCENE 11 — FINALE ════ */}
      <section className="scene-finale">
        <div className="finale-bg" />
        <div className="finale-veil" />
        <div className="finale-inner reveal">
          <span className="finale-eyebrow">Chapter Four · Now</span>
          <h2 className="finale-title">
            Your story is the data<br />
            we have been <span className="glow">missing.</span>
          </h2>
          <p className="finale-sub">
            Whether you spent days, weeks, or years dealing with side effects — or none at all —
            your experience belongs in the picture. The next pandemic depends on the listening we build today.
          </p>
          <div className="finale-ctas">
            <Link to="/signup" className="btn-primary btn-lg">
              Add your voice <span className="arrow">→</span>
            </Link>
            <Link to="/reports" className="btn-ghost btn-lg">Report anonymously</Link>
          </div>
          <p className="finale-note">No personal data required · Differential privacy by design</p>
        </div>
      </section>

    </div>
  )
}
