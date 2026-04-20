import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Sidebar = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(null);

  // Handle body scroll lock with useEffect
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Categories from your HTML with subcategories
  const categories = [
    { 
      name: "Bags & Luggage", 
      slug: "bags-luggage", 
      icon: "bi-bag",
      subcategories: ["Backpacks", "Handbags", "Luggage Sets", "Travel Bags", "Wallets"]
    },
    { 
      name: "Bikes", 
      slug: "bikes", 
      icon: "bi-bicycle",
      subcategories: ["Mountain Bikes", "Road Bikes", "Electric Bikes", "Kids Bikes", "Bike Accessories"]
    },
    { 
      name: "Clothes", 
      slug: "clothes", 
      icon: "bi-handbag",
      subcategories: ["T-Shirts", "Shirts", "Jeans", "Dresses", "Jackets", "Activewear"]
    },
    { 
      name: "Doors & Windows", 
      slug: "doors-windows", 
      icon: "bi-door-open",
      subcategories: ["Interior Doors", "Exterior Doors", "Windows", "Door Hardware", "Window Treatments"]
    },
    { 
      name: "Electronics & Accessories", 
      slug: "electronics-accessories", 
      icon: "bi-phone",
      subcategories: ["Phones", "Laptops", "Headphones", "Smart Watches", "Chargers", "Tablets"]
    },
    { 
      name: "Furniture", 
      slug: "furniture", 
      icon: "bi-house",
      subcategories: ["Sofas", "Beds", "Tables", "Chairs", "Storage", "Office Furniture"]
    },
    { 
      name: "Mens Wear", 
      slug: "mens-wear", 
      icon: "bi-person",
      subcategories: ["Shirts", "Pants", "Suits", "T-Shirts", "Accessories", "Shoes"]
    },
    { 
      name: "Shoes", 
      slug: "shoes", 
      icon: "bi-shoe",
      subcategories: ["Sneakers", "Formal Shoes", "Sandals", "Boots", "Sports Shoes", "Kids Shoes"]
    },
  ];

  // Quick links
  const quickLinks = [
    { name: "Today's Deals", icon: "bi-tag", link: "/products?section=deals" },
    { name: "New Arrivals", icon: "bi-star", link: "/products?section=new_arrivals" },
    { name: "Mystery Drop", icon: "bi-question-circle", link: "/mystery-drop" },
    { name: "VIP Rewards", icon: "bi-gem", link: "/referral" },
    { name: "Build Dream Mall", icon: "bi-building", link: "/dream-mall" },
    { name: "Sell on Mall242", icon: "bi-shop", link: "/sell" },
  ];

  // Help links
  const helpLinks = [
    { name: "Help Center", icon: "bi-question-circle", link: "/help" },
    { name: "Customer Service", icon: "bi-headset", link: "/customer-service" },
    { name: "Track Order", icon: "bi-truck", link: "/orders" },
    { name: "Returns", icon: "bi-arrow-return-left", link: "/returns" },
    { name: "Settings", icon: "bi-gear", link: "/settings" },
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-[100] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 w-80 md:w-96 h-full bg-gray-50 shadow-2xl overflow-y-auto transform transition-transform duration-300 z-[101] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with user info */}
        <div className="sticky top-0 bg-gradient-to-r from-[#00A9B0] to-[#008c92] text-white p-5 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="bi bi-person-fill text-2xl"></i>
              </div>
              <div>
                <div className="text-xs text-white/80">Welcome back,</div>
                <div className="font-semibold text-lg">Sign in</div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <i className="bi bi-x-lg text-xl"></i>
            </button>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.name}
                to={link.link}
                onClick={onClose}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                <i className={`${link.icon} text-[#00A9B0] text-lg w-6`}></i>
                <span className="text-sm">{link.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="py-2 bg-white">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Shop by Category
          </div>
          {categories.map((category) => (
            <div key={category.slug} className="border-b border-gray-100">
              <button
                onClick={() => setActiveCategory(activeCategory === category.slug ? null : category.slug)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <i className={`${category.icon} text-[#00A9B0] text-lg w-6`}></i>
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
                <i className={`bi bi-chevron-${activeCategory === category.slug ? 'down' : 'right'} text-gray-400 text-sm transition-transform`}></i>
              </button>
              
              {/* Subcategories - expandable */}
              {activeCategory === category.slug && (
                <div className="bg-gray-50 pl-12 pr-4 py-2">
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub}
                      to={`/products?category=${category.slug}&subcategory=${sub.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={onClose}
                      className="block py-2 text-sm text-gray-600 hover:text-[#00A9B0] transition-colors"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Help & Settings Section */}
        <div className="border-t border-gray-200 mt-2 pt-4 pb-8 bg-white">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Help & Settings
          </div>
          {helpLinks.map((link) => (
            <Link
              key={link.name}
              to={link.link}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <i className={`${link.icon} text-gray-500 text-lg w-6`}></i>
              <span className="text-sm text-gray-700">{link.name}</span>
            </Link>
          ))}
        </div>

        {/* VIP Banner at bottom */}
        <div className="p-4 mx-4 mb-4 bg-gradient-to-r from-[#00A9B0] to-[#FFC72C] rounded-xl">
          <div className="flex items-center gap-2">
            <i className="bi bi-gem text-white text-xl"></i>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Become a VIP Member</p>
              <p className="text-white/80 text-xs">Get early access & exclusive deals</p>
            </div>
            <Link 
              to="/referral" 
              onClick={onClose}
              className="bg-white text-[#00A9B0] text-xs font-semibold px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              Join Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;