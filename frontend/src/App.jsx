import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ScrollToTop from './components/common/ScrollToTop';
import FloatingWhatsApp from './components/common/FloatingWhatsApp';
import CookieConsent from './components/common/CookieConsent';
import PromoPopup from './components/common/PromoPopup';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const DreamMallQuizPage = lazy(() => import('./pages/DreamMallQuizPage'));
const MysteryDropPage = lazy(() => import('./pages/MysteryDropPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const UserSettings = lazy(() => import('./pages/UserSettings'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

// Layouts
import PublicLayout from './layouts/PublicLayout';
import ProtectedLayout from './layouts/ProtectedLayout';
import AdminLayout from './layouts/AdminLayout';

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-[#00A9B0] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      <Routes>
        {/* Public Routes - No Login Required */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/dream-mall" element={<DreamMallQuizPage />} />
          <Route path="/mystery-drop" element={<MysteryDropPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Protected Routes - Login Required */}
        <Route element={<ProtectedLayout />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/account" element={<UserDashboard />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <FloatingWhatsApp />
      <CookieConsent />
      <PromoPopup />
    </Suspense>
  );
}

export default App;