import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <div className="site-footer-logo">
              Privax<span className="site-footer-logo-dot">.</span>
            </div>
            <p className="site-footer-tagline">
              Private voices in a public crisis. An anonymized, differentially
              private record of post-vaccination experience.
            </p>
          </div>

          <div className="site-footer-col">
            <h6 className="site-footer-heading">Explore</h6>
            <Link to="/" className="site-footer-link">Home</Link>
            <Link to="/about" className="site-footer-link">About</Link>
            <Link to="/reports" className="site-footer-link">Reports</Link>
            <Link to="/blog" className="site-footer-link">Blog</Link>
          </div>

          <div className="site-footer-col">
            <h6 className="site-footer-heading">Trust</h6>
            <Link to="/privacy" className="site-footer-link">Privacy &amp; data</Link>
            <Link to="/about" className="site-footer-link">Methodology</Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-link"
            >
              Source code
            </a>
          </div>

          <div className="site-footer-col">
            <h6 className="site-footer-heading">A note</h6>
            <p className="site-footer-note">
              Privax is a research and thesis project. It is <em>not</em> a
              medical device, not a registry, and not a substitute for
              professional medical advice.
            </p>
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>© {year} Privax. Built with care in Romania.</span>
          <span className="site-footer-dot">·</span>
          <span>For every experience that finally counts.</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
