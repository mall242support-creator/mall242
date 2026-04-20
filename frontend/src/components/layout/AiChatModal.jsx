import { useState, useEffect, useRef } from 'react';

const AiChatModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "👋 Hello! I'm Andrew, your virtual shopping assistant. I can help you find products, check prices, or answer your questions. Ask me anything!", sender: 'bot', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [isOpen]);

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response (replace with actual API call later)
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('bag') || msg.includes('luggage')) {
      return "🎒 We have a great selection of bags and luggage! Check out our Designer Handbags, Leather Backpacks, and Travel Suitcases. Would you like me to show you some bestsellers?";
    } else if (msg.includes('shoe') || msg.includes('sneaker')) {
      return "👟 Our shoe collection includes Running Shoes, Casual Sneakers, Formal Shoes, and Boots. We have sizes for men, women, and kids. What type are you looking for?";
    } else if (msg.includes('electronics') || msg.includes('phone') || msg.includes('laptop')) {
      return "📱 We have the latest electronics including Wireless Headphones, Smart Watches, Phone Cases, and more. Check out our Electronics section for great deals!";
    } else if (msg.includes('furniture')) {
      return "🛋️ Shop our furniture collection for Modern Sofas, Dining Tables, Office Chairs, Bed Frames, and more. Free delivery on orders over $500!";
    } else if (msg.includes('deal') || msg.includes('sale')) {
      return "🎉 Today's Deals include up to 50% off on selected items! Check our 'Today's Deals' section for limited-time offers. What category interests you?";
    } else if (msg.includes('vip') || msg.includes('referral')) {
      return "👑 Our VIP Rewards program gives you early access to deals, exclusive discounts, and giveaway entries when you refer friends! Would you like to learn more?";
    } else if (msg.includes('help') || msg.includes('support')) {
      return "🛡️ I'm here to help! You can ask me about products, deals, orders, returns, or anything else about Mall242. What do you need assistance with?";
    } else {
      return "Thanks for your message! I can help you find products, check prices, learn about our VIP rewards program, or assist with any questions. What would you like to know?";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[200] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Chat Modal - Right side, responsive height */}
      <div className="fixed bottom-0 right-0 w-full sm:w-[400px] md:w-[450px] h-[85vh] sm:h-[90vh] md:h-[85vh] lg:h-[80vh] xl:h-[75vh] bg-white shadow-2xl rounded-t-2xl sm:rounded-l-2xl sm:rounded-t-none z-[201] flex flex-col animate-slideIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A9B0] to-[#008c92] text-white p-4 rounded-t-2xl flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <i className="bi bi-robot text-xl"></i>
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant - Andrew</h3>
              <p className="text-xs text-white/80">Online • Ready to help</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-[#00A9B0]/10 flex items-center justify-center mr-2 flex-shrink-0">
                  <i className="bi bi-robot text-[#00A9B0] text-sm"></i>
                </div>
              )}
              <div
                className={`max-w-[85%] p-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-[#00A9B0] text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                <span className={`text-xs mt-1 block ${
                  message.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {message.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0">
                  <i className="bi bi-person text-gray-500 text-sm"></i>
                </div>
              )}
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex mb-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#00A9B0]/10 flex items-center justify-center mr-2 flex-shrink-0">
                <i className="bi bi-robot text-[#00A9B0] text-sm"></i>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] resize-none text-sm"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '100px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="bg-[#00A9B0] text-white px-4 rounded-lg hover:bg-[#008c92] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <i className="bi bi-send text-lg"></i>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Andrew can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </>
  );
};

export default AiChatModal;