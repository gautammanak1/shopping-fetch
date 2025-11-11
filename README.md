# Fetch.ai Merchandise

A modern e-commerce platform for official Fetch.ai merchandise with AI-powered shopping using Fetch.ai uagents.

## Features

- 🛍️ **Product Management**: Full admin panel for managing t-shirt inventory
- 🎨 **Modern UI**: Beautiful gradient design with dark theme
- 📦 **Stock Management**: Real-time inventory tracking by size (S, M, L, XL, XXL)
- 🤖 **AI Agent**: uagents-based shopping agent for LLM-powered product queries and purchases
- ☁️ **Supabase Integration**: Robust database backend
- 🚀 **Next.js 14**: Built with the latest Next.js and TypeScript

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Database**: Supabase
- **AI Agent**: Fetch.ai uagents
- **Icons**: Lucide React

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the SQL script in your Supabase dashboard to create the necessary tables:

```bash
# Use the supabase-products.sql file
```

Or manually create the tables using the SQL provided in `supabase-products.sql`.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the store.

## Admin Panel

Navigate to `/admin` to access the admin panel where you can:
- Add new t-shirt products
- Edit existing products
- Manage stock levels by size
- Delete products

## AI Agent Setup

### Prerequisites

The AI agent requires Python 3.8+ and uagents with chat protocol support.

### Install Python Dependencies

```bash
cd agent
pip install -r requirements.txt
```

### Configure Agent

Create a `.env` file in the `agent` directory or set environment variables:

```bash
# Required
export SHOPPING_AGENT_SEED="your_seed_phrase_here"

# Optional
export API_BASE_URL="http://localhost:3000/api"
```

### Run the Agent

1. Make sure your Next.js server is running on port 3000
2. Start the agent:

```bash
python agent/shopping_agent.py
```

The agent will print its address. Use this address in your client code.

### Using the Agent

**Interactive Chat:**
```bash
python agent/client.py
```

**Programmatic Usage:**
```python
from agent.client import ShoppingChatClient

client = ShoppingChatClient("agent_address")
response = await client.chat("Show me all t-shirts")
```

The agent directly parses natural language queries and calls the API to browse products and place orders.

## API Endpoints

### Products

- `GET /api/products` - Get all active products
- `GET /api/products?active=false` - Get all products (including inactive)
- `POST /api/products` - Create a new product
- `GET /api/products/[id]` - Get a specific product
- `PATCH /api/products/[id]` - Update a product
- `DELETE /api/products/[id]` - Delete a product

### Orders

- `POST /api/orders` - Place an order

### Agent

- `POST /api/agent/query` - Query products via agent-friendly endpoint

## Product Structure

Each product includes:
- Name
- Description (default: "Made from 100% organic ring-spun cotton, this unisex t-shirt is a total must-have. It's high-quality, super comfy, and best of all—eco-friendly.")
- Price
- Image URL (uses images from `/public` folder: 1.avif - 5.avif)
- Sizes: S, M, L, XL, XXL
- Stock levels per size
- Active status

## Usage

1. **Admin**: Go to `/admin` to add products with images and stock levels
2. **Shopping**: Browse products on the homepage and select size to purchase
3. **AI Agent**: Use the Python client or integrate the agent into your application for LLM-powered shopping

## Product Images

The app uses images from the `public` folder:
- `/1.avif` through `/5.avif`

Make sure these images are available in your `public` directory.

## How It Works

1. **Admin adds products** through the admin panel with images, descriptions, prices, and stock levels
2. **Customers browse** the store and select products by size
3. **Orders are placed** and stock is automatically updated
4. **AI Agent** can query products using natural language and place orders programmatically

## License

MIT
# shopping-fetch
