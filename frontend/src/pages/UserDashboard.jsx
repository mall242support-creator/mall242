import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { authService, orderService, referralService } from '../services/api';
import { SafeHelmet } from '../components/common/SafeHelmet';

const UserDashboard = () => {
  const { cartCount } = useCart();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Get user profile
      const userRes = await authService.getMe();
      setUser(userRes.data);
      setFormData({
        name: userRes.data.name || '',
        email: userRes.data.email || '',
        phone: userRes.data.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setAddresses(userRes.data.addresses || []);
      
      // Get orders
      const ordersRes = await orderService.getUserOrders(1, 5);
      setOrders(ordersRes.orders || []);
      
      // Get referral stats
      const referralRes = await referralService.getStats();
      setReferralStats(referralRes.data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    try {
      const response = await authService.updateProfile({
        name: formData.name,
        phone: formData.phone,
      });
      setUser(response.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    try {
      await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Password change failed' });
    }
  };

  const quickActions = [
    { icon: 'bi-box-seam', label: 'Your Orders', link: '/orders', color: 'bg-blue-100 text-blue-600' },
    { icon: 'bi-geo-alt', label: 'Addresses', link: '#', onClick: () => setActiveTab('addresses'), color: 'bg-green-100 text-green-600' },
    { icon: 'bi-heart', label: 'Wish List', link: '/wishlist', color: 'bg-red-100 text-red-600' },
    { icon: 'bi-gem', label: 'VIP Rewards', link: '/referral', color: 'bg-purple-100 text-purple-600' },
    { icon: 'bi-star', label: 'Dream Mall', link: '/dream-mall', color: 'bg-yellow-100 text-yellow-600' },
    { icon: 'bi-cart', label: 'Cart', link: '/cart', color: 'bg-cyan-100 text-cyan-600' },
  ];

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
  <title>My Account | Mall242</title>
</Helmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Account</h1>
            <Link to="/settings" className="text-[#00A9B0] hover:underline text-sm">
              <i className="bi bi-gear mr-1"></i>
              Settings
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="lg:w-72 flex-shrink-0">
              {/* User Profile Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-[#00A9B0] to-[#FFC72C] rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <h2 className="font-bold text-lg">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                {user?.vipStatus && (
                  <div className="inline-flex items-center gap-1 mt-2 bg-gradient-to-r from-[#00A9B0] to-[#FFC72C] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    <i className="bi bi-gem text-xs"></i>
                    VIP Member
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Member since</p>
                  <p className="text-sm font-medium">{new Date(user?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === 'overview' ? 'bg-[#00A9B0]/10 text-[#00A9B0] border-l-4 border-[#00A9B0]' : 'hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-speedometer2 text-lg"></i>
                  <span>Overview</span>
                </button>
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
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === 'security' ? 'bg-[#00A9B0]/10 text-[#00A9B0] border-l-4 border-[#00A9B0]' : 'hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-shield-lock text-lg"></i>
                  <span>Login & Security</span>
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

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  {/* Quick Actions Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {quickActions.map((action) => (
                      action.onClick ? (
                        <button
                          key={action.label}
                          onClick={action.onClick}
                          className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow-md transition-all group"
                        >
                          <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                            <i className={`${action.icon} text-xl`}></i>
                          </div>
                          <span className="text-sm font-medium">{action.label}</span>
                        </button>
                      ) : (
                        <Link
                          key={action.label}
                          to={action.link}
                          className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow-md transition-all group"
                        >
                          <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                            <i className={`${action.icon} text-xl`}></i>
                          </div>
                          <span className="text-sm font-medium">{action.label}</span>
                        </Link>
                      )
                    ))}
                  </div>

                  {/* Referral Stats */}
                  {referralStats && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">VIP Rewards Status</h3>
                        <Link to="/referral" className="text-sm text-[#00A9B0] hover:underline">View Details →</Link>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#00A9B0]">{referralStats.stats?.totalSignups || 0}</div>
                          <div className="text-xs text-gray-500">Referrals</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#00A9B0]">{user?.rewardTier || 0}/4</div>
                          <div className="text-xs text-gray-500">Reward Tier</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#00A9B0]">${((referralStats.stats?.totalSignups || 0) * 5).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Earned</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#00A9B0]">{user?.vipStatus ? 'Unlocked' : `${10 - (referralStats.stats?.totalSignups || 0)} more`}</div>
                          <div className="text-xs text-gray-500">For VIP</div>
                        </div>
                      </div>
                      {!user?.vipStatus && (
                        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00A9B0] rounded-full" style={{ width: `${((referralStats.stats?.totalSignups || 0) / 10) * 100}%` }}></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent Orders */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Recent Orders</h3>
                      <Link to="/orders" className="text-sm text-[#00A9B0] hover:underline">View All →</Link>
                    </div>
                    {orders.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No orders yet</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order._id} className="py-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${order.total.toFixed(2)}</p>
                              <p className={`text-xs ${
                                order.status === 'delivered' ? 'text-green-600' : 
                                order.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1-242-555-0123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <button type="submit" className="bg-[#00A9B0] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#008c92] transition-colors">
                      Save Changes
                    </button>
                  </form>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Address Book</h2>
                    <button className="text-[#00A9B0] text-sm hover:underline">
                      + Add New Address
                    </button>
                  </div>
                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="bi bi-geo-alt text-5xl text-gray-300 mb-3 block"></i>
                      <p className="text-gray-500">No saved addresses yet</p>
                      <button className="mt-3 text-[#00A9B0] hover:underline text-sm">Add your first address</button>
                    </div>
                  ) : (
                    addresses.map((addr) => (
                      <div key={addr._id} className="border border-gray-200 rounded-lg p-4 mb-3">
                        {addr.isDefault && (
                          <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mb-2">Default</span>
                        )}
                        <p className="font-semibold">{addr.fullName}</p>
                        <p className="text-sm text-gray-600">{addr.street}</p>
                        <p className="text-sm text-gray-600">{addr.city}, {addr.island}</p>
                        <p className="text-sm text-gray-600">{addr.postalCode}</p>
                        <p className="text-sm text-gray-600">Phone: {addr.phone}</p>
                        <div className="flex gap-3 mt-3">
                          <button className="text-sm text-[#00A9B0] hover:underline">Edit</button>
                          <button className="text-sm text-red-500 hover:underline">Delete</button>
                        </div>
                      </div>
                    ))
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
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">New Password</label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <button type="submit" className="bg-[#00A9B0] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#008c92] transition-colors">
                      Update Password
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold mb-3">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your account</p>
                    <button className="text-[#00A9B0] text-sm hover:underline">Enable 2FA →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;