import React, { useState, useCallback, Suspense } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider }     from './context/AuthContext';
import { CartProvider }     from './context/CartContext';
import { MenuProvider }     from './context/MenuContext';

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
import ErrorBoundary from './components/ErrorBoundary';

const AdminPage = React.lazy(() => import('./pages/Admin'));

import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { useMenu } from './context/MenuContext';
import { useMyOrders } from './hooks/queries';
import { useOrderStream } from './hooks/useOrderStream';
import type { Lang } from './types';

function MenuError({ onRetry, lang }: { onRetry: () => void; lang: Lang }) {
  const L = (lv: string, ru: string, en: string) => (lang === 'lv' ? lv : lang === 'ru' ? ru : en);
  return (
    <div className="menu-error" role="alert">
      <div className="menu-error-emoji">🍣</div>
      <div className="menu-error-title">
        {L('Neizdevās ielādēt ēdienkarti', 'Не удалось загрузить меню', 'Could not load the menu')}
      </div>
      <div className="menu-error-sub">
        {L('Pārbaudiet savienojumu un mēģiniet vēlreiz.', 'Проверьте соединение и попробуйте снова.', 'Check your connection and try again.')}
      </div>
      <button className="menu-error-btn" onClick={onRetry}>
        {L('Mēģināt vēlreiz', 'Попробовать снова', 'Try again')}
      </button>
    </div>
  );
}

interface Section {
  id: string;
  e: string;
  k: string;
  cats: string[];
}

const SECTIONS: Section[] = [
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
  const [readyIds, setReadyIds] = useState<string[]>([]);

  const { user } = useAuth();
  const { lang } = useLanguage();
  const { error: menuError, reload: reloadMenu } = useMenu();

  // Signed-in customers' orders. A kitchen "ready" status arrives in real time
  // over SSE (useOrderStream invalidates this query); the 30s poll stays on as
  // a fallback for when the stream can't connect.
  const myOrders = useMyOrders({ enabled: !!user, poll: true });
  useOrderStream(!!user);

  // Derive the unseen "ready" notification from the cached orders.
  React.useEffect(() => {
    if (!user) {
      setReadyCount(0);
      setReadyIds([]);
      return;
    }
    let seen: string[] = [];
    try { seen = JSON.parse(localStorage.getItem('sr_ready_seen') || '[]'); } catch {}
    const list = myOrders.data ?? [];
    const readyList = list.filter(o => o.status === 'ready' && !seen.includes(o.id));
    setReadyIds(readyList.map(o => o.id));
    setReadyCount(readyList.length);
    const ready = readyList[0];
    if (ready) {
      setReadyNote(
        lang === 'lv' ? `Pasūtījums #${ready.id} ir gatavs!`
          : lang === 'ru' ? `Заказ #${ready.id} готов!`
          : `Order #${ready.id} is ready!`
      );
    }
  }, [user, lang, myOrders.data]);

  // A freshly placed order should refetch immediately (the create mutation also
  // invalidates, but this keeps the guest→login path covered).
  React.useEffect(() => {
    const onCreated = () => myOrders.refetch();
    window.addEventListener('sr_order_created', onCreated);
    return () => window.removeEventListener('sr_order_created', onCreated);
  }, [myOrders]);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const openOrder = useCallback(() => {
    setCartOpen(false);
    setTimeout(() => setOrderOpen(true), 80);
  }, []);

  if (window.location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={null}>
        <AdminPage />
      </Suspense>
    );
  }

  return (
    <>
      <Header
        onCartOpen={openCart}
        onMenuOpen={() => setMenuOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
        onAuthOpen={() => setAuthOpen(true)}
        onMyOrdersOpen={() => {
          let seen: string[] = [];
          try { seen = JSON.parse(localStorage.getItem('sr_ready_seen') || '[]'); } catch {}
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
        <HeroSlider onOrderNow={openCart} />
        {menuError ? (
          <MenuError onRetry={reloadMenu} lang={lang} />
        ) : (
          SECTIONS.map(s => (
            <ErrorBoundary key={s.id}>
              <MenuSection
                sectionId={s.id}
                emoji={s.e}
                titleKey={s.k}
                cats={s.cats}
              />
            </ErrorBoundary>
          ))
        )}
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
        <MenuProvider>
          <CartProvider>
            <MainApp />
          </CartProvider>
        </MenuProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
