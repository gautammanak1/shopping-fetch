# Fetch.ai Merchandise Store

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com)
[![Fetch.ai](https://img.shields.io/badge/Fetch.ai-uAgents-purple)](https://fetch.ai)

A modern e-commerce platform for official Fetch.ai merchandise with AI-powered shopping capabilities using Fetch.ai uAgents.

## Features

- **Product Catalog** — Browse Fetch.ai branded t-shirts with images, sizes, and pricing
- **Admin Panel** — Full inventory management dashboard for adding and updating products
- **Stock Management** — Real-time inventory tracking by size (S, M, L, XL, XXL)
- **AI Shopping Agent** — uAgents-based conversational agent for LLM-powered product queries and purchases
- **Dark Mode** — Theme toggle with system preference detection
- **Responsive Design** — Gradient-based modern UI with Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| Database | Supabase |
| AI Agent | Fetch.ai uAgents |
| Icons | Lucide React |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project

### Installation

```bash
git clone https://github.com/gautammanak1/shopping-fetch.git
cd shopping-fetch
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run the SQL script in your Supabase dashboard to create the products table, or use the provided `supabase-products.sql`.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── admin/          # Admin panel for product management
│   ├── api/            # API routes
│   ├── layout.tsx      # Root layout with theme provider
│   └── page.tsx        # Landing page / product catalog
├── components/
│   ├── ui/             # Shadcn UI components
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── config/             # App configuration
├── lib/                # Utility functions & Supabase client
├── public/             # Static assets
└── scripts/            # Utility scripts
```

## Deployment

Deploy to Vercel with one click or configure via `vercel.json`:

```bash
vercel deploy
```

## License

MIT
