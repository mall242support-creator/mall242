import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Sidebar from './Sidebar';
import AiChatModal from './AiChatModal';
import SearchAutocomplete from '../common/SearchAutocomplete';

const Header = () => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [user, setUser] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setTimeout(() => setUser(parsedUser), 0);
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('temp_auth');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      navigate(`/products?search=${encodeURIComponent(searchQuery)}${categoryParam}`);
    }
  };

  const handleCategorySelect = (categorySlug) => {
    setSelectedCategory(categorySlug);
    if (categorySlug !== 'all') {
      navigate(`/products?category=${categorySlug}`);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const categories = [
    { name: "All", slug: "all" },
    { name: "Bags & Luggage", slug: "bags-luggage" },
    { name: "Bikes", slug: "bikes" },
    { name: "Clothes", slug: "clothes" },
    { name: "Doors & Windows", slug: "doors-windows" },
    { name: "Electronics", slug: "electronics-accessories" },
    { name: "Furniture", slug: "furniture" },
    { name: "Mens Wear", slug: "mens-wear" },
    { name: "Shoes", slug: "shoes" },
  ];

  const languages = [
    { code: "EN", name: "English" },
    { code: "ES", name: "Español" },
    { code: "FR", name: "Français" },
    { code: "PT", name: "Português" },
    { code: "ZH", name: "中文" },
  ];

  const getSelectedCategoryName = () => {
    const cat = categories.find(c => c.slug === selectedCategory);
    return cat ? cat.name : "All";
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    return '/account';
  };

  const handleSearchSubmit = (searchTerm) => {
    const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
    navigate(`/products?search=${encodeURIComponent(searchTerm)}${categoryParam}`);
  };

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <AiChatModal isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
      
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container-custom">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center py-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-md transition-colors mr-1"
            >
              <i className="bi bi-list text-2xl"></i>
            </button>

            <Link to="/" className="flex-shrink-0 mr-4">
              <img src="/mall242logo.jpeg" alt="Mall242" className="h-16 md:h-20 w-auto object-contain" />
            </Link>

            {/* Search Autocomplete */}
            <div className="flex-1 max-w-2xl ml-auto mr-4">
              <div className="flex w-full h-10">
                <div className="relative group h-full">
                  <button
                    type="button"
                    className="flex items-center gap-1 px-4 h-full bg-gray-100 border border-gray-300 rounded-l-md hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    {getSelectedCategoryName()} <i className="bi bi-chevron-down text-xs"></i>
                  </button>
                  <div className="absolute top-full left-0 mt-0 w-48 bg-white shadow-lg rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-gray-200">
                    {categories.map((cat) => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => handleCategorySelect(cat.slug)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          selectedCategory === cat.slug ? 'bg-gray-100 text-[#00A9B0]' : ''
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <SearchAutocomplete onSearch={handleSearchSubmit} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className="flex items-center gap-1 hover:text-[#00A9B0] transition-colors px-2 py-1"
                >
                  <i className="bi bi-flag-fill text-[#00A9B0] text-lg"></i>
                  <span className="text-sm font-medium">{selectedLanguage}</span>
                  <i className="bi bi-chevron-down text-xs"></i>
                </button>
                {isCountryDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCountryDropdownOpen(false)} />
                    <div className="absolute top-full right-0 mt-1 w-56 bg-white shadow-lg rounded-md z-50 border border-gray-200 py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-500">Select Language</span>
                      </div>
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLanguage(lang.code);
                            setIsCountryDropdownOpen(false);
                          }}
                          className={`flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 transition-colors text-left ${
                            selectedLanguage === lang.code ? 'bg-gray-100 text-[#00A9B0]' : ''
                          }`}
                        >
                          <i className="bi bi-flag-fill text-[#00A9B0] text-lg"></i>
                          <div>
                            <div className="text-sm font-medium">{lang.name}</div>
                            <div className="text-xs text-gray-500">{lang.code}</div>
                          </div>
                          {selectedLanguage === lang.code && <i className="bi bi-check-lg ml-auto text-[#00A9B0]"></i>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Account & Lists */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex flex-col items-start hover:text-[#00A9B0] transition-colors"
                  >
                    <span className="text-xs text-gray-500">Hello, {user?.name?.split(' ')[0]}</span>
                    <span className="text-sm font-semibold flex items-center gap-1">
                      Account & Lists <i className="bi bi-chevron-down text-xs"></i>
                    </span>
                  </button>
                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute top-full right-0 mt-1 w-64 bg-white shadow-lg rounded-md z-50 border border-gray-200 py-2">
                        <Link to={getDashboardLink()} className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                          <i className="bi bi-speedometer2 mr-2"></i> Dashboard
                        </Link>
                        {!isAdmin && (
                          <>
                            <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                              <i className="bi bi-box-seam mr-2"></i> Your Orders
                            </Link>
                            <Link to="/wishlist" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                              <i className="bi bi-heart mr-2"></i> Your Wishlist
                            </Link>
                            <Link to="/referral" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                              <i className="bi bi-gem mr-2"></i> VIP Rewards
                            </Link>
                            <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                              <i className="bi bi-gear mr-2"></i> Settings
                            </Link>
                          </>
                        )}
                        <div className="border-t border-gray-100 my-1"></div>
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                          <i className="bi bi-box-arrow-right mr-2"></i> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to="/login" className="flex flex-col items-start hover:text-[#00A9B0] transition-colors">
                  <span className="text-xs text-gray-500">Hello, sign in</span>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    Account & Lists <i className="bi bi-chevron-down text-xs"></i>
                  </span>
                </Link>
              )}

              <Link to="/orders" className="flex flex-col items-start hover:text-[#00A9B0] transition-colors">
                <span className="text-xs text-gray-500">Returns</span>
                <span className="text-sm font-semibold">& Orders</span>
              </Link>

              <Link to="/cart" className="flex items-center gap-1 hover:text-[#00A9B0] transition-colors relative">
                <i className="bi bi-cart text-2xl"></i>
                <span className="text-sm font-semibold">Cart</span>
                <span className="absolute -top-2 -right-3 bg-[#FFC72C] text-black text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Layout - Increased header size, functional oval search */}
          <div className="lg:hidden">
            {/* Top row with menu and cart */}
            <div className="flex items-center justify-between py-3">
              {/* Menu Button - LEFT */}
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-full transition-colors"
              >
                <i className="bi bi-list text-2xl"></i>
              </button>
              
              {/* Logo - CENTER - INCREASED SIZE */}
              <Link to="/" className="flex-shrink-0">
                <img src="/mall242logo.jpeg" alt="Mall242" className="h-12 w-auto" />
              </Link>
              
              {/* Cart Icon - RIGHT */}
              <Link to="/cart" className="relative flex items-center justify-center w-10 h-10 hover:text-[#00A9B0] transition-colors">
                <i className="bi bi-cart text-xl"></i>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FFC72C] text-black text-[10px] font-bold rounded-full px-1.5 min-w-[16px] text-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Search Bar - OVAL SHAPE with search icon inside (no orange background) */}
            <form onSubmit={handleSearch} className="py-2 pb-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-5 py-3 pl-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent text-base"
                />
                <button 
                  type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00A9B0] transition-colors"
                >
                  <i className="bi bi-search text-lg"></i>
                </button>
              </div>
            </form>
          </div>

          {/* Mobile Navigation Icons Row - Below the header (TOP 4) */}
          <div className="lg:hidden flex justify-around items-center py-2 border-t border-gray-100">
            <Link to="/" className="flex flex-col items-center gap-0.5 text-xs text-gray-600 hover:text-[#00A9B0]">
              <i className="bi bi-house-door text-base"></i>
              <span className="text-[10px]">Home</span>
            </Link>
            <Link to="/products" className="flex flex-col items-center gap-0.5 text-xs text-gray-600 hover:text-[#00A9B0]">
              <i className="bi bi-grid text-base"></i>
              <span className="text-[10px]">Shop</span>
            </Link>
            <Link to="/referral" className="flex flex-col items-center gap-0.5 text-xs text-gray-600 hover:text-[#00A9B0]">
              <i className="bi bi-gem text-base"></i>
              <span className="text-[10px]">VIP</span>
            </Link>
            <button onClick={() => setIsAiChatOpen(true)} className="flex flex-col items-center gap-0.5 text-xs text-gray-600 hover:text-[#00A9B0]">
              <i className="bi bi-robot text-base"></i>
              <span className="text-[10px]">AI</span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 py-2 border-t border-gray-100 overflow-x-auto">
            <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-1 text-sm font-medium hover:text-[#00A9B0] transition-colors">
              <i className="bi bi-grid"></i> All <i className="bi bi-chevron-down text-xs"></i>
            </button>
            <Link to="/products?section=deals" className="flex items-center gap-1 text-sm font-medium hover:text-[#00A9B0] transition-colors whitespace-nowrap">
              <i className="bi bi-tag text-[#00A9B0] text-sm"></i> Today's Deals
            </Link>
            <Link to="/mystery-drop" className="flex items-center gap-1 text-sm font-medium hover:text-[#00A9B0] transition-colors whitespace-nowrap">
              <i className="bi bi-question-circle text-[#00A9B0] text-sm"></i> Mystery Drop
            </Link>
            <Link to="/dream-mall" className="flex items-center gap-1 text-sm font-medium hover:text-[#00A9B0] transition-colors whitespace-nowrap">
              <i className="bi bi-building text-[#00A9B0] text-sm"></i> Build Mall
            </Link>
            <Link to="/referral" className="flex items-center gap-1 text-sm font-medium hover:text-[#00A9B0] transition-colors whitespace-nowrap">
              <i className="bi bi-gem text-[#00A9B0] text-sm"></i> VIP Rewards
            </Link>
            <Link to="/sell" className="flex items-center gap-1 text-sm font-medium hover:text-[#00A9B0] transition-colors whitespace-nowrap">
              <i className="bi bi-shop text-[#00A9B0] text-sm"></i> Sell
            </Link>
            <button onClick={() => setIsAiChatOpen(true)} className="flex items-center gap-1 text-sm font-medium hover:text-[#00A9B0] transition-colors whitespace-nowrap">
              <i className="bi bi-robot text-[#00A9B0] text-sm"></i> AI Assist
            </button>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;