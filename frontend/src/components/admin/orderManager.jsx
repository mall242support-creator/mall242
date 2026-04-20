import { useState, useEffect } from 'react';
import { adminService, orderService } from '../../services/api';

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllOrders(1, 50, statusFilter, dateRange.start, dateRange.end);
      if (res.success) {
        setOrders(res.orders || []);
        setStats(res.stats);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setMessage({ type: 'error', text: 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateRange]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus, note = '') => {
    try {
      const res = await adminService.updateOrderStatus(orderId, newStatus, note);
      if (res.success) {
        setMessage({ type: 'success', text: `Order status updated to ${newStatus}` });
        fetchOrders();
        if (showDetailModal) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
    }
  };

  // Process refund
  const processRefund = async (orderId, amount, reason) => {
    if (!confirm(`Process refund of $${amount} for this order?`)) return;
    
    try {
      const res = await adminService.processRefund(orderId, amount, reason);
      if (res.success) {
        setMessage({ type: 'success', text: 'Refund processed successfully' });
        fetchOrders();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Refund failed' });
    }
  };

  // View order details
  const viewOrderDetails = async (order) => {
    try {
      const res = await orderService.getOrderById(order._id);
      if (res.success) {
        setSelectedOrder(res.order);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-cyan-100 text-cyan-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
  ];

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
        <h2 className="text-xl font-bold text-gray-800">Order Management</h2>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Total Orders</p>
            <p className="text-2xl font-bold text-blue-700">{stats.totalOrders || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-700">${(stats.totalRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600">Avg Order Value</p>
            <p className="text-2xl font-bold text-yellow-700">${(stats.averageOrderValue || 0).toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Pending Orders</p>
            <p className="text-2xl font-bold text-purple-700">{orders.filter(o => o.status === 'pending').length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
          >
            <option value="all">All Orders</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setDateRange({ start: '', end: '' })}
            className="px-4 py-2 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
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

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Order #</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="text-sm font-mono font-medium">{order.orderNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{order.user?.name || 'Guest'}</p>
                    <p className="text-xs text-gray-500">{order.user?.email || order.guestEmail || 'N/A'}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-[#00A9B0]">${order.total?.toFixed(2)}</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold border-0 ${statusColors[order.status] || 'bg-gray-100'}`}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => viewOrderDetails(order)}
                    className="text-[#00A9B0] hover:underline text-sm font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Orders Message */}
      {orders.length === 0 && (
        <div className="text-center py-12">
          <i className="bi bi-inbox text-5xl text-gray-300 mb-3 block"></i>
          <p className="text-gray-500">No orders found</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDetailModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Order #{selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <i className="bi bi-x-lg text-gray-500"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Status */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">Order Status</span>
                  <div className="mt-1">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold border-0 ${statusColors[selectedOrder.status] || 'bg-gray-100'}`}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedOrder.status === 'delivered' && selectedOrder.payment?.status !== 'refunded' && (
                  <button
                    onClick={() => processRefund(selectedOrder._id, selectedOrder.total, 'Customer request')}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600"
                  >
                    Process Refund
                  </button>
                )}
              </div>

              {/* Customer Info */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedOrder.user?.name || 'Guest'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedOrder.user?.email || selectedOrder.guestEmail || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Shipping Address</h4>
                <p className="text-sm">
                  {selectedOrder.shippingAddress?.fullName}<br />
                  {selectedOrder.shippingAddress?.street}<br />
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.island}<br />
                  {selectedOrder.shippingAddress?.postalCode}<br />
                  Phone: {selectedOrder.shippingAddress?.phone}
                </p>
              </div>

              {/* Order Items */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <h4 className="font-semibold text-gray-800 p-4 border-b border-gray-200">Order Items</h4>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Qty</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Price</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            {item.variant && (
                              <p className="text-xs text-gray-500">{item.variant.name}: {item.variant.value}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm">${item.price}</td>
                        <td className="px-4 py-2 text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-right font-semibold">Subtotal:</td>
                      <td className="px-4 py-2 font-semibold">${selectedOrder.subtotal?.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-right">Shipping:</td>
                      <td className="px-4 py-2">${selectedOrder.shippingCost?.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-right">Tax:</td>
                      <td className="px-4 py-2">${selectedOrder.tax?.toFixed(2)}</td>
                    </tr>
                    {selectedOrder.discount > 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-right text-green-600">Discount:</td>
                        <td className="px-4 py-2 text-green-600">-${selectedOrder.discount?.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="border-t border-gray-200">
                      <td colSpan="3" className="px-4 py-2 text-right font-bold text-lg">Total:</td>
                      <td className="px-4 py-2 font-bold text-lg text-[#00A9B0]">${selectedOrder.total?.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Info */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Method</p>
                    <p className="font-medium capitalize">{selectedOrder.payment?.method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-medium capitalize ${selectedOrder.payment?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedOrder.payment?.status || 'pending'}
                    </p>
                  </div>
                  {selectedOrder.payment?.transactionId && (
                    <div>
                      <p className="text-sm text-gray-500">Transaction ID</p>
                      <p className="font-mono text-sm">{selectedOrder.payment.transactionId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Order Timeline</h4>
                  <div className="space-y-3">
                    {selectedOrder.statusHistory.map((history, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <i className="bi bi-check-lg text-gray-500"></i>
                        </div>
                        <div>
                          <p className="font-medium capitalize">{history.status}</p>
                          <p className="text-sm text-gray-500">{new Date(history.timestamp).toLocaleString()}</p>
                          {history.note && <p className="text-sm text-gray-600 mt-1">{history.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderManager;