import React from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Container } from 'semantic-ui-react'
import { useAuth } from '../context/AuthContext'

function UserPage() {
  const Auth = useAuth()
  const user = Auth.getUser()
  const isUser = user?.role === 'USER'

  if (!isUser) {
    return <Navigate to='/' />
  }

  return (
    <Container text style={{ padding: '80px 20px', textAlign: 'center' }}>
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#14213D' }}>
        Hi, {user.name}.
      </h1>
      <p style={{ fontSize: '1.05rem', color: '#6B7790', lineHeight: 1.6, maxWidth: 520, margin: '16px auto 32px' }}>
        Your private space inside Privax. Submit a new report or browse the anonymized data from across the network.
      </p>
      <Link
        to='/reports'
        style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #3A9EC7, #4FB6D9)',
          color: '#0A0E16',
          textDecoration: 'none',
          fontWeight: 700,
          padding: '14px 32px',
          borderRadius: '100px',
          boxShadow: '0 8px 28px rgba(58,158,199,0.4)'
        }}
      >
        Go to Reports →
      </Link>
    </Container>
  )
}

export default UserPage
