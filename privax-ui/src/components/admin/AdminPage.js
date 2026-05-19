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
  const isAdmin = user.role === 'ADMIN'

  const [users, setUsers] = useState([])
  const [userUsernameSearch, setUserUsernameSearch] = useState('')
  const [isUsersLoading, setIsUsersLoading] = useState(false)

  useEffect(() => {
    handleGetUsers()
  }, [])

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
