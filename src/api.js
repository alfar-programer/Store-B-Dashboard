import axios from 'axios';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'https://store-b-backend-production.up.railway.app';

// Create an axios instance
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Crucial for cross-origin cookie sharing
});

// Add a request interceptor to add the token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle session expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            console.warn('Session expired or unauthorized. Redirecting to login...');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('userRole');
            // We can't use useNavigate here since it's not a component, 
            // but we can redirect manually if needed
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
