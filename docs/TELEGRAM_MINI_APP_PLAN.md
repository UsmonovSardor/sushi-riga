# 🍣 Cherry Sushi — Telegram Mini App
## To'liq arxitektura va dizayn rejasi (Senior level)

> Maqsad: `cherrysushi.eu` saytining aynan o'zi kabi ishlaydigan, lekin Telegram ichida ochiladigan
> premium Mini App. Bir xil backend (`sushi-riga-api` + Postgres), yangi yengil frontend,
> `@BotFather` orqali sozlanadigan bot. Dizayn + marketing senior darajada.
>
> **Qarorlar:** To'lov = Naqd + Telegram Payments · Tillar = LV/RU/EN · Boshlash = reja avval.

---

## 1. Umumiy arxitektura

```
                    ┌──────────────────────────────┐
                    │        TELEGRAM CLIENT        │
                    │  ┌────────────────────────┐   │
   Ochish tugmasi ─▶│  │   Mini App (WebView)   │   │
                    │  │  Vite + React + TG SDK │   │
                    │  └───────────┬────────────┘   │
                    │              │ initData        │
                    │  ┌───────────▼────────────┐   │
                    │  │   @cherrysushi_bot     │   │  ◀── BotFather
                    │  └───────────┬────────────┘   │
                    └──────────────┼────────────────┘
                                   │ HTTPS
                    ┌──────────────▼────────────────┐
                    │   sushi-riga-api (Railway)     │
                    │   Express + PostgreSQL         │
                    │  ┌──────────────────────────┐  │
                    │  │ MAVJUD: /api/menu, orders │  │
                    │  │        reviews, admin     │  │
                    │  ├──────────────────────────┤  │
                    │  │ YANGI:                    │  │
                    │  │  /api/tma/auth   (initData│  │
                    │  │  /api/tma/pay    (invoice)│  │
                    │  │  /api/bot/webhook (grammY)│  │
                    │  └──────────────────────────┘  │
                    └────────────────────────────────┘
```

