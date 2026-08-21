import axios from 'axios'
import { ensureValidSession } from './checkValidityToken'

// Create a custom axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true
});

// 🔐 REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  async (config) => {
    // 1. Skip token check for unauthenticated routes
    if (
        config.url?.includes('/auth/login/') || 
        config.url?.includes('/auth/token/refresh/') || 
        config.url?.includes('/auth/captcha')
    ) {
      return config;
    }

    // 2. If the user is logged in, guarantee the session is valid before proceeding
    if (localStorage.getItem('access_exp')) {
       await ensureValidSession();
    }
    
    // 3. No need to manually attach Bearer tokens — the browser sends the HttpOnly cookie automatically!
    config.headers['Accept'] = 'application/json';
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;