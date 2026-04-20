import { useState, useEffect } from 'react';
import { adminService, categoryService } from '../../services/api';

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    discountedPrice: '',
    quantity: '',
    category: '',
    brand: '',
    images: [],
    features: [],
    isActive: true,
    isFeatured: false,
    isPrime: false,
    variants: [],
  });
  const [imageUrl, setImageUrl] = useState('');
  const [featureText, setFeatureText] = useState('');
  const [variantName, setVariantName] = useState('');
  const [variantValue, setVariantValue] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantStock, setVariantStock] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch products and categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        adminService.getAllProducts(1, 100),
        categoryService.getAll(),
      ]);
      
      if (productsRes.success) {
        setProducts(productsRes.products || []);
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category?._id === selectedCategory || p.category === selectedCategory);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add image to product
  const addImage = () => {
    if (imageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, { url: imageUrl, isMain: prev.images.length === 0 }]
      }));
      setImageUrl('');
    }
  };

  // Remove image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Set main image
  const setMainImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isMain: i === index
      }))
    }));
  };

  // Add feature
  const addFeature = () => {
    if (featureText.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureText]
      }));
      setFeatureText('');
    }
  };

  // Remove feature
  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Add variant
  const addVariant = () => {
    if (variantName && variantValue) {
      setFormData(prev => ({
        ...prev,
        variants: [...prev.variants, {
          name: variantName,
          value: variantValue,
          priceAdjustment: parseFloat(variantPrice) || 0,
          stock: parseInt(variantStock) || 0,
        }]
      }));
      setVariantName('');
      setVariantValue('');
      setVariantPrice('');
      setVariantStock('');
    }
  };

  // Remove variant
  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // Open modal for add/edit
  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price,
        discountedPrice: product.discountedPrice || '',
        quantity: product.quantity,
        category: product.category?._id || product.category,
        brand: product.brand || '',
        images: product.images || [],
        features: product.features || [],
        isActive: product.isActive !== false,
        isFeatured: product.isFeatured || false,
        isPrime: product.isPrime || false,
        variants: product.variants || [],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        shortDescription: '',
        price: '',
        discountedPrice: '',
        quantity: '',
        category: '',
        brand: '',
        images: [],
        features: [],
        isActive: true,
        isFeatured: false,
        isPrime: false,
        variants: [],
      });
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setMessage({ type: '', text: '' });
    setImageUrl('');
    setFeatureText('');
    setVariantName('');
    setVariantValue('');
    setVariantPrice('');
    setVariantStock('');
  };

  // Save product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Product name is required' });
      return;
    }
    if (!formData.price) {
      setMessage({ type: 'error', text: 'Price is required' });
      return;
    }
    if (!formData.category) {
      setMessage({ type: 'error', text: 'Category is required' });
      return;
    }

    try {
      let res;
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null,
        quantity: parseInt(formData.quantity) || 0,
      };
      
      if (editingProduct) {
        res = await adminService.updateProduct(editingProduct._id, productData);
      } else {
        res = await adminService.createProduct(productData);
      }
      
      if (res.success) {
        setMessage({ type: 'success', text: `Product ${editingProduct ? 'updated' : 'created'} successfully!` });
        fetchData();
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
    }
  };

  // Delete product
  const handleDelete = async (product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) return;
    
    try {
      const res = await adminService.deleteProduct(product._id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Product deleted successfully!' });
        fetchData();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
    }
  };

  // Toggle product status
  const toggleActive = async (product) => {
    try {
      await adminService.updateProduct(product._id, { isActive: !product.isActive });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Product Management</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#00A9B0] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors flex items-center gap-2"
        >
          <i className="bi bi-plus-lg"></i> Add Product
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Category</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-[#00A9B0] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat._id 
                  ? 'bg-[#00A9B0] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name} ({products.filter(p => p.category?._id === cat._id || p.category === cat._id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Image</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <img 
                    src={product.images?.[0]?.url || 'https://picsum.photos/50/50'} 
                    alt={product.name} 
                    className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-800 line-clamp-2 max-w-[200px] block">
                    {product.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">{product.category?.name || 'N/A'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-[#00A9B0]">${product.price}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm ${product.quantity < 10 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                    {product.quantity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(product)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      product.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => openModal(product)}
                      className="text-[#00A9B0] hover:underline text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="text-red-500 hover:underline text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={closeModal}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <i className="bi bi-x-lg text-gray-500"></i>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="e.g., Nike, Samsung, Gucci"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Discounted Price</label>
                    <input
                      type="number"
                      name="discountedPrice"
                      value={formData.discountedPrice}
                      onChange={handleChange}
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    placeholder="Brief product description (max 300 chars)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Detailed product description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent resize-none"
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Images</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Enter image URL"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addImage}
                      className="bg-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Add Image
                    </button>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                        {!img.isMain && (
                          <button
                            type="button"
                            onClick={() => setMainImage(idx)}
                            className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Main
                          </button>
                        )}
                        {img.isMain && (
                          <span className="absolute top-0 left-0 bg-[#00A9B0] text-white text-xs px-2 py-0.5 rounded-tl-lg rounded-br-lg">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {formData.images.length === 0 && (
                    <p className="text-sm text-gray-400 mt-2">No images added. Add at least one image.</p>
                  )}
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Features</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={featureText}
                      onChange={(e) => setFeatureText(e.target.value)}
                      placeholder="e.g., Premium quality material"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="bg-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Add Feature
                    </button>
                  </div>
                  <div className="space-y-1">
                    {formData.features.map((feature, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">• {feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(idx)}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variants */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Variants (Color, Size, etc.)</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <input
                      type="text"
                      value={variantName}
                      onChange={(e) => setVariantName(e.target.value)}
                      placeholder="Name (color/size)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={variantValue}
                      onChange={(e) => setVariantValue(e.target.value)}
                      placeholder="Value (Red/Large)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={variantPrice}
                      onChange={(e) => setVariantPrice(e.target.value)}
                      placeholder="Price Adj"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={variantStock}
                      onChange={(e) => setVariantStock(e.target.value)}
                      placeholder="Stock"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="bg-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors mb-3"
                  >
                    + Add Variant
                  </button>
                  
                  {formData.variants.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Name</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Value</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Price Adj</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Stock</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {formData.variants.map((variant, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2">{variant.name}</td>
                              <td className="px-3 py-2">{variant.value}</td>
                              <td className="px-3 py-2">${variant.priceAdjustment}</td>
                              <td className="px-3 py-2">{variant.stock}</td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeVariant(idx)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Status Toggles */}
                <div className="flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 rounded accent-[#00A9B0]"
                    />
                    <span className="text-sm text-gray-700">Active (visible to customers)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                      className="w-4 h-4 rounded accent-[#00A9B0]"
                    />
                    <span className="text-sm text-gray-700">Featured on Homepage</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPrime"
                      checked={formData.isPrime}
                      onChange={handleChange}
                      className="w-4 h-4 rounded accent-[#00A9B0]"
                    />
                    <span className="text-sm text-gray-700">VIP Exclusive</span>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-[#00A9B0] text-white py-2.5 rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductManager;