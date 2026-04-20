import { useState, useEffect } from 'react';

const FloatingWhatsApp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Company WhatsApp number (replace with your actual number)
  const COMPANY_NUMBER = '12425551234'; // Bahamas format without +
  const WHATSAPP_URL = `https://wa.me/${COMPANY_NUMBER}`;

  // Predefined quick questions
  const quickQuestions = [
    { icon: 'bi-truck', text: 'Shipping Information', message: 'Hi! I have a question about shipping to the Bahamas.' },
    { icon: 'bi-arrow-return-left', text: 'Returns & Refunds', message: 'Hi! I need help with a return or refund.' },
    { icon: 'bi-box-seam', text: 'Order Status', message: 'Hi! I want to check the status of my order.' },
    { icon: 'bi-tag', text: 'Discount & Deals', message: 'Hi! Are there any current discounts or deals?' },
    { icon: 'bi-question-circle', text: 'Product Question', message: 'Hi! I have a question about a product.' },
    { icon: 'bi-person-badge', text: 'Vendor Registration', message: 'Hi! I want to become a vendor on Mall242.' },
  ];

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleQuickQuestion = (questionMessage) => {
    setMessage(questionMessage);
    setTimeout(() => {
      window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(questionMessage)}`, '_blank');
      setIsOpen(false);
      setMessage('');
    }, 100);
  };

  const handleCustomMessage = () => {
    if (message.trim()) {
      window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(message)}`, '_blank');
      setIsOpen(false);
      setMessage('');
    }
  };

  const handlePhoneInquiry = () => {
    if (phoneNumber.trim()) {
      const inquiryMessage = `Hi! I need assistance. My phone number is ${phoneNumber}. Please contact me.`;
      window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(inquiryMessage)}`, '_blank');
      setIsOpen(false);
      setPhoneNumber('');
    }
  };

  return (
    <>
      {/* WhatsApp Floating Button */}
      <div 
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
      >
        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group"
        >
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75 group-hover:opacity-100 transition-all duration-700"></div>
          <div className="relative w-14 h-14 md:w-16 md:h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-all duration-300 hover:scale-110">
            <i className="bi bi-whatsapp text-white text-2xl md:text-3xl"></i>
          </div>
        </button>

        {/* Chat Window */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-green-500 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <i className="bi bi-whatsapp text-green-500 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold">Mall242 Support</h3>
                  <p className="text-xs text-green-100">Online • Usually replies in minutes</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-200"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {/* Welcome Message */}
              <div className="mb-4">
                <div className="bg-gray-100 rounded-lg p-3 inline-block max-w-[85%]">
                  <p className="text-sm text-gray-700">
                    👋 Hi there! Welcome to Mall242 Support. How can we help you today?
                  </p>
                </div>
              </div>

              {/* Quick Questions */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">QUICK QUESTIONS</p>
                <div className="space-y-2">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(q.message)}
                      className="w-full text-left flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <i className={`${q.icon} text-[#00A9B0] text-lg`}></i>
                      <span className="text-sm">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Phone Number Inquiry */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">LEAVE YOUR NUMBER</p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1-242-555-0123"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handlePhoneInquiry}
                    disabled={!phoneNumber.trim()}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <p className="text-xs text-gray-500 mb-2">TYPE YOUR MESSAGE</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
                <button
                  onClick={handleCustomMessage}
                  disabled={!message.trim()}
                  className="w-full mt-2 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="bi bi-whatsapp"></i>
                  Send via WhatsApp
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
              <p className="text-xs text-gray-400">
                Our support team is available 9 AM - 6 PM, Monday to Saturday
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default FloatingWhatsApp;