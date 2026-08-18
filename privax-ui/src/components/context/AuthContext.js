import React, { createContext, useContext, useState, useEffect } from 'react'
import { privaxApi } from '../misc/PrivaxApi'

const AuthContext = createContext()

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  // Pull the live role/requestedRole from the server and merge it into the stored session, so a
  // user whose request was just approved (or denied) sees the change without logging out and in.
  const refreshUser = async () => {
    const stored = JSON.parse(localStorage.getItem('user'))
    if (!stored || !stored.authdata) return
    try {
      const res = await privaxApi.getCurrentUser()
      const merged = { ...stored, role: res.data.role, requestedRole: res.data.requestedRole }
      localStorage.setItem('user', JSON.stringify(merged))
      setUser(merged)
    } catch (e) {
      /* offline or session invalid — keep the stored value */
    }
  }

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    setUser(storedUser)
    if (storedUser) refreshUser()
  }, [])

  const getUser = () => {
    return JSON.parse(localStorage.getItem('user'))
  }

  const userIsAuthenticated = () => {
    return localStorage.getItem('user') !== null
  }

  const userLogin = user => {
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  const userLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  const contextValue = {
    user,
    getUser,
    userIsAuthenticated,
    userLogin,
    userLogout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext

export function useAuth() {
  return useContext(AuthContext)
}

export { AuthProvider }