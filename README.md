# 🍣 Sushi Rīga — Full-Stack Delivery App

Professional full-stack sushi delivery platform for **[cherrysushi.eu](https://cherrysushi.eu)**, built with **Node.js + Express** (PostgreSQL) backend and an installable **React + Vite PWA** frontend.

## Highlights

- 📲 **Installable PWA** — standalone display, offline menu/images via a Workbox service worker, Add-to-Home-Screen prompt
- 🛒 Cart, checkout, and **Stripe** card payments (cash / card)
- 👤 Phone-based auth (JWT), customer order history & live status
- ⭐ Product reviews & rating summaries
- 🛠️ Admin panel (menu CRUD, orders, Cloudinary image uploads)
- 🔔 Telegram notifications on new orders
- 🌐 Trilingual: Russian 🇷🇺 · Latvian 🇱🇻 · English 🇬🇧

## Architecture

```
sushi-riga/
├── backend/                       # Node.js + Express REST API (PostgreSQL)
│   ├── src/
│   │   ├── config/                # Environment config
│   │   ├── controllers/           # menu, order, auth, admin, payment, review
│   │   ├── data-init/             # Seed JSON for first-run bootstrap
│   │   ├── middleware/            # errorHandler, validate
│   │   ├── routes/                # menu, orders, auth, admin, payment, reviews
│   │   ├── services/             # telegramService
│   │   ├── db.js                  # pg Pool + schema (CREATE TABLE IF NOT EXISTS)
│   │   └── app.js                 # helmet, cors, compression, rate-limit
│   └── server.js
│
└── frontend/                      # React 18 + Vite PWA
    ├── public/                    # icons, manifest assets, sitemap
    ├── src/
    │   ├── components/            # Header, Cart, OrderModal, AuthModal, InstallPrompt, …
    │   ├── context/              # Cart, Auth, Language, Menu providers
    │   ├── pages/                 # Admin, MyOrders
    │   ├── i18n/translations.js   # RU / LV / EN
    │   ├── utils/                 # img (Cloudinary), useOverlay, keepAlive
    │   └── services/api.js        # fetch wrapper
    ├── vite.config.js             # React + vite-plugin-pwa (Workbox)
    └── index.html
```

## API Endpoints (main)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | All menu items |
| GET | `/api/menu/hits` | Featured products |
| GET | `/api/menu/category/:cat` | Filter by category |
| GET | `/api/reviews/summary` | Rating summaries |
| POST | `/api/orders` | Create order → Telegram |
| GET | `/api/orders/my` | Customer's orders (JWT) |
| POST | `/api/auth/*` | Register / login |
| POST | `/api/payment/*` | Stripe payment intent |
| `*` | `/api/admin/*` | Admin CRUD (protected) |

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
# DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, JWT_SECRET,
# STRIPE_SECRET_KEY, CLOUDINARY_URL
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production build + service worker
```

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL (pg), Helmet, CORS, compression, rate-limit, express-validator, JWT (jsonwebtoken + bcryptjs), Stripe, Cloudinary, Telegram Bot API
**Frontend:** React 18, Vite, vite-plugin-pwa (Workbox), Context API, Stripe.js
**Deploy:** Railway (API + static frontend + PostgreSQL) · cherrysushi.eu
