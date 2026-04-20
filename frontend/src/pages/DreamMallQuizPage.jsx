import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dreamMallService } from '../services/api';

const DreamMallPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedPreferences, setSavedPreferences] = useState(null);
  const [hasSavedMall, setHasSavedMall] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedDealTypes, setSelectedDealTypes] = useState([]);
  const [result, setResult] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [email, setEmail] = useState('');
  const [saveResults, setSaveResults] = useState(false);

  // Available options
  const categoryOptions = [
    { id: 'fashion', name: 'Fashion', icon: 'bi-handbag', emoji: '👗', color: 'bg-pink-100', gradient: 'from-pink-500 to-rose-500' },
    { id: 'electronics', name: 'Electronics', icon: 'bi-phone', emoji: '📱', color: 'bg-blue-100', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'furniture', name: 'Furniture', icon: 'bi-house', emoji: '🛋️', color: 'bg-orange-100', gradient: 'from-orange-500 to-amber-500' },
    { id: 'beauty', name: 'Beauty', icon: 'bi-mirror', emoji: '💄', color: 'bg-purple-100', gradient: 'from-purple-500 to-pink-500' },
    { id: 'sports', name: 'Sports', icon: 'bi-bicycle', emoji: '🏃', color: 'bg-green-100', gradient: 'from-green-500 to-emerald-500' },
    { id: 'toys', name: 'Toys', icon: 'bi-toy', emoji: '🧸', color: 'bg-yellow-100', gradient: 'from-yellow-500 to-amber-500' },
    { id: 'books', name: 'Books', icon: 'bi-book', emoji: '📚', color: 'bg-indigo-100', gradient: 'from-indigo-500 to-purple-500' },
    { id: 'food', name: 'Food & Grocery', icon: 'bi-cup-straw', emoji: '🍕', color: 'bg-red-100', gradient: 'from-red-500 to-orange-500' },
  ];

  const brandOptions = [
    { id: 'nike', name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
    { id: 'adidas', name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
    { id: 'apple', name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
    { id: 'samsung', name: 'Samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
    { id: 'gucci', name: 'Gucci', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Gucci_Logo.svg' },
    { id: 'zara', name: 'Zara', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg' },
    { id: 'sony', name: 'Sony', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Sony_logo.svg' },
    { id: 'ikea', name: 'IKEA', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/IKEA_logo.svg' },
  ];

  const dealTypeOptions = [
    { id: 'early_access', name: 'Early Access', icon: 'bi-clock', description: 'Shop before everyone else', color: 'bg-purple-100' },
    { id: 'discounts', name: 'Exclusive Discounts', icon: 'bi-tag', description: 'Get member-only prices', color: 'bg-green-100' },
    { id: 'new_arrivals', name: 'New Arrivals', icon: 'bi-megaphone', description: 'Be first to know', color: 'bg-blue-100' },
    { id: 'vip_events', name: 'VIP Events', icon: 'bi-gem', description: 'Invite-only events', color: 'bg-yellow-100' },
  ];

  // Fetch saved preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await dreamMallService.getMyPreferences();
        if (res.success && res.data && res.data.categories?.length > 0) {
          setSavedPreferences(res.data);
          setHasSavedMall(true);
          setSelectedCategories(res.data.categories || []);
          setSelectedBrands(res.data.brands || []);
          setSelectedDealTypes(res.data.dealTypes || []);
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      }
    };
    fetchPreferences();
  }, []);

  // Delete saved dream mall
  const deleteSavedMall = async () => {
    if (confirm('Are you sure you want to delete your saved Dream Mall preferences? You can always build a new one.')) {
      try {
        await dreamMallService.deletePreferences();
        setHasSavedMall(false);
        setSavedPreferences(null);
        setSelectedCategories([]);
        setSelectedBrands([]);
        setSelectedDealTypes([]);
        setShowResults(false);
        setStep(1);
        alert('Your Dream Mall preferences have been deleted.');
      } catch (error) {
        console.error('Failed to delete preferences:', error);
        alert('Failed to delete preferences. Please try again.');
      }
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleBrand = (brandId) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(b => b !== brandId)
        : [...prev, brandId]
    );
  };

  const toggleDealType = (dealId) => {
    setSelectedDealTypes(prev =>
      prev.includes(dealId)
        ? prev.filter(d => d !== dealId)
        : [...prev, dealId]
    );
  };

  const calculateResults = () => {
    let primaryCategory = '';
    let shopperType = '';
    let percentages = { fashion: 0, electronics: 0, home: 0, other: 0 };

    if (selectedCategories.includes('fashion')) {
      primaryCategory = 'Fashion Forward';
      percentages.fashion = 45;
      percentages.electronics = 25;
      percentages.home = 20;
      percentages.other = 10;
    } else if (selectedCategories.includes('electronics')) {
      primaryCategory = 'Tech Enthusiast';
      percentages.fashion = 20;
      percentages.electronics = 50;
      percentages.home = 20;
      percentages.other = 10;
    } else if (selectedCategories.includes('furniture')) {
      primaryCategory = 'Home Lover';
      percentages.fashion = 15;
      percentages.electronics = 15;
      percentages.home = 60;
      percentages.other = 10;
    } else if (selectedCategories.includes('beauty')) {
      primaryCategory = 'Beauty Guru';
      percentages.fashion = 40;
      percentages.electronics = 10;
      percentages.home = 20;
      percentages.other = 30;
    } else if (selectedCategories.includes('sports')) {
      primaryCategory = 'Active Lifestyle';
      percentages.fashion = 35;
      percentages.electronics = 25;
      percentages.home = 15;
      percentages.other = 25;
    } else {
      primaryCategory = 'Trend Explorer';
      percentages = { fashion: 30, electronics: 25, home: 20, other: 25 };
    }

    if (selectedDealTypes.includes('early_access') && selectedDealTypes.includes('discounts')) {
      shopperType = 'Smart Shopper';
    } else if (selectedDealTypes.includes('early_access')) {
      shopperType = 'Early Adopter';
    } else if (selectedDealTypes.includes('vip_events')) {
      shopperType = 'Experience Seeker';
    } else {
      shopperType = 'Deal Hunter';
    }

    const resultMessage = `Your Dream Mall is ${percentages.fashion}% Fashion, ${percentages.electronics}% Electronics, ${percentages.home}% Home & Living. As a ${primaryCategory}, you love being a ${shopperType}!`;

    setResult({
      primaryCategory,
      shopperType,
      percentages,
      message: resultMessage,
      recommendedBrands: selectedBrands.slice(0, 3),
    });
    setShowResults(true);
    setStep(4);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await dreamMallService.savePreferences({
        categories: selectedCategories,
        brands: selectedBrands,
        dealTypes: selectedDealTypes,
        email: saveResults ? email : undefined,
        saveResults,
      });
      if (response.success) {
        calculateResults();
        if (response.data?.recommendations) {
          setRecommendations(response.data.recommendations);
        }
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      calculateResults();
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const resetQuiz = () => {
    setStep(1);
    setShowResults(false);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedDealTypes([]);
    setResult(null);
    setRecommendations([]);
  };

  return (
    <>
      <Helmet>
        <title>Build Your Dream Mall | Mall242</title>
        <meta name="description" content="Create your personalized shopping experience at Mall242. Tell us what you love and get curated recommendations." />
      </Helmet>

      <div className="bg-gradient-to-br from-[#00A9B0]/5 via-white to-[#FFC72C]/5 min-h-screen py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#00A9B0] to-[#FFC72C] rounded-2xl shadow-lg mb-4">
              <i className="bi bi-building text-4xl text-white"></i>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Build Your Dream Mall</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Tell us what you love and we'll create a personalized shopping experience just for you
            </p>
          </div>

          {/* Show saved mall indicator */}
          {hasSavedMall && !showResults && (
            <div className="max-w-2xl mx-auto mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm text-green-700">
                <i className="bi bi-check-circle-fill mr-1"></i>
                You have a saved Dream Mall! 
                <button onClick={deleteSavedMall} className="ml-2 text-red-500 hover:text-red-700 underline">
                  Delete and rebuild
                </button>
              </p>
            </div>
          )}

          {/* Progress Steps */}
          {!showResults && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex justify-between items-center">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        step >= s ? 'bg-[#00A9B0] text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {s}
                      </div>
                      <div className="text-xs mt-2 text-gray-500 hidden md:block">
                        {s === 1 && 'Categories'}
                        {s === 2 && 'Brands'}
                        {s === 3 && 'Deals'}
                      </div>
                    </div>
                    {s < 3 && (
                      <div className={`absolute top-5 left-[calc(50%+20px)] right-[-calc(50%-20px)] h-0.5 ${
                        step > s ? 'bg-[#00A9B0]' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rest of your JSX remains the same... */}
          {/* Step 1: Categories */}
          {step === 1 && !showResults && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-center mb-2">What do you love to shop?</h2>
              <p className="text-center text-gray-500 mb-6">Select all categories that interest you</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`relative group p-4 rounded-xl border-2 transition-all text-center ${
                      selectedCategories.includes(cat.id)
                        ? `border-[#00A9B0] bg-gradient-to-br ${cat.gradient} bg-opacity-10 shadow-lg scale-105`
                        : 'border-gray-200 hover:border-[#00A9B0] hover:shadow-md'
                    }`}
                  >
                    <div className={`w-16 h-16 mx-auto rounded-full ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <span className="text-3xl">{cat.emoji}</span>
                    </div>
                    <div className="font-semibold text-gray-800">{cat.name}</div>
                    {selectedCategories.includes(cat.id) && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#00A9B0] rounded-full flex items-center justify-center">
                        <i className="bi bi-check text-white text-xs"></i>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={nextStep}
                  className="bg-[#00A9B0] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#008c92] transition-colors flex items-center gap-2"
                >
                  Continue <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Brands */}
          {step === 2 && !showResults && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-center mb-2">Your favorite brands</h2>
              <p className="text-center text-gray-500 mb-6">Select brands you love (optional)</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {brandOptions.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => toggleBrand(brand.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                      selectedBrands.includes(brand.id)
                        ? 'border-[#00A9B0] bg-[#00A9B0]/5 shadow-md'
                        : 'border-gray-200 hover:border-[#00A9B0]'
                    }`}
                  >
                    <div className="h-12 flex items-center justify-center mb-2">
                      <img src={brand.logo} alt={brand.name} className="h-8 object-contain" />
                    </div>
                    <div className="text-sm font-medium text-gray-700">{brand.name}</div>
                    {selectedBrands.includes(brand.id) && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#00A9B0] rounded-full flex items-center justify-center">
                        <i className="bi bi-check text-white text-xs"></i>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                >
                  <i className="bi bi-arrow-left mr-2"></i> Back
                </button>
                <button
                  onClick={nextStep}
                  className="bg-[#00A9B0] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#008c92] transition-colors flex items-center gap-2"
                >
                  Continue <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Deal Types */}
          {step === 3 && !showResults && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-center mb-2">What deals excite you?</h2>
              <p className="text-center text-gray-500 mb-6">Select your favorite deal types</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dealTypeOptions.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => toggleDealType(deal.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                      selectedDealTypes.includes(deal.id)
                        ? 'border-[#00A9B0] bg-[#00A9B0]/5 shadow-md'
                        : 'border-gray-200 hover:border-[#00A9B0]'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full ${deal.color} flex items-center justify-center`}>
                      <i className={`${deal.icon} text-xl text-gray-700`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{deal.name}</div>
                      <div className="text-sm text-gray-500">{deal.description}</div>
                    </div>
                    {selectedDealTypes.includes(deal.id) && (
                      <div className="w-6 h-6 bg-[#00A9B0] rounded-full flex items-center justify-center">
                        <i className="bi bi-check text-white text-sm"></i>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Email opt-in */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveResults}
                    onChange={(e) => setSaveResults(e.target.checked)}
                    className="w-4 h-4 mt-1 accent-[#00A9B0]"
                  />
                  <div>
                    <span className="font-semibold text-gray-700">Save my results</span>
                    <p className="text-sm text-gray-500">Get personalized recommendations sent to your email</p>
                  </div>
                </label>
                {saveResults && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    required
                  />
                )}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                >
                  <i className="bi bi-arrow-left mr-2"></i> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-[#00A9B0] to-[#008c92] text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      Build My Dream Mall <i className="bi bi-magic"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && result && (
            <div className="max-w-4xl mx-auto">
              {/* Result Card */}
              <div className="bg-gradient-to-br from-[#00A9B0] to-[#008c92] rounded-2xl p-8 text-white text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                  <i className="bi bi-star-fill text-4xl text-[#FFC72C]"></i>
                </div>
                <h2 className="text-2xl font-bold mb-2">Your Dream Mall is Ready!</h2>
                <p className="text-white/90 mb-4">{result.message}</p>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  <div className="bg-white/20 rounded-full px-4 py-2">
                    <span className="font-semibold">{result.primaryCategory}</span>
                  </div>
                  <div className="bg-white/20 rounded-full px-4 py-2">
                    <span className="font-semibold">{result.shopperType}</span>
                  </div>
                </div>
              </div>

              {/* Percentages Chart */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <h3 className="font-bold text-lg mb-4 text-center">Your Shopping Personality</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fashion</span>
                      <span>{result.percentages.fashion}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: `${result.percentages.fashion}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Electronics</span>
                      <span>{result.percentages.electronics}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${result.percentages.electronics}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Home & Living</span>
                      <span>{result.percentages.home}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${result.percentages.home}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Other</span>
                      <span>{result.percentages.other}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${result.percentages.other}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Brands */}
              {result.recommendedBrands && result.recommendedBrands.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                  <h3 className="font-bold text-lg mb-4">Brands You'll Love</h3>
                  <div className="flex flex-wrap gap-4">
                    {result.recommendedBrands.map((brand) => (
                      <div key={brand} className="bg-gray-100 rounded-lg px-4 py-2">
                        <span className="font-medium">{brand}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Products */}
              {recommendations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                  <h3 className="font-bold text-lg mb-4">Recommended For You</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {recommendations.map((product) => (
                      <Link key={product._id} to={`/product/${product.slug}?id=${product._id}`} className="group">
                        <div className="border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-all">
                          <img src={product.images?.[0]?.url} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-2" />
                          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-[#00A9B0]">{product.name}</h4>
                          <div className="text-[#00A9B0] font-bold mt-1">${product.price}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete Dream Mall Button */}
              {hasSavedMall && (
                <div className="text-center mb-6">
                  <button
                    onClick={deleteSavedMall}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center justify-center gap-1 mx-auto"
                  >
                    <i className="bi bi-trash"></i> Delete My Dream Mall
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/products"
                  className="bg-[#FFC72C] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#e5b300] transition-colors"
                >
                  Start Shopping <i className="bi bi-arrow-right ml-2"></i>
                </Link>
                <button
                  onClick={resetQuiz}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                >
                  Take Quiz Again <i className="bi bi-arrow-repeat ml-2"></i>
                </button>
              </div>

              {/* Share Results */}
              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm mb-3">Share your Dream Mall results</p>
                <div className="flex justify-center gap-3">
                  <button className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <i className="bi bi-whatsapp"></i>
                  </button>
                  <button className="w-10 h-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <i className="bi bi-facebook"></i>
                  </button>
                  <button className="w-10 h-10 bg-[#1DA1F2] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <i className="bi bi-twitter-x"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DreamMallPage;