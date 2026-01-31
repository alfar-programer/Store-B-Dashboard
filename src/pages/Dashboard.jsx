import React, { useState, useEffect, useCallback } from 'react'
import api from '../api'
import { TrendingUp, Package, ShoppingCart, DollarSign, Clock, CheckCircle } from 'lucide-react'
import './Dashboard.css'

const Dashboard = () => {
    const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 })
    const [recentOrders, setRecentOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log('Dashboard component mounted');
    }, [])

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsRes, ordersRes] = await Promise.all([
                api.get('/api/stats'),
                api.get('/api/orders')
            ])
            setStats(statsRes.data?.data || { products: 0, orders: 0, revenue: 0 })
            setRecentOrders(Array.isArray(ordersRes.data?.data) ? ordersRes.data.data.slice(0, 5) : [])
            setLoading(false)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            // Set default values on error
            setStats({ products: 0, orders: 0, revenue: 0 })
            setRecentOrders([])
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDashboardData()
    }, [fetchDashboardData])

    const statCards = [
        {
            icon: Package,
            label: 'Total Products',
            value: stats.products,
            color: '#667eea',
            trend: stats.growth?.products ? `${stats.growth.products > 0 ? '+' : ''}${stats.growth.products}%` : '+0%',
            trendUp: stats.growth?.products >= 0
        },
        {
            icon: ShoppingCart,
            label: 'Total Orders',
            value: stats.orders,
            color: '#764ba2',
            trend: stats.growth?.orders ? `${stats.growth.orders > 0 ? '+' : ''}${stats.growth.orders}%` : '+0%',
            trendUp: stats.growth?.orders >= 0
        },
        {
            icon: DollarSign,
            label: 'Total Revenue',
            value: `$${(Number(stats.revenue) || 0).toFixed(2)}`,
            color: '#f093fb',
            trend: stats.growth?.revenue ? `${stats.growth.revenue > 0 ? '+' : ''}${stats.growth.revenue}%` : '+0%',
            trendUp: stats.growth?.revenue >= 0
        },
        {
            icon: TrendingUp,
            label: 'Overall Growth',
            value: stats.growth?.overall ? `${stats.growth.overall > 0 ? '+' : ''}${stats.growth.overall}%` : '+0%',
            color: '#4facfe',
            trend: 'This month',
            trendUp: stats.growth?.overall >= 0
        }
    ]

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#f6ad55'
            case 'Shipped': return '#4299e1'
            case 'Delivered': return '#48bb78'
            default: return '#718096'
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                fontSize: '1.2rem',
                color: '#667eea'
            }}>
                Loading dashboard...
            </div>
        )
    }

    return (
        <div className="dashboard">
            {/* Welcome Section */}
            <div className="welcome-section">
                <div>
                    <h1 className="dashboard-title">Welcome back, Admin! 👋</h1>
                    <p className="dashboard-subtitle">Here's what's happening with your store today</p>
                </div>
                <div className="quick-actions">
                    <button className="quick-action-btn" onClick={() => window.location.href = '/products'}>
                        <Package size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((card, index) => {
                    const Icon = card.icon
                    return (
                        <div key={index} className="stat-card" style={{ borderTopColor: card.color }}>
                            <div className="stat-header">
                                <div className="stat-icon" style={{ background: card.color }}>
                                    <Icon size={24} color="white" />
                                </div>
                                <div className={`stat-trend ${card.trendUp ? 'up' : 'down'}`}>
                                    <TrendingUp size={14} />
                                    {card.trend}
                                </div>
                            </div>
                            <div className="stat-info">
                                <h3 className="stat-value">{card.value}</h3>
                                <p className="stat-label">{card.label}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Recent Orders Section */}
            <div className="recent-section">
                <div className="section-header">
                    <h2>Recent Orders</h2>
                    <a href="/orders" className="view-all-link">View All →</a>
                </div>
                <div className="recent-orders-list">
                    {recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
                            <div key={order.id} className="order-item">
                                <div className="order-info">
                                    <div className="order-id">
                                        <ShoppingCart size={16} />
                                        Order #{order.id}
                                    </div>
                                    <div className="order-customer">{order.customerName}</div>
                                </div>
                                <div className="order-details">
                                    <span className="order-amount">${(Number(order.total) || 0).toFixed(2)}</span>
                                    <span
                                        className="order-status"
                                        style={{ background: getStatusColor(order.status) }}
                                    >
                                        {order.status || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <Clock size={48} color="#cbd5e0" />
                            <p>No orders yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats-grid">
                <div className="quick-stat-card">
                    <Clock size={32} color="#667eea" />
                    <div>
                        <h4>Pending Orders</h4>
                        <p className="quick-stat-value">
                            {recentOrders.filter(o => o.status === 'Pending').length}
                        </p>
                    </div>
                </div>
                <div className="quick-stat-card">
                    <CheckCircle size={32} color="#48bb78" />
                    <div>
                        <h4>Completed Today</h4>
                        <p className="quick-stat-value">
                            {recentOrders.filter(o => o.status === 'Delivered').length}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
