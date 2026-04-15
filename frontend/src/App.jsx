import React, { useState } from 'react';
import { CartProvider }     from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import Header        from './components/Header';
import CategoryNav   from './components/CategoryNav';
import HeroSlider    from './components/HeroSlider';
import MenuSection   from './components/MenuSection';
import Cart          from './components/Cart';
import OrderModal    from './components/OrderModal';
import SearchOverlay from './components/SearchOverlay';
import SideMenu      from './components/SideMenu';
import Footer        from './components/Footer';

const CATS = [
  { id:'hit',    emoji:'⭐' },
  { id:'sets',   emoji:'🎁' },
  { id:'rolls',  emoji:'🍣' },
  { id:'sushi',  emoji:'🍱' },
  { id:'hot',    emoji:'🔥' },
  { id:'drinks', emoji:'🥤' },
];

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sideOpen,   setSideOpen]   = useState(false);
  const [orderOpen,  setOrderOpen]  = useState(false);

  return (
    <LanguageProvider>
      <CartProvider>
        <Header onSearch={() => setSearchOpen(true)} onMenu={() => setSideOpen(true)} />
        <CategoryNav />
        <SideMenu    isOpen={sideOpen}   onClose={() => setSideOpen(false)} />
        <HeroSlider />
        <main style={{ padding:'0 40px 80px' }}>
          {CATS.map(c => <MenuSection key={c.id} category={c.id} emoji={c.emoji} />)}
        </main>
        <Footer />
        <Cart        onCheckout={() => { setOrderOpen(true); }} />
        <OrderModal  isOpen={orderOpen}  onClose={() => setOrderOpen(false)} />
        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </CartProvider>
    </LanguageProvider>
  );
}
