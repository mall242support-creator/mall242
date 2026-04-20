import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { cartService } from '../services/api';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, cartCount: contextCartCount, refreshCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [savedForLater, setSavedForLater] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState({ type: '', text: '' });
  const [showClearModal, setShowClearModal] = useState(false);

  const cartCount = contextCartCount || 0;
  const subtotal = cart?.subtotal || 0;
  const shippingCost = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.075;
  const discount = promoDiscount;
  const total = subtotal + shippingCost + tax - discount;

  // Debug logging
  console.log('CartPage rendering - cart items:', cart?.items);
  console.log('CartCount:', cartCount);

  useEffect(() => {
    const loadSavedItems = async () => {
      try {
        const res = await cartService.getCart();
        if (res.success && res.cart?.savedForLater) {
          setSavedForLater(res.cart.savedForLater);
        }
      } catch (error) {
        console.error('Failed to load saved items:', error);
      }
    };
    loadSavedItems();
  }, [cart]);

  const handleQuantityUpdate = async (itemId, newQuantity, variant = null) => {
    console.log('handleQuantityUpdate called:', { itemId, newQuantity, variant });
    if (newQuantity < 1) return;
    setLoading(true);
    try {
      await updateQuantity(itemId, newQuantity, variant);
      await refreshCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId, variant = null) => {
    console.log('handleRemoveItem called:', { itemId, variant });
    setLoading(true);
    try {
      await removeFromCart(itemId, variant);
      await refreshCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToSaved = async (item) => {
    console.log('handleMoveToSaved called:', item);
    setLoading(true);
    try {
      await cartService.saveForLater(item.product, item.variant);
      await refreshCart();
    } catch (error) {
      console.error('Failed to move to saved:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToCart = async (item) => {
    console.log('handleMoveToCart called:', item);
    setLoading(true);
    try {
      await cartService.moveToCart(item.product, item.variant);
      await refreshCart();
    } catch (error) {
      console.error('Failed to move to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoMessage({ type: 'error', text: 'Please enter a promo code' });
      return;
    }
    
    setLoading(true);
    try {
      const res = await cartService.applyDiscount(promoCode);
      if (res.success) {
        setPromoDiscount(res.discountAmount || 15);
        setPromoMessage({ type: 'success', text: `Promo code applied! You saved $${(res.discountAmount || 15).toFixed(2)}` });
        await refreshCart();
      }
    } catch (error) {
      setPromoMessage({ type: 'error', text: error.response?.data?.message || 'Invalid promo code' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = async () => {
    setLoading(true);
    try {
      await clearCart();
      await refreshCart();
      setShowClearModal(false);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const proceedToCheckout = () => {
    navigate('/checkout');
  };

  // Empty cart state
  if (cartCount === 0) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container-custom">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-cart-x text-4xl text-gray-400"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h1>
              <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
              <Link 
                to="/products" 
                className="inline-flex items-center gap-2 bg-[#00A9B0] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#008c92] transition-colors"
              >
                <i className="bi bi-shop"></i>
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Shopping Cart</h1>
          <span className="text-gray-500">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-1 text-center">Total</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-gray-200">
                {cart?.items?.map((item) => {
                  // Get the correct product ID
                  const productId = item.product?._id || item.product || item.id;
                  console.log('Cart item:', { item, productId });
                  
                  return (
                    <div key={item._id || productId} className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-32 h-32 flex-shrink-0 mx-auto md:mx-0">
                          <img 
                            src={item.image || 'https://picsum.photos/128/128'} 
                            alt={item.name || 'Product'}
                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <Link 
                                to={`/product/${item.slug}?id=${productId}`}
                                className="font-semibold text-gray-800 hover:text-[#00A9B0] transition-colors line-clamp-2"
                              >
                                {item.name || 'Product'}
                              </Link>
                              {item.variant && item.variant.name && item.variant.value && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {item.variant.name}: {item.variant.value}
                                </p>
                              )}
                              <div className="flex gap-3 mt-3">
                                <button
                                  onClick={() => handleMoveToSaved(item)}
                                  disabled={loading}
                                  className="text-sm text-gray-500 hover:text-[#00A9B0] transition-colors flex items-center gap-1"
                                >
                                  <i className="bi bi-bookmark"></i> Save for later
                                </button>
                                <button
                                  onClick={() => handleRemoveItem(productId, item.variant)}
                                  disabled={loading}
                                  className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
                                >
                                  <i className="bi bi-trash"></i> Remove
                                </button>
                              </div>
                            </div>
                            
                            <div className="md:hidden flex justify-between items-center pt-2 border-t border-gray-100">
                              <span className="text-gray-500">Price:</span>
                              <span className="font-semibold text-[#00A9B0]">${item.price}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityUpdate(productId, item.quantity - 1, item.variant)}
                                disabled={loading || item.quantity <= 1}
                                className="w-8 h-8 rounded-full border border-gray-300 hover:border-[#00A9B0] hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center"
                              >
                                <i className="bi bi-dash"></i>
                              </button>
                              <span className="w-12 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityUpdate(productId, item.quantity + 1, item.variant)}
                                disabled={loading}
                                className="w-8 h-8 rounded-full border border-gray-300 hover:border-[#00A9B0] hover:bg-gray-50 transition-colors flex items-center justify-center"
                              >
                                <i className="bi bi-plus"></i>
                              </button>
                            </div>
                            
                            <div className="md:hidden flex justify-between items-center pt-2">
                              <span className="text-gray-500">Total:</span>
                              <span className="font-bold text-[#00A9B0]">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            
                            <div className="hidden md:block w-24 text-center font-bold text-[#00A9B0]">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            
                            <button
                              onClick={() => handleRemoveItem(productId, item.variant)}
                              disabled={loading}
                              className="hidden md:block text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <Link 
                  to="/products" 
                  className="text-[#00A9B0] hover:underline flex items-center gap-1 text-sm"
                >
                  <i className="bi bi-arrow-left"></i> Continue Shopping
                </Link>
                <button
                  onClick={() => setShowClearModal(true)}
                  className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <i className="bi bi-trash"></i> Clear Cart
                </button>
              </div>
            </div>

            {savedForLater.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Saved for Later ({savedForLater.length})</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="space-y-4">
                    {savedForLater.map((item) => (
                      <div key={item._id} className="flex gap-4 items-center">
                        <img 
                          src={item.image || 'https://picsum.photos/64/64'} 
                          alt={item.name || 'Product'} 
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.name || 'Product'}</p>
                          <p className="text-[#00A9B0] font-semibold">${item.price}</p>
                        </div>
                        <button
                          onClick={() => handleMoveToCart(item)}
                          disabled={loading}
                          className="bg-[#00A9B0] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#008c92] transition-colors"
                        >
                          Move to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar - same as before */}
          <div className="lg:w-96">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `$${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (7.5%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#00A9B0]">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Promo Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] text-sm"
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={loading}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage.text && (
                  <p className={`text-xs mt-2 ${promoMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {promoMessage.text}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                  <i className="bi bi-truck"></i>
                  <span>Free shipping on orders over $50</span>
                </div>
                {subtotal < 50 && (
                  <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                    <p className="text-yellow-800">
                      Add <strong>${(50 - subtotal).toFixed(2)}</strong> more to qualify for free shipping!
                    </p>
                    <div className="mt-2 h-1.5 bg-yellow-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${(subtotal / 50) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={proceedToCheckout}
                disabled={loading || cartCount === 0}
                className="w-full mt-6 bg-[#FFC72C] text-black py-3 rounded-full font-semibold hover:bg-[#e5b300] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <i className="bi bi-lock"></i>
                Proceed to Checkout
              </button>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-2">We accept</p>
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

      {/* Clear Cart Modal */}
      {showClearModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowClearModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="bi bi-exclamation-triangle text-2xl text-red-500"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Clear Cart?</h3>
                <p className="text-gray-500 mt-2">
                  Are you sure you want to remove all items from your cart? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCart}
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                >
                  {loading ? 'Clearing...' : 'Clear Cart'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;