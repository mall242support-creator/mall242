import { useState, useEffect } from 'react';
import { adminService, referralService } from '../../services/api';

const ReferralManager = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [topReferrers, setTopReferrers] = useState([]);
  const [dailyReferrals, setDailyReferrals] = useState([]);
  const [period, setPeriod] = useState('month');
  const [tiers, setTiers] = useState([
    { tier: 1, referralsNeeded: 1, reward: 'Early Access', isActive: true },
    { tier: 2, referralsNeeded: 3, reward: '15% Off Code', isActive: true },
    { tier: 3, referralsNeeded: 5, reward: 'Giveaway Entry', isActive: true },
    { tier: 4, referralsNeeded: 10, reward: 'VIP Status', isActive: true },
  ]);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch referral analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminService.getReferralAnalytics(period);
      if (res.success) {
        setAnalytics(res.analytics);
        setTopReferrers(res.analytics?.topReferrers || []);
        setDailyReferrals(res.analytics?.dailyReferrals || []);
      }
    } catch (error) {
      console.error('Failed to fetch referral analytics:', error);
      setMessage({ type: 'error', text: 'Failed to load referral analytics' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // Update reward tiers
  const updateTiers = async () => {
    try {
      const res = await adminService.updateRewardTiers(tiers);
      if (res.success) {
        setMessage({ type: 'success', text: 'Reward tiers updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
    }
  };

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...tiers];
    updatedTiers[index][field] = value;
    setTiers(updatedTiers);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Referral Analytics</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Total Clicks</p>
            <p className="text-2xl font-bold text-blue-700">{analytics.totals?.clicks || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Total Signups</p>
            <p className="text-2xl font-bold text-green-700">{analytics.totals?.signups || 0}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Completed Purchases</p>
            <p className="text-2xl font-bold text-purple-700">{analytics.totals?.purchases || 0}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600">Conversion Rate</p>
            <p className="text-2xl font-bold text-yellow-700">{analytics.conversion?.overallConversion || 0}%</p>
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      {analytics && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Clicks to Signups</span>
                <span className="font-semibold">{analytics.conversion?.clicksToSignups || 0}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${analytics.conversion?.clicksToSignups || 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Signups to Purchases</span>
                <span className="font-semibold">{analytics.conversion?.signupsToPurchases || 0}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${analytics.conversion?.signupsToPurchases || 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Conversion</span>
                <span className="font-semibold">{analytics.conversion?.overallConversion || 0}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${analytics.conversion?.overallConversion || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Referrals Chart */}
      {dailyReferrals.length > 0 && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Daily Referrals</h3>
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-[600px]">
              {dailyReferrals.map((day, idx) => (
                <div key={idx} className="flex-1 text-center">
                  <div className="h-32 flex items-end justify-center mb-2">
                    <div 
                      className="w-full bg-[#00A9B0] rounded-t-lg transition-all"
                      style={{ height: `${Math.min(100, (day.count / Math.max(...dailyReferrals.map(d => d.count), 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{day._id}</p>
                  <p className="text-sm font-semibold">{day.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Referrers */}
      {topReferrers.length > 0 && (
        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <h3 className="font-semibold text-gray-800 p-4 border-b border-gray-200">Top Referrers</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Referrals</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topReferrers.map((referrer, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`font-bold ${
                        idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{referrer.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{referrer.email}</td>
                    <td className="px-4 py-3 font-semibold text-[#00A9B0]">{referrer.referralCount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        referrer.rewardTier >= 4 ? 'bg-purple-100 text-purple-700' :
                        referrer.rewardTier >= 3 ? 'bg-blue-100 text-blue-700' :
                        referrer.rewardTier >= 2 ? 'bg-green-100 text-green-700' :
                        referrer.rewardTier >= 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        Tier {referrer.rewardTier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reward Tiers Configuration */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="font-semibold text-gray-800 p-4 border-b border-gray-200">Reward Tiers Configuration</h3>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tier</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Referrals Needed</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Reward</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tiers.map((tier, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-semibold">Tier {tier.tier}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={tier.referralsNeeded}
                        onChange={(e) => handleTierChange(idx, 'referralsNeeded', parseInt(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={tier.reward}
                        onChange={(e) => handleTierChange(idx, 'reward', e.target.value)}
                        className="w-40 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tier.isActive}
                          onChange={(e) => handleTierChange(idx, 'isActive', e.target.checked)}
                          className="w-4 h-4 accent-[#00A9B0]"
                        />
                        <span className="text-sm">Active</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={updateTiers}
            className="mt-4 bg-[#00A9B0] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
          >
            Save Tier Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralManager;