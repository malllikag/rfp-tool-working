// API configuration
// In production (Vercel), use relative paths to hit serverless functions
// In development, use localhost backend
const API_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? '' : 'http://localhost:5000');

export { API_URL };