**Uch qism:**
1. **Mini App (yangi)** — `telegram-app/` papka. Yengil, tez, Telegram WebApp SDK bilan.
2. **Backend (mavjud + qo'shimchalar)** — bir xil menu/orders/reviews API, ustiga TMA auth, Telegram to'lov, bot webhook.
3. **Bot** — bitta bot (`@BotFather`). Ham do'kon guruhiga (mavjud), ham mijozga (yangi) xabar yuboradi.

---

## 2. Texnologiyalar (eng oxirgi)

| Qatlam | Texnologiya | Sabab |
|---|---|---|
| Build | **Vite 5** | Eng tez, TMA uchun kichik bundle |
| UI | **React 18 + TypeScript** | Type-safe, senior standart |
| TG integratsiya | **@telegram-apps/sdk-react** | Rasmiy zamonaviy SDK (theme, viewport, haptics, invoice) |
| Styling | **Tailwind CSS + CSS vars** | Tez, brend dizayn tizimi, TG theme'ga moslashadi |
| State | **Zustand** | Yengil cart/store, Redux'siz |
| Data fetch | **TanStack Query** | Cache, retry, live status polling |
| Animatsiya | **Framer Motion** | Senior mikro-animatsiyalar |
| i18n | **i18next** | LV/RU/EN |
| Bot | **grammY** | Zamonaviy TS bot framework, webhook |
| To'lov | **Telegram Payments** (`createInvoiceLink` + `openInvoice`) | Native, provider = Stripe (EU) |

---

## 3. Backend qo'shimchalari

### 3.1 `initData` auth — `/api/tma/auth`
Telegram Mini App foydalanuvchini avtomatik yuboradi (`window.Telegram.WebApp.initData`).
Backend imzoni tekshiradi (xavfsizlik):

```
secret_key = HMAC_SHA256(key="WebAppData", msg=BOT_TOKEN)
check_hash = HMAC_SHA256(key=secret_key, msg=data_check_string)
check_hash === initData.hash  ➜ ishonchli
```

- Ma'lumot: `id`, `first_name`, `last_name`, `username`, `language_code`.
- `users_data` jadvaliga `telegram_id` bo'yicha yozamiz/topamiz → mavjud **JWT** beramiz (30 kun).
- **Telefon**: `initData`da telefon yo'q. Buyurtma vaqtida `WebApp.requestContact()` bilan so'raymiz (bir marta, saqlanadi).

### 3.2 DB o'zgarishi (migratsiya)
```sql
ALTER TABLE users_data  ADD COLUMN telegram_id BIGINT UNIQUE;
ALTER TABLE users_data  ADD COLUMN lang        TEXT DEFAULT 'ru';
ALTER TABLE orders      ADD COLUMN address     TEXT;      -- mavjud
ALTER TABLE orders      ADD COLUMN paid        BOOLEAN DEFAULT false;
ALTER TABLE orders      ADD COLUMN provider_charge_id TEXT;

-- Marketing uchun
ALTER TABLE users_data  ADD COLUMN points      INTEGER DEFAULT 0;
ALTER TABLE users_data  ADD COLUMN referred_by BIGINT;
CREATE TABLE IF NOT EXISTS promo_codes (
  code TEXT PRIMARY KEY, kind TEXT, value NUMERIC, active BOOLEAN DEFAULT true,
  min_total NUMERIC DEFAULT 0, uses INTEGER DEFAULT 0, max_uses INTEGER
);
```

### 3.3 Telegram to'lov — `/api/tma/pay/invoice`
1. Frontend cart yuboradi → backend narxni DB'dan qayta tekshiradi (mavjud `createOrder` logikasi).
2. Backend `createInvoiceLink` (Bot API) chaqiradi → invoice URL qaytaradi.
3. Frontend `WebApp.openInvoice(url, cb)` ochadi.
4. To'lov: Telegram → bot webhook'ga `pre_checkout_query` (backend `answerPreCheckoutQuery` ok) → `successful_payment` → backend `orders.paid = true`, status push.

### 3.4 Bot webhook — `/api/bot/webhook` (grammY)
- `/start` → salomlashuv + "Ochish" tugmasi (Mini App launch).
- `pre_checkout_query`, `successful_payment` — to'lov.
- **Buyurtma holati push** (yangi): status o'zgarganda (`new→cooking→ready→delivered`) mijozning Telegram'iga DM. Mavjud admin `updateOrder` shu yerga ulanadi.
- **Marketing push**: tashlab ketilgan savat, "sizni sog'indik", yangi mahsulot, aksiya.
- Do'kon guruhiga xabar — mavjud `telegramService` saqlanadi.

---

## 4. Ekranlar (Oson Prava dizayn tiliga mos)

| # | Ekran | Tavsif | Shablon analogi |
|---|---|---|---|
| 1 | **Home** | Header (TG avatar+ism, loyalty badge), sale hero karusel, kategoriya chiplar, "Best Sellers" grid, sticky savat bar | Dashboard + progress + kartalar |
| 2 | **Menyu** | Kategoriya tablar (Cold/Hot Rolls, Sets...), mahsulot kartalari (+/− qty) | Barcha testlar / Mavzular |
| 3 | **Mahsulot** (bottom sheet) | Rasm, tavsif, ⭐ reyting, qty, savatga | — |
| 4 | **Savat** | Itemlar, qty edit, subtotal, promo-kod, upsell ("ichimlik qo'shing") | — |
| 5 | **Checkout** | Ism (TG'dan), telefon (requestContact), manzil, izoh, to'lov (naqd / Telegram Pay = MainButton) | To'lov ekrani |
| 6 | **Buyurtma kuzatuvi** | Jonli status stepper (yangi→tayyorlanmoqda→tayyor→yetkazildi), bot push | — |
| 7 | **Buyurtmalar tarixi** | O'tган buyurtmalar, "Qayta buyurtma" | — |
| 8 | **Sharhlar** | Yetkazilgan mahsulotlarni baholash (mavjud `my-pending`) | Xatolarni tuzatish |
| 9 | **Profil/Sozlama** | Til (LV/RU/EN), saqlangan manzil, loyalty balllar, referral | Sozlamalar |

**Navigatsiya:** pastda tab-bar (Home · Menyu · Savat · Buyurtmalar · Profil) YOKI Telegram BackButton + sahifa oqimi. Tavsiya: pastki tab-bar + kontekstda BackButton.

---

## 5. Dizayn tizimi (Senior, premium dark)

- **Rejim:** Brend-forward **dark** tema (cherrysushi qizil aksent), Telegram safe-area/viewport'ga to'liq mos. Telegram light temada ham chiroyli fallback.
- **Ranglar:**
  - Fon: `#0E0F13` → `#14151A` (chuqur dark gradient)
  - Kartalar: gradientли (qizil `#E11D2A`, yashil aksiya, binafsha premium) — Oson Prava kabi rangli kartalar
  - Aksent: Cherry Red `#E11D2A`, oltin `#F5B301` (loyalty/hit)
- **Tipografiya:** `Inter` / `SF Pro` — qalin sarlavhalar, aniq ierarxiya.
- **Komponentlar:** yumaloq (radius 16-20px), yumshoq soya, 3D-tilt kartalar (saytdagi mavjud dizayn tili bilan bir xil), glassmorphism header.
- **Mikro-UX:** haptic feedback (savatga qo'shish, tugma), skeleton loaderlar, Framer Motion o'tishlar, MainButton bilan CTA.
- **Ikonlar:** `lucide-react` (chiziqli, zamonaviy).

---

## 6. Marketing / konversiya (Senior)

1. **Sale hero + promo-kodlar** — "Setlar 30% chegirma", checkoutда kod.
2. **Birinchi buyurtma chegirmasi** — yangi foydalanuvchiga avtomatik.
3. **Loyalty balllar** — har buyurtmadan ball, progress bar (Oson Prava kabi), ball → chegirma.
4. **Referral** — Mini App linkini ulashish; ikkalasi bonus oladi (`referred_by`).
5. **Upsell / cross-sell** — checkoutда "birga ko'p olinadi", ichimlik/snack qo'shish.
6. **Re-engagement push** (bot orqali):
   - Tashlab ketilgan savat (30 daqiqadan keyin)
   - "Sizni sog'indik" (14 kun faolsizlik)
   - Yangi mahsulot / aksiya e'loni
7. **Best-seller / HIT badge** — ijtimoiy dalil (mavjud `hit` flag).
8. **⭐ Sharh yig'ish** — yetkazilgandan keyin bot baholashga taklif qiladi.

---

## 7. Bosqichli yo'l xaritasi

| Faza | Ish | Natija |
|---|---|---|
| **0. Skelet** | `telegram-app/` init, TG SDK, `/api/tma/auth`, bot `/start`, deploy | Telegram'da "Ochish" → bo'sh app ochiladi |
| **1. Menyu + savat** | Home, menyu, mahsulot, savat (mavjud `/api/menu`) | Mahsulot ko'rish + savatga qo'shish |
| **2. Checkout (naqd)** | Checkout, manzil/telefon, buyurtma yaratish, status kuzatuvi, bot push | Naqd buyurtma to'liq ishlaydi |
| **3. Telegram to'lov** | `createInvoiceLink`, `openInvoice`, webhook, `paid` | Karta bilan to'lov |
| **4. Profil + i18n** | Buyurtmalar tarixi, sharhlar, LV/RU/EN, sozlama | To'liq foydalanuvchi oqimi |
| **5. Marketing** | Loyalty, referral, promo, re-engagement push | Konversiya vositalari |
| **6. Polish** | Animatsiya, haptic, performance, skeleton, launch | Senior daraja, ishga tayyor |

---

## 8. Muhit o'zgaruvchilari (env)

```
# Mavjud
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...          # do'kon guruhi
JWT_SECRET=...
DATABASE_URL=...
CLOUDINARY_*=...
STRIPE_SECRET_KEY=...         # (web, ixtiyoriy)

# Yangi
TMA_URL=https://app.cherrysushi.eu       # Mini App manzili
BOT_WEBHOOK_SECRET=...                    # webhook himoyasi
TELEGRAM_PROVIDER_TOKEN=...               # BotFather → Payments → Stripe
```

---

## 9. Deploy

- **Mini App (statik)** — Vercel yoki Railway static, subdomen: `app.cherrysushi.eu` (HTTPS majburiy).
- **Backend** — mavjud Railway `sushi-riga-api`, faqat yangi routelar + `setWebhook`.
- **BotFather sozlash (siz qilasiz):**
  1. Bot yaratish / mavjudni ishlatish
  2. `/setmenubutton` → Mini App URL (`app.cherrysushi.eu`)
  3. Payments → Stripe ulash → provider token
  4. Domenni Mini App uchun ro'yxatga olish

---

## 10. Keyingi qadam
Reja tasdiqlangach **Faza 0**dan boshlaymiz: `telegram-app/` skeleti + `initData` auth + bot `/start`,
va Telegram ichida bo'sh Mini App ochilishiga erishamiz.
