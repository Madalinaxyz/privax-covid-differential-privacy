import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { privaxApi } from '../misc/PrivaxApi'
import { handleLogError } from '../misc/Helpers'
import './Auth.css'

function Signup() {
  const Auth = useAuth()
  const isLoggedIn = Auth.userIsAuthenticated()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('USER')
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!(username && password && name && email)) {
      setIsError(true)
      setErrorMessage('Please fill in all the fields.')
      return
    }

    setIsLoading(true)
    const user = { username, password, name, email, role }

    try {
      const response = await privaxApi.signup(user)
      const { id, name: savedName, role: savedRole, requestedRole: savedRequestedRole } = response.data
      const authdata = window.btoa(username + ':' + password)
      Auth.userLogin({ id, name: savedName, role: savedRole, requestedRole: savedRequestedRole, authdata })

      setUsername('')
      setPassword('')
      setName('')
      setEmail('')
      setIsError(false)
      setErrorMessage('')
    } catch (error) {
      handleLogError(error)
      let message = 'Something went wrong. Please check your details and try again.'
      if (error.response && error.response.data) {
        const data = error.response.data
        if (data.status === 409) message = data.message
        else if (data.status === 400 && data.errors && data.errors[0]) message = data.errors[0].defaultMessage
      }
      setIsError(true)
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoggedIn) return <Navigate to="/" />

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

        <span className="auth-eyebrow">Create your account</span>
        <h1 className="auth-title">Add your voice.</h1>
        <p className="auth-sub">Report anonymously, on your own terms — no personal data required.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label className="auth-field">
            <span className="auth-label">Username</span>
            <input
              autoFocus
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Name</span>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
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
              autoComplete="new-password"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Account type</span>
            <div className="auth-select-wrap">
              <select
                className="auth-select"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="USER">I am a patient</option>
                <option value="DOCTOR">I am a clinician</option>
              </select>
            </div>
            {role === 'DOCTOR' && (
              <span className="auth-hint">
                You'll start as a standard account. Clinician access (including the research console) is granted after an admin verifies your request.
              </span>
            )}
          </label>

          {isError && <div className="auth-error">{errorMessage}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Creating account…' : (
              <>Create account <span className="arrow">→</span></>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </div>

        <div className="auth-foot-note">
          By creating an account, you agree to keep every report anonymous and honest.
        </div>
      </div>
    </div>
  )
}

export default Signup
