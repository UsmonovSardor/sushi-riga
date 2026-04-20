import React, { useState, useCallback } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider }     from './context/AuthContext';
import { CartProvider }     from './context/CartContext';

import Header       from './components/Header';
import PromoBar     from './components/PromoBar';
import CategoryNav  from './components/CategoryNav';
import HeroSlider   from './components/HeroSlider';
import MenuSection  from './components/MenuSection';
import Cart         from './components/Cart';
import CartBar      from './components/CartBar';
import SearchOverlay from './components/SearchOverlay';
import SideMenu     from './components/SideMenu';
import AuthModal    from './components/AuthModal';
import OrderModal   from './components/OrderModal';
import Footer       from './components/Footer';
import AdminPage    from './pages/Admin';

function MainApp() {
  const [cartOpen,   setCartOpen]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen,   setAuthOpen]   = useState(false);
  const [orderOpen,  setOrderOpen]  = useState(false);

  const openOrder = useCallback(() => { setCartOpen(false); setOrderOpen(true); }, []);

  if (window.location.pathname.startsWith('/admin')) return <AdminPage />;

  return (
    <>
      <Header
        onCartOpen   ={() => setCartOpen(true)}
        onMenuOpen   ={() => setMenuOpen(true)}
        onSearchOpen ={() => setSearchOpen(true)}
        onAuthOpen   ={() => setAuthOpen(true)}
      />
      <PromoBar />
      <CategoryNav />
      <main className="main">
        <HeroSlider />
        <MenuSection />
      </main>
      <Footer />

      <CartBar onCheckout={openOrder} />

      <Cart
        isOpen    ={cartOpen}
        onClose   ={() => setCartOpen(false)}
        onCheckout={openOrder}
      />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <SideMenu      isOpen={menuOpen}   onClose={() => setMenuOpen(false)} />
      {authOpen  && <AuthModal   onClose={() => setAuthOpen(false)} />}
      {orderOpen && <OrderModal  isOpen={orderOpen} onClose={() => setOrderOpen(false)} />}
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
