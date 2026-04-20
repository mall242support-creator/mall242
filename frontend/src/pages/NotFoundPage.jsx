import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SafeHelmet } from '../components/common/SafeHelmet';

const NotFoundPage = () => {
  return (
    <>
<Helmet>
  <title>Page Not Found | Mall242</title>
</Helmet>

      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          {/* 404 Illustration */}
          <div className="mb-6">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#00A9B0] to-[#FFC72C] rounded-full flex items-center justify-center">
              <i className="bi bi-question-lg text-5xl text-white"></i>
            </div>
          </div>

          {/* Error Code */}
          <h1 className="text-7xl md:text-8xl font-bold text-gray-800 mb-2">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          
          {/* Message */}
          <p className="text-gray-500 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-[#00A9B0] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#008c92] transition-colors"
            >
              <i className="bi bi-house-door"></i>
              Back to Home
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 border-2 border-[#00A9B0] text-[#00A9B0] px-6 py-3 rounded-full font-semibold hover:bg-[#00A9B0] hover:text-white transition-colors"
            >
              <i className="bi bi-grid"></i>
              Browse Products
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Or try these popular sections:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/products?category=clothes" className="text-sm text-[#00A9B0] hover:underline">Fashion</Link>
              <Link to="/products?category=electronics-accessories" className="text-sm text-[#00A9B0] hover:underline">Electronics</Link>
              <Link to="/products?category=furniture" className="text-sm text-[#00A9B0] hover:underline">Furniture</Link>
              <Link to="/mystery-drop" className="text-sm text-[#00A9B0] hover:underline">Mystery Drop</Link>
              <Link to="/referral" className="text-sm text-[#00A9B0] hover:underline">VIP Rewards</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;