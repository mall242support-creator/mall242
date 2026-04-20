import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import { SafeHelmet } from '../components/common/SafeHelmet';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralParam = searchParams.get('ref');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: referralParam || '',
    agreeTerms: false,
    subscribeNewsletter: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (referralParam) {
      console.log('Referred by:', referralParam);
    }
  }, [referralParam]);

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
    
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return 'No password';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-gray-200';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Please enter a password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms of Service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setServerError('');
    setSuccessMessage('');
    
    try {
      const response = await authService.register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        referralCode: formData.referralCode,
        subscribeNewsletter: formData.subscribeNewsletter,
      });
      
      console.log('Registration response:', response);
      
      if (response.success) {
        // Store user data
        localStorage.setItem('temp_auth', 'true');
        localStorage.setItem('user', JSON.stringify(response.data));
        
        console.log('User role:', response.data?.role);
        
        setSuccessMessage('Registration successful! Redirecting to your account...');
        
        // Redirect to account dashboard after 1 second
        setTimeout(() => {
          navigate('/account', { replace: true });
        }, 1000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setServerError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
<Helmet>
  <title>Create Account | Mall242</title>
</Helmet>

      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container-custom max-w-5xl">
          <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Left Side - Info Section with Logo */}
            <div className="md:w-1/2 bg-gradient-to-br from-[#00A9B0] to-[#008c92] text-white p-8 flex flex-col justify-center items-center text-center">
              <img src="/mall242logo.jpeg" alt="Mall242" className="h-20 w-auto mb-4" />
              <div className="mb-4">
                <span className="text-3xl font-bold tracking-wider">
                  <span className="text-white">MALL</span>
                  <span className="text-white">242</span>
                </span>
                <p className="text-sm opacity-90">Bahamas</p>
              </div>
              <h2 className="text-2xl font-bold mb-2 mt-4">Join Mall242 Today!</h2>
              <p className="mb-6 opacity-90">Create an account to unlock VIP rewards, early access to deals, and exclusive discounts.</p>
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Get exclusive VIP rewards</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Early access to sales</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Faster checkout process</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Track orders easily</span>
                </div>
              </div>
              
              {/* Referral Banner */}
              {referralParam && (
                <div className="mt-6 p-3 bg-white/20 rounded-lg w-full">
                  <i className="bi bi-gift-fill mr-2"></i>
                  <span className="text-sm">You were referred! Get rewards on first purchase.</span>
                </div>
              )}
            </div>
            
            {/* Right Side - Form Section */}
            <div className="md:w-1/2 p-8 overflow-y-auto max-h-[80vh]">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Create Account</h3>
                <p className="text-gray-500 text-sm mt-1">Fill in your details to get started</p>
                <p className="text-xs text-gray-400 mt-1"><span className="text-red-500">*</span> Required fields</p>
              </div>

              {serverError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
                  {serverError}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm border border-green-200">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Full Name with asterisk */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Email with asterisk */}
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
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password with asterisk and eye toggle */}
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
                      placeholder="Create a password"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] pr-10 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-lg`}></i>
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 h-1 rounded-full transition-all ${
                              level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Password strength: <span className="font-medium">{getPasswordStrengthText()}</span>
                      </p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password with asterisk and eye toggle */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] pr-10 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} text-lg`}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Referral Code (Optional - no asterisk) */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">
                    Referral Code
                  </label>
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    placeholder="Enter referral code (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Have a referral code? Enter it here to unlock rewards.
                  </p>
                </div>

                {/* Newsletter Subscription */}
                <div className="mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="subscribeNewsletter"
                      checked={formData.subscribeNewsletter}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#00A9B0]"
                    />
                    <span className="text-sm text-gray-600">
                      Subscribe to receive exclusive offers and updates
                    </span>
                  </label>
                </div>

                {/* Terms Agreement with asterisk */}
                <div className="mb-6">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="w-4 h-4 mt-0.5 accent-[#00A9B0]"
                    />
                    <span className="text-sm text-gray-600">
                      By creating an account, you agree to Mall242's{' '}
                      <Link to="/terms" className="text-[#00A9B0] hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-[#00A9B0] hover:underline">Privacy Policy</Link>
                      {' '}<span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="text-red-500 text-xs mt-1">{errors.agreeTerms}</p>
                  )}
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFC72C] text-black py-2 rounded-full font-semibold hover:bg-[#e5b300] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </>
                  ) : (
                    'Create your Mall242 account'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              {/* Sign In Link */}
              <Link
                to="/login"
                className="w-full block text-center border border-gray-300 bg-white text-gray-700 py-2 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Sign in to your account
              </Link>
            </div>
          </div>

          {/* Help Links */}
          <div className="text-center mt-6">
            <Link to="/help" className="text-sm text-gray-500 hover:text-[#00A9B0] mx-2">
              Help
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-[#00A9B0] mx-2">
              Privacy Policy
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-[#00A9B0] mx-2">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;