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
export const privaxApi = {
  authenticate,
  signup,
  numberOfUsers,
  getPublicStats,
  getUsers,
  deleteUser,
  test,
  getSideEffectReports,
  getAllSideEffectReports,
  createSideEffectReport,
  createClinicianReport,
  getRecentClinicianReports,
  getGroupedSideEffectReports,
  getSymptomStats,
  // ── Blog
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
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

function getPublicStats() {
  return instance.get('/public/stats')
}

// Protected Endpoints (No Need to Manually Pass User)
function test() {
  return instance.get('/api/vaccinations/test')
}

// function getSideEffectReports(epsilon) {
//   return instance.get('/api/side-effects', {
//     params: { epsilon },
//   });
// }

function getSideEffectReports({
  page = 0,
  size = 10,
  epsilon = 1.0,
  sort = null,
  vaccineName = null,
  severity = null,
  city = null,
  symptom = null
} = {}) {
  const params = { page, size, epsilon };
  if (sort)        params.sort        = sort;
  if (vaccineName) params.vaccineName = vaccineName;
  if (severity && severity !== 'ALL') params.severity = severity;
  if (city)        params.city        = city;
  if (symptom)     params.symptom     = symptom;
  return instance.get('/api/side-effects', { params });
}

function getAllSideEffectReports() {
  return instance.get('/api/side-effects/all')
}

function createSideEffectReport(reportData) {
  return instance.post("/api/side-effects", reportData, {
    headers: { "Content-Type": "application/json" },
  });
}

function createClinicianReport(reportData) {
  return instance.post("/api/side-effects/clinician", reportData, {
    headers: { "Content-Type": "application/json" },
  });
}

function getRecentClinicianReports(limit = 20) {
  return instance.get("/api/side-effects/clinician/recent", { params: { limit } });
}

function getGroupedSideEffectReports(vaccineName, severityLevel, epsilon) {
  return instance.get("/api/side-effects/grouped", {
    params: { vaccineName, severityLevel, epsilon },
  });
}

function getSymptomStats({ epsilon = 1.0, city = null, severity = null, vaccineName = null } = {}) {
  const params = { epsilon };
  if (city) params.city = city;
  if (severity && severity !== "ALL") params.severity = severity;
  if (vaccineName && vaccineName !== "ALL") params.vaccineName = vaccineName;
  return instance.get("/api/side-effects/symptom-stats", { params });
}


function getUsers(username) {
  const url = username ? `/api/users/${username}` : '/api/users'
  return instance.get(url)
}

function deleteUser(username) {
  return instance.delete(`/api/users/${username}`)
}

/* ── Blog ────────────────────────────────────────────────── */

function getBlogPosts({ page = 0, size = 12 } = {}) {
  return instance.get('/api/blog', { params: { page, size } });
}

function getBlogPost(slug) {
  return instance.get(`/api/blog/${slug}`);
}

function createBlogPost(data) {
  return instance.post('/api/blog', data, {
    headers: { 'Content-Type': 'application/json' }
  });
}

function updateBlogPost(id, data) {
  return instance.put(`/api/blog/${id}`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
}

function deleteBlogPost(id) {
  return instance.delete(`/api/blog/${id}`);
}

export default privaxApi
