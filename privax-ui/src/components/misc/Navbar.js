import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { getUser, userIsAuthenticated, userLogout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    userLogout()
    navigate('/')
  }

  const user     = getUser()
  const isAdmin  = user?.role === 'ADMIN'
  const isDoctor = user?.role === 'DOCTOR'

  const navLinks = [
    { label: 'Home',     to: '/' },
    { label: 'About',    to: '/about' },
    { label: 'Reports',  to: '/reports' },
    { label: 'Blog',     to: '/blog' },
    // A clinician (DOCTOR) has access to both the report-submission page and the research console.
    ...(isDoctor ? [{ label: 'Submit Report', to: '/doctorpage' }] : []),
    ...(isDoctor ? [{ label: 'Research',      to: '/research' }] : []),
    ...(isAdmin  ? [{ label: 'Admin',   to: '/adminpage'  }] : []),
  ]

  const isHome = location.pathname === '/'

  return (
    <header className={`navbar ${isHome ? 'navbar--overlay' : ''} ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar-inner">

        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-name">
            Privax<span className="navbar-logo-dot">.</span>
          </span>
        </Link>

        <nav className="navbar-links">
          {navLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`navbar-link ${location.pathname === to ? 'navbar-link--active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="navbar-auth">
          {userIsAuthenticated() ? (
            <>
              <span className="navbar-greeting">Hi, {user?.name}</span>
              <button onClick={handleLogout} className="btn-nav-outline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"  className="btn-nav-text">Login</Link>
              <Link to="/signup" className="btn-nav-primary">Add your voice</Link>
            </>
          )}
        </div>

      </div>
    </header>
  )
}
