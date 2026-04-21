import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('temp_auth');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('loginExpiry');
    setUser(null);
    navigate('/login');
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    return '/account';
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pb-2 pt-1">
      <div className="flex justify-around items-center">
        {/* Mystery Drop */}
        <Link to="/mystery-drop" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#FFC72C] transition-colors">
          <i className="bi bi-question-circle text-xl"></i>
          <span className="text-[10px]">Mystery</span>
        </Link>

        {/* Dream Mall */}
        <Link to="/dream-mall" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#00A9B0] transition-colors">
          <i className="bi bi-building text-xl"></i>
          <span className="text-[10px]">Build</span>
        </Link>

        {/* VIP Rewards */}
        <Link to="/referral" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#00A9B0] transition-colors">
          <i className="bi bi-gem text-xl"></i>
          <span className="text-[10px]">VIP</span>
        </Link>

        {/* Account with Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#00A9B0] transition-colors"
          >
            <i className="bi bi-person text-xl"></i>
            <span className="text-[10px]">Account</span>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowMenu(false)}
                    >
                      <i className="bi bi-speedometer2 mr-2"></i> Dashboard
                    </Link>
                    {!isAdmin && (
                      <>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowMenu(false)}
                        >
                          <i className="bi bi-box-seam mr-2"></i> My Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowMenu(false)}
                        >
                          <i className="bi bi-heart mr-2"></i> Wishlist
                        </Link>
                      </>
                    )}
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowMenu(false)}
                    >
                      <i className="bi bi-gear mr-2"></i> Settings
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <i className="bi bi-box-arrow-right mr-2"></i> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowMenu(false)}
                    >
                      <i className="bi bi-box-arrow-in-right mr-2"></i> Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowMenu(false)}
                    >
                      <i className="bi bi-person-plus mr-2"></i> Register
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>

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