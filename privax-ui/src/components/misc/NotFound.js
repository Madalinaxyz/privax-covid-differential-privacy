import React from 'react'
import { Link } from 'react-router-dom'
import './NotFound.css'

const NotFound = () => {
  return (
    <main className="notfound">
      <div className="notfound-inner">
        <div className="notfound-kicker">404 — page not found</div>
        <h1 className="notfound-title">
          That signal didn't <span className="notfound-accent">make it through.</span>
        </h1>
        <p className="notfound-lead">
          The page you were looking for either moved, never existed, or was lost
          to the noise. It happens — even in well-anonymized systems.
        </p>

        <div className="notfound-actions">
          <Link to="/" className="notfound-btn notfound-btn--primary">
            Back to home <span className="notfound-arrow">→</span>
          </Link>
          <Link to="/reports" className="notfound-btn notfound-btn--ghost">
            Explore the reports
          </Link>
        </div>

        <div className="notfound-links">
          <span className="notfound-links-label">Or try:</span>
          <Link to="/about">About</Link>
          <span className="notfound-dot">·</span>
          <Link to="/blog">Blog</Link>
          <span className="notfound-dot">·</span>
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>
    </main>
  )
}

export default NotFound
