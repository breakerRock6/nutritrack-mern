import axios from 'axios';

// withCredentials sends the HTTP-only auth cookie. The token is never visible to JavaScript.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000,
});

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond.';
  if (err?.message === 'Network Error') return 'Cannot reach the server. Check that the API is running.';
  return fallback;
}
