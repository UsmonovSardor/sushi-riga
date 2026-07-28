import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import AppShell from '@/components/AppShell';
import Home from '@/screens/Home';
import Menu from '@/screens/Menu';
import Cart from '@/screens/Cart';
import Checkout from '@/screens/Checkout';
import OrderTracking from '@/screens/OrderTracking';
import Orders from '@/screens/Orders';
import ReviewsPending from '@/screens/ReviewsPending';
import Profile from '@/screens/Profile';
import Splash from '@/components/Splash';

export default function App() {
  const { status, init } = useAuth();
  const location = useLocation();

  useEffect(() => {
    init();
  }, [init]);

  if (status === 'idle' || status === 'loading') {
    return <Splash />;
  }

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:catId" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderTracking />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/reviews" element={<ReviewsPending />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  );
}
