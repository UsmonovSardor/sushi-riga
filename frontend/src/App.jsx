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
import Notification  from './components/Notification';
import MyOrdersPage  from './pages/MyOrders';
import SideMenu      from './components/SideMenu';
import AuthModal     from './components/AuthModal';
import OrderModal    from './components/OrderModal';
import Footer        from './components/Footer';
import AdminPage     from './pages/Admin';

import { ordersApi } from './services/api';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';

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
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [myOrdersOpen, setMyOrdersOpen] = useState(false);

  const [readyNote, setReadyNote] = useState('');
  const [readyCount, setReadyCount] = useState(0);
  const [readyIds, setReadyIds] = useState([]);

  const { user } = useAuth();
  const { lang } = useLanguage();

  React.useEffect(() => {
    if (!user) {
      setReadyCount(0);
      return;
    }

    const seenKey = 'sr_ready_seen';
    const check = async () => {
  try {
    const seen = JSON.parse(localStorage.getItem(seenKey) || '[]');
    const list = await ordersApi.getMine();
    const readyList = list.filter(o => o.status === 'ready' && !seen.includes(o.id));
    setReadyIds(readyList.map(o => o.id));
    setReadyCount(readyList.length);
    const ready = readyList[0];
    if (ready) {
      setReadyNote(lang === 'lv' ? `Pasūtījums #${ready.id} ir gatavs!` : lang === 'ru' ? `Заказ #${ready.id} готов!` : `Order #${ready.id} is ready!`);
    }
  } catch {}
};

    

    check();
    

    window.addEventListener('sr_order_created', check);

    return () => {
      
      window.removeEventListener('sr_order_created', check);
    };
  }, [user, lang]);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const openOrder = useCallback(() => {
    setCartOpen(false);
    setTimeout(() => setOrderOpen(true), 80);
  }, []);

  if (window.location.pathname.startsWith('/admin')) {
    return <AdminPage />;
  }

  return (
    <>
      <Header
        onCartOpen={openCart}
        onMenuOpen={() => setMenuOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
        onAuthOpen={() => setAuthOpen(true)}
        onMyOrdersOpen={() => {
        const seen = JSON.parse(localStorage.getItem('sr_ready_seen') || '[]');
        localStorage.setItem('sr_ready_seen', JSON.stringify([...new Set([...seen, ...readyIds])].slice(-50)));
        setReadyCount(0);
       setReadyIds([]);
       setMyOrdersOpen(true);
      }}
        
        readyOrdersCount={readyCount}
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

      <CartBar
        onOpen={openCart}
        onCheckout={openOrder}
        hidden={cartOpen || orderOpen || authOpen}
      />

      <Cart
        isOpen={cartOpen}
        onClose={closeCart}
        onCheckout={openOrder}
      />

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={() => setOrderOpen(true)}
        />
      )}

      <MyOrdersPage
        isOpen={myOrdersOpen}
        onClose={() => setMyOrdersOpen(false)}
      />

      {readyNote && (
        <Notification
          message={readyNote}
          onDone={() => setReadyNote('')}
        />
      )}

      {orderOpen && (
        <OrderModal
          isOpen={orderOpen}
          onClose={() => setOrderOpen(false)}
          onOpenAuth={() => {
            setOrderOpen(false);
            setAuthOpen(true);
          }}
        />
      )}
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
