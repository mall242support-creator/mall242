import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';

const MysteryDropManager = () => {
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDrop, setEditingDrop] = useState(null);
  const [selectedDrop, setSelectedDrop] = useState(null);
  const [showSignupsModal, setShowSignupsModal] = useState(false);
  const [signups, setSignups] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    brandName: '',
    clue: '',
    description: '',
    blurredImageUrl: '',
    revealImageUrl: '',
    brandLogoUrl: '',
    bannerUrl: '',
    revealDate: '',
    emailHint: '',
    emailSubject: '',
    vipEarlyAccess: true,
    vipEarlyAccessHours: 24,
    deals: [],
    isActive: true,
    isFeatured: false,
  });
  const [dealForm, setDealForm] = useState({
    title: '',
    description: '',
    discountPercent: '',
    discountCode: '',
    validUntil: '',
    productLink: '',
  });

  useEffect(() => {
    fetchDrops();
  }, []);

  const fetchDrops = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllMysteryDrops();
      if (res.success) {
        setDrops(res.mysteryDrops || []);
      }
    } catch (error) {
      console.error('Failed to fetch mystery drops:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignups = async (dropId) => {
    try {
      const res = await adminService.getMysteryDropSignups(dropId);
      if (res.success) {
        setSignups(res.signups || []);
      }
    } catch (error) {
      console.error('Failed to fetch signups:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addDeal = () => {
    if (dealForm.title && dealForm.description) {
      setFormData(prev => ({
        ...prev,
        deals: [...prev.deals, { ...dealForm, _id: Date.now().toString() }]
      }));
      setDealForm({
        title: '',
        description: '',
        discountPercent: '',
        discountCode: '',
        validUntil: '',
        productLink: '',
      });
    }
  };

  const removeDeal = (index) => {
    setFormData(prev => ({
      ...prev,
      deals: prev.deals.filter((_, i) => i !== index)
    }));
  };

  const openModal = (drop = null) => {
    if (drop) {
      setEditingDrop(drop);
      setFormData({
        brandName: drop.brandName,
        clue: drop.clue,
        description: drop.description || '',
        blurredImageUrl: drop.blurredImageUrl,
        revealImageUrl: drop.revealImageUrl,
        brandLogoUrl: drop.brandLogoUrl || '',
        bannerUrl: drop.bannerUrl || '',
        revealDate: drop.revealDate?.split('T')[0] || '',
        emailHint: drop.emailHint || '',
        emailSubject: drop.emailSubject || '',
        vipEarlyAccess: drop.vipEarlyAccess !== false,
        vipEarlyAccessHours: drop.vipEarlyAccessHours || 24,
        deals: drop.deals || [],
        isActive: drop.isActive !== false,
        isFeatured: drop.isFeatured || false,
      });
    } else {
      setEditingDrop(null);
      setFormData({
        brandName: '',
        clue: '',
        description: '',
        blurredImageUrl: '',
        revealImageUrl: '',
        brandLogoUrl: '',
        bannerUrl: '',
        revealDate: '',
        emailHint: '',
        emailSubject: '',
        vipEarlyAccess: true,
        vipEarlyAccessHours: 24,
        deals: [],
        isActive: true,
        isFeatured: false,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      let res;
      if (editingDrop) {
        res = await adminService.updateMysteryDrop(editingDrop._id, formData);
      } else {
        res = await adminService.createMysteryDrop(formData);
      }
      
      if (res.success) {
        setMessage({ type: 'success', text: `Mystery drop ${editingDrop ? 'updated' : 'created'} successfully!` });
        fetchDrops();
        setTimeout(() => {
          setShowModal(false);
          setMessage({ type: '', text: '' });
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
    }
  };

  const handleReveal = async (drop) => {
    if (!confirm(`Reveal "${drop.brandName || drop.clue}" now? All signups will be notified.`)) return;
    
    try {
      const res = await adminService.revealMysteryDrop(drop._id);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        fetchDrops();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Reveal failed' });
    }
  };

  const handleDelete = async (drop) => {
    if (!confirm(`Are you sure you want to delete "${drop.brandName || drop.clue}"? This will also delete all signups.`)) return;
    
    try {
      const res = await adminService.deleteMysteryDrop(drop._id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Mystery drop deleted successfully!' });
        fetchDrops();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
    }
  };

  const viewSignups = async (drop) => {
    setSelectedDrop(drop);
    await fetchSignups(drop._id);
    setShowSignupsModal(true);
  };

  const exportSignups = async (dropId) => {
    window.open(`${import.meta.env.VITE_API_URL}/admin/mystery-drops/${dropId}/export`, '_blank');
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
        <h2 className="text-xl font-bold text-gray-800">Mystery Drop Management</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#00A9B0] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors flex items-center gap-2"
        >
          <i className="bi bi-plus-lg"></i> Create Mystery Drop
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {drops.length === 0 ? (
        <div className="text-center py-12">
          <i className="bi bi-question-circle text-5xl text-gray-300 mb-3 block"></i>
          <p className="text-gray-500">No mystery drops created yet</p>
          <button onClick={() => openModal()} className="mt-3 text-[#00A9B0] hover:underline">
            Create your first mystery drop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {drops.map((drop) => (
            <div key={drop._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex gap-4">
                <img 
                  src={drop.blurredImageUrl} 
                  alt={drop.brandName || 'Mystery'} 
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {drop.isRevealed ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Revealed: {drop.brandName}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                        Mystery
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      drop.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {drop.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {drop.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800">{drop.clue}</p>
                  <p className="text-sm text-gray-500 mt-1">{drop.description}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                    <span><i className="bi bi-calendar mr-1"></i>Reveal: {new Date(drop.revealDate).toLocaleDateString()}</span>
                    <span><i className="bi bi-envelope mr-1"></i>{drop.signupCount || 0} signups</span>
                    {drop.vipEarlyAccess && <span><i className="bi bi-gem mr-1"></i>VIP Early Access</span>}
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => openModal(drop)} className="text-[#00A9B0] hover:underline text-sm">Edit</button>
                    {!drop.isRevealed && (
                      <button onClick={() => handleReveal(drop)} className="text-green-600 hover:underline text-sm">Reveal Now</button>
                    )}
                    <button onClick={() => viewSignups(drop)} className="text-blue-600 hover:underline text-sm">View Signups</button>
                    <button onClick={() => exportSignups(drop._id)} className="text-gray-600 hover:underline text-sm">Export CSV</button>
                    <button onClick={() => handleDelete(drop)} className="text-red-500 hover:underline text-sm">Delete</button>
                  </div>
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
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingDrop ? 'Edit Mystery Drop' : 'Create New Mystery Drop'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Name (after reveal)</label>
                  <input
                    type="text"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reveal Date</label>
                  <input
                    type="datetime-local"
                    name="revealDate"
                    value={formData.revealDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Clue (shown before reveal)</label>
                <input
                  type="text"
                  name="clue"
                  value={formData.clue}
                  onChange={handleChange}
                  placeholder="e.g., The swoosh that changed the world..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Blurred Image URL</label>
                  <input
                    type="text"
                    name="blurredImageUrl"
                    value={formData.blurredImageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/blurred-brand.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    required
                  />
                  {formData.blurredImageUrl && (
                    <img src={formData.blurredImageUrl} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reveal Image URL</label>
                  <input
                    type="text"
                    name="revealImageUrl"
                    value={formData.revealImageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/brand-logo.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    required
                  />
                  {formData.revealImageUrl && (
                    <img src={formData.revealImageUrl} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Logo URL</label>
                  <input
                    type="text"
                    name="brandLogoUrl"
                    value={formData.brandLogoUrl}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Banner URL</label>
                  <input
                    type="text"
                    name="bannerUrl"
                    value={formData.bannerUrl}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Hint (optional)</label>
                <input
                  type="text"
                  name="emailHint"
                  value={formData.emailHint}
                  onChange={handleChange}
                  placeholder="e.g., Think red and white..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="vipEarlyAccess"
                    checked={formData.vipEarlyAccess}
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#00A9B0]"
                  />
                  <span className="text-sm text-gray-700">Enable VIP Early Access</span>
                </label>
                {formData.vipEarlyAccess && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Early Access Hours</label>
                    <input
                      type="number"
                      name="vipEarlyAccessHours"
                      value={formData.vipEarlyAccessHours}
                      onChange={handleChange}
                      min="1"
                      max="72"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    />
                  </div>
                )}
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#00A9B0]"
                  />
                  <span className="text-sm text-gray-700">Featured on Homepage</span>
                </label>
              </div>

              {/* Deals Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Deals (shown after reveal)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Deal Title"
                    value={dealForm.title}
                    onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={dealForm.description}
                    onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Discount %"
                    value={dealForm.discountPercent}
                    onChange={(e) => setDealForm({ ...dealForm, discountPercent: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Discount Code"
                    value={dealForm.discountCode}
                    onChange={(e) => setDealForm({ ...dealForm, discountCode: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Product Link"
                    value={dealForm.productLink}
                    onChange={(e) => setDealForm({ ...dealForm, productLink: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="date"
                    placeholder="Valid Until"
                    value={dealForm.validUntil}
                    onChange={(e) => setDealForm({ ...dealForm, validUntil: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={addDeal}
                  className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  + Add Deal
                </button>

                {formData.deals.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.deals.map((deal, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{deal.title}</p>
                          <p className="text-xs text-gray-500">{deal.description}</p>
                          {deal.discountCode && <p className="text-xs font-mono">Code: {deal.discountCode}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDeal(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#00A9B0] text-white py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
                >
                  {editingDrop ? 'Update Mystery Drop' : 'Create Mystery Drop'}
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

      {/* Signups Modal */}
      {showSignupsModal && selectedDrop && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowSignupsModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Signups for {selectedDrop.brandName || selectedDrop.clue}
              </h3>
              <button onClick={() => setShowSignupsModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="p-6">
              {signups.length === 0 ? (
                <div className="text-center py-8">
                  <i className="bi bi-envelope text-5xl text-gray-300 mb-3 block"></i>
                  <p className="text-gray-500">No signups yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Signed Up</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Notified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {signups.map((signup) => (
                      <tr key={signup._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{signup.email}</td>
                        <td className="px-4 py-3 text-sm">{signup.user?.name || 'Guest'}</td>
                        <td className="px-4 py-3 text-sm">{new Date(signup.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">
                          {signup.notified ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-yellow-600">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MysteryDropManager;