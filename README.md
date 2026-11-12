# INDSTATE — India's Trusted Property Marketplace

> Discover flats, luxury villas, builder floors, plots, and commercial spaces across Indian states and cities — with RERA-focused listings, INR pricing, EMI calculators, an interactive map, and a Hinglish AI assistant.

INDSTATE is a full-featured real estate marketplace web app built with **React + Vite** and **Supabase**. Buyers can browse, filter, compare, and visit properties; owners and agents can list properties and manage leads — all in one place.

---

## ✨ Features

### For Buyers & Renters
- **Property browsing & search** — listings across Indian states and cities, with categories: apartments, villas, penthouses, builder floors, commercial spaces, farm plots, and PG / co-living
- **Advanced filters & sorting** — filter sidebar and sort bar on the properties page
- **Interactive map view** — Leaflet-based map to explore properties by location
- **Rich property detail pages** — photo gallery, floor plans, amenities grid, nearby places, property overview, and agent contact card
- **EMI calculator** — calculate home-loan EMIs in ₹ from the property page or the standalone calculator page
- **Compare properties** — side-by-side comparison with a floating compare bar
- **Schedule a site visit** — book a visit directly from a property's page
- **Quick preview modal** — peek at a property without leaving the listing page

### For Owners, Agents & Admins
- **Add property** — authenticated users can list a new property (protected route)
- **User dashboard & profile** — manage your listings and account
- **Agent directory & profiles** — browse agents and view individual agent pages
- **Admin panel** — chatbot administration and lead-notification management

### Platform
- **Authentication** — email/password registration and login, Google sign-in, OTP input, forgot-password flow, and protected routes (Supabase Auth)
- **Hinglish AI chatbot** — floating assistant backed by a real-estate knowledge base (200-entry knowledge dataset included in `public/data/`)
- **Blog** — real-estate articles with individual post pages
- **Informational pages** — About, Contact, RERA Disclaimer, Privacy Policy, and Terms & Conditions

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router DOM 7 |
| Build tool | Vite 8 with `@vitejs/plugin-react` |
| Backend / Database | Supabase (PostgreSQL, Auth, Row Level Security) — `@supabase/supabase-js` |
| Maps | Leaflet 1.9 |
| Animation | Framer Motion, canvas-confetti |
| Icons | Lucide React |
| Linting | Oxlint |
| Deployment | Vercel (SPA rewrites configured in `vercel.json`) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended) and npm
- A free [Supabase](https://supabase.com/) project

### 1. Clone the repository
```bash
git clone https://github.com/Pradhan-07/indstate.git
cd indstate
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the template and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
# Optional: VITE_SITE_URL=https://your-production-app.vercel.app
```

> ⚠️ Never commit real secret keys or the Supabase service-role key to version control.

### 4. Set up the database
In your Supabase project's SQL Editor, run:
1. `supabase/schema.sql` — creates the `profiles` and `properties` tables, indexes, and Row Level Security policies
2. `supabase/seed.sql` — optional starter data

### 5. Run the app
```bash
npm run dev
```
Open the local URL Vite prints (default: http://localhost:5173).

### Other scripts
```bash
npm run build    # Production build
npm run preview  # Preview the production build locally
npm run lint     # Run Oxlint
```

---

## 🗂️ Project Structure

```
indstate/
├── public/                  # Static assets, category/partner images, chatbot knowledge data
├── src/
│   ├── components/
│   │   ├── admin/           # Chatbot & lead-notification admin panels
│   │   ├── auth/            # Protected routes, OTP input, auth helpers
│   │   ├── chatbot/         # Floating Hinglish AI chatbot
│   │   ├── common/          # Navbar, Footer, PropertyCard, modals, animations
│   │   ├── home/            # Hero search, featured sections, popular cities
│   │   ├── properties/      # Filter sidebar, map view, sort bar
│   │   └── propertyDetail/  # Gallery, EMI widget, floor plans, visit scheduler
│   ├── context/             # Auth, Chatbot, and Property contexts
│   ├── data/                # States & cities, properties, agents, knowledge bases
│   ├── lib/                 # Supabase client
│   ├── pages/               # All route pages (see Routes below)
│   ├── services/            # Property, AI chatbot, and lead-notification services
│   └── utils/               # EMI calculator, currency formatter, validators
├── supabase/
│   ├── schema.sql           # Database schema + RLS policies
│   └── seed.sql             # Seed data
├── .env.example             # Environment variable template
├── vercel.json              # Vercel SPA rewrite rules
└── vite.config.js           # Vite configuration
```

---

## 🧭 Routes

| Route | Page |
|---|---|
| `/` | Home |
| `/properties` | Browse & filter properties |
| `/property/:id` | Property details |
| `/agents`, `/agent/:id` | Agent directory & profiles |
| `/add-property` | List a property *(login required)* |
| `/dashboard`, `/profile` | User dashboard & profile *(login required)* |
| `/login`, `/register`, `/forgot-password` | Authentication |
| `/compare` | Compare properties |
| `/calculator` | EMI calculator |
| `/blog`, `/blog/:slug` | Blog |
| `/about`, `/contact` | About & Contact |
| `/rera-disclaimer`, `/privacy`, `/terms` | Legal pages |
| `/admin` | Admin panel |

---

## ☁️ Deployment

The project is configured for **Vercel**: `vercel.json` rewrites all routes to `index.html` so client-side routing works in production. Import the repository in Vercel, set the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables, and deploy.

---

## 👤 Author

**Karan Kumar Pradhan** — B.Tech CSE @ VIT-AP University
- GitHub: [@Pradhan-07](https://github.com/Pradhan-07)
- Portfolio: [karan-07.vercel.app](https://karan-07.vercel.app/)
- LinkedIn: [karan-pradhan-510062396](https://www.linkedin.com/in/karan-pradhan-510062396)
- LeetCode: [pradhan_07](https://leetcode.com/u/pradhan_07/)
