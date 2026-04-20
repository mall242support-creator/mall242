import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [resetMethod, setResetMethod] = useState('email');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Please enter your email address';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
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
      const response = await authService.forgotPassword(email);
      console.log('Forgot password response:', response);
      
      if (response.success) {
        setSubmitted(true);
      } else {
        setServerError(response.message || 'Failed to send reset link. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setServerError(error.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Reset Link Sent | Mall242</title>
          <meta name="description" content="Password reset link has been sent to your email." />
        </Helmet>
        <div className="bg-gray-50 min-h-screen py-12">
          <div className="container-custom max-w-md">
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-envelope-check text-4xl text-green-600"></i>
              </div>
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-gray-600 mb-4">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800">
                  <i className="bi bi-info-circle mr-2"></i>
                  Didn't receive the email? Check your spam folder or try again in a few minutes.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-block bg-[#00A9B0] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#008c92] transition-colors"
              >
                Return to Sign In
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="block w-full mt-3 text-sm text-[#00A9B0] hover:underline"
              >
                Try another email address
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Forgot Password | Mall242</title>
        <meta name="description" content="Reset your Mall242 password. Enter your email to receive a password reset link." />
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container-custom max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/">
              <img 
                src="/mall242logo.jpeg" 
                alt="Mall242" 
                className="h-16 mx-auto mb-2"
              />
            </Link>
            <p className="text-gray-500 text-sm">Reset your password</p>
          </div>

          {/* Reset Options */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-4">
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setResetMethod('email')}
                className={`pb-2 font-medium transition-colors ${
                  resetMethod === 'email' 
                    ? 'text-[#00A9B0] border-b-2 border-[#00A9B0]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="bi bi-envelope mr-2"></i>
                Email
              </button>
              <button
                onClick={() => setResetMethod('sms')}
                className={`pb-2 font-medium transition-colors ${
                  resetMethod === 'sms' 
                    ? 'text-[#00A9B0] border-b-2 border-[#00A9B0]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="bi bi-phone mr-2"></i>
                SMS
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <i className="bi bi-lock-fill mr-2"></i>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {serverError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  autoFocus
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFC72C] text-black py-2 rounded-full font-semibold hover:bg-[#e5b300] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm text-[#00A9B0] hover:underline">
                <i className="bi bi-arrow-left mr-1"></i>
                Back to Sign In
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold mb-2">Need help?</h3>
            <div className="space-y-2 text-sm">
              <Link to="/help" className="block text-gray-600 hover:text-[#00A9B0]">
                <i className="bi bi-question-circle mr-2"></i>
                Visit Help Center
              </Link>
              <Link to="/contact" className="block text-gray-600 hover:text-[#00A9B0]">
                <i className="bi bi-envelope mr-2"></i>
                Contact Customer Service
              </Link>
            </div>
          </div>

          {/* Security Note */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-400">
              For security reasons, the reset link will expire in 10 minutes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;