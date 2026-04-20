import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { referralService } from '../services/api';
import { SafeHelmet } from '../components/common/SafeHelmet';

const VIPRewardsPage = () => {
  const [stats, setStats] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('rewards');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, rewardsRes, leaderboardRes] = await Promise.all([
        referralService.getStats(),
        referralService.getRewards(),
        referralService.getLeaderboard('month', 10),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
        setReferralLink(statsRes.data.referralLink);
      }
      if (rewardsRes.success) {
        setRewards(rewardsRes.rewards || []);
      }
      if (leaderboardRes.success) {
        setLeaderboard(leaderboardRes.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch VIP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `Join Mall242 using my referral link and get exclusive rewards! ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = `Join Mall242 using my referral link and get exclusive rewards!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const rewardTiers = [
    { 
      tier: 1, 
      referrals: 1, 
      name: 'Early Access', 
      icon: 'bi-clock', 
      color: 'from-blue-500 to-cyan-500',
      benefits: ['Shop before public launch', 'Limited time offers', 'Exclusive previews'],
      unlocked: stats?.stats?.totalSignups >= 1
    },
    { 
      tier: 2, 
      referrals: 3, 
      name: '15% Off Code', 
      icon: 'bi-tag', 
      color: 'from-green-500 to-emerald-500',
      benefits: ['15% off your next purchase', 'Shareable with friends', 'Stackable with other offers'],
      unlocked: stats?.stats?.totalSignups >= 3
    },
    { 
      tier: 3, 
      referrals: 5, 
      name: 'Giveaway Entry', 
      icon: 'bi-gift', 
      color: 'from-purple-500 to-pink-500',
      benefits: ['Monthly drawing entry', '$500 shopping spree', 'Multiple entries possible'],
      unlocked: stats?.stats?.totalSignups >= 5
    },
    { 
      tier: 4, 
      referrals: 10, 
      name: 'VIP Status', 
      icon: 'bi-gem', 
      color: 'from-yellow-500 to-orange-500',
      benefits: ['Free shipping on all orders', 'Early access to sales', 'Exclusive VIP discounts', 'Birthday rewards', 'Priority support'],
      unlocked: stats?.stats?.totalSignups >= 10
    },
  ];

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
  <title>VIP Rewards | Mall242</title>
</Helmet>

      <div className="bg-gradient-to-br from-[#00A9B0]/5 via-white to-[#FFC72C]/5 min-h-screen py-8">
        <div className="container-custom">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#00A9B0] to-[#FFC72C] rounded-2xl shadow-lg mb-4">
              <i className="bi bi-gem text-4xl text-white"></i>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">VIP Rewards Program</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Invite friends to Mall242 and unlock exclusive rewards. The more friends you refer, the better it gets!
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <i className="bi bi-people text-2xl text-[#00A9B0] mb-2 block"></i>
                <div className="text-2xl font-bold text-gray-800">{stats.stats?.totalSignups || 0}</div>
                <div className="text-xs text-gray-500">Total Referrals</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <i className="bi bi-trophy text-2xl text-[#00A9B0] mb-2 block"></i>
                <div className="text-2xl font-bold text-gray-800">{stats.currentTier || 0}/4</div>
                <div className="text-xs text-gray-500">Current Tier</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <i className="bi bi-gem text-2xl text-[#00A9B0] mb-2 block"></i>
                <div className="text-2xl font-bold text-gray-800">{stats.isVIP ? 'Yes' : 'No'}</div>
                <div className="text-xs text-gray-500">VIP Status</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <i className="bi bi-clock text-2xl text-[#00A9B0] mb-2 block"></i>
                <div className="text-2xl font-bold text-gray-800">{stats.earlyAccessGranted ? 'Yes' : 'No'}</div>
                <div className="text-xs text-gray-500">Early Access</div>
              </div>
            </div>
          )}

          {/* Progress to Next Tier */}
          {stats && stats.nextReward && stats.nextReward.referralsNeeded > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700">Progress to Tier {stats.nextReward.tier}</span>
                <span className="text-sm text-gray-500">{stats.stats?.totalSignups || 0} / {stats.nextReward.referralsNeeded + (stats.stats?.totalSignups || 0)} referrals</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00A9B0] to-[#FFC72C] rounded-full transition-all duration-500"
                  style={{ width: `${((stats.stats?.totalSignups || 0) / (stats.nextReward.referralsNeeded + (stats.stats?.totalSignups || 0))) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {stats.nextReward.referralsNeeded} more referral{stats.nextReward.referralsNeeded !== 1 ? 's' : ''} to unlock {stats.nextReward.reward}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'rewards' ? 'text-[#00A9B0] border-b-2 border-[#00A9B0]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="bi bi-gift mr-2"></i> My Rewards
            </button>
            <button
              onClick={() => setActiveTab('refer')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'refer' ? 'text-[#00A9B0] border-b-2 border-[#00A9B0]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="bi bi-share mr-2"></i> Refer & Earn
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'leaderboard' ? 'text-[#00A9B0] border-b-2 border-[#00A9B0]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="bi bi-trophy mr-2"></i> Leaderboard
            </button>
          </div>

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div>
              {/* Reward Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {rewardTiers.map((tier) => (
                  <div 
                    key={tier.tier}
                    className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
                      tier.unlocked ? 'ring-2 ring-[#FFC72C] shadow-xl scale-105' : 'opacity-75'
                    }`}
                  >
                    {tier.unlocked && (
                      <div className="absolute top-0 right-0 bg-[#FFC72C] text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                        Unlocked!
                      </div>
                    )}
                    <div className={`bg-gradient-to-r ${tier.color} p-4 text-white text-center`}>
                      <i className={`${tier.icon} text-3xl mb-2 block`}></i>
                      <div className="text-2xl font-bold">{tier.referrals}+</div>
                      <div className="text-sm opacity-90">Referrals</div>
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-bold text-lg mb-2">{tier.name}</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {tier.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center justify-center gap-1">
                            <i className="bi bi-check-circle-fill text-green-500 text-xs"></i>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* My Rewards List */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">My Available Rewards</h2>
                {rewards.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="bi bi-gift text-5xl text-gray-300 mb-3 block"></i>
                    <p className="text-gray-500">No rewards available yet</p>
                    <p className="text-sm text-gray-400">Refer friends to unlock rewards!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rewards.map((reward) => (
                      <div key={reward.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#00A9B0] to-[#FFC72C] rounded-full flex items-center justify-center">
                            <i className="bi bi-tag text-white text-xl"></i>
                          </div>
                          <div>
                            <p className="font-semibold">{reward.description}</p>
                            <p className="text-xs text-gray-500">Expires: {new Date(reward.expiresAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button className="bg-[#00A9B0] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#008c92] transition-colors">
                          Claim Now
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Refer & Earn Tab */}
          {activeTab === 'refer' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Share Your Referral Link</h2>
              <p className="text-gray-600 mb-4">
                Share this link with your friends. When they sign up and make their first purchase, you'll earn rewards!
              </p>

              {/* Referral Link */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="bg-[#00A9B0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="bi bi-copy"></i>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Share on Social Media</h3>
                <div className="flex gap-3">
                  <button
                    onClick={shareOnWhatsApp}
                    className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="bi bi-whatsapp text-xl"></i> WhatsApp
                  </button>
                  <button
                    onClick={shareOnFacebook}
                    className="flex-1 bg-[#1877F2] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="bi bi-facebook text-xl"></i> Facebook
                  </button>
                  <button
                    onClick={shareOnTwitter}
                    className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="bi bi-twitter-x text-xl"></i> Twitter
                  </button>
                </div>
              </div>

              {/* Referral Stats */}
              {stats && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold mb-3">Your Referral Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-[#00A9B0]">{stats.stats?.totalClicks || 0}</div>
                      <div className="text-xs text-gray-500">Total Clicks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#00A9B0]">{stats.stats?.totalSignups || 0}</div>
                      <div className="text-xs text-gray-500">Signups</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#00A9B0]">{stats.stats?.totalCompleted || 0}</div>
                      <div className="text-xs text-gray-500">Completed Purchases</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#00A9B0]">${stats.stats?.totalEarnings?.toFixed(2) || '0'}</div>
                      <div className="text-xs text-gray-500">Earned</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Top Referrers This Month</h2>
              
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <i className="bi bi-trophy text-5xl text-gray-300 mb-3 block"></i>
                  <p className="text-gray-500">No leaders yet</p>
                  <p className="text-sm text-gray-400">Be the first to reach the top!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((user, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-50 to-transparent border border-yellow-200' :
                        index === 1 ? 'bg-gradient-to-r from-gray-50 to-transparent border border-gray-200' :
                        index === 2 ? 'bg-gradient-to-r from-orange-50 to-transparent border border-orange-200' :
                        'bg-white'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.referralCount} referrals</p>
                      </div>
                      {user.prize && (
                        <div className="text-right">
                          <span className="text-sm font-semibold text-[#00A9B0]">{user.prize}</span>
                        </div>
                      )}
                      {index === 0 && (
                        <i className="bi bi-trophy-fill text-yellow-500 text-2xl"></i>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Prize Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold mb-2">🏆 Monthly Prizes</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-yellow-600">1st Place</div>
                    <div>$1,000 Shopping Spree</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-500">2nd Place</div>
                    <div>$500 Shopping Spree</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-600">3rd Place</div>
                    <div>$250 Shopping Spree</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VIPRewardsPage;