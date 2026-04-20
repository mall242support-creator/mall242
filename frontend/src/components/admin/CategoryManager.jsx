import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'bi-grid',
    image: '',
    bannerImage: '',
    displayOrder: 0,
    isActive: true,
    isFeatured: false,
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      // You'll need to add this endpoint to adminService
      const res = await adminService.getAllCategories();
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setMessage({ type: 'error', text: 'Failed to load categories' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Open modal for add/edit
  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || 'bi-grid',
        image: category.image || '',
        bannerImage: category.bannerImage || '',
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive !== false,
        isFeatured: category.isFeatured || false,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        icon: 'bi-grid',
        image: '',
        bannerImage: '',
        displayOrder: 0,
        isActive: true,
        isFeatured: false,
      });
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setMessage({ type: '', text: '' });
  };

  // Save category
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Category name is required' });
      return;
    }

    try {
      let res;
      if (editingCategory) {
        res = await adminService.updateCategory(editingCategory._id, formData);
      } else {
        res = await adminService.createCategory(formData);
      }
      
      if (res.success) {
        setMessage({ type: 'success', text: `Category ${editingCategory ? 'updated' : 'created'} successfully!` });
        fetchCategories();
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
    }
  };

  // Delete category
  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) return;
    
    try {
      const res = await adminService.deleteCategory(category._id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Category deleted successfully!' });
        fetchCategories();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
    }
  };

  // Toggle category active status
  const toggleActive = async (category) => {
    try {
      await adminService.updateCategory(category._id, { isActive: !category.isActive });
      fetchCategories();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  // Available icons for categories
  const iconOptions = [
    'bi-grid', 'bi-bag', 'bi-bicycle', 'bi-handbag', 'bi-door-open', 
    'bi-phone', 'bi-house', 'bi-person', 'bi-shoe', 'bi-tag', 
    'bi-star', 'bi-gem', 'bi-gift', 'bi-book', 'bi-cup-straw'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Category Management</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#00A9B0] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors flex items-center gap-2"
        >
          <i className="bi bi-plus-lg"></i> Add Category
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Icon</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Slug</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Display Order</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Featured</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <i className={`${category.icon || 'bi-grid'} text-xl text-[#00A9B0]`}></i>
                  </td>
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{category.slug}</td>
                  <td className="px-4 py-3 text-sm">{category.displayOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(category)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        category.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {category.isFeatured ? (
                      <i className="bi bi-star-fill text-yellow-500"></i>
                    ) : (
                      <i className="bi bi-star text-gray-300"></i>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(category)}
                        className="text-[#00A9B0] hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-red-500 hover:underline text-sm"
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={closeModal}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button onClick={closeModal} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Name */}
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Electronics"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Category description for SEO"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`p-2 rounded-lg border ${
                          formData.icon === icon ? 'border-[#00A9B0] bg-[#00A9B0]/10' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <i className={`${icon} text-xl ${formData.icon === icon ? 'text-[#00A9B0]' : 'text-gray-600'}`}></i>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Image URL</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://example.com/category-image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg" />
                  )}
                </div>

                {/* Banner Image URL */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    name="bannerImage"
                    value={formData.bannerImage}
                    onChange={handleChange}
                    placeholder="https://example.com/banner-image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>

                {/* Status Toggles */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#00A9B0]"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#00A9B0]"
                    />
                    <span className="text-sm">Featured on Homepage</span>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#00A9B0] text-white py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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

export default CategoryManager;