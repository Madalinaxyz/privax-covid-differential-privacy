import React from 'react'
import { useAuth } from '../context/AuthContext'
import './PendingBanner.css'

// Shown while a signed-in user is waiting for an admin to approve a privileged-role request.
// The request itself grants no access — this just explains the wait.
function PendingBanner() {
  const { user } = useAuth()
  const pending = user?.requestedRole

  if (!pending) return null

  const label = pending === 'DOCTOR' ? 'Clinician' : pending
  return (
    <div className="pending-banner" role="status">
      <span className="pending-banner-dot" aria-hidden="true" />
      <span>
        Your <strong>{label}</strong> access is pending admin approval. You can use Privax as a
        standard account in the meantime — the {label.toLowerCase()} area will unlock once you're approved.
      </span>
    </div>
  )
}

export default PendingBanner
