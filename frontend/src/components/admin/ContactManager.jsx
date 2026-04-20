import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';

const ContactManager = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [closeTicket, setCloseTicket] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await adminService.getContactMessages(1, 50, statusFilter);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewMessage = async (msg) => {
    try {
      const res = await adminService.getContactMessage(msg._id);
      if (res.success) {
        setSelectedMessage(res.message);
      }
    } catch (error) {
      console.error('Failed to fetch message details:', error);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) {
      setMessage({ type: 'error', text: 'Please enter a reply message' });
      return;
    }

    try {
      const res = await adminService.replyToContact(selectedMessage._id, replyText, closeTicket);
      if (res.success) {
        setMessage({ type: 'success', text: 'Reply sent successfully!' });
        setShowReplyModal(false);
        setReplyText('');
        setCloseTicket(false);
        fetchMessages();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send reply' });
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const res = await adminService.deleteContactMessage(messageId);
      if (res.success) {
        setMessage({ type: 'success', text: 'Message deleted successfully!' });
        fetchMessages();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      read: 'bg-blue-100 text-blue-800',
      replied: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Contact Messages</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
        >
          <option value="all">All Messages</option>
          <option value="pending">Pending</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="text-center py-12">
          <i className="bi bi-inbox text-5xl text-gray-300 mb-3 block"></i>
          <p className="text-gray-500">No contact messages found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(msg.status)}`}>
                      {msg.status}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="font-semibold text-gray-800">{msg.name}</p>
                  <p className="text-sm text-gray-500">{msg.email}</p>
                  <p className="text-sm font-medium text-gray-700 mt-1">{msg.subject}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.message}</p>
                  {msg.orderNumber && (
                    <p className="text-xs text-gray-400 mt-1">Order: {msg.orderNumber}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      viewMessage(msg);
                      setShowReplyModal(true);
                    }}
                    className="text-[#00A9B0] hover:underline text-sm"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => deleteMessage(msg._id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowReplyModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Reply to {selectedMessage.name}</h3>
              <button onClick={() => setShowReplyModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Original Message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Original Message:</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedMessage.message}</p>
                {selectedMessage.orderNumber && (
                  <p className="text-xs text-gray-400 mt-2">Order: {selectedMessage.orderNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reply Message</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] resize-none"
                  placeholder="Type your reply here..."
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={closeTicket}
                  onChange={(e) => setCloseTicket(e.target.checked)}
                  className="w-4 h-4 accent-[#00A9B0]"
                />
                <span className="text-sm text-gray-700">Close this ticket after sending reply</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={sendReply}
                  className="flex-1 bg-[#00A9B0] text-white py-2 rounded-lg font-semibold hover:bg-[#008c92] transition-colors"
                >
                  Send Reply
                </button>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContactManager;