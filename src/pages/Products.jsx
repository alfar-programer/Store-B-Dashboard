import React, { useState, useEffect } from 'react'
import api from '../api'
import { Package, Upload, Edit, Trash2, X, Check } from 'lucide-react'
import './Products.css'

const Products = () => {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [imagePreviews, setImagePreviews] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        discount: 0,
        rating: 4.5,
        images: [],
        isFeatured: false
    })
    const [notification, setNotification] = useState({ show: false, message: '', type: '' })

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    const fetchProducts = async () => {
        try {
            const response = await api.get('/api/products')
            setProducts(response.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching products:', error)
            showNotification('Error fetching products', 'error')
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await api.get('/api/categories')
            setCategories(response.data)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type })
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' })
        }, 3000)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0) {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...files]
            }))

            files.forEach(file => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result])
                }
                reader.readAsDataURL(file)
            })
        }
    }

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
        setImagePreviews(prev => prev.filter((_, i) => i !== index))
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

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))

        if (files.length > 0) {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...files]
            }))

            files.forEach(file => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result])
                }
                reader.readAsDataURL(file)
            })
        }
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            price: '',
            stock: '',
            category: '',
            discount: 0,
            rating: 4.5,
            images: [],
            isFeatured: false
        })
        setImagePreviews([])
        setEditingProduct(null)
        setShowForm(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.images.length === 0 && !editingProduct) {
            showNotification('Please select at least one image', 'error')
            return
        }

        const data = new FormData()
        data.append('title', formData.title)
        data.append('description', formData.description)
        data.append('price', formData.price)
        data.append('stock', formData.stock)
        data.append('category', formData.category)
        data.append('discount', formData.discount)
        data.append('rating', formData.rating)
        data.append('isFeatured', formData.isFeatured)

        // Append all images with the same key 'images'
        formData.images.forEach(file => {
            // For new files
            if (file instanceof File) {
                data.append('images', file)
            }
            // Logic for existing images (urls) could be added here if we supported mixing new+old.
            // But simpler for now: Only send files. If files sent, backend replaces.
        })

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };

            console.log('📦 Submitting Product Data:', {
                title: formData.title,
                imagesCount: formData.images.length,
                isEditing: !!editingProduct
            });

            if (editingProduct) {
                await api.put(`/api/products/${editingProduct.id}`, data, config)
                showNotification('Product updated successfully!', 'success')
            } else {
                await api.post('/api/products', data, config)
                showNotification('Product created successfully!', 'success')
            }

            fetchProducts()
            resetForm()
        } catch (error) {
            console.error('Error saving product:', error)
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
            showNotification('Error saving product: ' + errorMsg, 'error')
        }
    }

    const handleEdit = (product) => {
        setEditingProduct(product)
        const parsedImages = getProductImages(product.image);

        setFormData({
            title: product.title,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            discount: product.discount,
            rating: product.rating,
            images: [], // We start empty for files. Ideally store existing URLs separately.
            isFeatured: product.isFeatured || false
        })
        setImagePreviews(parsedImages)
        setShowForm(true)
    }

    const getProductImages = (imageString) => {
        try {
            const parsed = JSON.parse(imageString);
            return Array.isArray(parsed) ? parsed : [imageString];
        } catch (e) {
            return [imageString];
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/api/products/${id}`)
                showNotification('Product deleted successfully!', 'success')
                fetchProducts()
            } catch (error) {
                console.error('Error deleting product:', error)
                showNotification('Error deleting product', 'error')
            }
        }
    }

    if (loading) {
        return <div className="products-loading">Loading products...</div>
    }

    return (
        <div className="products-page">
            {/* Notification */}
            {notification.show && (
                <div className={`notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={20} /> : <X size={20} />}
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="products-header">
                <div>
                    <h1>Products Management</h1>
                    <p>Manage your product inventory</p>
                </div>
                <button
                    className="add-product-btn"
                    onClick={() => setShowForm(!showForm)}
                >
                    <Package size={20} />
                    {showForm ? 'Cancel' : 'Add Product'}
                </button>
            </div>

            {/* Product Form */}
            {showForm && (
                <div className="product-form-container">
                    <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                    <form onSubmit={handleSubmit} className="product-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Product title"
                                />
                            </div>

                            <div className="form-group">
                                <label>Category *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Price *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="form-group">
                                <label>Stock Amount *</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    placeholder="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Discount (%)</label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                    placeholder="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Rating</label>
                                <input
                                    type="number"
                                    name="rating"
                                    value={formData.rating}
                                    onChange={handleInputChange}
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    placeholder="4.5"
                                />
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isFeatured"
                                        checked={formData.isFeatured}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                                    />
                                    <span>⭐ Featured Product (Show on home page)</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows="4"
                                placeholder="Product description"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Product Images *</label>
                            <div
                                className="image-upload-area"
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="upload-placeholder">
                                    <Upload size={48} />
                                    <p>Drag & drop images here or click to browse</p>
                                    <span>Supported formats: JPG, PNG, GIF, WEBP (Max 5MB)</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="file-input"
                                    multiple
                                />
                            </div>

                            {imagePreviews.length > 0 && (
                                <div className="image-previews-grid">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="image-preview-item" style={{ borderColor: index === 0 ? '#4299e1' : '#e2e8f0', borderWidth: index === 0 ? '2px' : '1px' }}>
                                            <img src={preview} alt={`Preview ${index}`} />
                                            {index === 0 && (
                                                <span className="main-image-badge" style={{
                                                    position: 'absolute',
                                                    top: '5px',
                                                    left: '5px',
                                                    background: '#4299e1',
                                                    color: 'white',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    zIndex: 10
                                                }}>Main</span>
                                            )}
                                            <div className="image-actions" style={{
                                                position: 'absolute',
                                                top: '5px',
                                                right: '5px',
                                                display: 'flex',
                                                gap: '5px'
                                            }}>
                                                {index !== 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newImages = [...formData.images];
                                                            const newPreviews = [...imagePreviews];

                                                            // Move selected item to front
                                                            const [selectedImage] = newImages.splice(index, 1);
                                                            const [selectedPreview] = newPreviews.splice(index, 1);

                                                            newImages.unshift(selectedImage);
                                                            newPreviews.unshift(selectedPreview);

                                                            setFormData(prev => ({ ...prev, images: newImages }));
                                                            setImagePreviews(newPreviews);
                                                        }}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.9)',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            fontSize: '10px',
                                                            color: '#2d3748',
                                                            fontWeight: '600'
                                                        }}
                                                        title="Set as Main Image"
                                                    >
                                                        ★ Main
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="remove-image-btn"
                                                    style={{ position: 'static' }}
                                                    onClick={() => removeImage(index)}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={resetForm} className="cancel-btn">
                                Cancel
                            </button>
                            <button type="submit" className="submit-btn">
                                {editingProduct ? 'Update Product' : 'Create Product'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Products List */}
            <div className="products-list">
                <h2>All Products ({products.length})</h2>
                {products.length === 0 ? (
                    <div className="empty-state">
                        <Package size={64} />
                        <p>No products yet. Add your first product to get started!</p>
                    </div>
                ) : (
                    <div className="products-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Discount</th>
                                    <th>Rating</th>
                                    <th>Featured</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id}>
                                        <td>
                                            <img
                                                src={getProductImages(product.image)[0]}
                                                alt={product.title}
                                                className="product-thumbnail"
                                            />
                                        </td>
                                        <td className="product-title">{product.title}</td>
                                        <td>{product.category}</td>
                                        <td className="product-price">${parseFloat(product.price).toFixed(2)}</td>
                                        <td>{product.stock}</td>
                                        <td>{product.discount}%</td>
                                        <td>
                                            <span className="rating-badge">★ {product.rating}</span>
                                        </td>
                                        <td>
                                            {product.isFeatured ? (
                                                <span className="featured-badge">⭐ Featured</span>
                                            ) : (
                                                <span className="not-featured">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => handleEdit(product)}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(product.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Products
