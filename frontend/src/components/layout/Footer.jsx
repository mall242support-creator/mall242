import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#0B1120] text-gray-300 mt-10">
      {/* Back to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="w-full bg-[#1a2538] hover:bg-[#1f2c42] text-white py-3 text-sm font-semibold transition-colors"
      >
        Back to top
      </button>

      <div className="container-custom py-8 md:py-12">
        {/* Footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1 - Get to Know Us */}
          <div>
            <h3 className="text-white font-semibold mb-4">Get to Know Us</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-[#00A9B0] transition-colors">About Mall242</Link></li>
              <li><Link to="/careers" className="hover:text-[#00A9B0] transition-colors">Careers</Link></li>
              <li><Link to="/press" className="hover:text-[#00A9B0] transition-colors">Press Releases</Link></li>
              <li><Link to="/impact" className="hover:text-[#00A9B0] transition-colors">Mall242 Impact</Link></li>
            </ul>
          </div>

          {/* Column 2 - Make Money with Us */}
          <div>
            <h3 className="text-white font-semibold mb-4">Make Money with Us</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/sell" className="hover:text-[#00A9B0] transition-colors">Sell on Mall242</Link></li>
              <li><Link to="/vendor" className="hover:text-[#00A9B0] transition-colors">Become a Vendor</Link></li>
              <li><Link to="/advertise" className="hover:text-[#00A9B0] transition-colors">Advertise Your Products</Link></li>
              <li><Link to="/affiliate" className="hover:text-[#00A9B0] transition-colors">Affiliate Program</Link></li>
            </ul>
          </div>

          {/* Column 3 - Let Us Help You */}
          <div>
            <h3 className="text-white font-semibold mb-4">Let Us Help You</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/account" className="hover:text-[#00A9B0] transition-colors">Your Account</Link></li>
              <li><Link to="/orders" className="hover:text-[#00A9B0] transition-colors">Your Orders</Link></li>
              <li><Link to="/shipping" className="hover:text-[#00A9B0] transition-colors">Shipping Rates & Policies</Link></li>
              <li><Link to="/returns" className="hover:text-[#00A9B0] transition-colors">Returns & Replacements</Link></li>
              <li><Link to="/help" className="hover:text-[#00A9B0] transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Column 4 - VIP Program */}
          <div>
            <h3 className="text-white font-semibold mb-4">VIP Program</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/referral" className="hover:text-[#FFC72C] transition-colors flex items-center gap-2">
                <i className="bi bi-gem text-[#FFC72C]"></i> VIP Rewards
              </Link></li>
              <li><Link to="/early-access" className="hover:text-[#FFC72C] transition-colors">Early Access</Link></li>
              <li><Link to="/referral-leaderboard" className="hover:text-[#FFC72C] transition-colors">Referral Leaderboard</Link></li>
              <li><Link to="/vip-faq" className="hover:text-[#FFC72C] transition-colors">VIP FAQ</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-6">
          {/* Logo and social links */}
          <div className="flex flex-col items-center gap-4">
            <img src="/mall242logo.jpeg" alt="Mall242" className="h-12 w-auto" />
            
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#00A9B0] transition-colors text-xl">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="hover:text-[#00A9B0] transition-colors text-xl">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" className="hover:text-[#00A9B0] transition-colors text-xl">
                <i className="bi bi-twitter-x"></i>
              </a>
              <a href="#" className="hover:text-[#00A9B0] transition-colors text-xl">
                <i className="bi bi-whatsapp"></i>
              </a>
            </div>

            {/* Copyright */}
            <p className="text-xs text-gray-500 text-center">
              © 2026 Mall242 — Bahamas B2B Marketplace. All rights reserved.
              <br />
              <span className="text-gray-600">123 Bay Street, Nassau, New Providence, Bahamas</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;