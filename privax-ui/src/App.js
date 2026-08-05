import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/context/AuthContext'
import PrivateRoute from './components/misc/PrivateRoute'
import Navbar from './components/misc/Navbar'
import Footer from './components/misc/Footer'
import NotFound from './components/misc/NotFound'
import Privacy from './components/misc/Privacy'
import Home from './components/home/Home'
import Login from './components/home/Login'
import Signup from './components/home/Signup'
import AdminPage from './components/admin/AdminPage'
import UserPage from './components/user/UserPage'
import DoctorPage from './components/doctor/DoctorPage'
import Report from './components/reports/Report'
import BlogIndex from './components/blog/BlogIndex'
import BlogPostView from './components/blog/BlogPostView'
import BlogEditor from './components/blog/BlogEditor'
import About from './components/about/About'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/reports' element={<Report />} />
          <Route path='/blog' element={<BlogIndex />} />
          <Route path='/blog/new' element={<PrivateRoute><BlogEditor /></PrivateRoute>} />
          <Route path='/blog/:slug' element={<BlogPostView />} />
          <Route path='/blog/:slug/edit' element={<PrivateRoute><BlogEditor /></PrivateRoute>} />
          <Route path='/about' element={<About />} />
          <Route path='/privacy' element={<Privacy />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path="/adminpage" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
          <Route path="/userpage" element={<PrivateRoute><UserPage /></PrivateRoute>} />
          <Route path="/doctorpage" element={<PrivateRoute><DoctorPage /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  )
}

export default App
