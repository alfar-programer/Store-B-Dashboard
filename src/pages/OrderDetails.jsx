import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { ArrowLeft, Package, User, MapPin, Phone, Mail, Clock, Check, X } from 'lucide-react'
import './OrderDetails.css'

const OrderDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [notification, setNotification] = useState({ show: false, message: '', type: '' })

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type })
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000)
    }

    useEffect(() => {
        fetchOrderDetails()
    }, [id])

    const fetchOrderDetails = async () => {
        try {
            const response = await api.get('/api/orders')

            if (response.data && response.data.success) {
                const foundOrder = response.data.data.find(o => o.id === parseInt(id))
                if (foundOrder) {
                    setOrder(foundOrder)
                } else {
                    setError('Order not found')
                }
            }
        } catch (err) {
            console.error('Error fetching order details:', err)
            setError('Failed to load order details')
        } finally {
            setLoading(false)
        }
    }

    const updateOrderStatus = async (newStatus) => {
        try {
            await api.put(`/api/orders/${id}`, { status: newStatus })
            showNotification(`Order status updated to ${newStatus}`, 'success')
            fetchOrderDetails()
        } catch (error) {
            console.error('Error updating order:', error)
            showNotification('Error updating order', 'error')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#f6ad55'
            case 'Processing': return '#4fd1c5'
            case 'Shipped': return '#4299e1'
            case 'Delivered': return '#48bb78'
            case 'Cancelled': return '#e53e3e'
            default: return '#718096'
        }
    }

    if (loading) return <div className="loading-state">Loading order details...</div>
    if (error) return (
        <div className="error-state">
            <p>{error}</p>
            <button className="back-btn-error" onClick={() => navigate('/orders')}>Back to Orders</button>
        </div>
    )
    if (!order) return null

    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    const address = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress

    return (
        <div className="order-details-page">
            {notification.show && (
                <div className={`notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={20} /> : <X size={20} />}
                    {notification.message}
                </div>
            )}

            <div className="details-header">
                <button className="back-btn" onClick={() => navigate('/orders')}>
                    <ArrowLeft size={20} /> Back to Orders
                </button>
                <div className="header-info">
                    <h1>Order # {order.id}</h1>
                    <span className="date-badge">{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
            </div>

            <div className="details-grid">
                {/* Left Column: Flow & Items */}
                <div className="details-main">
                    <div className="details-card status-card">
                        <div className="card-header">
                            <Clock size={20} />
                            <h2>Current Status:
                                <span style={{ color: getStatusColor(order.status), marginLeft: '10px' }}>
                                    {order.status}
                                </span>
                            </h2>
                        </div>
                        <div className="status-actions">
                            <label>Update Status:</label>
                            <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(e.target.value)}
                                disabled={order.status === 'Cancelled'}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className="details-card items-card">
                        <div className="card-header">
                            <Package size={20} />
                            <h2>Order Items</h2>
                        </div>
                        <div className="items-list-container">
                            {items.map((item, index) => (
                                <div key={index} className="order-item-row">
                                    <div className="item-main-info">
                                        <p className="item-title-text">{item.title}</p>
                                        <p className="item-qty-text">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="item-pricing">
                                        <p className="price-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                        <small className="price-unit">${item.price} each</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="order-summary-row">
                            <span>Total Amount</span>
                            <span className="summary-total-value">${Number(order.total).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer & Address */}
                <div className="details-sidebar">
                    <div className="details-card customer-card">
                        <div className="card-header">
                            <User size={20} />
                            <h2>Account Information</h2>
                        </div>
                        <div className="card-body-content">
                            <p><strong>Account Name:</strong> {order.userName || 'Guest'}</p>
                            <div className="contact-info-row">
                                <Mail size={16} />
                                <span>{order.userEmail || 'N/A'}</span>
                            </div>
                            <div className="contact-info-row">
                                <Phone size={16} />
                                <span>{order.userPhone || 'Registered phone N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="details-card address-card">
                        <div className="card-header">
                            <MapPin size={20} />
                            <h2>Checkout Details</h2>
                        </div>
                        <div className="card-body-content">
                            {address ? (
                                <>
                                    <div className="checkout-detail-item">
                                        <p><strong>Recipient Name:</strong> {address.fullName || order.customerName}</p>
                                        <p><strong>Contact Phone:</strong> {address.phone || 'N/A'}</p>
                                    </div>
                                    <div className="shipping-address-box">
                                        <h4>Shipping Address</h4>
                                        <p>{address.address}</p>
                                        <p>{address.city}, {address.state}</p>
                                        <p>{address.country}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="no-data">
                                    <p>No checkout/shipping details found.</p>
                                    <small>(Note: Older orders might not have this data stored separately)</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderDetails
