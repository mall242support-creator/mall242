import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/api';
import { SafeHelmet } from '../components/common/SafeHelmet';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getUserOrders(1, 50);
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-cyan-100 text-cyan-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'bi-clock-history',
      processing: 'bi-gear',
      confirmed: 'bi-check-circle',
      shipped: 'bi-truck',
      delivered: 'bi-box-seam',
      cancelled: 'bi-x-circle',
      refunded: 'bi-arrow-return-left',
    };
    return icons[status] || 'bi-question-circle';
  };

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

  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const res = await orderService.cancelOrder(orderId, 'Cancelled by customer');
      if (res.success) {
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: 'cancelled' }));
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
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
<SafeHelmet title="Cart | Mall242">
  <meta name="description" content="..." />
</SafeHelmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors capitalize ${
                  filter === status
                    ? 'bg-[#00A9B0] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {status === 'all' ? 'All Orders' : status}
                {status !== 'all' && (
                  <span className="ml-1 text-xs opacity-75">
                    ({orders.filter(o => o.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <i className="bi bi-inbox text-6xl text-gray-300 mb-4 block"></i>
              <h2 className="text-xl font-semibold mb-2">No orders found</h2>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? "You haven't placed any orders yet" 
                  : `No ${filter} orders found`}
              </p>
              <Link 
                to="/products" 
                className="inline-flex items-center gap-2 bg-[#00A9B0] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#008c92] transition-colors"
              >
                <i className="bi bi-shop"></i>
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Order Number</p>
                        <p className="font-mono font-semibold text-sm">{order.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Placed on</p>
                        <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-sm font-bold text-[#00A9B0]">${order.total?.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        <i className={`${getStatusIcon(order.status)} text-xs`}></i>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="text-[#00A9B0] hover:underline text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-4">
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {order.items?.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex-shrink-0 w-20 text-center">
                          <img 
                            src={item.image || 'https://picsum.photos/80/80'} 
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.name}</p>
                        </div>
                      ))}
                      {order.items?.length > 4 && (
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-500">+{order.items.length - 4}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons for Active Orders */}
                    {order.status === 'pending' && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={() => cancelOrder(order._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                    
                    {order.status === 'delivered' && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-3">
                        <Link
                          to={`/products`}
                          className="text-[#00A9B0] hover:underline text-sm font-medium"
                        >
                          Buy Again
                        </Link>
                        <button
                          onClick={() => alert('Return feature coming soon')}
                          className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                        >
                          Return Items
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${getStatusColor(selectedOrder.status)}`}>
                      <i className={`${getStatusIcon(selectedOrder.status)} text-sm`}></i>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                </div>
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => {
                      cancelOrder(selectedOrder._id);
                      setShowDetailModal(false);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              {/* Order Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Order Timeline</h4>
                  <div className="relative">
                    {selectedOrder.statusHistory.map((history, idx) => (
                      <div key={idx} className="flex gap-3 mb-4 last:mb-0">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center z-10 relative">
                            <i className="bi bi-check-lg text-green-600"></i>
                          </div>
                          {idx < selectedOrder.statusHistory.length - 1 && (
                            <div className="absolute top-8 left-4 w-0.5 h-full bg-gray-200"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium capitalize">{history.status}</p>
                          <p className="text-sm text-gray-500">{new Date(history.timestamp).toLocaleString()}</p>
                          {history.note && <p className="text-sm text-gray-600 mt-1">{history.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Tracking Info */}
              {selectedOrder.trackingNumber && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Tracking Information</h4>
                  <p className="text-sm">
                    <strong>Carrier:</strong> {selectedOrder.trackingCarrier || 'Standard Shipping'}<br />
                    <strong>Tracking Number:</strong> {selectedOrder.trackingNumber}<br />
                    {selectedOrder.trackingUrl && (
                      <a 
                        href={selectedOrder.trackingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#00A9B0] hover:underline text-sm"
                      >
                        Track Package →
                      </a>
                    )}
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <h4 className="font-semibold text-gray-800 p-4 border-b border-gray-200">Order Items</h4>
                <div className="divide-y divide-gray-100">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-4 flex gap-4">
                      <img 
                        src={item.image || 'https://picsum.photos/80/80'} 
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex-1">
                        <Link 
                          to={`/product/${item.slug}?id=${item.product}`}
                          className="font-semibold text-gray-800 hover:text-[#00A9B0] transition-colors"
                        >
                          {item.name}
                        </Link>
                        {item.variant && (
                          <p className="text-sm text-gray-500">{item.variant.name}: {item.variant.value}</p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                          <span className="font-semibold text-[#00A9B0]">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Totals */}
                <div className="bg-gray-50 p-4 border-t border-gray-200">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>${selectedOrder.shippingCost?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span>${selectedOrder.tax?.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-${selectedOrder.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-[#00A9B0]">${selectedOrder.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Method</p>
                    <p className="font-medium capitalize">{selectedOrder.payment?.method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className={`font-medium capitalize ${selectedOrder.payment?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedOrder.payment?.status || 'pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedOrder.status === 'delivered' && (
                  <button
                    onClick={() => alert('Return feature coming soon')}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Request Return
                  </button>
                )}
                <Link
                  to="/products"
                  className="flex-1 bg-[#00A9B0] text-white py-2 rounded-lg font-semibold text-center hover:bg-[#008c92] transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default OrdersPage;