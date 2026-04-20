import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { productService, categoryService } from '../services/api';
import { heroService } from '../services/api';
import { SafeHelmet } from '../components/common/SafeHelmet';

const HomePage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [dealsProducts, setDealsProducts] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch hero slides
        const heroRes = await heroService.getHeroSlides();
        if (heroRes.success && heroRes.slides && heroRes.slides.length > 0) {
          setHeroSlides(heroRes.slides);
        } else {
          // Default fallback slides
          setHeroSlides([
            {
              _id: '1',
              title: 'Biggest Sale of the Year',
              subtitle: 'Up to 50% off on electronics',
              image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=650&fit=crop',
              ctaLink: '/products?category=electronics-accessories',
              ctaText: 'Shop Now',
            },
            {
              _id: '2',
              title: 'Fashion Week',
              subtitle: 'New arrivals from top brands',
              image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=650&fit=crop',
              ctaLink: '/products?category=clothes',
              ctaText: 'Shop Now',
            },
            {
              _id: '3',
              title: 'Home & Furniture',
              subtitle: 'Transform your space',
              image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=650&fit=crop',
              ctaLink: '/products?category=furniture',
              ctaText: 'Shop Now',
            },
          ]);
        }

        // Fetch categories
        const categoriesRes = await categoryService.getAll();
        if (categoriesRes.success) {
          setCategories(categoriesRes.categories || []);
        }

        // Fetch deals products
        const dealsRes = await productService.getDealsProducts(12);
        if (dealsRes.success) {
          setDealsProducts(dealsRes.products || []);
        }

        // Fetch all products for categories
        const productsRes = await productService.getProducts({ limit: 100 });
        if (productsRes.success) {
          setProducts(productsRes.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get hero product for a category (first product that is featured)
  const getCategoryHeroProduct = useCallback((categoryId) => {
    const categoryProducts = products.filter(p => 
      (p.category?._id === categoryId || p.category === categoryId) && p.isActive
    );
    const featuredProduct = categoryProducts.find(p => p.isFeatured);
    return featuredProduct || categoryProducts[0];
  }, [products]);

  // Get products for category carousel
  const getCategoryProducts = useCallback((categoryId) => {
    const categoryProducts = products.filter(p => 
      (p.category?._id === categoryId || p.category === categoryId) && p.isActive
    );
    return categoryProducts.slice(0, 10);
  }, [products]);

  // Carousel scroll function
  const scroll = (containerId, direction) => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Navigate to product detail page
  const goToProduct = (productId, productName) => {
    if (!productId) return;
    const slug = productName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'product';
    navigate(`/product/${slug}?id=${productId}`);
  };

  // Handle add to cart with loading state
  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!product || addingToCart[product._id]) return;
    
    setAddingToCart(prev => ({ ...prev, [product._id]: true }));
    try {
      await addToCart(product, 1, null);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setTimeout(() => {
        setAddingToCart(prev => ({ ...prev, [product._id]: false }));
      }, 500);
    }
  };

  // Auto-slide effect for hero
  useEffect(() => {
    if (!heroSlides.length) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const goToSlide = (index) => setCurrentSlide(index);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);

  // Star rating component
  const StarRating = ({ rating }) => {
    const displayRating = rating || 4.5;
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <i key={i} className={`bi bi-star${i < fullStars ? '-fill' : hasHalfStar && i === fullStars ? '-half' : ''} text-[#FFC72C] text-xs`}></i>
        ))}
        <span className="text-xs text-gray-500 ml-1">({Math.floor(displayRating * 100)})</span>
      </div>
    );
  };

  // Product Card Component with Add to Cart
  const ProductCard = ({ product }) => {
    if (!product) return null;
    const displayPrice = product.discountedPrice || product.price;
    const originalPrice = product.price > displayPrice ? product.price : null;
    const isAdding = addingToCart[product._id];

    return (
      <div 
        onClick={() => goToProduct(product._id, product.name)}
        className="flex-shrink-0 w-[160px] md:w-[200px] bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-2 cursor-pointer border border-gray-100 hover:border-[#00A9B0] flex flex-col h-full"
      >
        <div className="flex-1">
          <img
            src={product.images?.[0]?.url || product.image || 'https://picsum.photos/200/200'}
            alt={product.name || 'Product'}
            className="w-full h-28 md:h-32 object-cover rounded-lg mb-2"
            loading="lazy"
          />
          <div className="font-medium text-xs md:text-sm line-clamp-2 mb-1">{product.name || 'Product'}</div>
          <StarRating rating={product.averageRating || product.rating || 4.5} />
          <div className="mt-1">
            <span className="text-[#00A9B0] font-bold text-sm md:text-base">${displayPrice?.toFixed(2) || '0.00'}</span>
            {originalPrice && (
              <span className="text-gray-400 text-xs line-through ml-1">${originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => handleAddToCart(product, e)}
          disabled={isAdding}
          className="mt-2 w-full bg-[#FFC72C] text-black text-xs py-1.5 rounded-full font-semibold hover:bg-[#e5b300] transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {isAdding ? (
            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <><i className="bi bi-cart-plus"></i> Add to Cart</>
          )}
        </button>
      </div>
    );
  };

  // Hero Product Card Component
  const HeroProductCard = ({ product, categoryName }) => {
    if (!product) return null;
    const displayPrice = product.discountedPrice || product.price;
    const originalPrice = product.price > displayPrice ? product.price : null;
    
    return (
      <div 
        className="relative rounded-xl overflow-hidden group cursor-pointer" 
        onClick={() => goToProduct(product._id, product.name)}
      >
        <img 
          src={product.images?.[0]?.url || product.image || 'https://picsum.photos/800/400'} 
          alt={product.name || 'Product'} 
          className="w-full h-48 md:h-64 object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="text-xs text-[#FFC72C] mb-1">{categoryName || 'Category'}</div>
          <h3 className="font-bold text-lg md:text-xl mb-1">{product.name || 'Product'}</h3>
          <p className="text-sm text-white/80 line-clamp-2 mb-2 hidden md:block">{product.shortDescription || product.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">${displayPrice?.toFixed(2) || '0.00'}</span>
            {originalPrice && (
              <>
                <span className="text-sm text-white/60 line-through">${originalPrice.toFixed(2)}</span>
                <span className="text-xs bg-red-500 px-1.5 py-0.5 rounded">
                  -{Math.round((1 - displayPrice / originalPrice) * 100)}%
                </span>
              </>
            )}
          </div>
          <StarRating rating={product.averageRating || 4.5} />
          <button className="mt-3 bg-[#FFC72C] text-black px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-[#e5b300] transition-colors">
            Shop Now →
          </button>
        </div>
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
  <title>Mall242 - Bahamas Premier Digital Mall | Shop Fashion, Electronics & More</title>
</Helmet>

      {/* Hero Carousel */}
      {heroSlides.length > 0 && (
        <div className="relative w-full overflow-hidden">
          <div className="relative h-[400px] md:h-[600px] lg:h-[650px]">
            {heroSlides.map((slide, index) => (
              <div
                key={slide._id}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                >
                  <div className="absolute inset-0 bg-black/30"></div>
                  <div className="absolute bottom-[20%] left-[10%] text-white max-w-[80%]">
                    <h2 className="text-2xl md:text-4xl font-bold mb-2">{slide.title}</h2>
                    <p className="text-sm md:text-base mb-4">{slide.subtitle}</p>
                    <Link
                      to={slide.ctaLink || '/products'}
                      className="inline-flex items-center gap-2 px-4 md:px-6 py-2 rounded-full font-semibold text-sm md:text-base transition-colors"
                      style={{ backgroundColor: slide.buttonColor || '#FFC72C', color: slide.textColor || 'black' }}
                    >
                      {slide.ctaText || 'Shop Now'} <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {heroSlides.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-md transition-all z-10 text-xl md:text-2xl font-bold"
              >
                &lt;
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-md transition-all z-10 text-xl md:text-2xl font-bold"
              >
                &gt;
              </button>

              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide ? 'w-6 bg-[#00A9B0]' : 'w-2 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="container-custom py-6 md:py-8">
        {/* Shop by Department - Categories with icons */}
        <section className="mb-10 md:mb-12">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <i className="bi bi-grid text-[#00A9B0] text-xl"></i>
            Shop by Department
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <img
                  src={cat.image || "https://picsum.photos/300/300"}
                  alt={cat.name}
                  className="w-full h-28 md:h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-center gap-1">
                  <i className={`${cat.icon || 'bi-grid'} text-white text-sm`}></i>
                  <span className="text-xs md:text-sm text-center font-semibold text-white block drop-shadow-md">
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Today's Deals Section */}
        {dealsProducts.length > 0 && (
          <section className="mb-10 md:mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <i className="bi bi-tag text-[#00A9B0] text-xl"></i>
                Today's Deals
              </h2>
              <Link to="/products?section=deals" className="text-xs md:text-sm text-[#00A9B0] hover:underline">View All →</Link>
            </div>
            
            <div className="relative group">
              <button
                onClick={() => scroll('dealsScroll', 'left')}
                className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg transition-all border border-gray-200 text-sm md:text-xl font-bold"
              >
                &lt;
              </button>
              
              <div
                id="dealsScroll"
                className="flex gap-3 md:gap-5 overflow-x-auto scroll-smooth pb-4"
                style={{ scrollbarWidth: 'thin', msOverflowStyle: 'auto' }}
              >
                {dealsProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              
              <button
                onClick={() => scroll('dealsScroll', 'right')}
                className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg transition-all border border-gray-200 text-sm md:text-xl font-bold"
              >
                &gt;
              </button>
            </div>
          </section>
        )}

        {/* Category Product Sections with Hero Product + Carousel */}
        {categories.map((category) => {
          const heroProduct = getCategoryHeroProduct(category._id);
          const categoryProducts = getCategoryProducts(category._id);
          if (categoryProducts.length === 0) return null;
          
          return (
            <section key={category._id} className="mb-10 md:mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <i className={`${category.icon || 'bi-grid'} text-[#00A9B0] text-xl`}></i>
                  {category.name}
                </h2>
                <Link to={`/products?category=${category.slug}`} className="text-xs md:text-sm text-[#00A9B0] hover:underline">View All →</Link>
              </div>
              
              {/* Hero Product - Large featured product for this category */}
              {heroProduct && (
                <div className="mb-4 md:mb-6">
                  <HeroProductCard product={heroProduct} categoryName={category.name} />
                </div>
              )}
              
              {/* Product Carousel */}
              <div className="relative group">
                <button
                  onClick={() => scroll(`categoryScroll-${category._id}`, 'left')}
                  className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg transition-all border border-gray-200 text-sm md:text-xl font-bold"
                >
                  &lt;
                </button>
                
                <div
                  id={`categoryScroll-${category._id}`}
                  className="flex gap-3 md:gap-5 overflow-x-auto scroll-smooth pb-4"
                  style={{ scrollbarWidth: 'thin', msOverflowStyle: 'auto' }}
                >
                  {categoryProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                
                <button
                  onClick={() => scroll(`categoryScroll-${category._id}`, 'right')}
                  className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg transition-all border border-gray-200 text-sm md:text-xl font-bold"
                >
                  &gt;
                </button>
              </div>
            </section>
          );
        })}

        {/* Mystery Drop Section */}
        <section className="mb-10 md:mb-12">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <i className="bi bi-question-circle text-[#00A9B0] text-xl"></i> Mystery Drop
          </h2>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 md:p-6 text-center">
              <div className="bg-white/10 backdrop-blur-sm w-20 h-20 md:w-32 md:h-32 mx-auto rounded-full flex items-center justify-center mb-3 md:mb-4">
                <i className="bi bi-question-lg text-3xl md:text-5xl text-white/70"></i>
              </div>
              <h3 className="text-white text-lg md:text-xl font-bold mb-1 md:mb-2">??? Major Brand Coming</h3>
              <p className="text-gray-300 text-xs md:text-sm mb-3 md:mb-4">Sign up to reveal the mystery brand</p>
              <Link to="/mystery-drop" className="inline-flex items-center gap-2 bg-[#FFC72C] text-black px-4 md:px-6 py-1.5 md:py-2 rounded-full font-semibold text-sm md:text-base hover:bg-[#e5b300] transition-colors">
                Sign up to reveal <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 md:p-6 text-center">
              <div className="bg-white/10 backdrop-blur-sm w-20 h-20 md:w-32 md:h-32 mx-auto rounded-full flex items-center justify-center mb-3 md:mb-4">
                <i className="bi bi-question-lg text-3xl md:text-5xl text-white/70"></i>
              </div>
              <h3 className="text-white text-lg md:text-xl font-bold mb-1 md:mb-2">??? Luxury Brand</h3>
              <p className="text-gray-300 text-xs md:text-sm mb-3 md:mb-4">Get early access to exclusive deals</p>
              <Link to="/mystery-drop" className="inline-flex items-center gap-2 bg-[#FFC72C] text-black px-4 md:px-6 py-1.5 md:py-2 rounded-full font-semibold text-sm md:text-base hover:bg-[#e5b300] transition-colors">
                Sign up to reveal <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </section>

        {/* VIP Referral Banner */}
        <section className="mb-10 md:mb-12 bg-gradient-to-r from-[#00A9B0] via-[#FFC72C] to-black rounded-xl p-4 md:p-8 text-white">
          <div className="text-center">
            <i className="bi bi-gem text-3xl md:text-4xl mb-2 md:mb-3 inline-block"></i>
            <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Unlock VIP Early Access</h2>
            <p className="text-white/90 text-xs md:text-sm mb-4 md:mb-6 max-w-2xl mx-auto">
              Invite friends to Mall242 and unlock exclusive rewards. The more friends you refer, the better it gets!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6 max-w-3xl mx-auto">
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 md:p-3">
                <div className="text-xl md:text-2xl font-bold">1</div>
                <div className="text-xs md:text-sm">Friend</div>
                <div className="text-[10px] md:text-xs">Early Access</div>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 md:p-3">
                <div className="text-xl md:text-2xl font-bold">3</div>
                <div className="text-xs md:text-sm">Friends</div>
                <div className="text-[10px] md:text-xs">15% Off Code</div>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 md:p-3">
                <div className="text-xl md:text-2xl font-bold">5</div>
                <div className="text-xs md:text-sm">Friends</div>
                <div className="text-[10px] md:text-xs">Giveaway Entry</div>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 md:p-3">
                <div className="text-xl md:text-2xl font-bold">10+</div>
                <div className="text-xs md:text-sm">Friends</div>
                <div className="text-[10px] md:text-xs">VIP Status</div>
              </div>
            </div>
            <Link to="/referral" className="inline-flex items-center gap-2 bg-white text-[#00A9B0] px-4 md:px-6 py-1.5 md:py-2 rounded-full font-semibold text-sm md:text-base hover:bg-gray-100 transition-colors">
              Get Your Referral Link <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;