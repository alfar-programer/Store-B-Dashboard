import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [processingToken, setProcessingToken] = useState(true);
    const navigate = useNavigate();

    // Check for authentication tokens in URL parameters (cross-port login)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const role = urlParams.get('role');

        if (token && role === 'admin') {
            // Store tokens in admin dashboard's localStorage
            localStorage.setItem('adminToken', token);
            localStorage.setItem('userRole', role);

            console.log('Token stored, redirecting to dashboard...');

            // Clear URL parameters and redirect to dashboard
            window.history.replaceState({}, document.title, window.location.pathname);

            // Small delay to ensure localStorage is set
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 100);
        } else {
            // Check if already logged in
            const existingToken = localStorage.getItem('adminToken');
            const existingRole = localStorage.getItem('userRole');
            if (existingToken && existingRole === 'admin') {
                console.log('Already authenticated, redirecting...');
                navigate('/', { replace: true });
            } else {
                setProcessingToken(false);
            }
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        const API_URL = import.meta.env.VITE_API_URL;

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // successful login
                localStorage.setItem('adminToken', data.token); // Keeping same key for simplicity, or could rename
                localStorage.setItem('userRole', data.role);

                if (data.role === 'admin') {
                    navigate('/');
                } else {
                    console.log('Login failed checks:', data);
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('userRole');
                    setError(`Access denied. Role received: ${data.role}. You must be an admin.`);
                }
            } else {
                setError(data.message || 'Invalid email or password');
            }
        } catch (err) {
            setError(`Connection failed: ${err.message || 'Unknown error'}`);
            console.error('Login error:', err);
        }
    };

    // Show loading state while processing token from URL
    if (processingToken) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <h2>Processing login...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Admin Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter admin email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="login-btn">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
