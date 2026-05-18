import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { privaxApi } from '../misc/PrivaxApi'
import { handleLogError } from '../misc/Helpers'
import './Auth.css'

function Login() {
  const Auth = useAuth()
  const isLoggedIn = Auth.userIsAuthenticated()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isError,  setIsError]  = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!(username && password)) {
      setIsError(true)
      return
    }
    setIsLoading(true)
    try {
      const user = await privaxApi.authenticate(username, password)
      const { id, name, role } = user
      const authdata = window.btoa(username + ':' + password)
      Auth.userLogin({ id, name, role, authdata })
      setIsError(false)
    } catch (error) {
      handleLogError(error)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoggedIn) return <Navigate to={'/'} />

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-veil" />

      {/* Subtle starfield */}
      <span className="auth-star s1" />
      <span className="auth-star s2" />
      <span className="auth-star s3" />
      <span className="auth-star s4" />
      <span className="auth-star s5" />
      <span className="auth-star s6" />
      <span className="auth-star s7" />
      <span className="auth-star s8" />

      <div className="auth-card">
        <Link to="/" className="auth-logo">
          Privax<span className="auth-logo-dot">.</span>
        </Link>

        <span className="auth-eyebrow">Sign in to your account</span>
        <h1 className="auth-title">Welcome back.</h1>
        <p className="auth-sub">Your private space for honest reporting.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label className="auth-field">
            <span className="auth-label">Username</span>
            <input
              autoFocus
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              autoComplete="username"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Password</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {isError && (
            <div className="auth-error">
              The username or password you entered is incorrect.
            </div>
          )}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Signing in…' : (
              <>Sign in <span className="arrow">→</span></>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Create one</Link>
        </div>

        <div className="auth-foot-note">
          By signing in, you agree to keep every report anonymous and honest.
        </div>
      </div>
    </div>
  )
}

export default Login
