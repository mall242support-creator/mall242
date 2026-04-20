import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Please enter your password';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setServerError('');
    
    try {
      console.log('Attempting login with:', { email: formData.email });
      
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
      console.log('FULL RESPONSE:', JSON.stringify(response, null, 2));
      console.log('Login response:', response);
      
if (response && (response.success || response.token || response.user)) {
  // Store user data
  const userData = response.data || response.user || response;
  localStorage.setItem('temp_auth', 'true');
  localStorage.setItem('user', JSON.stringify(userData));
  
  // If "Remember Me" is checked, set expiry
  if (formData.rememberMe) {
    localStorage.setItem('rememberMe', 'true');
    localStorage.setItem('loginExpiry', Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else {
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('loginExpiry');
  }
  
  // Redirect based on user role
  const userRole = userData?.role || 'user';
  console.log('User role:', userRole);
  
  // Use window.location for hard redirect to ensure page reload
  if (userRole === 'admin') {
    window.location.href = '/admin';
  } else {
    window.location.href = '/account';
  }
} else {
        setServerError(response.message || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setServerError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In | Mall242</title>
        <meta name="description" content="Sign in to your Mall242 account to track orders, manage your VIP rewards, and enjoy faster checkout." />
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container-custom max-w-5xl">
          <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Left Side */}
            <div className="md:w-1/2 bg-gradient-to-br from-[#00A9B0] to-[#008c92] text-white p-8 flex flex-col justify-center items-center text-center">
              <img src="/mall242logo.jpeg" alt="Mall242" className="h-20 w-auto mb-4" />
              <div className="mb-4">
                <span className="text-3xl font-bold tracking-wider">
                  <span className="text-white">MALL</span>
                  <span className="text-white">242</span>
                </span>
                <p className="text-sm opacity-90">Bahamas</p>
              </div>
              <h2 className="text-2xl font-bold mb-2 mt-4">Welcome Back!</h2>
              <p className="mb-6 opacity-90">Sign in to access your account, track orders, and unlock VIP rewards.</p>
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Track your orders</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Manage VIP rewards</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Faster checkout</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Exclusive deals & discounts</span>
                </div>
              </div>
            </div>
            
            {/* Right Side */}
            <div className="md:w-1/2 p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Sign In</h3>
                <p className="text-gray-500 text-sm mt-1">Enter your credentials to access your account</p>
              </div>

              {serverError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] pr-10 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-lg`}></i>
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  <div className="text-right mt-1">
                    <Link to="/forgot-password" className="text-xs text-[#00A9B0] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#00A9B0]"
                    />
                    <span className="text-sm text-gray-600">Keep me signed in</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFC72C] text-black py-2 rounded-full font-semibold hover:bg-[#e5b300] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">New to Mall242?</span>
                </div>
              </div>

              <Link
                to="/register"
                className="w-full block text-center border border-gray-300 bg-white text-gray-700 py-2 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Create your Mall242 account
              </Link>

              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/checkout')}
                  className="text-sm text-gray-500 hover:text-[#00A9B0] transition-colors"
                >
                  Checkout as guest →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;