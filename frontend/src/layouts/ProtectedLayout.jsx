import { Outlet, Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PromoBar from '../components/layout/PromoBar';
import MobileBottomNav from '../components/layout/MobileBottomNav';

// Check if user is authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('temp_auth');
  const user = localStorage.getItem('user');
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  
  // Check if any auth flag exists
  return !!(token || isLoggedIn) && !!user;
};

// Get user role
const getUserRole = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.role || 'user';
    } catch (e) {
      return 'user';
    }
  }
  return 'user';
};

const ProtectedLayout = () => {
  const authenticated = isAuthenticated();
  const userRole = getUserRole();
  
  console.log('ProtectedLayout - authenticated:', authenticated);
  console.log('ProtectedLayout - userRole:', userRole);
  
  if (!authenticated) {
    const currentPath = window.location.pathname;
    console.log('Not authenticated, redirecting to login from:', currentPath);
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