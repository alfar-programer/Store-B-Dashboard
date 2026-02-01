import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { X, Check } from 'lucide-react'
import './Orders.css'

const Orders = () => {
    const [orders, setOrders] = useState([])
    const [notification, setNotification] = useState({ show: false, message: '', type: '' })
    const navigate = useNavigate()

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type })
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' })
        }, 3000)
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const response = await api.get('/api/orders')
            if (response.data && response.data.success) {
                setOrders(response.data.data)
            } else if (Array.isArray(response.data)) {
                setOrders(response.data)
            } else {
                setOrders([])
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
            showNotification('Error fetching orders', 'error')
        }
    }

    const updateOrderStatus = async (id, newStatus) => {
        try {
            await api.put(`/api/orders/${id}`, { status: newStatus })
            showNotification(`Order status updated to ${newStatus}`, 'success')
            fetchOrders()
        } catch (error) {
            console.error('Error updating order:', error)
            showNotification('Error updating order', 'error')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return '#f6ad55'
            case 'Processing':
                return '#4fd1c5'
            case 'Shipped':
                return '#4299e1'
            case 'Delivered':
                return '#48bb78'
            case 'Cancelled':
                return '#e53e3e'
            default:
                return '#718096'
        }
    }

    const openOrderDetails = (id) => {
        navigate(`/orders/${id}`)
    }

    return (
        <div className="orders-page">
            {/* Notification */}
            {notification.show && (
                <div className={`notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={20} /> : <X size={20} />}
                    {notification.message}
                </div>
            )}
            <div className="page-header">
                <h1>Orders Management</h1>
            </div>

            <div className="orders-table">
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td>{order.customerName}</td>
                                <td>{(Number(order.total) || 0).toFixed(2)} <small>EGP</small></td>
                                <td>
                                    <span
                                        className="status-badge"
                                        style={{ background: getStatusColor(order.status) }}
                                    >
                                        {order.status}
                                    </span>
                                </td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="actions-cell">
                                    <select
                                        value={order.status}
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                        className="status-select"
                                        disabled={order.status === 'Cancelled'}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        {(order.status === 'Pending' || order.status === 'Cancelled') && (
                                            <option value="Cancelled">Cancelled</option>
                                        )}
                                    </select>
                                    <button
                                        className="btn-details"
                                        onClick={() => openOrderDetails(order.id)}
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Orders
