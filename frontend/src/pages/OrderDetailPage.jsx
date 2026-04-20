import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import { SafeHelmet } from '../components/common/SafeHelmet';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrderById(id);
      if (res.success) {
        setOrder(res.order);
      } else {
        navigate('/orders');
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setCancelling(true);
    try {
      const res = await orderService.cancelOrder(id, 'Cancelled by customer');
      if (res.success) {
        setOrder(prev => ({ ...prev, status: 'cancelled' }));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle text-6xl text-gray-300 mb-4 block"></i>
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <Link to="/orders" className="text-[#00A9B0] hover:underline">Back to Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <>
<Helmet>
  <title>Order #{order?.orderNumber} | Mall242</title>
</Helmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Link to="/orders" className="text-[#00A9B0] hover:underline flex items-center gap-1 mb-4">
              <i className="bi bi-arrow-left"></i> Back to Orders
            </Link>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Order #{order.orderNumber}</h1>
                <p className="text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${getStatusColor(order.status)}`}>
                <i className={`${getStatusIcon(order.status)} text-sm`}></i>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Order Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Order Timeline</h2>
                <div className="relative">
                  {order.statusHistory.map((history, idx) => (
                    <div key={idx} className="flex gap-3 mb-4 last:mb-0">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center z-10 relative">
                          <i className="bi bi-check-lg text-green-600"></i>
                        </div>
                        {idx < order.statusHistory.length - 1 && (
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Shipping Address</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                  <p className="text-gray-800">
                    {order.shippingAddress?.fullName}<br />
                    {order.shippingAddress?.street}<br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.island}<br />
                    {order.shippingAddress?.postalCode}<br />
                    Phone: {order.shippingAddress?.phone}
                  </p>
                </div>
                {order.trackingNumber && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tracking Information</p>
                    <p className="text-gray-800">
                      <strong>Carrier:</strong> {order.trackingCarrier || 'Standard Shipping'}<br />
                      <strong>Tracking #:</strong> {order.trackingNumber}<br />
                      {order.trackingUrl && (
                        <a 
                          href={order.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#00A9B0] hover:underline text-sm inline-block mt-1"
                        >
                          Track Package →
                        </a>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <h2 className="text-lg font-bold text-gray-800 p-6 pb-0">Order Items</h2>
              <div className="divide-y divide-gray-100">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="p-6 flex flex-col sm:flex-row gap-4">
                    <img 
                      src={item.image || 'https://picsum.photos/100/100'} 
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="flex-1">
                      <Link 
                        to={`/product/${item.slug}?id=${item.product}`}
                        className="font-semibold text-gray-800 hover:text-[#00A9B0] transition-colors"
                      >
                        {item.name}
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-gray-500 mt-1">{item.variant.name}: {item.variant.value}</p>
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
              <div className="bg-gray-50 p-6 border-t border-gray-200">
                <div className="max-w-xs ml-auto space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${order.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>${order.shippingCost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (7.5%)</span>
                    <span>${order.tax?.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${order.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-[#00A9B0]">${order.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Payment Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium capitalize">{order.payment?.method || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className={`font-medium capitalize ${order.payment?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.payment?.status || 'pending'}
                  </p>
                </div>
                {order.payment?.transactionId && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="font-mono text-sm">{order.payment.transactionId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {order.status === 'pending' && (
                <button
                  onClick={cancelOrder}
                  disabled={cancelling}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
              {order.status === 'delivered' && (
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

            {/* Need Help */}
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <i className="bi bi-headset text-yellow-600 text-xl mb-2 block"></i>
              <p className="text-sm text-yellow-800">
                Need help with your order? <Link to="/contact" className="font-semibold underline">Contact Support</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailPage;