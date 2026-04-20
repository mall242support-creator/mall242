import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import { SafeHelmet } from '../components/common/SafeHelmet';

const UserSettings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    bio: '',
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Address Form
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    street: '',
    city: '',
    island: 'New Providence',
    postalCode: '',
    phone: '',
    isDefault: false,
  });

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    type: 'card',
    last4: '',
    brand: '',
    expiryMonth: '',
    expiryYear: '',
    isDefault: false,
  });

  // Notification Preferences
  const [preferences, setPreferences] = useState({
    newsletter: true,
    marketingEmails: true,
    orderUpdates: true,
    promotionalSms: false,
  });

  const islands = [
    'New Providence',
    'Grand Bahama',
    'Abaco',
    'Eleuthera',
    'Exuma',
    'Long Island',
    'Andros',
    'Cat Island',
  ];

  // Fetch user data
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await authService.getMe();
      if (res.success) {
        setUser(res.data);
        setProfileForm({
          name: res.data.name || '',
          phone: res.data.phone || '',
          bio: res.data.bio || '',
        });
        setAddresses(res.data.addresses || []);
        setPaymentMethods(res.data.paymentMethods || []);
        setPreferences(res.data.preferences || {
          newsletter: true,
          marketingEmails: true,
          orderUpdates: true,
          promotionalSms: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await authService.updateProfile(profileForm);
      if (res.success) {
        setUser(res.data);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  // Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setSaving(false);
      return;
    }

    try {
      const res = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Password change failed' });
    } finally {
      setSaving(false);
    }
  };

  // Add/Edit Address
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let updatedAddresses;
      if (editingAddress) {
        updatedAddresses = addresses.map(addr =>
          addr._id === editingAddress._id ? { ...addressForm, _id: addr._id } : addr
        );
      } else {
        updatedAddresses = [...addresses, { ...addressForm, _id: Date.now().toString() }];
      }

      // Ensure only one default address
      if (addressForm.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({
          ...addr,
          isDefault: addr._id === (editingAddress?._id || addressForm._id),
        }));
      }

      // In a real app, you'd call an API endpoint
      // const res = await authService.updateAddresses(updatedAddresses);
      
      setAddresses(updatedAddresses);
      setMessage({ type: 'success', text: `Address ${editingAddress ? 'updated' : 'added'} successfully!` });
      setShowAddressModal(false);
      resetAddressForm();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save address' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = (addressId) => {
    if (confirm('Are you sure you want to delete this address?')) {
      setAddresses(addresses.filter(addr => addr._id !== addressId));
      setMessage({ type: 'success', text: 'Address deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Set Default Address
  const setDefaultAddress = (addressId) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr._id === addressId,
    })));
    setMessage({ type: 'success', text: 'Default address updated!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Add Payment Method
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let updatedPayments;
      if (paymentForm.last4.length === 4) {
        updatedPayments = [...paymentMethods, { ...paymentForm, _id: Date.now().toString() }];
        
        if (paymentForm.isDefault) {
          updatedPayments = updatedPayments.map(pm => ({
            ...pm,
            isDefault: pm._id === updatedPayments[updatedPayments.length - 1]._id,
          }));
        }
        
        setPaymentMethods(updatedPayments);
        setMessage({ type: 'success', text: 'Payment method added successfully!' });
        setShowPaymentModal(false);
        resetPaymentForm();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Please enter the last 4 digits of your card' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add payment method' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Payment Method
  const handleDeletePayment = (paymentId) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      setPaymentMethods(paymentMethods.filter(pm => pm._id !== paymentId));
      setMessage({ type: 'success', text: 'Payment method removed!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Update Preferences
  const handlePreferenceUpdate = async (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    // In a real app, call API to save
    setMessage({ type: 'success', text: 'Preferences updated!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  // Reset forms
  const resetAddressForm = () => {
    setAddressForm({
      fullName: '',
      street: '',
      city: '',
      island: 'New Providence',
      postalCode: '',
      phone: '',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      type: 'card',
      last4: '',
      brand: '',
      expiryMonth: '',
      expiryYear: '',
      isDefault: false,
    });
  };

  const openAddressModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        fullName: address.fullName,
        street: address.street,
        city: address.city,
        island: address.island,
        postalCode: address.postalCode,
        phone: address.phone,
        isDefault: address.isDefault,
      });
    } else {
      resetAddressForm();
    }
    setShowAddressModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
<Helmet>
  <title>Settings | Mall242</title>
</Helmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <Link to="/account" className="text-[#00A9B0] hover:underline text-sm">
              <i className="bi bi-arrow-left mr-1"></i> Back to Dashboard
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-24">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === 'profile' ? 'bg-[#00A9B0]/10 text-[#00A9B0] border-l-4 border-[#00A9B0]' : 'hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-person text-lg"></i>
                  <span>Profile Information</span>
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === 'addresses' ? 'bg-[#00A9B0]/10 text-[#00A9B0] border-l-4 border-[#00A9B0]' : 'hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-geo-alt text-lg"></i>
                  <span>Address Book</span>
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === 'payments' ? 'bg-[#00A9B0]/10 text-[#00A9B0] border-l-4 border-[#00A9B0]' : 'hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-credit-card text-lg"></i>
                  <span>Payment Methods</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === 'security' ? 'bg-[#00A9B0]/10 text-[#00A9B0] border-l-4 border-[#00A9B0]' : 'hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-shield-lock text-lg"></i>
                  <span>Security</span>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === 'notifications' ? 'bg-[#00A9B0]/10 text-[#00A9B0] border-l-4 border-[#00A9B0]' : 'hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-bell text-lg"></i>
                  <span>Notifications</span>
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Message Alert */}
              {message.text && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold mb-4">Profile Information</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+1-242-555-0123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Bio (Optional)</label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows="3"
                        placeholder="Tell us a little about yourself"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#00A9B0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Address Book</h2>
                    <button
                      onClick={() => openAddressModal()}
                      className="text-[#00A9B0] text-sm hover:underline flex items-center gap-1"
                    >
                      <i className="bi bi-plus-lg"></i> Add New Address
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="bi bi-geo-alt text-5xl text-gray-300 mb-3 block"></i>
                      <p className="text-gray-500">No saved addresses yet</p>
                      <button
                        onClick={() => openAddressModal()}
                        className="mt-3 text-[#00A9B0] hover:underline text-sm"
                      >
                        Add your first address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div key={addr._id} className="border border-gray-200 rounded-lg p-4 relative">
                          {addr.isDefault && (
                            <span className="absolute top-2 right-2 text-xs bg-[#00A9B0]/10 text-[#00A9B0] px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                          <p className="font-semibold">{addr.fullName}</p>
                          <p className="text-sm text-gray-600 mt-1">{addr.street}</p>
                          <p className="text-sm text-gray-600">{addr.city}, {addr.island}</p>
                          <p className="text-sm text-gray-600">{addr.postalCode}</p>
                          <p className="text-sm text-gray-600">Phone: {addr.phone}</p>
                          <div className="flex gap-3 mt-3">
                            <button
                              onClick={() => openAddressModal(addr)}
                              className="text-sm text-[#00A9B0] hover:underline"
                            >
                              Edit
                            </button>
                            {!addr.isDefault && (
                              <button
                                onClick={() => setDefaultAddress(addr._id)}
                                className="text-sm text-gray-500 hover:underline"
                              >
                                Set as Default
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAddress(addr._id)}
                              className="text-sm text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Methods Tab */}
              {activeTab === 'payments' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Payment Methods</h2>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="text-[#00A9B0] text-sm hover:underline flex items-center gap-1"
                    >
                      <i className="bi bi-plus-lg"></i> Add Payment Method
                    </button>
                  </div>

                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="bi bi-credit-card text-5xl text-gray-300 mb-3 block"></i>
                      <p className="text-gray-500">No saved payment methods</p>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="mt-3 text-[#00A9B0] hover:underline text-sm"
                      >
                        Add your first payment method
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map((pm) => (
                        <div key={pm._id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <i className={`bi ${pm.brand === 'Visa' ? 'bi-credit-card' : 'bi-paypal'} text-2xl text-[#00A9B0]`}></i>
                            <div>
                              <p className="font-semibold capitalize">{pm.brand || pm.type}</p>
                              <p className="text-sm text-gray-500">•••• {pm.last4}</p>
                              <p className="text-xs text-gray-400">Expires {pm.expiryMonth}/{pm.expiryYear}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            {pm.isDefault && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default</span>
                            )}
                            <button
                              onClick={() => handleDeletePayment(pm._id)}
                              className="text-red-500 hover:underline text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold mb-4">Change Password</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#00A9B0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold mb-3">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your account</p>
                    <button className="text-[#00A9B0] text-sm hover:underline">
                      Enable 2FA →
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold mb-4">Notification Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div>
                        <p className="font-semibold">Newsletter</p>
                        <p className="text-sm text-gray-500">Receive weekly updates about new products and deals</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.newsletter}
                          onChange={(e) => handlePreferenceUpdate('newsletter', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00A9B0]/25 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A9B0]"></div>
                      </label>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div>
                        <p className="font-semibold">Marketing Emails</p>
                        <p className="text-sm text-gray-500">Exclusive offers, promotions, and sales events</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketingEmails}
                          onChange={(e) => handlePreferenceUpdate('marketingEmails', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00A9B0]/25 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A9B0]"></div>
                      </label>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div>
                        <p className="font-semibold">Order Updates</p>
                        <p className="text-sm text-gray-500">Order confirmations, shipping updates, and delivery notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.orderUpdates}
                          onChange={(e) => handlePreferenceUpdate('orderUpdates', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00A9B0]/25 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A9B0]"></div>
                      </label>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <div>
                        <p className="font-semibold">Promotional SMS</p>
                        <p className="text-sm text-gray-500">Text message alerts for flash sales and exclusive deals</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.promotionalSms}
                          onChange={(e) => handlePreferenceUpdate('promotionalSms', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00A9B0]/25 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A9B0]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddressModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                <button onClick={() => setShowAddressModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Street Address</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">City</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Island</label>
                    <select
                      value={addressForm.island}
                      onChange={(e) => setAddressForm({ ...addressForm, island: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    >
                      {islands.map(island => (
                        <option key={island} value={island}>{island}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Phone</label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefaultAddress"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 accent-[#00A9B0]"
                  />
                  <label htmlFor="isDefaultAddress" className="text-sm text-gray-700">Set as default address</label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#00A9B0] text-white py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
                >
                  {saving ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowPaymentModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Add Payment Method</h3>
                <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Card Type</label>
                  <select
                    value={paymentForm.brand}
                    onChange={(e) => setPaymentForm({ ...paymentForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  >
                    <option value="">Select Card Type</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                    <option value="Discover">Discover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Last 4 Digits</label>
                  <input
                    type="text"
                    value={paymentForm.last4}
                    onChange={(e) => setPaymentForm({ ...paymentForm, last4: e.target.value.slice(0, 4) })}
                    maxLength="4"
                    pattern="[0-9]{4}"
                    required
                    placeholder="1234"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Expiry Month</label>
                    <select
                      value={paymentForm.expiryMonth}
                      onChange={(e) => setPaymentForm({ ...paymentForm, expiryMonth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    >
                      <option value="">Month</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Expiry Year</label>
                    <select
                      value={paymentForm.expiryYear}
                      onChange={(e) => setPaymentForm({ ...paymentForm, expiryYear: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefaultPayment"
                    checked={paymentForm.isDefault}
                    onChange={(e) => setPaymentForm({ ...paymentForm, isDefault: e.target.checked })}
                    className="w-4 h-4 accent-[#00A9B0]"
                  />
                  <label htmlFor="isDefaultPayment" className="text-sm text-gray-700">Set as default payment method</label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#00A9B0] text-white py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
                >
                  {saving ? 'Adding...' : 'Add Payment Method'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default UserSettings;