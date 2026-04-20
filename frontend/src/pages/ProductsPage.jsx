import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productService, categoryService } from '../services/api';
import { SafeHelmet } from '../components/common/SafeHelmet';

// Price Slider Component
const PriceSlider = ({ priceRange, setPriceRange }) => {
  const handleChange = (e) => {
    const value = parseInt(e.target.value);
    setPriceRange(prev => ({ ...prev, max: value }));
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>${priceRange.min}</span>
        <span>${priceRange.max}</span>
      </div>
      <input
        type="range"
        min="0"
        max="1000"
        value={priceRange.max}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00A9B0]"
      />
    </div>
  );
};

// Star Rating Component
const StarRating = ({ rating, size = 'sm' }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const starSize = size === 'sm' ? 'text-xs' : 'text-sm';
  
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <i key={i} className={`bi bi-star${i < fullStars ? '-fill' : hasHalfStar && i === fullStars ? '-half' : ''} text-[#FFC72C] ${starSize}`}></i>
      ))}
      <span className={`text-gray-500 ${starSize} ml-1`}>{rating}</span>
    </div>
  );
};

// Brand data for each category
const categoryBrands = {
  'bags-luggage': ['Samsonite', 'Tumi', 'Rimowa', 'American Tourister', 'Travelpro', 'Herschel Supply Co.', 'Eastpak', 'JanSport', 'Béis', 'Carl Friedrik', 'Victorinox'],
  'bikes': ['Trek', 'Giant', 'Specialized', 'Cannondale', 'Scott', 'Santa Cruz', 'Bianchi', 'Merida', 'Cube', 'Pinarello'],
  'clothes': ['Nike', 'Adidas', 'Zara', 'H&M', 'Gucci', 'Louis Vuitton', 'Prada', 'Burberry', 'Balenciaga', "Levi's"],
  'electronics-accessories': ['Apple', 'Samsung', 'Sony', 'LG', 'Panasonic', 'Dell', 'HP', 'Lenovo', 'Xiaomi', 'Huawei'],
  'shoes': ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Vans', 'Converse', 'Timberland', 'Clarks'],
  'mens-wear': ['Hugo Boss', 'Armani', 'Ralph Lauren', 'Tom Ford', 'Brooks Brothers', 'Calvin Klein'],
  'doors-windows': ['Andersen Windows', 'Pella', 'JELD-WEN', 'Marvin Windows', 'VELUX', 'YKK AP'],
  'furniture': ['IKEA', 'Ashley Furniture', 'Herman Miller', 'Steelcase', 'La-Z-Boy', 'Kartell', 'Restoration Hardware'],
  'all': ['Nike', 'Adidas', 'Apple', 'Samsung', 'Gucci', 'Prada', 'Trek', 'Samsonite', 'IKEA', 'Hugo Boss']
};

