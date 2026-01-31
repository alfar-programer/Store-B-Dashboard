import React, { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react'
import './Categories.css'

const Categories = () => {
    const [categories, setCategories] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: null
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await api.get('/api/categories')
            setCategories(response.data)
        } catch (error) {
            console.error('Error fetching categories:', error)
            setError('Failed to load categories')
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFormData(prev => ({
                ...prev,
                image: file
            }))

            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.currentTarget.classList.add('drag-over')
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.currentTarget.classList.remove('drag-over')
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.currentTarget.classList.remove('drag-over')

        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            setFormData(prev => ({
                ...prev,
                image: file
            }))

            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const data = new FormData()
        data.append('name', formData.name)
        data.append('description', formData.description)

        if (formData.image) {
            data.append('image', formData.image)
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };

            if (editingCategory) {
                await api.put(`/api/categories/${editingCategory.id}`, data, config)
            } else {
                await api.post('/api/categories', data, config)
            }

            fetchCategories()
            handleCloseModal()
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to save category')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) {
            return
        }

        try {
            await api.delete(`/api/categories/${id}`)
            fetchCategories()
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to delete category')
        }
    }

    const handleEdit = (category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            description: category.description || '',
            image: null
        })
        // If image is an absolute URL (Cloudinary), use it directly.
        const imageUrl = category.image?.startsWith('http')
            ? category.image
            : null;

        setImagePreview(imageUrl)
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingCategory(null)
        setFormData({ name: '', description: '', image: null })
        setImagePreview(null)
        setError('')
    }

    return (
        <div className="categories-page">
            <div className="page-header">
                <h1>Categories</h1>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    Add Category
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="categories-grid">
                {categories.map((category) => (
                    <div key={category.id} className="category-card">
                        {category.image && (
                            <div className="category-image">
                                <img src={category.image} alt={category.name} />
                            </div>
                        )}
                        <div className="category-content">
                            <h3>{category.name}</h3>
                            <p>{category.description || 'No description'}</p>
                        </div>
                        <div className="category-actions">
                            <button
                                className="btn-icon btn-edit"
                                onClick={() => handleEdit(category)}
                                title="Edit"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                className="btn-icon btn-delete"
                                onClick={() => handleDelete(category.id)}
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="empty-state">
                    <p>No categories yet. Create your first category!</p>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                            <button className="btn-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g., Electronics, Clothing, Food"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description for this category"
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Category Image {!editingCategory && '*'}</label>
                                <div
                                    className="image-upload-area"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {imagePreview ? (
                                        <div className="image-preview">
                                            <img src={imagePreview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="remove-image-btn"
                                                onClick={() => {
                                                    setImagePreview(null)
                                                    setFormData(prev => ({ ...prev, image: null }))
                                                }}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="upload-placeholder">
                                            <Upload size={48} />
                                            <p>Drag & drop an image here or click to browse</p>
                                            <span>Supported formats: JPG, PNG, GIF, WEBP (Max 5MB)</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="file-input"
                                        required={!editingCategory && !imagePreview}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleCloseModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Categories
