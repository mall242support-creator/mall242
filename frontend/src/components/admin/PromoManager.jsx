import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';

const PromoManager = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    discountCode: '',
    startDate: '',
    endDate: '',
    isActive: true,
    showOncePerSession: true,
    delaySeconds: 3,
    backgroundColor: '#00A9B0',
    textColor: '#ffffff',
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllPromos();
      if (res.success) {
        setPromos(res.promos || []);
      }
    } catch (error) {
      console.error('Failed to fetch promos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        title: promo.title,
        description: promo.description,
        image: promo.image || '',
        buttonText: promo.buttonText || 'Shop Now',
        buttonLink: promo.buttonLink || '/products',
        discountCode: promo.discountCode || '',
        startDate: promo.startDate?.split('T')[0] || '',
        endDate: promo.endDate?.split('T')[0] || '',
        isActive: promo.isActive !== false,
        showOncePerSession: promo.showOncePerSession !== false,
        delaySeconds: promo.delaySeconds || 3,
        backgroundColor: promo.backgroundColor || '#00A9B0',
        textColor: promo.textColor || '#ffffff',
      });
    } else {
      setEditingPromo(null);
      setFormData({
        title: '',
        description: '',
        image: '',
        buttonText: 'Shop Now',
        buttonLink: '/products',
        discountCode: '',
        startDate: '',
        endDate: '',
        isActive: true,
        showOncePerSession: true,
        delaySeconds: 3,
        backgroundColor: '#00A9B0',
        textColor: '#ffffff',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      let res;
      if (editingPromo) {
        res = await adminService.updatePromo(editingPromo._id, formData);
      } else {
        res = await adminService.createPromo(formData);
      }
      
      if (res.success) {
        setMessage({ type: 'success', text: `Promo ${editingPromo ? 'updated' : 'created'} successfully!` });
        fetchPromos();
        setTimeout(() => {
          setShowModal(false);
          setMessage({ type: '', text: '' });
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
    }
  };

  const handleDelete = async (promo) => {
    if (!confirm(`Are you sure you want to delete "${promo.title}"?`)) return;
    
    try {
      const res = await adminService.deletePromo(promo._id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Promo deleted successfully!' });
        fetchPromos();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Promo Popup Management</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#00A9B0] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors flex items-center gap-2"
        >
          <i className="bi bi-plus-lg"></i> Create Promo
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {promos.length === 0 ? (
        <div className="text-center py-12">
          <i className="bi bi-megaphone text-5xl text-gray-300 mb-3 block"></i>
          <p className="text-gray-500">No promo popups created yet</p>
          <button onClick={() => openModal()} className="mt-3 text-[#00A9B0] hover:underline">
            Create your first promo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {promos.map((promo) => (
            <div key={promo._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex gap-4">
                {promo.image && (
                  <img src={promo.image} alt={promo.title} className="w-24 h-24 object-cover rounded-lg" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{promo.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      promo.isActive && new Date(promo.endDate) > new Date() 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {promo.isActive && new Date(promo.endDate) > new Date() ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{promo.description}</p>
                  {promo.discountCode && (
                    <p className="text-xs font-mono text-[#00A9B0] mt-1">Code: {promo.discountCode}</p>
                  )}
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => openModal(promo)} className="text-[#00A9B0] hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(promo)} className="text-red-500 hover:underline text-sm">Delete</button>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>Valid: {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingPromo ? 'Edit Promo' : 'Create New Promo'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Code (optional)</label>
                  <input
                    type="text"
                    name="discountCode"
                    value={formData.discountCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                />
                {formData.image && <img src={formData.image} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    name="buttonText"
                    value={formData.buttonText}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Button Link</label>
                  <input
                    type="text"
                    name="buttonLink"
                    value={formData.buttonLink}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Background Color</label>
                  <input
                    type="color"
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Text Color</label>
                  <input
                    type="color"
                    name="textColor"
                    value={formData.textColor}
                    onChange={handleChange}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Delay (seconds)</label>
                  <input
                    type="number"
                    name="delaySeconds"
                    value={formData.delaySeconds}
                    onChange={handleChange}
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
                <div className="flex items-center gap-4 pt-7">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#00A9B0]"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showOncePerSession"
                      checked={formData.showOncePerSession}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#00A9B0]"
                    />
                    <span className="text-sm text-gray-700">Show once per session</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#00A9B0] text-white py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
                >
                  {editingPromo ? 'Update Promo' : 'Create Promo'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default PromoManager;