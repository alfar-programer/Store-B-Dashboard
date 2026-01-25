import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('adminToken');
        const role = localStorage.getItem('userRole');
        
        console.log('ProtectedRoute - Checking auth:', { hasToken: !!token, role });
        
        if (token && role === 'admin') {
            console.log('ProtectedRoute - Authenticated, allowing access');
            setIsAuthenticated(true);
        } else {
            console.log('ProtectedRoute - Not authenticated, redirecting to login');
            setIsAuthenticated(false);
        }
        setIsChecking(false);
    }, []);

    // Show nothing while checking to avoid flash
    if (isChecking) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
