import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { promoService } from '../../services/api';

const PromoPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [promo, setPromo] = useState(null);

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res = await promoService.getActivePromo();
        if (res.success && res.promo) {
          setPromo(res.promo);
          
          // Check if already shown this session
          const sessionKey = `promo_shown_${res.promo._id}`;
          const alreadyShown = sessionStorage.getItem(sessionKey);
          
          if (!alreadyShown) {
            // Show popup after delay
            setTimeout(() => {
              setIsVisible(true);
              sessionStorage.setItem(sessionKey, 'true');
            }, (res.promo.delaySeconds || 3) * 1000);
          }
        }
      } catch (error) {
        console.error('Failed to fetch promo:', error);
      }
    };
    
    fetchPromo();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const copyDiscountCode = () => {
    if (promo?.discountCode) {
      navigator.clipboard.writeText(promo.discountCode);
      alert('Discount code copied to clipboard!');
    }
  };

  if (!isVisible || !promo) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={handleClose}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden animate-scaleUp">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white z-10"
        >
          <i className="bi bi-x-lg"></i>
        </button>
        
        {/* Image */}
        {promo.image && (
          <img 
            src={promo.image} 
            alt={promo.title} 
            className="w-full h-48 object-cover"
          />
        )}
        
        {/* Content */}
        <div className="p-6 text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: promo.backgroundColor || '#00A9B0' }}
          >
            <i className="bi bi-gift text-white text-2xl"></i>
          </div>
          
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: promo.textColor || '#333' }}
          >
            {promo.title}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {promo.description}
          </p>
          
          {promo.discountCode && (
            <div 
              className="mb-4 p-3 rounded-lg cursor-pointer hover:opacity-80 transition"
              style={{ backgroundColor: `${promo.backgroundColor}20` }}
              onClick={copyDiscountCode}
            >
              <p className="text-sm text-gray-500 mb-1">Use code:</p>
              <p className="font-mono font-bold text-xl" style={{ color: promo.backgroundColor || '#00A9B0' }}>
                {promo.discountCode}
              </p>
              <p className="text-xs text-gray-400 mt-1">Click to copy</p>
            </div>
          )}
          
          <Link
            to={promo.buttonLink}
            onClick={handleClose}
            className="block w-full py-3 rounded-full font-semibold text-center transition-colors"
            style={{ backgroundColor: promo.backgroundColor || '#00A9B0', color: promo.textColor || '#fff' }}
          >
            {promo.buttonText}
          </Link>
          
          <p className="text-xs text-gray-400 mt-3">
            Offer valid until {new Date(promo.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes scaleUp {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scaleUp {
          animation: scaleUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default PromoPopup;