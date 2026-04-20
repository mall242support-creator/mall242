import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';

const HeroManager = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    mobileImage: '',
    ctaText: 'Shop Now',
    ctaLink: '/products',
    displayOrder: 0,
    isActive: true,
    buttonColor: '#FFC72C',
    textColor: 'white',
  });

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllHeroSlides();
      if (res.success) {
        setSlides(res.slides || []);
      }
    } catch (error) {
      console.error('Failed to fetch hero slides:', error);
      setMessage({ type: 'error', text: 'Failed to load hero slides' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openModal = (slide = null) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData({
        title: slide.title,
        subtitle: slide.subtitle || '',
        image: slide.image,
        mobileImage: slide.mobileImage || '',
        ctaText: slide.ctaText || 'Shop Now',
        ctaLink: slide.ctaLink || '/products',
        displayOrder: slide.displayOrder || 0,
        isActive: slide.isActive !== false,
        buttonColor: slide.buttonColor || '#FFC72C',
        textColor: slide.textColor || 'white',
      });
    } else {
      setEditingSlide(null);
      setFormData({
        title: '',
        subtitle: '',
        image: '',
        mobileImage: '',
        ctaText: 'Shop Now',
        ctaLink: '/products',
        displayOrder: slides.length,
        isActive: true,
        buttonColor: '#FFC72C',
        textColor: 'white',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSlide(null);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }
    if (!formData.image.trim()) {
      setMessage({ type: 'error', text: 'Image URL is required' });
      return;
    }

    try {
      let res;
      if (editingSlide) {
        res = await adminService.updateHeroSlide(editingSlide._id, formData);
      } else {
        res = await adminService.createHeroSlide(formData);
      }
      
      if (res.success) {
        setMessage({ type: 'success', text: `Slide ${editingSlide ? 'updated' : 'created'} successfully!` });
        fetchSlides();
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
    }
  };

  const handleDelete = async (slide) => {
    if (!confirm(`Are you sure you want to delete "${slide.title}"?`)) return;
    
    try {
      const res = await adminService.deleteHeroSlide(slide._id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Slide deleted successfully!' });
        fetchSlides();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
    }
  };

  const toggleActive = async (slide) => {
    try {
      await adminService.updateHeroSlide(slide._id, { isActive: !slide.isActive });
      fetchSlides();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const updateOrder = async (slideId, newOrder) => {
    const updatedSlides = slides.map(s => {
      if (s._id === slideId) return { ...s, displayOrder: newOrder };
      return s;
    });
    setSlides(updatedSlides);
    
    // Reorder all slides
    const reorderData = updatedSlides.map((s, idx) => ({
      id: s._id,
      displayOrder: idx
    }));
    
    try {
      await adminService.reorderHeroSlides(reorderData);
    } catch (error) {
      console.error('Failed to reorder:', error);
      fetchSlides(); // Refresh on error
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
        <h2 className="text-xl font-bold text-gray-800">Hero Banner Management</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#00A9B0] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors flex items-center gap-2"
        >
          <i className="bi bi-plus-lg"></i> Add Slide
        </button>
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

      {/* Slides List */}
      <div className="space-y-4">
        {slides.map((slide, idx) => (
          <div key={slide._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex gap-4">
              <img 
                src={slide.image} 
                alt={slide.title} 
                className="w-32 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-800">{slide.title}</h3>
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      slide.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {slide.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">{slide.subtitle}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Order:</label>
                    <select
                      value={idx}
                      onChange={(e) => updateOrder(slide._id, parseInt(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {slides.map((_, i) => (
                        <option key={i} value={i}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => openModal(slide)}
                    className="text-[#00A9B0] hover:underline text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(slide)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">Link: {slide.ctaLink}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length === 0 && (
        <div className="text-center py-12">
          <i className="bi bi-images text-5xl text-gray-300 mb-3 block"></i>
          <p className="text-gray-500">No hero slides yet. Click "Add Slide" to create one.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={closeModal}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingSlide ? 'Edit Slide' : 'Add New Slide'}
              </h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <i className="bi bi-x-lg text-gray-500"></i>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Biggest Sale of the Year"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    placeholder="e.g., Up to 50% off on electronics"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Image URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://example.com/hero-image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    required
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Image URL</label>
                  <input
                    type="text"
                    name="mobileImage"
                    value={formData.mobileImage}
                    onChange={handleChange}
                    placeholder="https://example.com/mobile-hero.jpg (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">CTA Text</label>
                    <input
                      type="text"
                      name="ctaText"
                      value={formData.ctaText}
                      onChange={handleChange}
                      placeholder="Shop Now"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">CTA Link</label>
                    <input
                      type="text"
                      name="ctaLink"
                      value={formData.ctaLink}
                      onChange={handleChange}
                      placeholder="/products"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Button Color</label>
                    <input
                      type="color"
                      name="buttonColor"
                      value={formData.buttonColor}
                      onChange={handleChange}
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Text Color</label>
                    <select
                      name="textColor"
                      value={formData.textColor}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    >
                      <option value="white">White</option>
                      <option value="black">Black</option>
                      <option value="#00A9B0">Teal</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
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
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#00A9B0] text-white py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
                  >
                    {editingSlide ? 'Update Slide' : 'Create Slide'}
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

export default HeroManager;