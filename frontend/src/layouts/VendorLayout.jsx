import { Outlet, Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PromoBar from '../components/layout/PromoBar';
import MobileBottomNav from '../components/layout/MobileBottomNav';

// Check if user is authenticated and is vendor or admin
const isVendor = () => {
  const token = localStorage.getItem('temp_auth');
  const userStr = localStorage.getItem('user');
  
  if (!token) return false;
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.role === 'vendor' || user.role === 'admin';
    } catch (e) {
      return false;
    }
  }
  return false;
};

const VendorLayout = () => {
  if (!isVendor()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PromoBar />
      <Header />
      <main className="flex-grow pt-2">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default VendorLayout;