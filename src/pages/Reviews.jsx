import React, { useState, useEffect } from 'react';
import api from '../api';
import './Reviews.css';
import { Search, Filter, CheckCircle, XCircle, Clock, Star } from 'lucide-react';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchReviews(statusFilter);
    }, [statusFilter]);

    const fetchReviews = async (status) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/api/admin/reviews?status=${status}`);
            setReviews(response.data.data);
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Failed to fetch reviews.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await api.put(`/api/admin/reviews/${id}/status`, { status: newStatus });
            // Optimistic UI update
            setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
        } catch (err) {
            console.error('Error updating review status:', err);
            alert('Failed to update review status.');
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'approved': return <span className="status-badge approved"><CheckCircle size={14}/> Approved</span>;
            case 'rejected': return <span className="status-badge rejected"><XCircle size={14}/> Rejected</span>;
            default: return <span className="status-badge pending"><Clock size={14}/> Pending</span>;
        }
    };

    return (
        <div className="reviews-page">
            <div className="page-header">
                <h2>Customer Reviews</h2>
            </div>

            <div className="reviews-controls">
                <div className="filter-group">
                    <Filter size={18} />
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="status-select"
                    >
                        <option value="all">All Reviews</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="reviews-table-container">
                {loading ? (
                    <div className="loading-state">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="empty-state">No reviews found.</div>
                ) : (
                    <table className="reviews-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Customer</th>
                                <th>Rating</th>
                                <th>Review</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map(review => (
                                <tr key={review.id} className={`status-${review.status}`}>
                                    <td>
                                        <div className="product-info-cell">
                                            <span className="product-title">{review.productTitle || `Product ID: ${review.productId}`}</span>
                                        </div>
                                    </td>
                                    <td>{review.userName || 'Anonymous'}</td>
                                    <td>
                                        <div className="rating-cell">
                                            <span>{review.rating}</span>
                                            <Star size={14} fill="#f5b223" color="#f5b223" />
                                        </div>
                                    </td>
                                    <td className="review-content-cell">
                                        {review.title && <strong>{review.title}</strong>}
                                        <p>{review.body}</p>
                                    </td>
                                    <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                                    <td>{getStatusBadge(review.status)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            {review.status !== 'approved' && (
                                                <button 
                                                    className="btn-approve" 
                                                    onClick={() => handleUpdateStatus(review.id, 'approved')}
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <button 
                                                    className="btn-reject" 
                                                    onClick={() => handleUpdateStatus(review.id, 'rejected')}
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Reviews;
