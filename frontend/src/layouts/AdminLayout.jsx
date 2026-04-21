import { Outlet, Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PromoBar from '../components/layout/PromoBar';
import MobileBottomNav from '../components/layout/MobileBottomNav';

// Check if user is authenticated and is admin
const isAdmin = () => {
  const token = localStorage.getItem('temp_auth');
  const userStr = localStorage.getItem('user');
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  
  if (!token && !isLoggedIn) return false;
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.role === 'admin';
    } catch (e) {
      return false;
    }
  }
  return false;
};

const AdminLayout = () => {
  const admin = isAdmin();
  
  console.log('AdminLayout - isAdmin:', admin);
  
  if (!admin) {
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

export default AdminLayout;