import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const MobileBottomNav = () => {
  const { cartCount } = useCart();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center py-2 px-2">
        {/* Home */}
        <Link to="/" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#00A9B0] transition-colors">
          <i className="bi bi-house-door text-xl"></i>
          <span className="text-[10px]">Home</span>
        </Link>

        {/* Search - Opens search modal or focuses search */}
        <button 
          onClick={() => {
            const searchInput = document.querySelector('input[type="text"]');
            if (searchInput) searchInput.focus();
          }}
          className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#00A9B0] transition-colors"
        >
          <i className="bi bi-search text-xl"></i>
          <span className="text-[10px]">Search</span>
        </button>

        {/* Mystery Drop */}
        <Link to="/mystery-drop" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#FFC72C] transition-colors">
          <i className="bi bi-question-circle text-xl"></i>
          <span className="text-[10px]">Mystery</span>
        </Link>

        {/* Account */}
        <Link to="/login" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#00A9B0] transition-colors">
          <i className="bi bi-person text-xl"></i>
          <span className="text-[10px]">Account</span>
        </Link>

        {/* Cart */}
        <Link to="/cart" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#00A9B0] transition-colors relative">
          <i className="bi bi-cart text-xl"></i>
          <span className="text-[10px]">Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#FFC72C] text-black text-[10px] font-bold rounded-full px-1.5 min-w-[16px] text-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default MobileBottomNav;