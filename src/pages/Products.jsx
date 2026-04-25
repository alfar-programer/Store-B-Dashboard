import React, { useState, useEffect } from 'react'
import api from '../api'
import { Package, Upload, Edit, Trash2, X, Check } from 'lucide-react'
import './Products.css'

const Products = () => {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
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
        isFeatured: false,
        pinned: '',
        excluded: ''
    })
    const [notification, setNotification] = useState({ show: false, message: '', type: '' })

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    const fetchProducts = async (page = 1) => {
        try {
            const response = await api.get(`/api/products?page=${page}`)
            // Backend returns paginated: { success, data: [...], pagination: {...} }
            // Axios wraps this in response.data, so the array is at response.data.data
            const productsArray = Array.isArray(response.data)
                ? response.data
                : (response.data?.data ?? [])
            setProducts(productsArray)
            if (response.data?.pagination) {
                setPagination(response.data.pagination)
            }
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
            // Categories returns a plain array directly
            const categoriesArray = Array.isArray(response.data)
                ? response.data
                : (response.data?.data ?? [])
            setCategories(categoriesArray)
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
            isFeatured: false,
            pinned: '',
            excluded: ''
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

            let productId = editingProduct ? editingProduct.id : null;

            if (editingProduct) {
                await api.put(`/api/products/${editingProduct.id}`, data, config)
                showNotification('Product updated successfully!', 'success')
                fetchProducts(pagination.page)
            } else {
                const res = await api.post('/api/products', data, config)
                productId = res.data?.data?.id || res.data?.id || null;
                showNotification('Product created successfully!', 'success')
                fetchProducts(1) // Go to first page on new product creation
            }

            // After product save, save recommendations pinning
            console.log('📦 Recommendations form data:', { pinned: formData.pinned, excluded: formData.excluded, productId });
            if (productId && (formData.pinned.trim() !== '' || formData.excluded.trim() !== '')) {
                const pinnedIds = formData.pinned.split(',').map(s=>parseInt(s.trim())).filter(x=>!isNaN(x));
                const excludedIds = formData.excluded.split(',').map(s=>parseInt(s.trim())).filter(x=>!isNaN(x));
                
                console.log('📌 Sending Recommendation Update:', { productId, pinnedIds, excludedIds });
                try {
                    const recRes = await api.put(`/api/admin/products/${productId}/recommendations`, {
                        pinned: pinnedIds,
                        excluded: excludedIds
                    });
                    console.log('✅ Recommendation Update Response:', recRes.data);
                    showNotification('Product and recommendations saved!', 'success');
                } catch (recErr) {
                    console.error('❌ Failed to update recommendations', recErr);
                    showNotification('Product saved, but failed to update recommendations: ' + (recErr.response?.data?.message || recErr.message), 'error');
                }
            }

            resetForm()
        } catch (error) {
            console.error('Error saving product:', error)
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
            showNotification('Error saving product: ' + errorMsg, 'error')
        }
    }

    const handleEdit = async (product) => {
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
            isFeatured: product.isFeatured || false,
            pinned: '',
            excluded: ''
        })
        setImagePreviews(parsedImages)
        setShowForm(true)

        // Fetch current recommendations status for the form
        try {
            const recRes = await api.get(`/api/products/${product.id}/recommendations`);
            // The backend responds with recommendations, if we can parse pinned/excluded we can populate them
            // Or alternatively we just allow writing to it. For now, fetching them is slightly indirect since the endpoint returns joined products.
            // Let's rely on the admin to just overwrite or input what they want.
        } catch (e) {
            console.error('Failed to fetch recommendations', e);
        }
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
                fetchProducts(pagination.page)
            } catch (error) {
                console.error('Error deleting product:', error)
                showNotification('Error deleting product', 'error')
            }
        }
    }

    const handleRunCron = async () => {
        try {
            showNotification('Running recommendation cron job...', 'success');
            const res = await api.post('/api/admin/recommendations/run');
            console.log('Cron result:', res.data);
            showNotification('Recommendation cron job completed!', 'success');
        } catch (error) {
            console.error('Cron error:', error);
            showNotification('Error running cron: ' + (error.response?.data?.message || error.message), 'error');
        }
    };

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
                <div style={{display: 'flex', gap: '10px'}}>
                    <button
                        className="add-product-btn"
                        onClick={handleRunCron}
                        style={{background: '#38a169'}}
                    >
                        🔄 Run Recommendations
                    </button>
                    <button
                        className="add-product-btn"
                        onClick={() => setShowForm(!showForm)}
                    >
                        <Package size={20} />
                        {showForm ? 'Cancel' : 'Add Product'}
                    </button>
                </div>
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

                            <div className="form-group">
                                <label>Pinned Recommend IDs</label>
                                <input
                                    type="text"
                                    name="pinned"
                                    value={formData.pinned}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 102, 105"
                                />
                                <small style={{fontSize: '10px', color: '#718096'}}>Comma-separated Product IDs</small>
                            </div>
                            
                            <div className="form-group">
                                <label>Exclude Recommend IDs</label>
                                <input
                                    type="text"
                                    name="excluded"
                                    value={formData.excluded}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 103"
                                />
                                <small style={{fontSize: '10px', color: '#718096'}}>Comma-separated Product IDs</small>
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
                <h2>All Products ({pagination.total || products.length})</h2>
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
                                        <td className="product-price">{parseFloat(product.price).toFixed(2)} <small>EGP</small></td>
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

                        {/* Pagination Controls */}
                        {pagination.pages > 1 && (
                            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px', padding: '20px 0' }}>
                                <button 
                                    onClick={() => fetchProducts(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    style={{ 
                                        padding: '8px 16px', 
                                        borderRadius: '6px', 
                                        background: pagination.page <= 1 ? '#e2e8f0' : '#4f46e5', 
                                        color: pagination.page <= 1 ? '#a0aec0' : 'white', 
                                        border: 'none', 
                                        cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                                        fontWeight: '500',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{ display: 'flex', alignItems: 'center', fontWeight: '500', color: '#4a5568' }}>
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button 
                                    onClick={() => fetchProducts(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.pages}
                                    style={{ 
                                        padding: '8px 16px', 
                                        borderRadius: '6px', 
                                        background: pagination.page >= pagination.pages ? '#e2e8f0' : '#4f46e5', 
                                        color: pagination.page >= pagination.pages ? '#a0aec0' : 'white', 
                                        border: 'none', 
                                        cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
                                        fontWeight: '500',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Products
