import React, { useState, useCallback } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider }     from './context/AuthContext';
import { CartProvider }     from './context/CartContext';

import Header        from './components/Header';
import PromoBar      from './components/PromoBar';
import CategoryNav   from './components/CategoryNav';
import HeroSlider    from './components/HeroSlider';
import MenuSection   from './components/MenuSection';
import Cart          from './components/Cart';
import CartBar       from './components/CartBar';
import SearchOverlay from './components/SearchOverlay';
import SideMenu      from './components/SideMenu';
import AuthModal     from './components/AuthModal';
import OrderModal    from './components/OrderModal';
import Footer        from './components/Footer';
import AdminPage     from './pages/Admin';

const SECTIONS = [
  { id:'hit',     e:'⭐', k:'c_hit',     cats:['hit'] },
  { id:'cold',    e:'🍣', k:'c_cold',    cats:['cold'] },
  { id:'hot',     e:'🔥', k:'c_hot',     cats:['hot'] },
  { id:'tempura', e:'🍤', k:'c_tempura', cats:['tempura'] },
  { id:'special', e:'🎎', k:'c_special', cats:['gunkan','nigiri','sashimi'] },
  { id:'double',  e:'🎯', k:'c_double',  cats:['double'] },
  { id:'sets',    e:'🎁', k:'c_sets',    cats:['sets'] },
  { id:'food',    e:'🍜', k:'c_food',    cats:['soup','wok','burger'] },
  { id:'salad',   e:'🥗', k:'c_salad',   cats:['salad'] },
  { id:'snacks',  e:'🍟', k:'c_snacks',  cats:['snacks'] },
  { id:'drinks',  e:'🥤', k:'c_drinks',  cats:['drinks'] },
];

function MainApp() {
  const [cartOpen,   setCartOpen]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen,   setAuthOpen]   = useState(false);
  const [orderOpen,  setOrderOpen]  = useState(false);

  const openCart  = useCallback(() => setCartOpen(true),  []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const openOrder = useCallback(() => {
    setCartOpen(false);
    setTimeout(() => setOrderOpen(true), 80);
  }, []);

  if (window.location.pathname.startsWith('/admin')) return <AdminPage />;

  return (
    <>
      <Header
        onCartOpen  ={openCart}
        onMenuOpen  ={() => setMenuOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
        onAuthOpen  ={() => setAuthOpen(true)}
      />
      <PromoBar />
      <CategoryNav />

      <main className="main">
        <HeroSlider />
        {SECTIONS.map(s => (
          <MenuSection
            key={s.id}
            sectionId={s.id}
            emoji={s.e}
            titleKey={s.k}
            cats={s.cats}
          />
        ))}
      </main>

      <Footer />

      {/* Floating cart bar */}
      <CartBar onOpen={openCart} onCheckout={openOrder} />

      {/* Drawers & Modals */}
      <Cart
        isOpen    ={cartOpen}
        onClose   ={closeCart}
        onCheckout={openOrder}
      />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <SideMenu      isOpen={menuOpen}   onClose={() => setMenuOpen(false)} />
      {authOpen  && <AuthModal  onClose={() => setAuthOpen(false)} />}
      {orderOpen && <OrderModal isOpen={orderOpen} onClose={() => setOrderOpen(false)} onOpenAuth={() => { setOrderOpen(false); setAuthOpen(true); }} />}
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