// Product Grid Card Component
const ProductGridCard = ({ product, onAddToCart, addingToCart }) => {
  const displayPrice = product.discountedPrice || product.price;
  const originalPrice = product.price > displayPrice ? product.price : null;
  const discountPercent = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
  const isAdding = addingToCart[product._id];

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group flex flex-col h-full">
      <Link to={`/product/${product.slug}?id=${product._id}`} className="block">
        <div className="relative">
          <img
            src={product.images?.[0]?.url || 'https://picsum.photos/300/300'}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {discountPercent > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discountPercent}%
            </div>
          )}
          {product.isPrime && (
            <div className="absolute top-2 right-2 bg-[#00A9B0] text-white text-xs font-bold px-2 py-1 rounded">
              <i className="bi bi-star-fill text-xs mr-1"></i>VIP
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="text-xs text-gray-500 mb-1">{product.brand || 'Mall242'}</div>
          <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-[#00A9B0] transition-colors">
            {product.name}
          </h3>
          <StarRating rating={product.averageRating || 4.5} size="sm" />
          <div className="mt-2">
            <span className="text-[#00A9B0] font-bold text-lg">${displayPrice}</span>
            {originalPrice && (
              <span className="text-gray-400 text-sm line-through ml-2">${originalPrice}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3 mt-auto">
        <button
          onClick={(e) => onAddToCart(product, e)}
          disabled={isAdding}
          className="w-full bg-[#FFC72C] text-black py-2 rounded-full text-sm font-semibold hover:bg-[#e5b300] transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {isAdding ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <><i className="bi bi-cart-plus"></i> Add to Cart</>
          )}
        </button>
      </div>
    </div>
  );
};

// Product List Card Component
const ProductListCard = ({ product, onAddToCart, addingToCart }) => {
  const displayPrice = product.discountedPrice || product.price;
  const originalPrice = product.price > displayPrice ? product.price : null;
  const isAdding = addingToCart[product._id];
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col sm:flex-row group">
      <Link to={`/product/${product.slug}?id=${product._id}`} className="relative sm:w-48 flex-shrink-0">
        <img
          src={product.images?.[0]?.url || 'https://picsum.photos/300/300'}
          alt={product.name}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        {originalPrice && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{Math.round((1 - displayPrice / originalPrice) * 100)}%
          </div>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start flex-wrap gap-2 flex-1">
          <div>
            <Link to={`/product/${product.slug}?id=${product._id}`}>
              <div className="text-sm text-gray-500 mb-1">{product.brand || 'Mall242'}</div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-[#00A9B0] transition-colors">
                {product.name}
              </h3>
            </Link>
            <StarRating rating={product.averageRating || 4.5} size="sm" />
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.shortDescription || product.description}</p>
          </div>
          <div className="text-right">
            <div className="text-[#00A9B0] font-bold text-2xl">${displayPrice}</div>
            {originalPrice && (
              <div className="text-gray-400 text-sm line-through">${originalPrice}</div>
            )}
            {product.isPrime && (
              <div className="text-[#00A9B0] text-xs font-semibold mt-1">
                <i className="bi bi-star-fill text-xs mr-1"></i>VIP Exclusive
              </div>
            )}
          </div>
        </div>
        <button
          onClick={(e) => onAddToCart(product, e)}
          disabled={isAdding}
          className="mt-3 bg-[#FFC72C] text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#e5b300] transition-colors disabled:opacity-50 flex items-center justify-center gap-1 w-full sm:w-auto"
        >
          {isAdding ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <><i className="bi bi-cart-plus"></i> Add to Cart</>
          )}
        </button>
      </div>
    </div>
  );
};

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [addingToCart, setAddingToCart] = useState({});
  
  // Active filters (applied immediately)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Get brands for selected category
  const brandsForCategory = categoryBrands[selectedCategory] || categoryBrands['all'];

  // Handle Add to Cart
  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (addingToCart[product._id]) return;
    
    setAddingToCart(prev => ({ ...prev, [product._id]: true }));
    try {
      await addToCart(product, 1, null);
    } finally {
      setTimeout(() => {
        setAddingToCart(prev => ({ ...prev, [product._id]: false }));
      }, 500);
    }
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll();
        if (res.success) {
          setCategories([
            { name: "All Categories", slug: "all", _id: "all" },
            ...(res.categories || [])
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products function
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page: currentPage,
        limit: 20,
        sort: sortBy === 'price-low' ? 'price' : sortBy === 'price-high' ? '-price' : sortBy === 'rating' ? '-averageRating' : '-createdAt',
      };
      
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (priceRange.max < 1000) filters.maxPrice = priceRange.max;
      if (selectedRating > 0) filters.rating = selectedRating;
      if (selectedBrands.length > 0) filters.brand = selectedBrands.join(',');
      
      const res = await productService.getProducts(filters);
      if (res.success) {
        setProducts(res.products || []);
        setTotalPages(res.totalPages || 1);
        setTotalProducts(res.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, priceRange.max, selectedRating, sortBy, currentPage, selectedBrands]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryClick = (categorySlug) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
    setSelectedBrands([]);
  };

  const toggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrands([]);
    setPriceRange({ min: 0, max: 1000 });
    setSelectedRating(0);
    setCurrentPage(1);
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
<Helmet>
  <title>Shop All Products | Mall242</title>
</Helmet>

      <div className="bg-gray-50 min-h-screen">
        <div className="container-custom py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-[#00A9B0]">Home</Link>
            <i className="bi bi-chevron-right text-xs"></i>
            <span className="text-gray-800">Products</span>
            {selectedCategory !== 'all' && (
              <>
                <i className="bi bi-chevron-right text-xs"></i>
                <span className="text-gray-800 capitalize">{selectedCategory?.replace('-', ' ')}</span>
              </>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-200">Filters</h3>
                
                {/* Category Filter */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Category</h4>
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => handleCategoryClick(cat.slug)}
                        className={`w-full text-left px-2 py-1 rounded-md transition-colors ${
                          selectedCategory === cat.slug ? 'bg-[#00A9B0]/10 text-[#00A9B0] font-medium' : 'hover:bg-gray-50'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Price Range</h4>
                  <PriceSlider priceRange={priceRange} setPriceRange={setPriceRange} />
                </div>

                {/* Brands - Based on selected category */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Brands</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                    {brandsForCategory.map((brand) => (
                      <label key={brand} className="flex items-center gap-2 cursor-pointer hover:text-[#00A9B0]">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="w-4 h-4 rounded accent-[#00A9B0]"
                        />
                        <span className="text-sm">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Customer Rating */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Customer Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((stars) => (
                      <label key={stars} className="flex items-center gap-2 cursor-pointer hover:text-[#00A9B0]">
                        <input
                          type="radio"
                          name="rating-filter"
                          checked={selectedRating === stars}
                          onChange={() => setSelectedRating(selectedRating === stars ? 0 : stars)}
                          className="w-4 h-4 accent-[#00A9B0]"
                        />
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <i 
                              key={i} 
                              className={`bi bi-star${i < stars ? '-fill' : ''} ${i < stars ? 'text-[#FFC72C]' : 'text-gray-300'} text-sm`}
                            ></i>
                          ))}
                          <span className="text-sm text-gray-500 ml-1">& Up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(selectedCategory !== 'all' || selectedBrands.length > 0 || selectedRating > 0 || priceRange.max < 1000) && (
                  <button
                    onClick={clearFilters}
                    className="w-full mt-4 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Mobile Filter Button */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-full py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2"
                >
                  <i className="bi bi-funnel"></i>
                  Filters & Sorting
                </button>
              </div>

              {/* Results Header */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="font-semibold">{totalProducts}</span>
                    <span className="text-gray-500"> results found</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    >
                      <option value="featured">Sort by: Featured</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Avg. Customer Rating</option>
                      <option value="-createdAt">Newest Arrivals</option>
                    </select>

                    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 px-3 ${viewMode === 'grid' ? 'bg-[#00A9B0] text-white' : 'bg-white text-gray-600'}`}
                      >
                        <i className="bi bi-grid-3x3-gap-fill"></i>
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 px-3 ${viewMode === 'list' ? 'bg-[#00A9B0] text-white' : 'bg-white text-gray-600'}`}
                      >
                        <i className="bi bi-list-ul"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Grid/List */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-12 h-12 border-4 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <i className="bi bi-inbox text-6xl text-gray-300 mb-4 block"></i>
                  <h3 className="text-xl font-semibold mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters or search terms.</p>
                  <button
                    onClick={clearFilters}
                    className="text-[#00A9B0] hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductGridCard 
                      key={product._id} 
                      product={product} 
                      onAddToCart={handleAddToCart}
                      addingToCart={addingToCart}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <ProductListCard 
                      key={product._id} 
                      product={product} 
                      onAddToCart={handleAddToCart}
                      addingToCart={addingToCart}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                      &lt;
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 3 + i;
                        if (pageNum > totalPages) return null;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-md ${
                            currentPage === pageNum
                              ? 'bg-[#00A9B0] text-white'
                              : 'border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed top-0 left-0 w-80 h-full bg-white z-50 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-bold text-lg">Filters</h3>
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="p-4">
              {/* Category Filter - Mobile */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Category</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded-md transition-colors ${
                        selectedCategory === cat.slug ? 'bg-[#00A9B0]/10 text-[#00A9B0] font-medium' : 'hover:bg-gray-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range - Mobile */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Price Range</h4>
                <PriceSlider priceRange={priceRange} setPriceRange={setPriceRange} />
              </div>

              {/* Brands - Mobile */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Brands</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {brandsForCategory.map((brand) => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="w-4 h-4 rounded accent-[#00A9B0]"
                      />
                      <span className="text-sm">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Customer Rating - Mobile */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Customer Rating</h4>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((stars) => (
                    <label key={stars} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rating-mobile"
                        checked={selectedRating === stars}
                        onChange={() => setSelectedRating(selectedRating === stars ? 0 : stars)}
                        className="w-4 h-4 accent-[#00A9B0]"
                      />
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <i 
                            key={i} 
                            className={`bi bi-star${i < stars ? '-fill' : ''} ${i < stars ? 'text-[#FFC72C]' : 'text-gray-300'} text-sm`}
                          ></i>
                        ))}
                        <span className="text-sm text-gray-500 ml-1">& Up</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters - Mobile */}
              {(selectedCategory !== 'all' || selectedBrands.length > 0 || selectedRating > 0 || priceRange.max < 1000) && (
                <button
                  onClick={clearFilters}
                  className="w-full mt-4 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ProductsPage;