import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/api';

const SearchAutocomplete = ({ onSearch, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Failed to load recent searches:', e);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Search products
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await productService.searchProducts(query, 1, 8);
        if (res.success) {
          setResults(res.products || []);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
        if (onClose) onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm);
      if (onSearch) onSearch(searchTerm);
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for products, brands, categories..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] focus:border-transparent pr-10"
          autoComplete="off"
        />
        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <i className="bi bi-x-circle"></i>
          </button>
        )}
      </div>

      {showDropdown && (
        <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {query.trim() === '' ? (
            // Recent Searches
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-500">RECENT SEARCHES</span>
                {recentSearches.length > 0 && (
                  <button onClick={clearRecentSearches} className="text-xs text-gray-400 hover:text-gray-600">
                    Clear
                  </button>
                )}
              </div>
              {recentSearches.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No recent searches</p>
              ) : (
                <div className="space-y-1">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(term);
                        handleSearch(term);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"
                    >
                      <i className="bi bi-clock-history text-gray-400"></i>
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-6 text-center">
              <i className="bi bi-search text-4xl text-gray-300 mb-2 block"></i>
              <p className="text-gray-500">No products found for "{query}"</p>
              <p className="text-sm text-gray-400 mt-1">Try different keywords or browse categories</p>
            </div>
          ) : (
            <>
              {/* Search Results */}
              <div className="p-2">
                {results.map((product) => (
                  <Link
                    key={product._id}
                    to={`/product/${product.slug}?id=${product._id}`}
                    onClick={() => {
                      saveRecentSearch(query);
                      setShowDropdown(false);
                      if (onClose) onClose();
                    }}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <img
                      src={product.images?.[0]?.url || 'https://picsum.photos/50/50'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm line-clamp-1">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.brand || 'Mall242'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#00A9B0] text-sm">
                        ${product.discountedPrice || product.price}
                      </div>
                      {product.discountedPrice && (
                        <div className="text-xs text-gray-400 line-through">${product.price}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* View All Results Button */}
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => handleSearch(query)}
                  className="w-full text-center py-2 text-sm text-[#00A9B0] hover:bg-gray-50 rounded-lg font-medium"
                >
                  View all results for "{query}" →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;