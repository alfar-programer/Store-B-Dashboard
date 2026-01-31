import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, FolderOpen, LogOut, Users } from 'lucide-react'
import './Sidebar.css'

const Sidebar = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const menuItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/products', icon: Package, label: 'Products' },
        { path: '/categories', icon: FolderOpen, label: 'Categories' },
        { path: '/orders', icon: ShoppingCart, label: 'Orders' },
        { path: '/users', icon: Users, label: 'Users' }
    ]

    const handleLogout = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://store-b-backend-production.up.railway.app';
            await axios.post(`${API_URL}/api/auth/logout`);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('userRole');
            navigate('/login');
        }
    }

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Admin Panel</h2>
            </div>
            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
                <button onClick={handleLogout} className="nav-item logout-btn">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </nav>
        </div>
    )
}

export default Sidebar
