// The API base URL is provided at build time via REACT_APP_API_BASE_URL.
// It falls back to the local backend for development, so no config is needed to run locally.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'

export const config = {
  url: {
    API_BASE_URL,
  },
}