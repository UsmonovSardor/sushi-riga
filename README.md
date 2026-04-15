# 🍣 Sushi Rīga — Full-Stack Delivery App

Professional full-stack sushi delivery application built with **Node.js + Express** backend and **React + Vite** frontend.

## Architecture

```
sushi-riga/
├── backend/                    # Node.js + Express REST API
│   ├── src/
│   │   ├── config/             # Environment config
│   │   ├── controllers/        # Route controllers
│   │   │   ├── menuController.js
│   │   │   └── orderController.js
│   │   ├── data/
│   │   │   └── menu.json       # Menu data
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── menu.js         # GET /api/menu
│   │   │   └── orders.js       # POST /api/orders
│   │   ├── services/
│   │   │   └── telegramService.js  # Telegram bot notifications
│   │   └── app.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/                   # React + Vite SPA
    ├── src/
    │   ├── components/
    │   │   ├── Header/
    │   │   ├── CategoryNav/
    │   │   ├── HeroSlider/
    │   │   ├── MenuSection/
    │   │   ├── ProductCard/
    │   │   ├── Cart/
    │   │   ├── OrderModal/
    │   │   ├── SearchOverlay/
    │   │   ├── SideMenu/
    │   │   ├── Footer/
    │   │   └── Notification/
    │   ├── context/
    │   │   ├── CartContext.jsx
    │   │   └── LanguageContext.jsx
    │   ├── hooks/
    │   ├── i18n/
    │   │   └── translations.js  # RU / LV / EN
    │   ├── services/
    │   │   └── api.js           # Fetch wrapper
    │   └── App.jsx
    ├── index.html
    └── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | All menu items |
| GET | `/api/menu/hits` | Hit products |
| GET | `/api/menu/category/:cat` | By category |
| POST | `/api/orders` | Create order → Telegram |

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
# Fill in TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Tech Stack

**Backend:** Node.js, Express, Helmet, CORS, Rate Limiting, Express Validator  
**Frontend:** React 18, Vite, Context API  
**Notifications:** Telegram Bot API  
**Languages:** Russian 🇷🇺, Latvian 🇱🇻, English 🇬🇧
