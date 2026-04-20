import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieAccepted = localStorage.getItem('cookieConsent');
    if (!cookieAccepted) {
      // Show popup after 1 second
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
    // Optionally disable non-essential cookies
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg animate-slideUp">
      <div className="container-custom max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm text-gray-700">
              <i className="bi bi-cookie text-[#00A9B0] mr-2"></i>
              We use cookies to enhance your experience, personalize content, and analyze traffic. 
              By clicking "Accept", you consent to our use of cookies.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <Link to="/privacy-policy" className="text-[#00A9B0] hover:underline">Privacy Policy</Link>
              {' '}·{' '}
              <Link to="/cookie-policy" className="text-[#00A9B0] hover:underline">Cookie Policy</Link>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={declineCookies}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={acceptCookies}
              className="px-4 py-2 text-sm bg-[#00A9B0] text-white rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
            >
              Accept Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;