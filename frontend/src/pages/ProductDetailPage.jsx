import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productService } from '../services/api';
import { SafeHelmet } from '../components/common/SafeHelmet';

// Star Rating Component
const StarRating = ({ rating, size = 'md', interactive = false, onChange = null }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const getStarClass = (index) => {
    const currentRating = hoverRating || rating;
    if (index < currentRating) return 'bi bi-star-fill';
    if (index < Math.ceil(currentRating) && currentRating % 1 !== 0) return 'bi bi-star-half';
    return 'bi bi-star';
  };
  
  if (interactive && onChange) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onChange(star)}
            className="text-2xl focus:outline-none transition-colors"
          >
            <i className={`${star <= (hoverRating || rating) ? 'bi bi-star-fill' : 'bi bi-star'} text-[#FFC72C]`}></i>
          </button>
        ))}
      </div>
    );
  }
  
  const starSize = size === 'md' ? 'text-lg' : 'text-sm';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <i key={star} className={`${getStarClass(star)} text-[#FFC72C] ${starSize}`}></i>
      ))}
    </div>
  );
};

const ProductDetailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('id');
  const { addToCart, cartCount } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0, distribution: {} });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Fetch product data
  useEffect(() => {
    if (!productId) {
      setError('Product ID not provided');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getProduct(productId);
        if (res.success) {
          setProduct(res.product);
          
          // Set default selections for variants
          if (res.product.variants) {
            const colorVariant = res.product.variants.find(v => v.name === 'color');
            const sizeVariant = res.product.variants.find(v => v.name === 'size');
            if (colorVariant) setSelectedColor(colorVariant);
            if (sizeVariant) setSelectedSize(sizeVariant.value);
          }
          
          // Fetch related products
          const relatedRes = await productService.getRelatedProducts(res.product._id, 4);
          if (relatedRes.success) {
            setRelatedProducts(relatedRes.products || []);
          }
          
          // Fetch reviews
          await fetchReviews(productId);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Failed to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);
  
  const fetchReviews = async (pid) => {
    try {
      const res = await productService.getReviews(pid, 1, 20);
      if (res.success) {
        setReviews(res.reviews || []);
        // Calculate distribution
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        (res.reviews || []).forEach(r => {
          if (r.rating >= 1 && r.rating <= 5) dist[Math.floor(r.rating)]++;
        });
        setReviewStats({
          average: res.averageRating || product?.averageRating || 0,
          total: res.total || 0,
          distribution: dist,
        });
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };
  
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      alert('Please write a review comment');
      return;
    }
    
    setSubmittingReview(true);
    try {
      const res = await productService.addReview(productId, reviewForm);
      if (res.success) {
        setShowReviewModal(false);
        setReviewForm({ rating: 5, title: '', comment: '' });
        await fetchReviews(productId);
        // Refresh product to get updated rating
        const productRes = await productService.getProduct(productId);
        if (productRes.success) {
          setProduct(productRes.product);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };
  
  const handleHelpful = async (reviewId) => {
    try {
      await productService.markReviewHelpful(reviewId);
      await fetchReviews(productId);
    } catch (err) {
      console.error('Failed to mark helpful:', err);
    }
  };
  
  const updateQuantity = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 99)) {
      setQuantity(newQuantity);
    }
  };
  
  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    try {
      const variant = {
        color: selectedColor?.value,
        size: selectedSize,
      };
      await addToCart(product, quantity, variant);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } finally {
      setTimeout(() => setIsAddingToCart(false), 500);
    }
  };
  
  const handleBuyNow = async () => {
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    try {
      const variant = {
        color: selectedColor?.value,
        size: selectedSize,
      };
      await addToCart(product, quantity, variant);
      navigate('/checkout');
    } finally {
      setTimeout(() => setIsAddingToCart(false), 500);
    }
  };
  
  const displayPrice = product?.discountedPrice || product?.price;
  const originalPrice = product?.price > displayPrice ? product?.price : null;
  const discountPercent = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
  const isInStock = (product?.quantity || 0) > 0;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle text-6xl text-gray-300 mb-4 block"></i>
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-4">{error || "The product you're looking for doesn't exist."}</p>
          <Link to="/products" className="text-[#00A9B0] hover:underline">Continue Shopping →</Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
<Helmet>
  <title>{product?.name ? `${product.name} | Mall242` : 'Product Details | Mall242'}</title>
</Helmet>
      
      {/* Success Toast Message */}
      {showSuccessMessage && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slideIn">
          <i className="bi bi-check-circle-fill mr-2"></i>
          Added to cart! ({cartCount + 1} items)
        </div>
      )}
      
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="container-custom">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
            <Link to="/" className="hover:text-[#00A9B0]">Home</Link>
            <i className="bi bi-chevron-right text-xs"></i>
            <Link to="/products" className="hover:text-[#00A9B0]">Products</Link>
            <i className="bi bi-chevron-right text-xs"></i>
            <Link to={`/products?category=${product.category?.slug}`} className="hover:text-[#00A9B0] capitalize">
              {product.category?.name || 'Products'}
            </Link>
            <i className="bi bi-chevron-right text-xs"></i>
            <span className="text-gray-800 line-clamp-1">{product.name}</span>
          </div>
          
          {/* Product Main Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: Image Gallery */}
              <div className="lg:w-1/2">
                <div className="relative">
                  <img
                    src={product.images?.[selectedImage]?.url || product.images?.[0]?.url || 'https://picsum.photos/500/500'}
                    alt={product.name}
                    className="w-full h-96 object-cover rounded-lg border border-gray-200"
                  />
                  {discountPercent > 0 && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                      -{discountPercent}%
                    </div>
                  )}
                  {product.isPrime && (
                    <div className="absolute top-4 right-4 bg-[#00A9B0] text-white text-sm font-bold px-3 py-1 rounded">
                      <i className="bi bi-star-fill mr-1"></i>VIP
                    </div>
                  )}
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 ${
                          selectedImage === idx ? 'border-[#00A9B0]' : 'border-gray-200'
                        }`}
                      >
                        <img src={img.url} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right: Product Info */}
              <div className="lg:w-1/2">
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                <Link to={`/products?brand=${product.brand}`} className="text-[#00A9B0] text-sm hover:underline mb-2 inline-block">
                  Visit the {product.brand || 'Mall242'} Store
                </Link>
                
                <div className="flex items-center gap-3 mb-4">
                  <StarRating rating={product.averageRating || 4.5} size="sm" />
                  <span className="text-sm text-gray-500">{product.totalReviews || 0} ratings</span>
                </div>
                
                <div className="border-t border-b border-gray-200 py-4 my-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#00A9B0]">${displayPrice}</span>
                    {originalPrice && (
                      <>
                        <span className="text-gray-400 line-through">${originalPrice}</span>
                        <span className="text-red-500 text-sm font-semibold">
                          Save ${(originalPrice - displayPrice).toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                  {product.isPrime && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-[#00A9B0]">
                      <i className="bi bi-star-fill"></i>
                      <span>VIP Exclusive - Free Shipping</span>
                    </div>
                  )}
                  <div className="mt-2">
                    {isInStock ? (
                      <span className="text-sm text-green-600">
                        <i className="bi bi-check-circle-fill"></i> In Stock ({product.quantity} available)
                      </span>
                    ) : (
                      <span className="text-sm text-red-600">
                        <i className="bi bi-x-circle-fill"></i> Out of Stock
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Color Selection */}
                {product.variants && product.variants.filter(v => v.name === 'color').length > 0 && (
                  <div className="mb-4">
                    <div className="font-semibold mb-2">Color: <span className="font-normal capitalize">{selectedColor?.value}</span></div>
                    <div className="flex gap-3 flex-wrap">
                      {product.variants.filter(v => v.name === 'color').map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSelectedColor(color)}
                          className={`w-12 h-12 rounded-full border-2 transition-all ${
                            selectedColor?.value === color.value ? 'border-[#00A9B0] ring-2 ring-[#00A9B0]/50' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value.toLowerCase() }}
                          title={color.value}
                        >
                          {color.image && <img src={color.image} alt={color.value} className="w-full h-full rounded-full object-cover" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Size Selection */}
                {product.variants && product.variants.filter(v => v.name === 'size').length > 0 && (
                  <div className="mb-4">
                    <div className="font-semibold mb-2">Size: <span className="font-normal">{selectedSize}</span></div>
                    <div className="flex gap-2 flex-wrap">
                      {product.variants.filter(v => v.name === 'size').map((size) => (
                        <button
                          key={size.value}
                          onClick={() => setSelectedSize(size.value)}
                          className={`px-4 py-2 border rounded-md transition-all ${
                            selectedSize === size.value
                              ? 'border-[#00A9B0] bg-[#00A9B0] text-white'
                              : 'border-gray-300 hover:border-[#00A9B0]'
                          }`}
                        >
                          {size.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Quantity Selector */}
                <div className="mb-4">
                  <div className="font-semibold mb-2">Quantity:</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(-1)}
                      disabled={!isInStock}
                      className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 1;
                        if (val < 1) val = 1;
                        if (val > product.quantity) val = product.quantity;
                        setQuantity(val);
                      }}
                      className="w-16 text-center border border-gray-300 rounded-md py-1"
                      disabled={!isInStock}
                    />
                    <button
                      onClick={() => updateQuantity(1)}
                      disabled={!isInStock || quantity >= product.quantity}
                      className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-500 ml-2">{product.quantity} available</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={!isInStock || isAddingToCart}
                    className="flex-1 bg-[#FFC72C] text-black py-3 rounded-full font-semibold hover:bg-[#e5b300] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAddingToCart ? (
                      <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> Adding...</>
                    ) : (
                      <><i className="bi bi-cart-plus mr-2"></i>Add to Cart</>
                    )}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={!isInStock || isAddingToCart}
                    className="flex-1 bg-[#00A9B0] text-white py-3 rounded-full font-semibold hover:bg-[#008c92] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAddingToCart ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</>
                    ) : (
                      <>Buy Now</>
                    )}
                  </button>
                </div>
                
                {/* Additional Info */}
                <div className="mt-6 text-sm text-gray-500 space-y-2">
                  <div><i className="bi bi-truck mr-2"></i> Free delivery on orders over $50</div>
                  <div><i className="bi bi-arrow-return-left mr-2"></i> 30-day easy returns</div>
                  <div><i className="bi bi-shield-check mr-2"></i> Secure transaction</div>
                  <div><i className="bi bi-tag mr-2"></i> SKU: {product.sku || product._id?.slice(-8)}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs Section */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'description'
                    ? 'text-[#00A9B0] border-b-2 border-[#00A9B0]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Product Description
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'features'
                    ? 'text-[#00A9B0] border-b-2 border-[#00A9B0]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Features & Details
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'text-[#00A9B0] border-b-2 border-[#00A9B0]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Customer Reviews ({reviewStats.total})
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === 'description' && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Product Description</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description || 'No description available.'}
                  </p>
                </div>
              )}
              
              {activeTab === 'features' && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Product Details</h3>
                  {product.features && product.features.length > 0 ? (
                    <ul className="space-y-2">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <i className="bi bi-check-circle-fill text-[#00A9B0] text-sm mt-0.5"></i>
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No features listed.</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      <strong>Category:</strong> <Link to={`/products?category=${product.category?.slug}`} className="text-[#00A9B0] hover:underline capitalize">
                        {product.category?.name || 'Products'}
                      </Link>
                    </p>
                    {product.brand && (
                      <p className="text-sm text-gray-500 mt-1">
                        <strong>Brand:</strong> {product.brand}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'reviews' && (
                <div>
                  {/* Review Summary */}
                  <div className="flex flex-col md:flex-row gap-6 mb-8 pb-6 border-b border-gray-200">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-[#00A9B0]">{reviewStats.average.toFixed(1)}</div>
                      <StarRating rating={reviewStats.average} size="sm" />
                      <div className="text-sm text-gray-500 mt-1">{reviewStats.total} ratings</div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewStats.distribution[star] || 0;
                        const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-sm">
                            <span className="w-12">{star} ★</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-[#FFC72C] rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="w-12 text-gray-500">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="bg-[#00A9B0] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#008c92] transition-colors"
                      >
                        Write a Review
                      </button>
                    </div>
                  </div>
                  
                  {/* Reviews List */}
                  <div className="space-y-6">
                    {reviews.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this product!</p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review._id} className="border-b border-gray-100 pb-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold">{review.userName || 'Anonymous'}</div>
                              <StarRating rating={review.rating} size="sm" />
                            </div>
                            <div className="text-sm text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {review.title && (
                            <h4 className="font-semibold mt-2">{review.title}</h4>
                          )}
                          <p className="text-gray-600 mt-1">{review.comment}</p>
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {review.images.map((img, idx) => (
                                <img key={idx} src={img} alt="" className="w-16 h-16 object-cover rounded" />
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => handleHelpful(review._id)}
                            className="text-sm text-gray-500 hover:text-[#00A9B0] mt-2"
                          >
                            <i className="bi bi-hand-thumbs-up mr-1"></i> Helpful ({review.helpful || 0})
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Related Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((item) => {
                  const itemPrice = item.discountedPrice || item.price;
                  return (
                    <Link key={item._id} to={`/product/${item.slug}?id=${item._id}`} className="group">
                      <div className="border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-all">
                        <img 
                          src={item.images?.[0]?.url || 'https://picsum.photos/200/200'} 
                          alt={item.name} 
                          className="w-full h-32 object-cover rounded-lg mb-2" 
                        />
                        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-[#00A9B0]">{item.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <i className="bi bi-star-fill text-[#FFC72C] text-xs"></i>
                          <span className="text-xs">{item.averageRating || 4.5}</span>
                        </div>
                        <div className="text-[#00A9B0] font-bold mt-1">${itemPrice}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Review Modal */}
      {showReviewModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowReviewModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Write a Review</h3>
                <button onClick={() => setShowReviewModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Rating</label>
                  <StarRating 
                    rating={reviewForm.rating} 
                    size="md" 
                    interactive={true} 
                    onChange={(val) => setReviewForm({ ...reviewForm, rating: val })} 
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Review Title (Optional)</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    placeholder="Summarize your experience"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Review *</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    placeholder="Share your experience with this product"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-[#00A9B0] text-white py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ProductDetailPage;