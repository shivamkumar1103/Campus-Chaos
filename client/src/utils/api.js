import axios from 'axios';

// Cookie auth: browser sends the httpOnly session cookie automatically.
// No token is stored in JS (no localStorage) — XSS cannot steal it.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export default api;
