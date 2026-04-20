import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { mysteryDropService } from '../services/api';
import { SafeHelmet } from '../components/common/SafeHelmet';

const MysteryDropPage = () => {
  const [upcomingDrops, setUpcomingDrops] = useState([]);
  const [revealedDrops, setRevealedDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrop, setSelectedDrop] = useState(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupMessage, setSignupMessage] = useState({ type: '', text: '' });
  const [isVIP, setIsVIP] = useState(false);

  // Check if user is VIP - moved outside useEffect
  const checkVIPStatus = useCallback(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.vipStatus || false;
      } catch (err) {
        console.error('Failed to parse user:', err);
        return false;
      }
    }
    return false;
  }, []);

  // Fetch mystery drops
  const fetchMysteryDrops = useCallback(async () => {
    setLoading(true);
    try {
      const vipStatus = checkVIPStatus();
      setIsVIP(vipStatus);
      const res = await mysteryDropService.getAll(vipStatus);
      if (res.success) {
        setUpcomingDrops(res.upcoming || []);
        setRevealedDrops(res.revealed || []);
      }
    } catch (error) {
      console.error('Failed to fetch mystery drops:', error);
    } finally {
      setLoading(false);
    }
  }, [checkVIPStatus]);

  useEffect(() => {
    fetchMysteryDrops();
  }, [fetchMysteryDrops]);

  const handleSignup = (drop) => {
    setSelectedDrop(drop);
    setSignupEmail('');
    setSignupMessage({ type: '', text: '' });
    setShowSignupModal(true);
  };

  const submitSignup = async () => {
    if (!signupEmail.trim()) {
      setSignupMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }
    if (!signupEmail.includes('@')) {
      setSignupMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setSignupMessage({ type: '', text: '' });
    try {
      const res = await mysteryDropService.signup(signupEmail, selectedDrop._id);
      if (res.success) {
        setSignupMessage({ type: 'success', text: res.message || 'You\'re signed up! We\'ll notify you when the brand is revealed.' });
        setTimeout(() => {
          setShowSignupModal(false);
          setSignupMessage({ type: '', text: '' });
        }, 2000);
      }
    } catch (error) {
      setSignupMessage({ type: 'error', text: error.response?.data?.message || 'Signup failed' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTimeRemaining = (revealDate) => {
    const now = new Date();
    const reveal = new Date(revealDate);
    const diff = reveal - now;
    
    if (diff <= 0) return 'Revealed!';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (86400000)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
<Helmet>
  <title>Mystery Drop | Mall242</title>
</Helmet>

      <div className="bg-gradient-to-br from-purple-900 via-black to-indigo-900 min-h-screen py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur rounded-2xl shadow-lg mb-4">
              <i className="bi bi-question-lg text-4xl text-white"></i>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Mystery Drop</h1>
            <p className="text-purple-200 max-w-2xl mx-auto">
              Sign up to reveal mystery brands and get exclusive early access to deals before anyone else!
            </p>
          </div>

          {/* VIP Badge */}
          {isVIP && (
            <div className="max-w-md mx-auto mb-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-3 text-center">
              <p className="text-white font-semibold">
                <i className="bi bi-gem mr-2"></i> 
                VIP Early Access - You get to see reveals 24 hours early!
              </p>
            </div>
          )}

          {/* Upcoming Drops */}
          {upcomingDrops.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <i className="bi bi-clock-history text-yellow-400"></i>
                Upcoming Mystery Drops
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingDrops.map((drop) => (
                  <div key={drop._id} className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-yellow-400/50 transition-all group">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={drop.blurredImageUrl} 
                        alt="Mystery Brand" 
                        className="w-full h-full object-cover blur-md group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <i className="bi bi-question-lg text-6xl text-white/70"></i>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        {getTimeRemaining(drop.revealDate)}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-yellow-400 text-sm mb-1">🔮 Mystery Brand</p>
                      <p className="text-white font-semibold text-lg mb-2">{drop.clue}</p>
                      <p className="text-gray-300 text-sm mb-3">{drop.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-purple-300 text-xs">
                          <i className="bi bi-calendar mr-1"></i>
                          Reveals: {formatDate(drop.revealDate)}
                        </div>
                        <button
                          onClick={() => handleSignup(drop)}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          Sign Up to Reveal
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revealed Drops */}
          {revealedDrops.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <i className="bi bi-eye-fill text-green-400"></i>
                Revealed Mystery Brands
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {revealedDrops.map((drop) => (
                  <div key={drop._id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={drop.revealImageUrl} 
                        alt={drop.brandName} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Revealed!
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {drop.brandLogoUrl && (
                          <img src={drop.brandLogoUrl} alt={drop.brandName} className="h-8 object-contain" />
                        )}
                        <h3 className="font-bold text-xl text-gray-800">{drop.brandName}</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{drop.description}</p>
                      
                      {/* Deals */}
                      {drop.deals && drop.deals.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {drop.deals.map((deal, idx) => (
                            <div key={idx} className="bg-yellow-50 rounded-lg p-2">
                              <p className="font-semibold text-sm">{deal.title}</p>
                              <p className="text-xs text-gray-600">{deal.description}</p>
                              {deal.discountCode && (
                                <div className="mt-1 inline-block bg-yellow-200 px-2 py-0.5 rounded text-xs font-mono">
                                  Code: {deal.discountCode}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Link
                        to={drop.deals?.[0]?.productLink || '/products'}
                        className="block w-full text-center bg-[#00A9B0] text-white py-2 rounded-full font-semibold hover:bg-[#008c92] transition-colors"
                      >
                        Shop {drop.brandName} →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Drops Message */}
          {upcomingDrops.length === 0 && revealedDrops.length === 0 && (
            <div className="text-center py-12">
              <i className="bi bi-inbox text-6xl text-white/30 mb-4 block"></i>
              <p className="text-white/70">No mystery drops available at the moment.</p>
              <p className="text-white/50 text-sm">Check back soon for exciting reveals!</p>
            </div>
          )}
        </div>
      </div>

      {/* Signup Modal */}
      {showSignupModal && selectedDrop && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowSignupModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Reveal Mystery Brand</h3>
                <button onClick={() => setShowSignupModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="bg-purple-100 rounded-lg p-3 mb-4">
                  <p className="text-purple-800 text-sm">{selectedDrop.clue}</p>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Enter your email to be notified when this mystery brand is revealed!
                </p>
                {selectedDrop.emailHint && (
                  <p className="text-gray-500 text-xs mb-3">
                    <i className="bi bi-lightbulb mr-1"></i> Hint: {selectedDrop.emailHint}
                  </p>
                )}
              </div>

              {signupMessage.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  signupMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {signupMessage.text}
                </div>
              )}

              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] mb-4"
              />

              <button
                onClick={submitSignup}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Notify Me When Revealed
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                We'll never share your email. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MysteryDropPage;