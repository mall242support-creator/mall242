import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { contactService } from '../services/api';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    orderNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await contactService.sendContactForm(formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'Your message has been sent! We\'ll get back to you within 24 hours.' });
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          orderNumber: '',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send message. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: 'bi-envelope', title: 'Email', info: 'hello@mall242.com', link: 'mailto:hello@mall242.com' },
    { icon: 'bi-telephone', title: 'Phone', info: '+1-242-555-0123', link: 'tel:+12425550123' },
    { icon: 'bi-whatsapp', title: 'WhatsApp', info: '+1-242-555-0123', link: 'https://wa.me/12425550123' },
    { icon: 'bi-geo-alt', title: 'Address', info: '123 Bay Street, Nassau, Bahamas', link: 'https://maps.google.com' },
  ];

  const faqs = [
    { q: 'How long does shipping take?', a: 'Shipping within New Providence takes 2-3 business days. Other islands take 5-7 business days.' },
    { q: 'How do I track my order?', a: 'Once your order ships, you\'ll receive a tracking number via email. You can also track it in your Orders page.' },
    { q: 'What is your return policy?', a: 'We offer 30-day easy returns. Items must be unused and in original packaging.' },
    { q: 'How do I become a vendor?', a: 'Click on "Sell" in the navigation menu and fill out the vendor application form.' },
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us | Mall242</title>
        <meta name="description" content="Get in touch with Mall242 customer support. We're here to help with your questions and concerns." />
      </Helmet>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#00A9B0] to-[#FFC72C] rounded-2xl shadow-lg mb-4">
              <i className="bi bi-headset text-4xl text-white"></i>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Contact Us</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {contactInfo.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                target={item.link.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all group border border-gray-200"
              >
                <div className="w-12 h-12 bg-[#00A9B0]/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#00A9B0] transition-colors">
                  <i className={`${item.icon} text-xl text-[#00A9B0] group-hover:text-white transition-colors`}></i>
                </div>
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.info}</p>
              </a>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Contact Form */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Send us a message</h2>
                
                {message.text && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Order Number (Optional)</label>
                      <input
                        type="text"
                        name="orderNumber"
                        value={formData.orderNumber}
                        onChange={handleChange}
                        placeholder="MAL-2024-XXXXX"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Subject *</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0]"
                    >
                      <option value="">Select a subject</option>
                      <option value="order">Order Issue</option>
                      <option value="shipping">Shipping Question</option>
                      <option value="return">Return Request</option>
                      <option value="product">Product Question</option>
                      <option value="vendor">Vendor Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A9B0] resize-none"
                      placeholder="Please provide as much detail as possible..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00A9B0] text-white py-3 rounded-lg font-semibold hover:bg-[#008c92] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send"></i>
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="lg:w-96">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <div key={idx}>
                      <button
                        onClick={() => {
                          const answer = document.getElementById(`faq-${idx}`);
                          answer.classList.toggle('hidden');
                        }}
                        className="w-full text-left font-semibold text-gray-800 hover:text-[#00A9B0] transition-colors flex justify-between items-center"
                      >
                        {faq.q}
                        <i className="bi bi-chevron-down text-gray-400"></i>
                      </button>
                      <p id={`faq-${idx}`} className="text-sm text-gray-500 mt-2 hidden">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Business Hours</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p>Saturday: 10:00 AM - 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Social Media</h3>
                  <div className="flex gap-3">
                    <a href="#" className="w-10 h-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <i className="bi bi-facebook"></i>
                    </a>
                    <a href="#" className="w-10 h-10 bg-[#1DA1F2] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <i className="bi bi-twitter-x"></i>
                    </a>
                    <a href="#" className="w-10 h-10 bg-[#E4405F] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <i className="bi bi-instagram"></i>
                    </a>
                    <a href="#" className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <i className="bi bi-whatsapp"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;