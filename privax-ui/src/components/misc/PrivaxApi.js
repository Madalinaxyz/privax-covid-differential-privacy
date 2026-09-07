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
  getCurrentUser,
  getPendingUsers,
  approveUser,
  denyUser,
  createSideEffectReport,
  createClinicianReport,
  getGroupedSideEffectReports,
  getSymptomStats,
  // ── Researcher API (budgeted DP)
  getResearchBudget,
  researchCount,
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

// NOTE: There is intentionally no getSideEffectReports() — the backend no longer exposes a
// per-record feed. The View Reports table uses synthetic illustrative data (illustrativeReports.js),
// and real privacy-preserving data comes from the aggregate endpoints and the researcher API.

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


/* ── Researcher API (interactive, budgeted differential privacy) ─────────── */

// The caller's current privacy budget (total + remaining). Does not spend any budget.
function getResearchBudget() {
  return instance.get('/api/research/budget')
}

// A budgeted, differentially-private count. Spends `epsilon` from the caller's budget and returns
// a freshly-noised count. Rejected with HTTP 429 once the budget is exhausted, 400 for a bad epsilon.
function researchCount({ epsilon, vaccineName = null, city = null, severity = null } = {}) {
  const params = { epsilon }
  if (vaccineName && vaccineName !== 'ALL') params.vaccineName = vaccineName
  if (city) params.city = city
  if (severity && severity !== 'ALL') params.severity = severity
  return instance.get('/api/research/side-effects/count', { params })
}

function getUsers(username) {
  const url = username ? `/api/users/${username}` : '/api/users'
  return instance.get(url)
}

function deleteUser(username) {
  return instance.delete(`/api/users/${username}`)
}

// Current authenticated user's live record (role + any pending requestedRole).
function getCurrentUser() {
  return instance.get('/api/users/me')
}

// Admin: pending privileged-access requests, and approve / deny.
function getPendingUsers() {
  return instance.get('/api/users/pending')
}

function approveUser(username) {
  return instance.post(`/api/users/${username}/approve`)
}

function denyUser(username) {
  return instance.post(`/api/users/${username}/deny`)
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
