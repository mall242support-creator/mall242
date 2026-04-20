import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistService } from '../services/api';
import { useCart } from '../context/CartContext';
import { SafeHelmet } from '../components/common/SafeHelmet';

const WishlistPage = () => {
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await wishlistService.getWishlist();
      if (res.success) {
        setWishlist(res.wishlist || []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId, productName) => {
    try {
      const res = await wishlistService.removeFromWishlist(productId);
      if (res.success) {
        setMessage({ type: 'success', text: `${productName} removed from wishlist` });
        fetchWishlist();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to remove' });
    }
  };

  const handleMoveToCart = async (product) => {
    try {
      const res = await wishlistService.moveToCart(product._id);
      if (res.success) {
        addToCart(product, 1, null);
        setMessage({ type: 'success', text: `${product.name} moved to cart` });
        fetchWishlist();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to move to cart' });
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1, null);
    setMessage({ type: 'success', text: `${product.name} added to cart` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <i key={i} className={`bi bi-star${i < fullStars ? '-fill' : ''} text-[#FFC72C] text-xs`}></i>
        ))}
      </div>
    );
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
  <title>My Wishlist | Mall242</title>
</Helmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>

          {/* Message Alert */}
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {wishlist.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <i className="bi bi-heart text-6xl text-gray-300 mb-4 block"></i>
              <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-6">Save items you love to your wishlist</p>
              <Link to="/products" className="bg-[#00A9B0] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#008c92] transition-colors">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlist.map((item) => {
                  const product = item.product;
                  const displayPrice = product?.discountedPrice || product?.price;
                  const originalPrice = product?.price > displayPrice ? product?.price : null;
                  
                  return (
                    <div key={product?._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                      <Link to={`/product/${product?.slug}?id=${product?._id}`}>
                        <img
                          src={product?.images?.[0]?.url || 'https://picsum.photos/300/300'}
                          alt={product?.name}
                          className="w-full h-48 object-cover"
                        />
                      </Link>
                      <div className="p-4">
                        <Link to={`/product/${product?.slug}?id=${product?._id}`}>
                          <h3 className="font-semibold text-lg mb-1 hover:text-[#00A9B0] transition-colors line-clamp-2">
                            {product?.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mb-2">
                          <StarRating rating={product?.averageRating || 4.5} />
                          <span className="text-xs text-gray-500">({product?.totalReviews || 0})</span>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl font-bold text-[#00A9B0]">${displayPrice}</span>
                          {originalPrice && (
                            <span className="text-gray-400 line-through">${originalPrice}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 bg-[#FFC72C] text-black py-2 rounded-full font-semibold text-sm hover:bg-[#e5b300] transition-colors"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => handleMoveToCart(product)}
                            className="px-3 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                            title="Move to Cart"
                          >
                            <i className="bi bi-cart-plus"></i>
                          </button>
                          <button
                            onClick={() => handleRemove(product?._id, product?.name)}
                            className="px-3 py-2 border border-red-200 rounded-full hover:bg-red-50 transition-colors text-red-500"
                            title="Remove"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clear Wishlist Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to clear your entire wishlist?')) {
                      await wishlistService.clearWishlist();
                      fetchWishlist();
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Clear Wishlist
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default WishlistPage;