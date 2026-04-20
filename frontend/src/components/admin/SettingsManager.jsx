import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';

const SettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Mall242',
    siteDescription: 'Bahamas Premier Digital Mall',
    contactEmail: 'hello@mall242.com',
    contactPhone: '+1-242-555-0123',
    address: '123 Bay Street, Nassau, Bahamas',
    
    // Launch Settings
    launchDate: '2024-12-01',
    isEarlyAccessEnabled: true,
    isSiteLive: true,
    
    // Referral Settings
    referralExpiryDays: 30,
    vipThreshold: 10,
    
    // Mystery Drop Settings
    mysteryDropAutoReveal: true,
    mysteryDropRevealHour: 10,
    
    // Shipping Settings
    freeShippingThreshold: 50,
    baseShippingCost: 5.99,
    
    // Tax Settings
    taxRate: 7.5,
    
    // Email Settings
    senderEmail: 'hello@mall242.com',
    senderName: 'Mall242',
    
    // SEO Settings
    metaTitle: 'Mall242 - Bahamas Premier Digital Mall',
    metaDescription: 'Discover Mall242, the Bahamas premier online marketplace. Shop fashion, electronics, furniture, and more.',
    metaKeywords: 'mall242, bahamas shopping, online mall, ecommerce bahamas',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminService.getSettings();
      if (res.success) {
        setSettings(res.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use default settings if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await adminService.updateSettings(settings);
      if (res.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
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
      <h2 className="text-xl font-bold text-gray-800 mb-6">Site Settings</h2>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-building text-[#00A9B0]"></i>
            General Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Site Name</label>
              <input
                type="text"
                name="siteName"
                value={settings.siteName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Site Description</label>
              <input
                type="text"
                name="siteDescription"
                value={settings.siteDescription}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={settings.contactEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                name="contactPhone"
                value={settings.contactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={settings.address}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
          </div>
        </div>

        {/* Launch Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-rocket-takeoff text-[#00A9B0]"></i>
            Launch Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Launch Date</label>
              <input
                type="date"
                name="launchDate"
                value={settings.launchDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isEarlyAccessEnabled"
                  checked={settings.isEarlyAccessEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 accent-[#00A9B0]"
                />
                <span className="text-sm text-gray-700">Enable Early Access</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isSiteLive"
                  checked={settings.isSiteLive}
                  onChange={handleChange}
                  className="w-4 h-4 accent-[#00A9B0]"
                />
                <span className="text-sm text-gray-700">Site Live (Maintenance Mode)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Referral Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-share text-[#00A9B0]"></i>
            Referral Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Referral Expiry (days)</label>
              <input
                type="number"
                name="referralExpiryDays"
                value={settings.referralExpiryDays}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">VIP Threshold (referrals)</label>
              <input
                type="number"
                name="vipThreshold"
                value={settings.vipThreshold}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
          </div>
        </div>

        {/* Mystery Drop Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-question-circle text-[#00A9B0]"></i>
            Mystery Drop Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Auto Reveal Hour (UTC)</label>
              <input
                type="number"
                name="mysteryDropRevealHour"
                value={settings.mysteryDropRevealHour}
                onChange={handleChange}
                min="0"
                max="23"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="mysteryDropAutoReveal"
                  checked={settings.mysteryDropAutoReveal}
                  onChange={handleChange}
                  className="w-4 h-4 accent-[#00A9B0]"
                />
                <span className="text-sm text-gray-700">Auto Reveal Mystery Drops</span>
              </label>
            </div>
          </div>
        </div>

        {/* Shipping & Tax Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-truck text-[#00A9B0]"></i>
            Shipping & Tax Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Free Shipping Threshold ($)</label>
              <input
                type="number"
                name="freeShippingThreshold"
                value={settings.freeShippingThreshold}
                onChange={handleChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Base Shipping Cost ($)</label>
              <input
                type="number"
                name="baseShippingCost"
                value={settings.baseShippingCost}
                onChange={handleChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                name="taxRate"
                value={settings.taxRate}
                onChange={handleChange}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-envelope text-[#00A9B0]"></i>
            Email Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sender Email</label>
              <input
                type="email"
                name="senderEmail"
                value={settings.senderEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sender Name</label>
              <input
                type="text"
                name="senderName"
                value={settings.senderName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-graph-up text-[#00A9B0]"></i>
            SEO Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Title</label>
              <input
                type="text"
                name="metaTitle"
                value={settings.metaTitle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
              <textarea
                name="metaDescription"
                value={settings.metaDescription}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Keywords</label>
              <input
                type="text"
                name="metaKeywords"
                value={settings.metaKeywords}
                onChange={handleChange}
                placeholder="keyword1, keyword2, keyword3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#00A9B0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsManager;