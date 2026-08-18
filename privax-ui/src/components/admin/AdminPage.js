import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { privaxApi } from '../misc/PrivaxApi'
import AdminTab from './AdminTab'
import { handleLogError } from '../misc/Helpers'
import './admin.css'

function AdminPage() {
  const Auth = useAuth()
  const user = Auth.getUser()
  const isAdmin = user?.role === 'ADMIN'

  const [users, setUsers] = useState([])
  const [userUsernameSearch, setUserUsernameSearch] = useState('')
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [pending, setPending] = useState([])

  useEffect(() => {
    handleGetUsers()
    handleGetPending()
  }, [])

  const handleGetPending = async () => {
    try {
      const response = await privaxApi.getPendingUsers()
      setPending(response.data)
    } catch (error) {
      handleLogError(error)
    }
  }

  const handleApprove = async (username) => {
    try {
      await privaxApi.approveUser(username)
      await Promise.all([handleGetPending(), handleGetUsers()])
    } catch (error) {
      handleLogError(error)
    }
  }

  const handleDeny = async (username) => {
    try {
      await privaxApi.denyUser(username)
      await Promise.all([handleGetPending(), handleGetUsers()])
    } catch (error) {
      handleLogError(error)
    }
  }

  const handleInputChange = (e, { name, value }) => {
    if (name === 'userUsernameSearch') {
      setUserUsernameSearch(value)
    }
  }

  const handleGetUsers = async () => {
    try {
      setIsUsersLoading(true)
      const response = await privaxApi.getUsers()
      const users = response.data
      setUsers(users)
    } catch (error) {
      handleLogError(error)
    } finally {
      setIsUsersLoading(false)
    }
  }

  const handleDeleteUser = async (username) => {
    try {
      await privaxApi.deleteUser(username)
      await handleGetUsers()
    } catch (error) {
      handleLogError(error)
    }
  }

  const handleSearchUser = async () => {
    try {
      const response = await privaxApi.getUsers(userUsernameSearch)
      const data = response.data
      const users = data instanceof Array ? data : [data]
      setUsers(users)
    } catch (error) {
      handleLogError(error)
      setUsers([])
    }
  }

  if (!isAdmin) {
    return <Navigate to='/' />
  }

  return (
    <div className='admin-page'>
      <div className='admin-header'>
        <div className='admin-header-left'>
          <span className='admin-eyebrow'>Console</span>
          <h1 className='admin-title'>Admin</h1>
        </div>
        <p className='admin-sub'>
          Manage user accounts. Search, review, and remove access as needed.
        </p>
      </div>
      {pending.length > 0 && (
        <div className='admin-pending'>
          <div className='admin-pending-head'>
            <h2>Pending access requests</h2>
            <span className='admin-pending-count'>{pending.length}</span>
          </div>
          <p className='admin-pending-sub'>
            These users applied for privileged access at signup. Approving grants the role; denying keeps them a standard user.
          </p>
          <ul className='admin-pending-list'>
            {pending.map(u => (
              <li key={u.id} className='admin-pending-row'>
                <div className='admin-pending-who'>
                  <span className='admin-pending-name'>{u.name}</span>
                  <span className='admin-pending-username'>@{u.username}</span>
                  <span className={`admin-pending-role admin-pending-role--${(u.requestedRole || '').toLowerCase()}`}>
                    requests {u.requestedRole}
                  </span>
                </div>
                <div className='admin-pending-actions'>
                  <button className='admin-btn admin-btn--approve' onClick={() => handleApprove(u.username)}>Approve</button>
                  <button className='admin-btn admin-btn--deny' onClick={() => handleDeny(u.username)}>Deny</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className='admin-tabs-wrap'>
        <AdminTab
          isUsersLoading={isUsersLoading}
          users={users}
          userUsernameSearch={userUsernameSearch}
          handleDeleteUser={handleDeleteUser}
          handleSearchUser={handleSearchUser}
          handleInputChange={handleInputChange}
        />
      </div>
    </div>
  )
}

export default AdminPage
