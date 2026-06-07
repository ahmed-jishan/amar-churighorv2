# Amar Churighor — Full-Stack E-commerce Platform

A production-ready, Vercel-deployable e-commerce platform built with Next.js 15, Firebase, and Tailwind CSS.

---

## Tech Stack
- **Frontend**: Next.js 15 App Router, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Firebase Firestore, Firebase Auth, Firebase Storage
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

---

## Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd amar-churighor
npm install
```

### 2. Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore**, **Authentication (Email/Password)**, and **Storage**
3. Copy your config to `.env.local` (see `.env.local.example`)

### 3. Deploy Firestore Rules
```bash
npm install -g firebase-tools
firebase login
firebase init   # select Firestore + Storage
firebase deploy --only firestore:rules,storage
```

### 4. Create Super Admin
Follow `scripts/seed-admin.md` to set up the first admin account manually via Firebase Console.

### 5. Run Locally
```bash
npm run dev
```

### 6. Deploy to Vercel
```bash
npx vercel
# Add all NEXT_PUBLIC_FIREBASE_* env vars in Vercel dashboard
```

---

## Project Structure
```
amar-churighor/
├── app/
│   ├── (admin)/           # Admin panel (protected)
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── content/
│   │   └── settings/
│   ├── products/[slug]/   # Product detail
│   ├── checkout/
│   ├── order-success/
│   ├── track-order/
│   ├── categories/
│   ├── search/
│   ├── offers/
│   ├── about/, contact/, privacy/, terms/, refund/
│   └── page.tsx           # Homepage
├── components/
│   ├── admin/             # AdminShell sidebar
│   └── ui/                # All UI components
├── context/               # CartContext, AdminContext
├── hooks/                 # useProducts, useRecentlyViewed
├── lib/
│   ├── firebase/          # config, products, orders, auth, content, admins
│   └── validators/        # Zod schemas
├── types/index.ts
├── firestore.rules
├── storage.rules
└── package.json
```

---

## Features

### Customer Side
- Browse products with filters, search, categories
- Add to cart with fly animation + toast
- Slide-in cart drawer
- Checkout with Bangladeshi address fields
- Cash on delivery
- Order tracking by Order ID
- Recently viewed products (localStorage)

### Admin Panel (`/login`)
- Dashboard with revenue, order stats
- Full product CRUD with image upload
- Order management + status updates (7 stages)
- Customer database (auto-built from orders)
- Content management: FAQ, reviews
- Super Admin: create/suspend/remove admins

---

## Firestore Collections
| Collection   | Purpose                          |
|-------------|----------------------------------|
| products     | Product catalog                  |
| orders       | All customer orders              |
| admins       | Admin user records               |
| categories   | Product categories               |
| hero_slides  | Homepage carousel content        |
| faqs         | FAQ items                        |
| reviews      | Customer testimonials            |
| settings     | Store configuration              |
