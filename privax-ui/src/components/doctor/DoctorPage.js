import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DoctorReportForm from './DoctorReportForm'
import './doctor.css'

function DoctorPage() {
  const Auth = useAuth()
  const user = Auth.getUser()
  const isDoctor = user?.role === 'DOCTOR'

  if (!isDoctor) return <Navigate to="/" replace />

  return (
    <main className="doctor-page">
      <div className="doctor-header">
        <div className="doctor-header-left">
          <span className="doctor-eyebrow">Clinician console</span>
          <h1 className="doctor-title">Doctor</h1>
        </div>
        <p className="doctor-sub">
          Submit a side-effect report on behalf of a patient. The patient code
          stays with you — Privax never resolves it to a person.
        </p>
      </div>

      <section className="doctor-card doctor-card--form">
        <header className="doctor-card-head">
          <h2>New patient report</h2>
          <p>Fill in what the patient reported in the consultation.</p>
        </header>
        <DoctorReportForm />
      </section>
    </main>
  )
}

export default DoctorPage
