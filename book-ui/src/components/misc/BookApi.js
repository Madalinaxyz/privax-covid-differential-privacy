import axios from 'axios'
import { config } from '../../Constants'

// Axios instance
const instance = axios.create({
  baseURL: config.url.API_BASE_URL
})

// Automatically add authentication headers
instance.interceptors.request.use(
  (request) => {
    const user = JSON.parse(localStorage.getItem("user")) // Retrieve user from localStorage

    if (user && user.authdata) {
      request.headers.Authorization = `Basic ${user.authdata}`
    } else if (user && user.token) {
      request.headers.Authorization = `Bearer ${user.token}` // If using JWT
    }

    return request
  },
  (error) => Promise.reject(error)
)

// API Methods
export const bookApi = {
  authenticate,
  signup,
  numberOfUsers,
  numberOfBooks,
  getUsers,
  deleteUser,
  getBooks,
  deleteBook,
  addBook,
  test,
  getSideEffectReports,
  getAllSideEffectReports,
  createSideEffectReport
}

// Authentication Functions
function authenticate(username, password) {
  return instance.post('/auth/authenticate', { username, password }, {
    headers: { 'Content-type': 'application/json' }
  }).then(response => {
    const user = response.data
    if (user.authdata) {
      localStorage.setItem("user", JSON.stringify(user)) // Store user session
    }
    return user
  })
}

function signup(user) {
  return instance.post('/auth/signup', user, {
    headers: { 'Content-type': 'application/json' }
  })
}

// Public Endpoints
function numberOfUsers() {
  return instance.get('/public/numberOfUsers')
}

function numberOfBooks() {
  return instance.get('/public/numberOfBooks')
}

// Protected Endpoints (No Need to Manually Pass User)
function test() {
  return instance.get('/api/vaccinations/test')
}

function getSideEffectReports() {
  return instance.get('/api/side-effects')
}

function getAllSideEffectReports() {
  return instance.get('/api/side-effects/all')
}

function createSideEffectReport(reportData) {
  return instance.post("/api/side-effects", reportData, {
    headers: { "Content-Type": "application/json" },
  });
}

function getUsers(username) {
  const url = username ? `/api/users/${username}` : '/api/users'
  return instance.get(url)
}

function deleteUser(username) {
  return instance.delete(`/api/users/${username}`)
}

function getBooks(text) {
  const url = text ? `/api/books?text=${text}` : '/api/books'
  return instance.get(url)
}

function deleteBook(isbn) {
  return instance.delete(`/api/books/${isbn}`)
}

function addBook(book) {
  return instance.post('/api/books', book, {
    headers: { 'Content-type': 'application/json' }
  })
}

export default bookApi
