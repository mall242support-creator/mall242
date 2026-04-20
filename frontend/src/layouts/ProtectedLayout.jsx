import { Outlet, Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PromoBar from '../components/layout/PromoBar';
import MobileBottomNav from '../components/layout/MobileBottomNav';

const isAuthenticated = () => {
  const token = localStorage.getItem('temp_auth');
  const user = localStorage.getItem('user');
  const rememberMe = localStorage.getItem('rememberMe');
  const loginExpiry = localStorage.getItem('loginExpiry');
  
  if (rememberMe && loginExpiry) {
    if (Date.now() > parseInt(loginExpiry)) {
      localStorage.removeItem('temp_auth');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('loginExpiry');
      return false;
    }
  }
  
  return !!token && !!user;
};

const ProtectedLayout = () => {
  if (!isAuthenticated()) {
    const currentPath = window.location.pathname;
    return <Navigate to="/login" state={{ from: currentPath }} replace />;
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

export default ProtectedLayout;