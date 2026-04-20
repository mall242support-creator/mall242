import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService, cartService, adminService } from '../services/api';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart, cartCount } = useCart();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [taxRate, setTaxRate] = useState(7.5);
  
  // Shipping Address Form
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    island: 'New Providence',
    postalCode: '',
    phone: '',
  });
  
  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
  });
  
  const [errors, setErrors] = useState({});
  const [saveAddress, setSaveAddress] = useState(false);
  
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

  // Fetch tax rate from admin settings
  useEffect(() => {
    const fetchTaxRate = async () => {
      try {
        const res = await adminService.getSettings();
        if (res.success && res.settings) {
          setTaxRate(res.settings.taxRate || 7.5);
        }
      } catch (error) {
        console.error('Failed to fetch tax rate:', error);
      }
    };
    fetchTaxRate();
  }, []);

  // Calculate totals
  const subtotal = cart?.subtotal || 0;
  const shippingCost = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + shippingCost + tax;

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'number') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
    }
    if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
    }
    if (name === 'cvc') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
  };

  const validateAddress = () => {
    const newErrors = {};
    if (!shippingAddress.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!shippingAddress.street.trim()) newErrors.street = 'Street address is required';
    if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
    if (!shippingAddress.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!shippingAddress.phone.trim()) newErrors.phone = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    if (paymentMethod === 'card') {
      const newErrors = {};
      if (!cardDetails.number.replace(/\s/g, '')) newErrors.number = 'Card number is required';
      if (!cardDetails.name.trim()) newErrors.name = 'Name on card is required';
      if (!cardDetails.expiry) newErrors.expiry = 'Expiry date is required';
      if (!cardDetails.cvc) newErrors.cvc = 'CVC is required';
      
      // Validate expiry date
      if (cardDetails.expiry) {
        const [month, year] = cardDetails.expiry.split('/');
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;
        
        if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
          newErrors.expiry = 'Card has expired';
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateAddress()) {
      setStep(2);
      window.scrollTo(0, 0);
    } else if (step === 2 && validatePayment()) {
      setStep(3);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const placeOrder = async () => {
    setLoading(true);
    try {
      // Format items correctly for backend
      const formattedItems = cart?.items?.map(item => ({
        product: {
          _id: item.id,
        },
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant,
        image: item.image,
      })) || [];

      const orderData = {
        shippingAddress,
        paymentMethod,
        items: formattedItems,
        subtotal,
        shippingCost,
        tax,
        total,
        notes: '',
      };
      
      const response = await orderService.createOrder(orderData);
      
      if (response.success) {
        setOrderDetails(response.order);
        setOrderComplete(true);
        setShowThankYouModal(true);
        clearCart();
        
        // Clear guest cart if exists
        const sessionId = localStorage.getItem('guestCartId');
        if (sessionId) {
          await cartService.clearCart(sessionId);
          localStorage.removeItem('guestCartId');
        }
      }
    } catch (error) {
      console.error('Order failed:', error);
      alert(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeThankYouModal = () => {
    setShowThankYouModal(false);
    navigate('/orders');
  };

  const continueShopping = () => {
    setShowThankYouModal(false);
    navigate('/');
  };

  if (cartCount === 0 && !orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="bi bi-cart-x text-6xl text-gray-300 mb-4 block"></i>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some items to your cart before checking out</p>
          <Link to="/products" className="bg-[#00A9B0] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#008c92] transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout | Mall242</title>
        <meta name="description" content="Complete your purchase securely at Mall242." />
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom max-w-6xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s ? 'bg-[#00A9B0] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {s}
                    </div>
                    <div className="text-xs mt-2 text-gray-500 hidden md:block">
                      {s === 1 && 'Shipping'}
                      {s === 2 && 'Payment'}
                      {s === 3 && 'Review'}
                    </div>
                  </div>
                  {s < 3 && (
                    <div className={`absolute top-5 left-[calc(50%+20px)] right-[-calc(50%-20px)] h-0.5 ${
                      step > s ? 'bg-[#00A9B0]' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1">
              {/* Step 1: Shipping Address */}
              {step === 1 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleAddressChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                          errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Street Address *</label>
                      <input
                        type="text"
                        name="street"
                        value={shippingAddress.street}
                        onChange={handleAddressChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                          errors.street ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={shippingAddress.city}
                          onChange={handleAddressChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Island *</label>
                        <select
                          name="island"
                          value={shippingAddress.island}
                          onChange={handleAddressChange}
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
                        <label className="block text-sm font-semibold mb-1">Postal Code *</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={shippingAddress.postalCode}
                          onChange={handleAddressChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                            errors.postalCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={shippingAddress.phone}
                          onChange={handleAddressChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="saveAddress"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="w-4 h-4 accent-[#00A9B0]"
                      />
                      <label htmlFor="saveAddress" className="text-sm text-gray-700">Save this address to my account</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {step === 2 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 accent-[#00A9B0]"
                        />
                        <i className="bi bi-credit-card text-xl"></i>
                        <span>Credit/Debit Card</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 accent-[#00A9B0]"
                        />
                        <i className="bi bi-paypal text-xl"></i>
                        <span>PayPal</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 accent-[#00A9B0]"
                        />
                        <i className="bi bi-cash-stack text-xl"></i>
                        <span>Cash on Delivery</span>
                      </label>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-semibold mb-1">Card Number *</label>
                          <input
                            type="text"
                            name="number"
                            value={cardDetails.number}
                            onChange={handleCardChange}
                            placeholder="1234 5678 9012 3456"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                              errors.number ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Name on Card *</label>
                          <input
                            type="text"
                            name="name"
                            value={cardDetails.name}
                            onChange={handleCardChange}
                            placeholder="John Doe"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                              errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-1">Expiry Date *</label>
                            <input
                              type="text"
                              name="expiry"
                              value={cardDetails.expiry}
                              onChange={handleCardChange}
                              placeholder="MM/YY"
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                                errors.expiry ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-1">CVC *</label>
                            <input
                              type="text"
                              name="cvc"
                              value={cardDetails.cvc}
                              onChange={handleCardChange}
                              placeholder="123"
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                                errors.cvc ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.cvc && <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <i className="bi bi-shield-check text-green-500"></i>
                          <span>Your payment information is secure</span>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'paypal' && (
                      <div className="bg-blue-50 p-4 rounded-lg mt-4">
                        <div className="flex items-center gap-3">
                          <i className="bi bi-paypal text-3xl text-blue-600"></i>
                          <div>
                            <p className="text-sm text-blue-800 font-semibold">PayPal Checkout</p>
                            <p className="text-sm text-blue-600">You will be redirected to PayPal to complete your payment after reviewing your order.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'cod' && (
                      <div className="bg-green-50 p-4 rounded-lg mt-4">
                        <div className="flex items-center gap-3">
                          <i className="bi bi-cash-stack text-3xl text-green-600"></i>
                          <div>
                            <p className="text-sm text-green-800 font-semibold">Cash on Delivery</p>
                            <p className="text-sm text-green-600">Pay when your order arrives. Additional fees may apply for some islands.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Review Order */}
              {step === 3 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold mb-4">Review Your Order</h2>
                  
                  {/* Shipping Address Review */}
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <p className="text-sm text-gray-600">
                      {shippingAddress.fullName}<br />
                      {shippingAddress.street}<br />
                      {shippingAddress.city}, {shippingAddress.island}<br />
                      {shippingAddress.postalCode}<br />
                      Phone: {shippingAddress.phone}
                    </p>
                    <button onClick={() => setStep(1)} className="text-sm text-[#00A9B0] hover:underline mt-2">
                      Edit
                    </button>
                  </div>

                  {/* Payment Method Review */}
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <h3 className="font-semibold mb-2">Payment Method</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {paymentMethod === 'card' ? 'Credit/Debit Card' : paymentMethod === 'paypal' ? 'PayPal' : 'Cash on Delivery'}
                    </p>
                    {paymentMethod === 'card' && cardDetails.number && (
                      <p className="text-sm text-gray-500">Card ending in {cardDetails.number.slice(-4)}</p>
                    )}
                    <button onClick={() => setStep(2)} className="text-sm text-[#00A9B0] hover:underline mt-2">
                      Edit
                    </button>
                  </div>

                  {/* Order Items Review */}
                  <div>
                    <h3 className="font-semibold mb-2">Order Items ({cartCount})</h3>
                    <div className="space-y-2">
                      {cart?.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-2">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-500 ml-2">x {item.quantity}</span>
                          </div>
                          <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                {step > 1 && (
                  <button
                    onClick={prevStep}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <i className="bi bi-arrow-left mr-2"></i> Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={nextStep}
                    className="bg-[#00A9B0] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#008c92] transition-colors ml-auto"
                  >
                    Continue <i className="bi bi-arrow-right ml-2"></i>
                  </button>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={loading}
                    className="bg-[#FFC72C] text-black px-8 py-3 rounded-full font-semibold hover:bg-[#e5b300] transition-colors ml-auto disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Place Order <i className="bi bi-check-lg"></i>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:w-96">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({taxRate}%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-[#00A9B0] text-xl">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <i className="bi bi-shield-check"></i>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <i className="bi bi-arrow-return-left"></i>
                    <span>30-day return policy</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <i className="bi bi-headset"></i>
                    <span>24/7 Customer Support</span>
                  </div>
                </div>

                {/* Accepted Payment Methods */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center mb-2">Secure payment methods</p>
                  <div className="flex justify-center gap-3 text-2xl text-gray-400">
                    <i className="bi bi-credit-card"></i>
                    <i className="bi bi-paypal"></i>
                    <i className="bi bi-cash-stack"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thank You Modal */}
      {showThankYouModal && orderDetails && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={closeThankYouModal}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
                <i className="bi bi-check-lg text-4xl text-green-500"></i>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
              <p className="text-green-100">Thank you for shopping with us</p>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <p className="text-gray-600">Order Number</p>
                <p className="font-mono font-bold text-lg">{orderDetails.orderNumber}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-bold text-[#00A9B0]">${orderDetails.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="capitalize">{orderDetails.payment?.method || paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Shipping to</span>
                  <span className="capitalize">{shippingAddress.island}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 text-center mb-6">
                A confirmation email has been sent to your email address.
                You can track your order status in the Orders section.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={closeThankYouModal}
                  className="flex-1 bg-[#00A9B0] text-white py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
                >
                  View Orders
                </button>
                <button
                  onClick={continueShopping}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
            
            <button
              onClick={closeThankYouModal}
              className="absolute top-4 right-4 text-white hover:text-gray-200"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default CheckoutPage;