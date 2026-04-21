import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService, orderService } from '../services/api';
import CategoryManager from '../components/admin/CategoryManager';
import ProductManager from '../components/admin/ProductManager';
import OrderManager from '../components/admin/OrderManager';
import HeroManager from '../components/admin/HeroManager';
import ReferralManager from '../components/admin/ReferralManager';
import PromoManager from '../components/admin/PromoManager';
import SettingsManager from '../components/admin/SettingsManager';
import ContactManager from '../components/admin/ContactManager';
import MysteryDropManager from '../components/admin/MysteryDropManager';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [broadcastData, setBroadcastData] = useState({
    subject: '',
    message: '',
    userType: 'all',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Define fetchDashboardData BEFORE the useEffect
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminService.getStats();
      setStats(statsRes.stats);
      
      const usersRes = await adminService.getUsers(1, 10);
      setUsers(usersRes.users || []);
      
      const productsRes = await adminService.getAllProducts(1, 10);
      setProducts(productsRes.products || []);
      
      const ordersRes = await orderService.getUserOrders(1, 10);
      setOrders(ordersRes.orders || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Now useEffect can call fetchDashboardData
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    try {
      await adminService.sendBroadcastEmail(
        broadcastData.subject,
        broadcastData.message,
        broadcastData.userType
      );
      setMessage({ type: 'success', text: 'Broadcast email sent successfully!' });
      setBroadcastData({ subject: '', message: '', userType: 'all' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send broadcast' });
    }
  };

  // Rest of your component remains the same...
  const sidebarItems = [
    { id: 'overview', name: 'Overview', icon: 'bi-speedometer2' },
    { id: 'users', name: 'Users', icon: 'bi-people' },
    { id: 'products', name: 'Products', icon: 'bi-box-seam' },
    { id: 'orders', name: 'Orders', icon: 'bi-truck' },
    { id: 'categories', name: 'Categories', icon: 'bi-grid' },
    { id: 'hero', name: 'Hero Banner', icon: 'bi-images' },
    { id: 'mystery', name: 'Mystery Drops', icon: 'bi-question-circle' },
    { id: 'promos', name: 'Promo Popups', icon: 'bi-megaphone' },
    { id: 'contact', name: 'Contact Messages', icon: 'bi-envelope' },
    { id: 'referrals', name: 'Referrals', icon: 'bi-share' },
    { id: 'broadcast', name: 'Broadcast', icon: 'bi-megaphone' },
    { id: 'settings', name: 'Settings', icon: 'bi-gear' },
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
        <title>Admin Dashboard | Mall242</title>
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="container-custom px-4 sm:px-6 py-4 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Admin Dashboard</h1>

          {/* Mobile Horizontal Scroll Tabs */}
          <div className="lg:hidden mb-4 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    activeTab === item.id 
                      ? 'bg-[#00A9B0] text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <i className={`${item.icon} text-base`}></i>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-24">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === item.id ? 'bg-[#00A9B0]/10 text-[#00A9B0] border-l-4 border-[#00A9B0]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <i className={`${item.icon} text-lg`}></i>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {message.text && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Overview Tab */}
              {activeTab === 'overview' && stats && (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Total Users</p>
                          <p className="text-xl sm:text-2xl font-bold">{stats.users?.total || 0}</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <i className="bi bi-people text-blue-600 text-base sm:text-xl"></i>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Total Orders</p>
                          <p className="text-xl sm:text-2xl font-bold">{stats.orders?.total || 0}</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <i className="bi bi-truck text-green-600 text-base sm:text-xl"></i>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Total Revenue</p>
                          <p className="text-xl sm:text-2xl font-bold">${(stats.revenue?.total || 0).toLocaleString()}</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <i className="bi bi-currency-dollar text-yellow-600 text-base sm:text-xl"></i>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Total Products</p>
                          <p className="text-xl sm:text-2xl font-bold">{stats.products?.total || 0}</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <i className="bi bi-box-seam text-purple-600 text-base sm:text-xl"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <button onClick={() => setActiveTab('users')} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 text-center hover:shadow-md transition">
                      <i className="bi bi-person-plus text-xl sm:text-2xl text-[#00A9B0] mb-1 sm:mb-2 block"></i>
                      <span className="text-xs sm:text-sm font-medium">Add User</span>
                    </button>
                    <button onClick={() => setActiveTab('products')} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 text-center hover:shadow-md transition">
                      <i className="bi bi-plus-circle text-xl sm:text-2xl text-[#00A9B0] mb-1 sm:mb-2 block"></i>
                      <span className="text-xs sm:text-sm font-medium">Add Product</span>
                    </button>
                    <button onClick={() => setActiveTab('categories')} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 text-center hover:shadow-md transition">
                      <i className="bi bi-grid text-xl sm:text-2xl text-[#00A9B0] mb-1 sm:mb-2 block"></i>
                      <span className="text-xs sm:text-sm font-medium">Manage Categories</span>
                    </button>
                    <button onClick={() => setActiveTab('broadcast')} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 text-center hover:shadow-md transition">
                      <i className="bi bi-megaphone text-xl sm:text-2xl text-[#00A9B0] mb-1 sm:mb-2 block"></i>
                      <span className="text-xs sm:text-sm font-medium">Send Broadcast</span>
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Recent Users</h3>
                      <div className="space-y-3">
                        {users.slice(0, 5).map((user) => (
                          <div key={user._id} className="flex justify-between items-center flex-wrap gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">{user.name}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                              user.role === 'admin' ? 'bg-red-100 text-red-600' :
                              user.role === 'vendor' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Recent Orders</h3>
                      <div className="space-y-3">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order._id} className="flex justify-between items-center flex-wrap gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">{order.orderNumber}</p>
                              <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-sm sm:text-base">${order.total?.toFixed(2)}</p>
                              <span className={`text-xs ${
                                order.status === 'delivered' ? 'text-green-600' :
                                order.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-lg sm:text-xl font-bold">User Management</h2>
                    <button className="text-[#00A9B0] text-sm hover:underline">+ Add User</button>
                  </div>
                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <table className="min-w-[600px] sm:min-w-full w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">Name</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">Email</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">Role</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">Status</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{user.name}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{user.email}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                              <select
                                value={user.role}
                                onChange={async (e) => {
                                  try {
                                    await adminService.updateUserRole(user._id, e.target.value);
                                    setMessage({ type: 'success', text: `User role updated to ${e.target.value}` });
                                    fetchDashboardData();
                                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                                  } catch (error) {
                                    setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
                                  }
                                }}
                                className="text-xs sm:text-sm border border-gray-200 rounded px-1 sm:px-2 py-1"
                              >
                                <option value="user">User</option>
                                <option value="vendor">Vendor</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                              <button
                                onClick={async () => {
                                  try {
                                    if (user.isActive) {
                                      await adminService.deactivateUser(user._id);
                                      setMessage({ type: 'success', text: `User ${user.name} deactivated` });
                                    } else {
                                      await adminService.activateUser(user._id);
                                      setMessage({ type: 'success', text: `User ${user.name} activated` });
                                    }
                                    fetchDashboardData();
                                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                                  } catch (error) {
                                    setMessage({ type: 'error', text: error.response?.data?.message || 'Status update failed' });
                                  }
                                }}
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  user.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                {user.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    alert(`User Details:\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nStatus: ${user.isActive ? 'Active' : 'Inactive'}`);
                                  }}
                                  className="text-[#00A9B0] hover:underline text-xs sm:text-sm"
                                >
                                  View
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
                                      try {
                                        await adminService.deleteUser(user._id);
                                        setMessage({ type: 'success', text: `User ${user.name} deleted successfully` });
                                        fetchDashboardData();
                                        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                                      } catch (error) {
                                        setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
                                      }
                                    }
                                  }}
                                  className="text-red-500 hover:underline text-xs sm:text-sm"
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
              )}

              {/* Products Tab */}
              {activeTab === 'products' && <ProductManager />}

              {/* Orders Tab */}
              {activeTab === 'orders' && <OrderManager />}

              {/* Categories Tab */}
              {activeTab === 'categories' && <CategoryManager />}

              {/* Hero Banner Tab */}
              {activeTab === 'hero' && <HeroManager />}

              {/* Mystery Drops Tab */}
              {activeTab === 'mystery' && <MysteryDropManager />}

              {/* Promo Popups Tab */}
              {activeTab === 'promos' && <PromoManager />}

              {/* Contact Messages Tab */}
              {activeTab === 'contact' && <ContactManager />}

              {/* Referrals Tab */}
              {activeTab === 'referrals' && <ReferralManager />}

              {/* Broadcast Tab */}
              {activeTab === 'broadcast' && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold mb-4">Send Broadcast Email</h2>
                  <form onSubmit={handleBroadcast} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Send to</label>
                      <select
                        value={broadcastData.userType}
                        onChange={(e) => setBroadcastData({ ...broadcastData, userType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      >
                        <option value="all">All Users</option>
                        <option value="users">Regular Users</option>
                        <option value="vendors">Vendors</option>
                        <option value="vip">VIP Members</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Subject</label>
                      <input
                        type="text"
                        value={broadcastData.subject}
                        onChange={(e) => setBroadcastData({ ...broadcastData, subject: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Message</label>
                      <textarea
                        value={broadcastData.message}
                        onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                        required
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <button type="submit" className="bg-[#00A9B0] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#008c92] transition-colors">
                      Send Broadcast
                    </button>
                  </form>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && <SettingsManager />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;