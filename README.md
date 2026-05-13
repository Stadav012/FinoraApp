# Finora

> **Your money, simplified.** — A personal finance app for day-to-day money management.

Finora is a cross-platform mobile application built with **React Native** and **Expo** that helps users track income and spending, analyze financial habits, manage budgets, and stay on top of subscriptions — all backed by cloud sync and AI-powered intelligence.

---

## 🎯 What Finora Does

Finora is designed as a **complete personal finance product** — not just a single spreadsheet — for people who want to understand and control where their money goes.

### Core Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Sign in / sign up flow with secure account management |
| **Dashboard** | At-a-glance financial overview: balances, recent activity, spending summaries |
| **Transactions** | Add, review, categorize, and search income/expense entries |
| **Analytics** | Visual charts and breakdowns of spending patterns over time |
| **Budgets** | Set and track category-based budgets with progress indicators |
| **Subscriptions** | Monitor recurring payments, see upcoming charges, detect waste |

### Intelligent Features

| Feature | Description |
|---------|-------------|
| **AI Categorization** | OpenAI-backed APIs auto-categorize and parse transactions |
| **Smart Insights** | AI-generated spending observations and recommendations |
| **Transaction Parsing** | Natural language input — e.g. "coffee at starbucks $5.50" |

### Utility & Extras

| Feature | Description |
|---------|-------------|
| **Cloud Sync** | Data syncs across devices via cloud backend |
| **Email Reminders** | Configurable alerts for bills, budget limits, reports |
| **Export / PDF** | Generate and export financial reports as PDF/CSV |
| **Themes** | Light and dark mode with customizable accent colors |
| **Landing Page** | Marketing-style "learn more" area for new users |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React Native (Expo SDK 54) |
| **Language** | TypeScript (strict mode) |
| **Navigation** | Expo Router (file-based routing) |
| **Animations** | React Native Reanimated |
| **Icons** | @expo/vector-icons (Ionicons) |
| **State** | TBD — likely Zustand or React Context |
| **Backend** | TBD — Firebase / Supabase / custom API |
| **AI** | OpenAI API for categorization & parsing |

---

## 📁 Project Structure

```
FinoraApp/
├── app/                      # Expo Router file-based screens
│   ├── _layout.tsx           # Root layout (Stack navigator)
│   ├── (auth)/               # Authentication flow (outside tabs)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (tabs)/               # Main tab navigator
│       ├── _layout.tsx       # Tab bar configuration
│       ├── index.tsx         # Dashboard (home)
│       ├── transactions.tsx  # Transaction list & add
│       ├── analytics.tsx     # Charts & insights
│       ├── budgets.tsx       # Budget tracking
│       └── more.tsx          # Settings, subscriptions, export
├── constants/
│   └── theme.ts              # Design tokens: colors, typography, spacing
├── hooks/
│   └── useThemeColors.ts     # Theme-aware color hook
├── assets/                   # Icons, splash screens, images
├── Finora Logos/              # Brand logos (PNG & SVG)
├── DESIGN.md                 # Design system reference
├── app.json                  # Expo configuration
├── babel.config.js           # Babel + Reanimated plugin
├── tsconfig.json             # TypeScript config with path aliases
└── package.json              # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Expo CLI** (comes via npx)
- **iOS Simulator** (Xcode) or **Android Emulator** (Android Studio)  
- Or install **Expo Go** on a physical device

### Run the app

```bash
# Install dependencies (already done)
npm install

# Start the development server
npm start

# Or target a specific platform
npm run ios
npm run android
npm run web
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

---

## 🎨 Design System

Finora uses the **Dimension** style — a deep-space command center aesthetic. It employs a dark, immersive interface, reminiscent of a command center displaying critical information.

### Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| 🌑 Midnight Base | `#0a0a0a` | Page canvas, primary background |
| 🪨 Storm Gray | `#161616` | Muted text, subtle borders |
| 🌫️ Ghost White | `#e5e5e5` | Hairline borders, dividers, outlines |
| ⚪ Canvas White | `#ffffff` | Active text, primary pill buttons |
| 💜 Interactive Glow | `#6b62f2` | Ambient light effects, accents |

### Theme Support

The app is **strictly dark mode**. Surfaces range from deep black (`Midnight Base`) to subtle translucent grays (`Translucent Accent`), often paired with blurred backgrounds to create depth. Interactive elements are ghost-like controls, soft white accents, and carefully calibrated radii that hint at physical buttons.

---

## 📋 Roadmap

- [x] Project setup (Expo + TypeScript + Router)
- [x] Tab navigation structure
- [x] Auth flow scaffolding (login/signup)
- [x] Design system & theme tokens
- [ ] Dashboard screen — build out UI
- [ ] Transaction CRUD — add/edit/delete/list
- [ ] Analytics charts — spending breakdowns
- [ ] Budget category management
- [ ] Subscriptions tracking
- [ ] Cloud backend integration
- [ ] OpenAI transaction categorization
- [ ] Export/PDF generation
- [ ] Email reminder system
- [ ] Onboarding flow
- [ ] Landing/marketing page

---

## 📝 License

Private — all rights reserved.
