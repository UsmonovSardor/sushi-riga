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

// Map of category -> which backend cats to merge, emoji, i18n key
const SECTIONS = [
  { id:'hit',     emoji:'⭐', key:'c_hit',     cats:['hit']                          },
  { id:'cold',    emoji:'🍣', key:'c_cold',    cats:['cold']                         },
  { id:'hot',     emoji:'🔥', key:'c_hot',     cats:['hot']                          },
  { id:'tempura', emoji:'🍤', key:'c_tempura', cats:['tempura']                      },
  { id:'special', emoji:'🎎', key:'c_special', cats:['gunkan','nigiri','sashimi']    },
  { id:'double',  emoji:'🎯', key:'c_double',  cats:['double']                       },
  { id:'sets',    emoji:'🎁', key:'c_sets',    cats:['sets']                         },
  { id:'food',    emoji:'🍜', key:'c_food',    cats:['soup','wok','burger']          },
  { id:'salad',   emoji:'🥗', key:'c_salad',   cats:['salad']                        },
  { id:'snacks',  emoji:'🍟', key:'c_snacks',  cats:['snacks']                       },
  { id:'drinks',  emoji:'🥤', key:'c_drinks',  cats:['drinks']                       },
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
        <SideMenu isOpen={sideOpen} onClose={() => setSideOpen(false)} />
        <HeroSlider />
        <main style={{ padding:'0 40px 80px', maxWidth:1400, margin:'0 auto' }}>
          {SECTIONS.map(s => (
            <MenuSection key={s.id} sectionId={s.id} emoji={s.emoji} titleKey={s.key} cats={s.cats} />
          ))}
        </main>
        <Footer />
        <Cart onCheckout={() => setOrderOpen(true)} />
        <OrderModal isOpen={orderOpen} onClose={() => setOrderOpen(false)} />
        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </CartProvider>
    </LanguageProvider>
  );
}
