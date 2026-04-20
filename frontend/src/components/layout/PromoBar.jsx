import { useState } from 'react';

const PromoBar = () => {
  // Read from localStorage during render, not in an effect
  const [isVisible, setIsVisible] = useState(() => {
    const isClosed = localStorage.getItem('promoBarClosed');
    return isClosed !== 'true';
  });

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('promoBarClosed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-[#00A9B0] via-[#FFC72C] to-black text-white py-2 px-4">
      <div className="container-custom">
        <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2 animate-pulse-slow">
            <i className="bi bi-tag-fill text-sm md:text-base"></i>
            <span className="text-xs md:text-sm font-semibold tracking-wide">
              GET UP TO 25% OFF DEAL
            </span>
          </div>
          <a 
            href="/products?section=top_deals" 
            className="bg-black/70 backdrop-blur-sm text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold hover:bg-black transition-all duration-200 flex items-center gap-1"
          >
            Grab Deal <i className="bi bi-arrow-right-short"></i>
          </a>
          <button 
            onClick={handleClose}
            className="absolute right-2 md:right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close promo bar"
          >
            <i className="bi bi-x-lg text-xs md:text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoBar;