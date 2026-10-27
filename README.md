# GoCart Admin Console

A modern, responsive administration dashboard built with **Next.js 15 (App Router)** and **Tailwind CSS v4** for the **GoCart Multi-Vendor E-Commerce Platform**.

GoCart Admin empowers platform administrators to manage merchant stores, moderate orders, curate marketplace categories, manage users and roles, configure promotions, and monitor real-time platform analytics.

---

## ✨ Features

- **🔐 Dual Authentication Modes**:
  - **Admin Email & Password**: Authenticate via backend GraphQL mutations with automated `ADMIN` role verification, JWT session persistence, and token refresh.
  - **Master Security Key (`X-Admin-Key`)**: Root-level API key authentication with one-click configured key autofill.
- **🏬 Store & Merchant Management**:
  - Review, approve, and reject new merchant store applications.
  - Inspect store documents, business emails, contact details, and approval history.
  - Suspend, unsuspend, or inspect active merchant stores.
- **🏷️ Category & Product Curation**:
  - Browse marketplace categories and hierarchies.
  - Moderate catalog products, inventory stock, and product variants.
- **📦 Order Moderation & Tracking**:
  - View multi-vendor orders, customer details, fulfillment status, and order totals.
- **👥 Platform Users & Roles**:
  - Manage customers, merchants, and platform administrators.
  - Monitor account statuses and toggle user suspension/activation.
- **🎟️ Coupons & Discounts**:
  - Create and manage platform-wide promotional discount codes.
- **📊 Analytics & Insights**:
  - Visual metrics and area charts powered by Recharts.
- **🛡️ Next.js Middleware Protection**:
  - Route guards ensuring unauthorized requests redirect to `/login`.

---

## 🛠️ Tech Stack

| Technology | Description |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **State Management** | [Redux Toolkit](https://redux-toolkit.js.org/) & `react-redux` |
| **API Client** | GraphQL HTTP Client with token refresh & `X-Admin-Key` integration |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Notifications** | [React Hot Toast](https://react-hot-toast.com/) |

---

## 📁 Project Structure

```text
gocart-admin/
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── stores/
│   │           ├── pending/ # GET pending store applications API
│   │           └── action/  # POST approve/reject store action API
│   ├── approve/             # Store review and approval workflows
│   ├── categories/          # Marketplace category management
│   ├── coupons/             # Discount codes and promotions
│   ├── login/               # Admin authentication page (Email & Key)
│   ├── orders/              # Platform order management
│   ├── settings/            # System and account configuration
│   ├── stores/              # Active store listings and management
│   ├── users/               # Platform user directory & role controls
│   ├── layout.jsx           # Global layout with Redux StoreProvider & Toast
│   ├── page.jsx             # Admin dashboard overview & KPI cards
│   ├── StoreProvider.js     # Redux hydration & auto-auth initializer
│   └── globals.css          # Tailwind CSS v4 configuration & styles
├── components/
│   ├── admin/
│   │   ├── AdminLayout.jsx  # Dashboard shell layout
│   │   ├── AdminNavbar.jsx  # Header bar with session and logout controls
│   │   ├── AdminSidebar.jsx # Sidebar navigation menu
│   │   └── StoreInfo.jsx    # Store details modal / inspector
│   ├── Loading.jsx          # Reusable spinner component
│   └── OrdersAreaChart.jsx  # Order metrics visualization
├── lib/
│   ├── features/
│   │   └── auth/            # Redux authSlice (user, token, login, logout)
│   ├── graphql/             # GraphQL queries & mutations (auth, store, product)
│   ├── apiClient.js         # Fetch wrapper with auto-refresh & admin key injection
│   └── store.js             # Redux store configuration
├── middleware.js            # Edge route protection & token validator
└── package.json             # Scripts & dependencies
```

---

## ⚙️ Environment Variables

Create or update `.env.local` in the project root:

```env
# Currency display symbol
NEXT_PUBLIC_CURRENCY_SYMBOL='$'

# Backend GraphQL Gateway Endpoint
NEXT_PUBLIC_API_BASE_URL=https://gocart-backend-dtoi.onrender.com

# Server-only Admin Master Key (Never prefix with NEXT_PUBLIC_)
ADMIN_KEY=your_secret_master_admin_key_here
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

The admin dashboard runs by default on port `3001` (to avoid conflicting with the client storefront on port `3000`):

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### 3. Production Build

```bash
npm run build
npm start
```

---

## 🔑 Logging In

When accessing `http://localhost:3001`, unauthenticated users are automatically redirected to `http://localhost:3001/login`.

You can log in using either of the two tabs:

### Option A: Admin Email & Password
- Enter your registered administrator email and password.
- Use the **"Quick Fill"** button during development to populate demo admin credentials.
- The system verifies the account and checks for `role: 'ADMIN'`.

### Option B: Master Security Key
- Enter your master `X-Admin-Key`.
- Click **"Use Configured Key"** to auto-populate the key specified in your `.env.local`.
- Authenticates root administrative permissions for all backend services.

---

## 📜 Available Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack on port `3001`.
- `npm run build`: Builds the production bundle.
- `npm run start`: Starts the Next.js production server on port `3001`.
- `npm run lint`: Runs ESLint checks across the codebase.

---

## 🔗 Related Services

- **GoCart Client / Storefront**: Runs on `http://localhost:3000`
- **GoCart Backend API**: `https://gocart-backend-dtoi.onrender.com/query`