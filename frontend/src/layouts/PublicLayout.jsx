import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PromoBar from '../components/layout/PromoBar';
import MobileBottomNav from '../components/layout/MobileBottomNav';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PromoBar />
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default PublicLayout;