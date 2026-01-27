import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Check, Shield, User as UserIcon, Ban, Unlock } from 'lucide-react'
import './Users.css'

const Users = () => {
    // API URL - Uses environment variable in dev, falls back to production URL
    const API_URL = import.meta.env.VITE_API_URL || 'https://store-b-backend-production.up.railway.app';
    const [users, setUsers] = useState([])
    const [notification, setNotification] = useState({ show: false, message: '', type: '' })

    // Get current user ID from local storage or token to prevent self-blocking
    // Ideally we decode the token, but for now we'll handle the error from backend
    // or decode it here if needed.

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type })
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' })
        }, 3000)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.data && response.data.success) {
                setUsers(response.data.data)
            } else {
                setUsers([])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            showNotification('Error fetching users', 'error')
        }
    }

    const toggleBlockStatus = async (id, isBlocked) => {
        try {
            const token = localStorage.getItem('adminToken');
            // Toggle the status
            const newStatus = !isBlocked;

            await axios.put(`${API_URL}/api/users/${id}/block`, { isBlocked: newStatus }, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            showNotification(`User ${newStatus ? 'blocked' : 'unblocked'} successfully`, 'success')
            fetchUsers()
        } catch (error) {
            console.error('Error updating user:', error)
            const msg = error.response?.data?.message || 'Error updating user status';
            showNotification(msg, 'error')
        }
    }

    return (
        <div className="users-page">
            {/* Notification */}
            {notification.show && (
                <div className={`notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={20} /> : <X size={20} />}
                    {notification.message}
                </div>
            )}
            <div className="page-header">
                <h1>Users Management</h1>
            </div>

            <div className="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Joined Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>#{user.id}</td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge ${user.role}`}>
                                        {user.role === 'admin' ?
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={14} /> Admin</div> :
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UserIcon size={14} /> Customer</div>
                                        }
                                    </span>
                                </td>
                                <td>{user.phone || '-'}</td>
                                <td>
                                    <span className={`status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="actions-cell">
                                    {user.isBlocked ? (
                                        <button
                                            className="btn-unblock"
                                            onClick={() => toggleBlockStatus(user.id, user.isBlocked)}
                                            title="Unblock User"
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Unlock size={16} /> Unblock
                                            </div>
                                        </button>
                                    ) : (
                                        <button
                                            className="btn-block"
                                            onClick={() => toggleBlockStatus(user.id, user.isBlocked)}
                                            title="Block User"
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Ban size={16} /> Block
                                            </div>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Users
